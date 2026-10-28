/* COSE（RFC 8152，已被 RFC 9052/9053 取代但标签与结构不变）—— CBOR 对象签名与加密
 *
 * 官方测试向量来源：COSE 工作组官方示例仓库 cose-wg/Examples（github.com/cose-wg/Examples）
 * 共 323 个 JSON，本模块用到其中：
 *   hmac-examples/HMac-enc-01..05   COSE_MAC0   HS256 / HS384 / HS512 / HS256-64（截断）
 *   mac0-tests/HMac-01              COSE_MAC0   HS256
 *   aes-gcm-examples/aes-gcm-enc-01..04  COSE_Encrypt0  A128/192/256GCM
 *   chacha-poly-examples/chacha-poly-enc-01  COSE_Encrypt0  ChaCha20/Poly1305
 *   sign1-tests/sign-pass-01..03    COSE_Sign1  ES256（验签）
 *
 * 这些向量最值钱的地方是 intermediates 里的 ToMac_hex / AAD_hex / ToBeSign_hex：
 * 它们把「待签/待认证字节串」单独给出来了，所以能分层定位——
 * 结构拼错了和结构拼对了但算法算错，是两类不同的失败，不会混在一起。
 *
 * 三种结构（RFC 8152 §6）：
 *   COSE_MAC0     tag 17  [protected, unprotected, payload, tag]
 *                 MAC_structure = ["MAC0", protected, external_aad, payload]
 *   COSE_Encrypt0 tag 16  [protected, unprotected, ciphertext]
 *                 Enc_structure = ["Encrypt0", protected, external_aad]
 *   COSE_Sign1    tag 18  [protected, unprotected, payload, signature]
 *                 Sig_structure = ["Signature1", protected, external_aad, payload]
 *
 * ⚠ 三个容易写错的点（都由官方向量钉死，别凭直觉改）：
 *   1) 结构里的 protected 是【已编码的 bstr】，不是 map 本体；external_aad 恒为 h'' 参与编码。
 *   2) ES256 的 signature 是 raw r||s（64 字节），不是 DER —— Web Crypto 恰好也是这个格式。
 *   3) IV 放在 unprotected 的标签 5，而不是 protected。
 */
(function () {
  var CBOR = (typeof window !== 'undefined' && window.CBOR) ||
    (typeof global !== 'undefined' && global.CBOR) || null;
  if (!CBOR) { try { CBOR = require('./crypto_cbor.js'); } catch (e) { } }
  if (!CBOR) throw new Error('crypto_cose.js 依赖 crypto_cbor.js（CBOR）');

  /* ---------------- Web Crypto 取用（浏览器与 Node 通吃） ---------------- */
  function subtle() {
    var c = (typeof globalThis !== 'undefined') ? globalThis.crypto : null;
    if (c && c.subtle) return c.subtle;
    try { return require('crypto').webcrypto.subtle; } catch (e) { }
    throw new Error('当前环境不支持 Web Crypto');
  }
  function rnd(n) {
    var c = (typeof globalThis !== 'undefined') ? globalThis.crypto : null;
    if (c && c.getRandomValues) return c.getRandomValues(new Uint8Array(n));
    return new Uint8Array(require('crypto').randomBytes(n));
  }

  /* ---------------- CBOR 节点小工具 ---------------- */
  function NU(n) { return { k: 'uint', v: BigInt(n) }; }
  function NI(n) { return { k: 'nint', v: BigInt(n) }; }
  function intNode(n) { return n < 0 ? NI(n) : NU(n); }
  function NB(b) { return { k: 'bytes', v: b instanceof Uint8Array ? b : new Uint8Array(b) }; }
  function NT(s) { return { k: 'text', v: s }; }
  function NA(a) { return { k: 'array', v: a, indef: false }; }
  function NM(pairs) { return { k: 'map', v: pairs, indef: false }; }
  function TAG(t, v) { return { k: 'tag', t: BigInt(t), v: v }; }
  function enc(n) { return new Uint8Array(CBOR.encNode(n)); }
  function hexOf(n) { return CBOR.toHex(enc(n)); }

  function nodeBytes(n) {
    if (!n || n.k !== 'bytes') throw new Error('期望字节串，实际是 ' + (n && n.k));
    return n.v;
  }
  function mapGet(m, key) {
    if (!m || m.k !== 'map') return undefined;
    for (var i = 0; i < m.v.length; i++) {
      var kk = m.v[i][0];
      if ((kk.k === 'uint' && Number(kk.v) === key) || (kk.k === 'nint' && Number(kk.v) === key)) return m.v[i][1];
    }
    return undefined;
  }
  function arrAt(a, i) {
    if (!a || a.k !== 'array' || i >= a.v.length) throw new Error('COSE 结构缺第 ' + i + ' 项');
    return a.v[i];
  }
  /* 剥掉最外层 tag（若没有 tag 就原样返回） */
  function untag(n) { return n && n.k === 'tag' ? n.v : n; }

  /* ---------------- 算法表（COSE IANA 注册值） ---------------- */
  var MAC_ALGS = {
    'HS256': { v: 5, hash: 'SHA-256', tagLen: 32 },
    'HS384': { v: 6, hash: 'SHA-384', tagLen: 48 },
    'HS512': { v: 7, hash: 'SHA-512', tagLen: 64 },
    /* ⚠ 凭直觉会写成 5：COSE 里 HMAC 256/256 = 5，而【截断到 64 位】是另一个注册值 4。
       官方向量 hmac-examples/HMac-enc-05.json 的 protected 是 h'A10104'（即 {1:4}），钉死为 4。 */
    'HS256/64': { v: 4, hash: 'SHA-256', tagLen: 8 }
  };
  var ENC_ALGS = {
    'A128GCM': { v: 1, klen: 16 },
    'A192GCM': { v: 2, klen: 24 },
    'A256GCM': { v: 3, klen: 32 },
    'ChaCha20/Poly1305': { v: 24, klen: 32 }
  };
  var SIGN_ALGS = {
    'ES256': { v: -7, crv: 'P-256', hash: 'SHA-256' },
    'ES384': { v: -35, crv: 'P-384', hash: 'SHA-384' },
    'ES512': { v: -36, crv: 'P-521', hash: 'SHA-512' }
  };

  /* ---------------- 密码学小工具 ---------------- */
  async function hmacBytes(hashName, keyBytes, msg) {
    var k = await subtle().importKey('raw', keyBytes, { name: 'HMAC', hash: { name: hashName } }, false, ['sign']);
    return new Uint8Array(await subtle().sign('HMAC', k, msg));
  }
  async function gcmSeal(keyBytes, iv, aad, pt) {
    var k = await subtle().importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    var a = { name: 'AES-GCM', iv: iv, additionalData: aad, tagLength: 128 };
    return new Uint8Array(await subtle().encrypt(a, k, pt));
  }
  async function gcmOpen(keyBytes, iv, aad, sealed) {
    var k = await subtle().importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    var a = { name: 'AES-GCM', iv: iv, additionalData: aad, tagLength: 128 };
    return new Uint8Array(await subtle().decrypt(a, k, sealed));
  }
  async function chachaSeal(keyBytes, iv, aad, pt) {
    var k = await subtle().importKey('raw', keyBytes, { name: 'ChaCha20-Poly1305' }, false, ['encrypt', 'decrypt']);
    var a = { name: 'ChaCha20-Poly1305', iv: iv, additionalData: aad };
    return new Uint8Array(await subtle().encrypt(a, k, pt));
  }

  /* ---------------- 结构构造器（返回待签/待认证字节串，便于分层验证） ---------------- */
  /* MAC_structure = ["MAC0", protected_bstr, external_aad, payload] */
  function macStructure(protBstr, extAad, payload) {
    return enc(NA([NT('MAC0'), NB(protBstr), NB(extAad), NB(payload)]));
  }
  /* Enc_structure = ["Encrypt0", protected_bstr, external_aad] */
  function encStructure(protBstr, extAad) {
    return enc(NA([NT('Encrypt0'), NB(protBstr), NB(extAad)]));
  }
  /* Sig_structure = ["Signature1", protected_bstr, external_aad, payload] */
  function sigStructure(protBstr, extAad, payload) {
    return enc(NA([NT('Signature1'), NB(protBstr), NB(extAad), NB(payload)]));
  }
  function protBytes(algV, extra) {
    var pairs = [[NU(1), intNode(algV)]];
    if (extra) for (var i = 0; i < extra.length; i++) pairs.push(extra[i]);
    return enc(NM(pairs));
  }
  function empty() { return new Uint8Array(0); }

  /* ---------------- COSE_MAC0 ---------------- */
  async function buildMac0(algName, keyBytes, payload, extAad) {
    var A = MAC_ALGS[algName];
    if (!A) throw new Error('不支持的 MAC 算法：' + algName + '（可选：' + Object.keys(MAC_ALGS).join(' / ') + '）');
    var pb = protBytes(A.v);
    var toMac = macStructure(pb, extAad || empty(), payload);
    var full = await hmacBytes(A.hash, keyBytes, toMac);
    var tag = full.slice(0, A.tagLen);
    var body = TAG(17, NA([NB(pb), NM([]), NB(payload), NB(tag)]));
    return { cborHex: hexOf(body), toMacHex: CBOR.toHex(toMac), tagHex: CBOR.toHex(tag), fullTagHex: CBOR.toHex(full) };
  }
  async function openMac0(cborBytes, keyBytes, extAad) {
    var root = untag(CBOR.decodeOne(cborBytes));
    var prot = nodeBytes(arrAt(root, 0));
    var payload = nodeBytes(arrAt(root, 2));
    var tag = nodeBytes(arrAt(root, 3));
    var toMac = macStructure(prot, extAad || empty(), payload);
    /* 从 protected 里读 alg；读不到就按 tag 长度猜（HS256=32 / HS384=48 / HS512=64 / 截断=8） */
    var pm = CBOR.decodeOne(prot);
    var algN = mapGet(pm, 1);
    var algName = null, i;
    if (algN) {
      var av = algN.k === 'nint' ? Number(algN.v) : Number(algN.v);
      for (i in MAC_ALGS) if (MAC_ALGS[i].v === av && MAC_ALGS[i].tagLen === tag.length) algName = i;
      if (!algName) for (i in MAC_ALGS) if (MAC_ALGS[i].v === av) algName = i;
    }
    if (!algName) {
      for (i in MAC_ALGS) if (MAC_ALGS[i].tagLen === tag.length) { algName = i; break; }
    }
    if (!algName) throw new Error('无法判定 MAC 算法（tag 长度 ' + tag.length + ' 字节）');
    var full = await hmacBytes(MAC_ALGS[algName].hash, keyBytes, toMac);
    var want = full.slice(0, tag.length);
    if (CBOR.toHex(want) !== CBOR.toHex(tag)) throw new Error('COSE_MAC0 标签校验失败：内容已被篡改或密钥不对');
    return { payload: payload, alg: algName };
  }

  /* ---------------- COSE_Encrypt0 ---------------- */
  async function buildEncrypt0(algName, keyBytes, iv, payload, extAad) {
    var A = ENC_ALGS[algName];
    if (!A) throw new Error('不支持的内容加密算法：' + algName + '（可选：' + Object.keys(ENC_ALGS).join(' / ') + '）');
    if (keyBytes.length !== A.klen) throw new Error(algName + ' 需要 ' + A.klen + ' 字节密钥，收到 ' + keyBytes.length + ' 字节');
    var pb = protBytes(A.v);
    var aad = encStructure(pb, extAad || empty());
    var sealed, ct;
    if (A.v === 24) { sealed = await chachaSeal(keyBytes, iv, aad, payload); ct = sealed; }
    else { sealed = await gcmSeal(keyBytes, iv, aad, payload); ct = sealed; }
    var body = TAG(16, NA([NB(pb), NM([[NU(5), NB(iv)]]), NB(ct)]));
    return { cborHex: hexOf(body), aadHex: CBOR.toHex(aad), ctHex: CBOR.toHex(ct) };
  }
  async function openEncrypt0(cborBytes, keyBytes, extAad) {
    var root = untag(CBOR.decodeOne(cborBytes));
    var prot = nodeBytes(arrAt(root, 0));
    var unprot = arrAt(root, 1);
    var ct = nodeBytes(arrAt(root, 2));
    var iv = nodeBytes(mapGet(unprot, 5) || { k: 'bytes', v: empty() });
    var aad = encStructure(prot, extAad || empty());
    var pm = CBOR.decodeOne(prot);
    var algN = mapGet(pm, 1);
    var v = algN ? Number(algN.v) : null;
    var pt;
    if (v === 24) pt = await chachaOpen(keyBytes, iv, aad, ct);
    else pt = await gcmOpen(keyBytes, iv, aad, ct);
    return { payload: pt };
  }
  async function chachaOpen(keyBytes, iv, aad, sealed) {
    var k = await subtle().importKey('raw', keyBytes, { name: 'ChaCha20-Poly1305' }, false, ['encrypt', 'decrypt']);
    var a = { name: 'ChaCha20-Poly1305', iv: iv, additionalData: aad };
    return new Uint8Array(await subtle().decrypt(a, k, sealed));
  }

  /* ---------------- COSE_Sign1 ---------------- */
  async function buildSign1(algName, jwk, payload, extAad) {
    var A = SIGN_ALGS[algName];
    if (!A) throw new Error('不支持的签名算法：' + algName + '（可选：' + Object.keys(SIGN_ALGS).join(' / ') + '）');
    if (!jwk || jwk.kty !== 'EC' || !jwk.d) throw new Error('签名需要含私钥 d 的 EC JWK');
    var pb = protBytes(A.v);
    var toBeSign = sigStructure(pb, extAad || empty(), payload);
    var key = await subtle().importKey('jwk', { kty: 'EC', crv: A.crv, x: jwk.x, y: jwk.y, d: jwk.d },
      { name: 'ECDSA', namedCurve: A.crv }, false, ['sign']);
    var sig = new Uint8Array(await subtle().sign({ name: 'ECDSA', hash: { name: A.hash } }, key, toBeSign));
    var body = TAG(18, NA([NB(pb), NM([]), NB(payload), NB(sig)]));
    return { cborHex: hexOf(body), toBeSignHex: CBOR.toHex(toBeSign), sigHex: CBOR.toHex(sig) };
  }
  /* 原始验签：直接对给定的 msg 验 raw r||s 签名。
     单独抽出来是因为官方向量 sign-pass-01 的 ToBeSign_hex 与 output.cbor 里的 protected 不一致
     （该向量标了 failures={"ChangeProtected":"a0"}：先按 protected=h'' 签名，再把 protected 换成 h'A0'），
     此时只能用官方给的 ToBeSign_hex 去验官方签名值——否则永远验不过，也无法定位是哪一层错。 */
  async function verifyRaw(algName, jwk, sig, msg) {
    var A = SIGN_ALGS[algName];
    if (!A) throw new Error('不支持的签名算法：' + algName);
    var key = await subtle().importKey('jwk', { kty: 'EC', crv: A.crv, x: jwk.x, y: jwk.y },
      { name: 'ECDSA', namedCurve: A.crv }, false, ['verify']);
    return subtle().verify({ name: 'ECDSA', hash: { name: A.hash } }, key, sig, msg);
  }
  async function openSign1(cborBytes, jwk, extAad) {
    var root = untag(CBOR.decodeOne(cborBytes));
    var prot = nodeBytes(arrAt(root, 0));
    var payload = nodeBytes(arrAt(root, 2));
    var sig = nodeBytes(arrAt(root, 3));
    var toBeSign = sigStructure(prot, extAad || empty(), payload);
    /* alg 可能在 protected 也可能在 unprotected（向量 sign-pass-01 就是放 unprotected） */
    var pm = CBOR.decodeOne(prot);
    var algN = mapGet(pm, 1);
    if (!algN) algN = mapGet(arrAt(root, 1), 1);
    var v = algN ? Number(algN.v) : null;
    var algName = null, i;
    for (i in SIGN_ALGS) if (SIGN_ALGS[i].v === v) algName = i;
    if (!algName) throw new Error('无法判定签名算法（COSE alg=' + v + '）');
    var ok = await verifyRaw(algName, jwk, sig, toBeSign);
    if (!ok) throw new Error('COSE_Sign1 验签失败：签名无效或密钥不匹配');
    return { payload: payload, alg: algName };
  }

  var api = {
    buildMac0: buildMac0, openMac0: openMac0,
    buildEncrypt0: buildEncrypt0, openEncrypt0: openEncrypt0,
    buildSign1: buildSign1, openSign1: openSign1, verifyRaw: verifyRaw,
    macStructure: macStructure, encStructure: encStructure, sigStructure: sigStructure,
    protBytes: protBytes, hexOf: hexOf, untag: untag, arrAt: arrAt, mapGet: mapGet, nodeBytes: nodeBytes,
    MAC_ALGS: MAC_ALGS, ENC_ALGS: ENC_ALGS, SIGN_ALGS: SIGN_ALGS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  (typeof global !== 'undefined' ? global : window).COSE = api;

  /* ---------------- 对外：注册 ---------------- */
  var G = '认证加密';
  function hexToB(h) {
    h = String(h || '').replace(/[^0-9a-fA-F]/g, '');
    if (h.length % 2) throw new Error('十六进制长度必须是偶数，当前 ' + h.length + ' 位');
    var o = new Uint8Array(h.length / 2);
    for (var i = 0; i < o.length; i++) o[i] = parseInt(h.substr(i * 2, 2), 16);
    return o;
  }
  function toHexB(b) { var s = ''; for (var i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0'); return s; }

  reg({
    id: 'cose-mac0', name: 'COSE_MAC0（RFC 8152）', group: G, key: true, param: true,
    keyLabel: '对称密钥（十六进制，HS256 建议 32 字节）',
    paramLabel: '算法（HS256 / HS384 / HS512 / HS256/64，留空默认 HS256）',
    info: 'COSE_MAC0（RFC 8152）：对 MAC_structure = ["MAC0", protected, external_aad, payload] 做 HMAC，只认证不加密。输出带 CBOR 标签 17 的字节串；解密方向会校验标签，篡改即报错。官方向量：cose-wg/Examples。',
    enc: async function (b, k, p, fmt) {
      var alg = String(p || '').trim() || 'HS256';
      var r = await buildMac0(alg, hexToB(k), b, empty());
      return bytesOut(hexToB(r.cborHex), fmt);
    },
    dec: async function (s, k, p, fmt) {
      var r = await openMac0(bytesIn(s, fmt), hexToB(k), empty());
      return r.payload;
    }
  });

  reg({
    id: 'cose-encrypt0', name: 'COSE_Encrypt0（RFC 8152）', group: G, key: true, param: true,
    keyLabel: '内容加密密钥 CEK（十六进制：A128GCM=32 位 / A192GCM=48 位 / A256GCM 与 ChaCha20=64 位）',
    paramLabel: '算法与 IV，格式「A128GCM」或「A256GCM:001122...(24 位十六进制 IV)」，留空默认 A128GCM 并随机生成 IV',
    info: 'COSE_Encrypt0（RFC 8152）：AAD 是 CBOR 编码的 Enc_structure = ["Encrypt0", protected, external_aad]，IV 放在 unprotected 的标签 5。输出带 CBOR 标签 16。官方向量：cose-wg/Examples。',
    enc: async function (b, k, p, fmt) {
      var spec = String(p || '').trim(), alg = 'A128GCM', iv = null;
      if (spec) {
        var i = spec.indexOf(':');
        if (i >= 0) { alg = spec.slice(0, i).trim(); iv = hexToB(spec.slice(i + 1)); }
        else alg = spec;
      }
      var A = ENC_ALGS[alg];
      if (!A) throw new Error('未知算法 ' + alg + '，可选：' + Object.keys(ENC_ALGS).join(' / '));
      var kb = hexToB(k);
      if (kb.length !== A.klen) throw new Error(alg + ' 需要 ' + A.klen + ' 字节密钥（' + (A.klen * 2) + ' 位十六进制），收到 ' + kb.length + ' 字节');
      if (!iv) iv = rnd(12);
      if (iv.length !== 12) throw new Error('IV 必须是 12 字节（24 位十六进制），收到 ' + iv.length + ' 字节');
      var r = await buildEncrypt0(alg, kb, iv, b, empty());
      return bytesOut(hexToB(r.cborHex), fmt);
    },
    dec: async function (s, k, p, fmt) {
      var r = await openEncrypt0(bytesIn(s, fmt), hexToB(k), empty());
      return r.payload;
    }
  });

  reg({
    id: 'cose-sign1', name: 'COSE_Sign1（RFC 8152）', group: '数字签名', key: true, param: true,
    keyLabel: 'EC 私钥/公钥 JWK（JSON，签名需含 d；验签只需 x/y）',
    paramLabel: '算法（ES256 / ES384 / ES512，留空默认 ES256）',
    info: 'COSE_Sign1（RFC 8152）：对 Sig_structure = ["Signature1", protected, external_aad, payload] 签名，ES256 的签名值是 raw r||s（64 字节）而非 DER。输出带 CBOR 标签 18；加密=签名，解密=验签还原原文。官方向量：cose-wg/Examples。',
    enc: async function (b, k, p, fmt) {
      var alg = String(p || '').trim() || 'ES256';
      var jwk = JSON.parse(String(k).trim());
      var r = await buildSign1(alg, jwk, b, empty());
      return bytesOut(hexToB(r.cborHex), fmt);
    },
    dec: async function (s, k, p, fmt) {
      var jwk = JSON.parse(String(k).trim());
      var r = await openSign1(bytesIn(s, fmt), jwk, empty());
      return r.payload;
    }
  });
})();
