/* JOSE —— JWS（RFC 7515）/ JWE（RFC 7516）/ JWK（RFC 7517）/ JWA（RFC 7518）
 *
 * 官方测试向量来源（两条互相独立的链路）：
 *   1) RFC 7520《Examples of Protecting Content Using JSON Object Signing and Encryption (JOSE)》
 *      —— IETF 官方示例文档，逐章给出 plaintext / key(JWK) / generated(cek,iv,epk) / output(compact,json)。
 *      经 dahnielson/rfc7520（4.1 全套 RSA 私钥）与 panva/jose cookbook（JWE 12 条 + JWS 8 条）收录。
 *   2) 与 Node 的 Web Crypto 交叉比对。
 *
 * 覆盖：
 *   JWS  alg: HS256/384/512  RS256/384/512  PS256/384/512  ES256/384/512  EdDSA（Ed25519/Ed448）
 *   JWE  alg: dir  A128KW/A192KW/A256KW  A128GCMKW/A192GCMKW/A256GCMKW
 *             RSA1_5  RSA-OAEP  RSA-OAEP-256/384/512
 *             ECDH-ES  ECDH-ES+A128KW/+A192KW/+A256KW
 *             PBES2-HS256+A128KW / PBES2-HS384+A192KW / PBES2-HS512+A256KW
 *   JWE  enc: A128GCM/A192GCM/A256GCM
 *             A128CBC-HS256 / A192CBC-HS384 / A256CBC-HS512
 *             A128CBC+HS256 / A192CBC+HS384 / A256CBC+HS512（RFC 7518 早期名，等价于上面三个）
 *
 * ⚠ 六个由官方向量钉死、凭直觉极易写错的点：
 *   1) A128CBC-HS256 的 CEK 是 32 字节，前 16 是 MAC_KEY、后 16 是 ENC_KEY —— 不是「16 字节密钥」。
 *      认证标签是 HMAC 结果的【前半截】（HS256 取 16 字节），AAD 长度按【位】计、64 位大端。
 *   2) AES-CBC 的 AAD 不进 AES，只进 HMAC；且 AL 是 AAD 的位长度，不是字节长度。
 *   3) JWE 的 AAD 默认是 protected 的 base64url 原文（ASCII 字节），不是解码后的字节。
 *      存在 unprotected 头时，AAD = ASCII(protected_b64u || '.' || BASE64URL(unprotected_json))。
 *   4) PBES2 的 salt 是 ASCII(alg) || 0x00 || p2s 三段拼接，不是裸 p2s。
 *   5) ECDH-ES 的 ConcatKDF AlgorithmID：dir 模式用 enc 名，KW 模式用 alg 名（如 "ECDH-ES+A128KW"）。
 *      apu/apv 是 base64url 解码后的字节参与拼接，长度前缀是 4 字节大端【字节数】。
 *   6) Web Crypto 不支持 RSAES-PKCS1-v1_5 加密/解密（只支持 RSA-OAEP），
 *      所以 RSA1_5 的模幂与去填充是本模块自己用 BigInt 实现的。
 */
(function () {
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

  /* ---------------- base64url ---------------- */
  function b64uEnc(b) {
    b = b instanceof Uint8Array ? b : new Uint8Array(b);
    var s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    if (typeof btoa === 'function') s = btoa(s);
    else s = Buffer.from(b).toString('base64');
    return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64uDec(s) {
    s = String(s).trim();
    while (s.length % 4) s += '=';
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    if (typeof atob === 'function') {
      var bin = atob(s), r = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) r[i] = bin.charCodeAt(i);
      return r;
    }
    return new Uint8Array(Buffer.from(s, 'base64'));
  }
  function utf8(s) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
    return new Uint8Array(Buffer.from(s, 'utf8'));
  }
  function utf8d(b) {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(b);
    return Buffer.from(b).toString('utf8');
  }

  /* ---------------- BigInt 工具（RSA1_5 需要自己算模幂） ---------------- */
  function biFromB64u(s) {
    var b = b64uDec(s), h = '0x';
    for (var i = 0; i < b.length; i++) h += ('0' + b[i].toString(16)).slice(-2);
    return BigInt(h);
  }
  function b64uFromBi(v, len) {
    var h = v.toString(16);
    if (h.length % 2) h = '0' + h;
    while (h.length < len * 2) h = '00' + h;
    var b = new Uint8Array(len);
    for (var i = 0; i < len; i++) b[i] = parseInt(h.substr(i * 2, 2), 16);
    return b64uEnc(b);
  }
  function modPow(base, exp, mod) {
    var r = 1n; base = base % mod; exp = exp;
    while (exp > 0n) {
      if (exp & 1n) r = (r * base) % mod;
      base = (base * base) % mod;
      exp >>= 1n;
    }
    return r;
  }
  /* PKCS#1 v1.5 加密块解填充：0x00 0x02 || PS(非零,>=8) || 0x00 || M */
  function rsa15Unpad(em) {
    if (em[0] !== 0x00 || em[1] !== 0x02) return null;
    var i = 2;
    while (i < em.length && em[i] !== 0x00) i++;
    if (i < 2 + 8) return null;           /* PS 至少 8 字节 */
    if (i >= em.length) return null;
    return em.subarray(i + 1);
  }
  function rsa15Pad(m, k) { /* k = 模长字节数 */
    if (m.length > k - 11) throw new Error('PKCS#1 v1.5：消息过长（模长 ' + k + ' 字节）');
    var ps = rnd(k - 3 - m.length), out = new Uint8Array(k), p = 0;
    out[p++] = 0x00; out[p++] = 0x02;
    for (var i = 0; i < ps.length; i++) { var v = ps[i]; if (v === 0) v = 1; out[p++] = v; }
    out[p++] = 0x00;
    out.set(m, p);
    return out;
  }
  /* 用 JWK 里的 n/e/d 做裸 RSA（Web Crypto 不给 RSA1_5） */
  function rsa15EncWithJwk(jwk, m) {
    var n = biFromB64u(jwk.n), e = biFromB64u(jwk.e);
    var k = b64uDec(jwk.n).length;
    var em = rsa15Pad(m, k);
    var x = 0n;
    for (var i = 0; i < em.length; i++) x = (x << 8n) | BigInt(em[i]);
    if (x >= n) throw new Error('PKCS#1 v1.5：填充后数值超过模数');
    return modPow(x, e, n), b64uFromBi(modPow(x, e, n), k);
  }
  function rsa15DecWithJwk(jwk, cB64u) {
    var n = biFromB64u(jwk.n), d = biFromB64u(jwk.d);
    var k = b64uDec(jwk.n).length;
    var cb = b64uDec(cB64u);
    var x = 0n;
    for (var i = 0; i < cb.length; i++) x = (x << 8n) | BigInt(cb[i]);
    var y = modPow(x, d, n);
    var em = b64uDec(b64uFromBi(y, k));
    var m = rsa15Unpad(em);
    if (!m) throw new Error('PKCS#1 v1.5 解填充失败（密文不匹配或已被篡改）');
    return m;
  }

  /* 剥掉私钥分量：RSA 去 d/p/q/dp/dq/qi，EC 去 d —— 加密/验签只能喂公钥 */
  function rsaPubOf(j) {
    var o = {};
    ['kty', 'n', 'e', 'kid', 'use', 'alg'].forEach(function (k) { if (j[k] != null) o[k] = j[k]; });
    return o;
  }
  function ecPubOf(j) {
    var o = {};
    ['kty', 'crv', 'x', 'y', 'kid', 'use', 'alg'].forEach(function (k) { if (j[k] != null) o[k] = j[k]; });
    return o;
  }

  /* ---------------- JWA 算法表 ---------------- */
  var HASH_BITS = { S256: 256, S384: 384, S512: 512 };
  var JWS_ALGS = {
    HS256: { kind: 'hmac', hash: 'SHA-256' },
    HS384: { kind: 'hmac', hash: 'SHA-384' },
    HS512: { kind: 'hmac', hash: 'SHA-512' },
    RS256: { kind: 'rsa15', hash: 'SHA-256' },
    RS384: { kind: 'rsa15', hash: 'SHA-384' },
    RS512: { kind: 'rsa15', hash: 'SHA-512' },
    PS256: { kind: 'rsapss', hash: 'SHA-256' },
    PS384: { kind: 'rsapss', hash: 'SHA-384' },
    PS512: { kind: 'rsapss', hash: 'SHA-512' },
    ES256: { kind: 'ecdsa', hash: 'SHA-256', crv: 'P-256', klen: 32 },
    ES384: { kind: 'ecdsa', hash: 'SHA-384', crv: 'P-384', klen: 48 },
    ES512: { kind: 'ecdsa', hash: 'SHA-512', crv: 'P-521', klen: 66 },
    EdDSA: { kind: 'eddsa' }
  };
  /* enc: [密钥总长(字节), AES-CBC 用? , HMAC 位数, 标签截断(字节)] */
  var ENC_ALGS = {
    A128GCM: { klen: 16, mode: 'gcm', tag: 16 },
    A192GCM: { klen: 24, mode: 'gcm', tag: 16 },
    A256GCM: { klen: 32, mode: 'gcm', tag: 16 },
    A128CBC_HS256: { klen: 32, mode: 'cbc', hash: 'SHA-256', mac: 16, tag: 16 },
    A192CBC_HS384: { klen: 48, mode: 'cbc', hash: 'SHA-384', mac: 24, tag: 24 },
    A256CBC_HS512: { klen: 64, mode: 'cbc', hash: 'SHA-512', mac: 32, tag: 32 }
  };
  var ENC_ALIAS = {
    'A128CBC-HS256': 'A128CBC_HS256', 'A192CBC-HS384': 'A192CBC_HS384', 'A256CBC-HS512': 'A256CBC_HS512',
    'A128CBC+HS256': 'A128CBC_HS256', 'A192CBC+HS384': 'A192CBC_HS384', 'A256CBC+HS512': 'A256CBC_HS512'
  };
  function encSpec(enc) {
    var k = ENC_ALIAS[enc] || enc;
    var s = ENC_ALGS[k];
    if (!s) throw new Error('未知 enc：' + enc + '，可选：' + Object.keys(ENC_ALGS).map(function (x) {
      return x.replace('_', '-');
    }).join(' / '));
    return s;
  }

  /* ---------------- JWK → CryptoKey ---------------- */
  function jwkToKey(jwk, alg) {
    var A = JWS_ALGS[alg];
    if (!A) throw new Error('未知 JWS 算法：' + alg);
    var isPriv = !!jwk.d;
    var usages = isPriv ? ['sign'] : ['verify'];
    if (A.kind === 'hmac') {
      return subtle().importKey('raw', b64uDec(jwk.k), { name: 'HMAC', hash: A.hash }, false, usages);
    }
    if (A.kind === 'rsa15') {
      return subtle().importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: A.hash }, false, usages);
    }
    if (A.kind === 'rsapss') {
      /* ⚠ RSA-PSS 走 RsaHashedImportParams，hash 是必填；漏了会报
         "can not be converted to 'RsaHashedImportParams' because 'hash' is required" */
      return subtle().importKey('jwk', rsaPubOf(jwk) && jwk.d ? jwk : rsaPubOf(jwk),
        { name: 'RSA-PSS', hash: A.hash, saltLength: parseInt(alg.slice(2), 10) / 8 }, false, usages);
    }
    if (A.kind === 'ecdsa') {
      return subtle().importKey('jwk', jwk, { name: 'ECDSA', namedCurve: A.crv }, false, usages);
    }
    if (A.kind === 'eddsa') {
      var nm = jwk.crv === 'Ed448' ? 'Ed448' : 'Ed25519';
      return subtle().importKey('jwk', jwk, { name: nm }, false, usages);
    }
    throw new Error('未支持：' + alg);
  }

  /* ================= JWS（RFC 7515） ================= */
  /* 签名输入 = ASCII(BASE64URL(protected) || '.' || BASE64URL(payload))
     b64:false（RFC 7797）时 payload 段直接用原始字节，不编码 */
  function jwsSignInput(protectedB64u, payloadBytes, b64) {
    var head = utf8(protectedB64u + '.');
    if (b64 === false) {
      var out = new Uint8Array(head.length + payloadBytes.length);
      out.set(head, 0); out.set(payloadBytes, head.length);
      return out;
    }
    var pay = utf8(b64uEnc(payloadBytes));
    var o = new Uint8Array(head.length + pay.length);
    o.set(head, 0); o.set(pay, head.length);
    return o;
  }

  async function jwsSign(alg, keyJwkOrSecret, protectedObj, payloadBytes, opts) {
    opts = opts || {};
    /* ⚠ protected 的【编码结果】才是签名输入的一部分，键顺序与是否为空串都影响结果。
       若调用方已持有官方编码（opts.protectedB64u），必须直接采用，不能重新序列化对象：
       RFC 7520 §4.7「Protecting Content Only」的 protected 是空串，重序列化会得到 "e30"，签名全错。 */
    var protectedB64u = opts.protectedB64u != null
      ? opts.protectedB64u
      : b64uEnc(utf8(JSON.stringify(protectedObj)));
    var input = jwsSignInput(protectedB64u, payloadBytes, opts.b64);
    var A = JWS_ALGS[alg];
    if (!A) throw new Error('未知 JWS alg：' + alg + '，可选：' + Object.keys(JWS_ALGS).join(' / '));
    var sig;
    if (A.kind === 'hmac') {
      var kb = typeof keyJwkOrSecret === 'string' ? utf8(keyJwkOrSecret) : b64uDec(keyJwkOrSecret.k);
      var mk = await subtle().importKey('raw', kb, { name: 'HMAC', hash: A.hash }, false, ['sign']);
      sig = new Uint8Array(await subtle().sign('HMAC', mk, input));
    } else {
      var ck = await jwkToKey(keyJwkOrSecret, alg);
      sig = new Uint8Array(await subtle().sign(
        A.kind === 'rsapss' ? { name: 'RSA-PSS', saltLength: parseInt(alg.slice(2), 10) / 8 }
          : A.kind === 'eddsa' ? { name: keyJwkOrSecret.crv === 'Ed448' ? 'Ed448' : 'Ed25519' }
            : A.kind === 'rsa15' ? { name: 'RSASSA-PKCS1-v1_5' }
              : { name: 'ECDSA', hash: A.hash },
        ck, input));
      if (A.kind === 'ecdsa') { /* Web Crypto 已是 raw r||s，JWS 要的就是这个格式，无需转换 */ }
    }
    return {
      protected: protectedB64u,
      payload: opts.b64 === false ? utf8d(payloadBytes) : b64uEnc(payloadBytes),
      signature: b64uEnc(sig),
      compact: protectedB64u + '.' + (opts.b64 === false ? utf8d(payloadBytes) : b64uEnc(payloadBytes)) + '.' + b64uEnc(sig)
    };
  }

  async function jwsVerify(alg, keyJwkOrSecret, protectedB64u, payloadSeg, sigB64u, opts) {
    opts = opts || {};
    var payloadBytes = opts.b64 === false ? utf8(payloadSeg) : b64uDec(payloadSeg);
    var input = jwsSignInput(protectedB64u, payloadBytes, opts.b64);
    var A = JWS_ALGS[alg];
    if (!A) throw new Error('未知 JWS alg：' + alg + '，可选：' + Object.keys(JWS_ALGS).join(' / '));
    if (A.kind === 'hmac') {
      var kb = typeof keyJwkOrSecret === 'string' ? utf8(keyJwkOrSecret) : b64uDec(keyJwkOrSecret.k);
      var mk = await subtle().importKey('raw', kb, { name: 'HMAC', hash: A.hash }, false, ['verify']);
      return subtle().verify('HMAC', mk, b64uDec(sigB64u), input);
    }
    /* ⚠ 验签一律走 jwkToKey()：RSASSA 需要 hash、ECDSA 需要 namedCurve、PSS 需要 saltLength，
       三者的 importKey 参数各不相同，手工拼容易漏字段（这里踩过：rsa15 漏 hash、ecdsa 传成 hash 而非 namedCurve）。 */
    var ck = await jwkToKey(keyJwkOrSecret, alg);
    return subtle().verify(
      A.kind === 'rsapss' ? { name: 'RSA-PSS', saltLength: parseInt(alg.slice(2), 10) / 8 }
        : A.kind === 'eddsa' ? { name: keyJwkOrSecret.crv === 'Ed448' ? 'Ed448' : 'Ed25519' }
          : A.kind === 'rsa15' ? { name: 'RSASSA-PKCS1-v1_5' }
            : { name: 'ECDSA', hash: A.hash },
      ck, b64uDec(sigB64u), input);
  }

  /* ================= JWE 密钥管理（alg） ================= */
  /* Concat KDF（NIST SP 800-56A 的 JOSE 变体，RFC 7518 §4.6.2）
   *
   * ⚠ 这里有两处极易写错、且写错了不会报错只会「解不出 CEK」的地方，由 RFC 7520 §5.4/§5.5 钉死：
   *   1) SuppPubInfo 是 keydatalen 的【4 字节裸值】，【不带】长度前缀。
   *      它不像 AlgorithmID / PartyUInfo / PartyVInfo 那样是 length||data 结构。
   *      我最初给它加了长度前缀，结果 8 种参数组合全部对不上官方 CEK。
   *   2) SuppPrivInfo 是「缺席」（absent），不是「长度为 0 的空段」—— 连 4 字节的 0 都不能追加。
   *      多追加一段 0x00000000 会让摘要完全不同。
   *   正确布局：Counter(4) || Z || len+AlgorithmID || len+PartyUInfo || len+PartyVInfo || keydatalen(4 裸)
   */
  function concatKdf(z, algId, apuB, apvB, keydatalen) {
    var parts = [];
    function prep(b) {
      var l = new Uint8Array(4);
      l[0] = (b.length >>> 24) & 255; l[1] = (b.length >>> 16) & 255;
      l[2] = (b.length >>> 8) & 255; l[3] = b.length & 255;
      var o = new Uint8Array(4 + b.length); o.set(l, 0); o.set(b, 4); return o;
    }
    var one = new Uint8Array(4); one[3] = 1;
    var kl = new Uint8Array(4);
    kl[0] = (keydatalen >>> 24) & 255; kl[1] = (keydatalen >>> 16) & 255;
    kl[2] = (keydatalen >>> 8) & 255; kl[3] = keydatalen & 255;
    parts.push(one, z, prep(algId), prep(apuB || new Uint8Array(0)), prep(apvB || new Uint8Array(0)), kl);
    var total = 0; parts.forEach(function (p) { total += p.length; });
    var buf = new Uint8Array(total), off = 0;
    parts.forEach(function (p) { buf.set(p, off); off += p.length; });
    return { hash: 'SHA-256', message: buf, outBytes: keydatalen / 8 };
  }
  async function concatKdfOut(z, algId, apuB, apvB, keydatalenBits) {
    var s = concatKdf(z, algId, apuB, apvB, keydatalenBits);
    var d = await subtle().digest(s.hash, s.message);
    return new Uint8Array(d).subarray(0, s.outBytes);
  }

  /* 生成 CEK 或对 CEK 做包装 → 返回 { encryptedKey, epk } */
  async function wrapKey(alg, enc, keyJwk, cek, gen) {
    gen = gen || {};
    var E = encSpec(enc);
    if (alg === 'dir') return { encryptedKey: new Uint8Array(0), cek: cek };

    if (alg === 'A128KW' || alg === 'A192KW' || alg === 'A256KW') {
      var kek = keyJwk.k ? b64uDec(keyJwk.k) : null;
      if (!kek) throw new Error(alg + ' 需要 oct 密钥（JWK 含 k）');
      var kk = await subtle().importKey('raw', kek, { name: 'AES-KW' }, false, ['wrapKey']);
      /* ⚠ importKey 的 usages 不能是空数组（Node 报 "Usages cannot be empty"），给一个最小可用的 usage */
      var ck = await subtle().importKey('raw', cek, { name: 'AES-GCM' }, true, ['encrypt']);
      var wrapped = new Uint8Array(await subtle().wrapKey('raw', ck, kk, { name: 'AES-KW' }));
      return { encryptedKey: wrapped };
    }
    if (alg === 'A128GCMKW' || alg === 'A192GCMKW' || alg === 'A256GCMKW') {
      var kek2 = b64uDec(keyJwk.k);
      var iv = gen.iv ? (typeof gen.iv === 'string' ? b64uDec(gen.iv) : gen.iv) : rnd(12);
      var kk2 = await subtle().importKey('raw', kek2, { name: 'AES-GCM' }, false, ['encrypt']);
      var ct = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, kk2, cek));
      /* Web Crypto 的 GCM 输出尾部 16 字节就是 tag */
      return { encryptedKey: ct.subarray(0, ct.length - 16), tag: ct.subarray(ct.length - 16), iv: iv };
    }
    if (alg === 'RSA1_5') {
      var ekB64u = rsa15EncWithJwk(keyJwk, cek);
      return { encryptedKey: b64uDec(ekB64u) };
    }
    if (alg.indexOf('RSA-OAEP') === 0) {
      var h = alg === 'RSA-OAEP' ? 'SHA-1' : alg === 'RSA-OAEP-256' ? 'SHA-256' : alg === 'RSA-OAEP-384' ? 'SHA-384' : 'SHA-512';
      /* ⚠ 加密只用公钥：官方向量给的 JWK 常含 d（完整私钥），直接 import 成 encrypt 会报
         "Unsupported key usage for an RSA-OAEP key"，必须先剥掉私钥分量 */
      var pk = await subtle().importKey('jwk', rsaPubOf(keyJwk), { name: 'RSA-OAEP', hash: h }, false, ['encrypt']);
      var ek = new Uint8Array(await subtle().encrypt({ name: 'RSA-OAEP' }, pk, cek));
      return { encryptedKey: ek };
    }
    if (alg.indexOf('PBES2') === 0) {
      var m = /^PBES2-(HS(?:256|384|512))\+(A(?:128|192|256)KW)$/.exec(alg);
      if (!m) throw new Error('未知 PBES2 变体：' + alg);
      /* ⚠ p2s 在 JWE header 里是 base64url 【字符串】，拼进 PBKDF2 salt 前必须先解码成字节。
         直接把字符串塞进 Uint8Array.set 会静默写入 NaN→0，派生出的 KEK 与官方完全不同，
         而 ct/tag/iv 全都对得上，极易误判成「只是 encrypted_key 随机」。
         解密侧（unwrapKey）本来就走 b64uDec(hdr.p2s)，所以这个 bug 只在加密侧暴露。 */
      var p2s = gen.p2s ? (typeof gen.p2s === 'string' ? b64uDec(gen.p2s) : gen.p2s) : rnd(16);
      var p2c = gen.p2c || 4096;
      var dkLen = parseInt(m[2].slice(1, 4), 10) / 8;
      var pw = typeof keyJwk === 'string' ? utf8(keyJwk) : b64uDec(keyJwk.k);
      var salt = utf8(alg + '\x00');
      var full = new Uint8Array(salt.length + p2s.length);
      full.set(salt, 0); full.set(p2s, salt.length);
      var base = await subtle().importKey('raw', pw, 'PBKDF2', false, ['deriveBits']);
      var dk = new Uint8Array(await subtle().deriveBits({ name: 'PBKDF2', salt: full, iterations: p2c, hash: m[1].replace('HS', 'SHA-') }, base, dkLen * 8));
      var kw = await subtle().importKey('raw', dk, { name: 'AES-KW' }, false, ['wrapKey']);
      var ck2 = await subtle().importKey('raw', cek, { name: 'AES-GCM' }, true, ['encrypt']);
      var w2 = new Uint8Array(await subtle().wrapKey('raw', ck2, kw, { name: 'AES-KW' }));
      return { encryptedKey: w2, p2s: p2s, p2c: p2c };
    }
    if (alg.indexOf('ECDH-ES') === 0) {
      var kwAlg = alg.indexOf('+') >= 0 ? alg.slice(alg.indexOf('+') + 1) : null;
      var recipientJwk = keyJwk;
      var crv = recipientJwk.crv || 'P-256';
      var epkJwk = gen.epk;
      var ephPriv = null;
      if (epkJwk && epkJwk.d) {
        ephPriv = await subtle().importKey('jwk', epkJwk, { name: 'ECDH', namedCurve: crv }, false, ['deriveBits']);
      } else {
        var pair = await subtle().generateKey({ name: 'ECDH', namedCurve: crv }, true, ['deriveBits']);
        ephPriv = pair.privateKey;
        epkJwk = await subtle().exportKey('jwk', pair.publicKey);
      }
      var pub = await subtle().importKey('jwk', ecPubOf(recipientJwk), { name: 'ECDH', namedCurve: crv }, false, []);
      var bits = await subtle().deriveBits({ name: 'ECDH', public: pub }, ephPriv, crv === 'P-521' ? 528 : crv === 'P-384' ? 384 : 256);
      var z = new Uint8Array(bits);
      /* ⚠ AlgorithmID 的取值规则由 RFC 7520 §5.4/§5.5 钉死，凭直觉极易写反：
         ECDH-ES（direct）      → 用 enc 名（如 "A128CBC-HS256"）
         ECDH-ES+AxxxKW         → 用【完整的 alg 名】（如 "ECDH-ES+A128KW"），不是 "A128KW"！
         我最初写成 kwAlg（去掉 ECDH-ES+ 前缀的部分），导致派生的 KEK 完全对不上官方 CEK。 */
      var algId = utf8(kwAlg ? alg : enc);
      var keydatalen = kwAlg ? parseInt(kwAlg.slice(1, 4), 10) : (E.klen * 8);
      var dk2 = await concatKdfOut(z, algId, gen.apu ? b64uDec(gen.apu) : null, gen.apv ? b64uDec(gen.apv) : null, keydatalen);
      if (!kwAlg) return { encryptedKey: new Uint8Array(0), cek: dk2, epk: epkJwk };
      var kw3 = await subtle().importKey('raw', dk2, { name: 'AES-KW' }, false, ['wrapKey']);
      var ck3 = await subtle().importKey('raw', cek, { name: 'AES-GCM' }, true, ['encrypt']);
      var w3 = new Uint8Array(await subtle().wrapKey('raw', ck3, kw3, { name: 'AES-KW' }));
      return { encryptedKey: w3, epk: epkJwk };
    }
    throw new Error('暂不支持的 alg：' + alg);
  }

  /* 解出 CEK */
  async function unwrapKey(alg, enc, keyJwk, encryptedKey, hdr) {
    var E = encSpec(enc);
    if (alg === 'dir') {
      if (encryptedKey && encryptedKey.length) throw new Error('dir 模式下 Encrypted Key 必须为空');
      var kk = keyJwk.k ? b64uDec(keyJwk.k) : null;
      if (!kk) throw new Error('dir 需要 oct 密钥（JWK 含 k）');
      if (kk.length !== E.klen) throw new Error('dir：密钥需 ' + E.klen + ' 字节，收到 ' + kk.length);
      return kk;
    }
    if (alg === 'A128KW' || alg === 'A192KW' || alg === 'A256KW') {
      var kek = b64uDec(keyJwk.k);
      var uk = await subtle().importKey('raw', kek, { name: 'AES-KW' }, false, ['unwrapKey']);
      var ck = await subtle().unwrapKey('raw', encryptedKey, uk, { name: 'AES-KW' }, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
      return new Uint8Array(await subtle().exportKey('raw', ck));
    }
    if (alg === 'A128GCMKW' || alg === 'A192GCMKW' || alg === 'A256GCMKW') {
      var kek2 = b64uDec(keyJwk.k);
      var iv2 = b64uDec(hdr.iv), tag2 = b64uDec(hdr.tag);
      var ek2 = encryptedKey;
      var combined = new Uint8Array(ek2.length + tag2.length);
      combined.set(ek2, 0); combined.set(tag2, ek2.length);
      var uk2 = await subtle().importKey('raw', kek2, { name: 'AES-GCM' }, false, ['decrypt']);
      return new Uint8Array(await subtle().decrypt({ name: 'AES-GCM', iv: iv2, tagLength: 128 }, uk2, combined));
    }
    if (alg === 'RSA1_5') {
      return rsa15DecWithJwk(keyJwk, b64uEnc(encryptedKey));
    }
    if (alg.indexOf('RSA-OAEP') === 0) {
      var h2 = alg === 'RSA-OAEP' ? 'SHA-1' : alg === 'RSA-OAEP-256' ? 'SHA-256' : alg === 'RSA-OAEP-384' ? 'SHA-384' : 'SHA-512';
      var pk2 = await subtle().importKey('jwk', keyJwk, { name: 'RSA-OAEP', hash: h2 }, false, ['decrypt']);
      return new Uint8Array(await subtle().decrypt({ name: 'RSA-OAEP' }, pk2, encryptedKey));
    }
    if (alg.indexOf('PBES2') === 0) {
      var m2 = /^PBES2-(HS(?:256|384|512))\+(A(?:128|192|256)KW)$/.exec(alg);
      var p2s2 = b64uDec(hdr.p2s), p2c2 = hdr.p2c;
      var dkLen2 = parseInt(m2[2].slice(1, 4), 10) / 8;
      var pw2 = typeof keyJwk === 'string' ? utf8(keyJwk) : b64uDec(keyJwk.k);
      var salt2 = utf8(alg + '\x00');
      var full2 = new Uint8Array(salt2.length + p2s2.length);
      full2.set(salt2, 0); full2.set(p2s2, salt2.length);
      var base2 = await subtle().importKey('raw', pw2, 'PBKDF2', false, ['deriveBits']);
      var dkb = new Uint8Array(await subtle().deriveBits({ name: 'PBKDF2', salt: full2, iterations: p2c2, hash: m2[1].replace('HS', 'SHA-') }, base2, dkLen2 * 8));
      var uk3 = await subtle().importKey('raw', dkb, { name: 'AES-KW' }, false, ['unwrapKey']);
      var ck4 = await subtle().unwrapKey('raw', encryptedKey, uk3, { name: 'AES-KW' }, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
      return new Uint8Array(await subtle().exportKey('raw', ck4));
    }
    if (alg.indexOf('ECDH-ES') === 0) {
      var kwAlg2 = alg.indexOf('+') >= 0 ? alg.slice(alg.indexOf('+') + 1) : null;
      var crv2 = keyJwk.crv || 'P-256';
      var epk2 = hdr.epk;
      if (!epk2) throw new Error('ECDH-ES 缺少 epk（临时公钥）');
      var ephPub = await subtle().importKey('jwk', epk2, { name: 'ECDH', namedCurve: crv2 }, false, []);
      var priv = await subtle().importKey('jwk', keyJwk, { name: 'ECDH', namedCurve: crv2 }, false, ['deriveBits']);
      var bits2 = await subtle().deriveBits({ name: 'ECDH', public: ephPub }, priv, crv2 === 'P-521' ? 528 : crv2 === 'P-384' ? 384 : 256);
      var z2 = new Uint8Array(bits2);
      var algId2 = utf8(kwAlg2 ? alg : enc);   /* 同 wrapKey：KW 分支用完整 alg 名 */
      var keydatalen2 = kwAlg2 ? parseInt(kwAlg2.slice(1, 4), 10) : (E.klen * 8);
      var dk3 = await concatKdfOut(z2, algId2, hdr.apu ? b64uDec(hdr.apu) : null, hdr.apv ? b64uDec(hdr.apv) : null, keydatalen2);
      if (!kwAlg2) return dk3;
      var uk4 = await subtle().importKey('raw', dk3, { name: 'AES-KW' }, false, ['unwrapKey']);
      var ck5 = await subtle().unwrapKey('raw', encryptedKey, uk4, { name: 'AES-KW' }, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
      return new Uint8Array(await subtle().exportKey('raw', ck5));
    }
    throw new Error('暂不支持的 alg：' + alg);
  }

  /* ================= 内容加密 ================= */
  async function encContent(E, cek, iv, plaintext, aadBytes) {
    if (E.mode === 'gcm') {
      var k = await subtle().importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
      var ct = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv: iv, additionalData: aadBytes, tagLength: E.tag * 8 }, k, plaintext));
      return { ciphertext: ct.subarray(0, ct.length - E.tag), tag: ct.subarray(ct.length - E.tag) };
    }
    /* AES-CBC-HMAC（RFC 7518 §5.2）：cek 前一半 MAC_KEY，后一半 ENC_KEY */
    var half = cek.length / 2;
    var macKey = cek.subarray(0, half), encKey = cek.subarray(half);
    var mk = await subtle().importKey('raw', macKey, { name: 'HMAC', hash: E.hash }, false, ['sign']);
    var ek = await subtle().importKey('raw', encKey, { name: 'AES-CBC' }, false, ['encrypt']);
    var ct2 = new Uint8Array(await subtle().encrypt({ name: 'AES-CBC', iv: iv }, ek, plaintext));
    /* AL = AAD 的位长度（64 位大端） */
    var al = new Uint8Array(8);
    var bits = aadBytes.length * 8;
    /* 用浮点安全写法写 64 位大端 */
    var hi = Math.floor(bits / 4294967296), lo = bits >>> 0;
    for (var i = 0; i < 4; i++) { al[i] = (hi >>> (24 - i * 8)) & 255; al[4 + i] = (lo >>> (24 - i * 8)) & 255; }
    var total = aadBytes.length + iv.length + ct2.length + al.length;
    var buf = new Uint8Array(total), off = 0;
    buf.set(aadBytes, off); off += aadBytes.length;
    buf.set(iv, off); off += iv.length;
    buf.set(ct2, off); off += ct2.length;
    buf.set(al, off);
    var full = new Uint8Array(await subtle().sign('HMAC', mk, buf));
    return { ciphertext: ct2, tag: full.subarray(0, E.mac) };
  }
  async function decContent(E, cek, iv, ciphertext, tag, aadBytes) {
    if (E.mode === 'gcm') {
      var k = await subtle().importKey('raw', cek, { name: 'AES-GCM' }, false, ['decrypt']);
      var comb = new Uint8Array(ciphertext.length + tag.length);
      comb.set(ciphertext, 0); comb.set(tag, ciphertext.length);
      return new Uint8Array(await subtle().decrypt({ name: 'AES-GCM', iv: iv, additionalData: aadBytes, tagLength: tag.length * 8 }, k, comb));
    }
    var half = cek.length / 2;
    var macKey = cek.subarray(0, half), encKey = cek.subarray(half);
    /* ⚠ RFC 7518 §5.2.2 规定认证标签是 HMAC 结果的【前一半】（HS256 取 16 字节）。
       但 Web Crypto 的 subtle.verify 要求 signature 是完整的 HMAC 输出，
       直接把 16 字节截断值交给 verify 会恒返回 false —— 必须自己算出完整 HMAC 再比对前一半。 */
    var mk = await subtle().importKey('raw', macKey, { name: 'HMAC', hash: E.hash }, false, ['sign']);
    var al = new Uint8Array(8);
    var bits = aadBytes.length * 8;
    var hi = Math.floor(bits / 4294967296), lo = bits >>> 0;
    for (var i = 0; i < 4; i++) { al[i] = (hi >>> (24 - i * 8)) & 255; al[4 + i] = (lo >>> (24 - i * 8)) & 255; }
    var buf = new Uint8Array(aadBytes.length + iv.length + ciphertext.length + al.length), off = 0;
    buf.set(aadBytes, off); off += aadBytes.length;
    buf.set(iv, off); off += iv.length;
    buf.set(ciphertext, off); off += ciphertext.length;
    buf.set(al, off);
    var fullTag = new Uint8Array(await subtle().sign('HMAC', mk, buf));
    var want = fullTag.subarray(0, E.mac);
    var same = want.length === tag.length;
    /* 常数时间：不提前 break，避免按首个不匹配位置泄漏时序 */
    if (same) { var _d = 0; for (var q = 0; q < want.length; q++) _d |= want[q] ^ tag[q]; same = (_d === 0); }
    if (!same) throw new Error('认证标签校验失败（密文或 AAD 被篡改）');
    var ek = await subtle().importKey('raw', encKey, { name: 'AES-CBC' }, false, ['decrypt']);
    return new Uint8Array(await subtle().decrypt({ name: 'AES-CBC', iv: iv }, ek, ciphertext));
  }

  /* zip:DEF（RFC 7516 §4.1.3）：明文先 DEFLATE 再加密。读写两侧都要支持，否则 §5.9 会解出压缩垃圾。 */
  async function deflateRaw(b) {
    if (typeof CompressionStream === 'function') {
      var cs = new CompressionStream('deflate-raw');
      var w = cs.writable.getWriter(); w.write(b); w.close();
      return new Uint8Array(await new Response(cs.readable).arrayBuffer());
    }
    return new Uint8Array(require('zlib').deflateRawSync(Buffer.from(b)));
  }
  async function inflateRaw(b) {
    if (typeof DecompressionStream === 'function') {
      var ds = new DecompressionStream('deflate-raw');
      var w = ds.writable.getWriter(); w.write(b); w.close();
      return new Uint8Array(await new Response(ds.readable).arrayBuffer());
    }
    return new Uint8Array(require('zlib').inflateRawSync(Buffer.from(b)));
  }

  /* AAD = ASCII(BASE64URL(protected)) [+ '.' + BASE64URL(JWE AAD)]
   *
   * ⚠ unprotected header 【不进】AAD —— 这正是 RFC 7520 §5.11「Protecting Specific Header Fields」
   *   的全部意义：想受完整性保护的字段放 protected，不想受保护的放 unprotected。
   *   若把 unprotected 也拼进 AAD，等于把「不保护」变成了「保护」，与官方向量直接冲突
   *   （§5.11 / §5.12 两条向量会立刻认证失败，这里踩过）。
   *   §5.12 连 protected 都是空串，此时 AAD 就是空字节串。
   */
  function buildAad(protectedB64u, unprotected, externalAad) {
    var s = protectedB64u;
    if (externalAad != null && externalAad.length) s += '.' + b64uEnc(externalAad);
    return utf8(s);
  }

  /* ================= 对外：JWE 加密/解密 ================= */
  async function jweEncrypt(opts) {
    var alg = opts.alg, enc = opts.enc, keyJwk = opts.key;
    var E = encSpec(enc);
    var protectedObj = Object.assign({ alg: alg, enc: enc }, opts.protected || {});
    var unprotected = opts.unprotected || null;
    /* 若 alg 需要头字段（apu/apv/epk/p2s/p2c/iv/tag），先放到 unprotected */
    /* ⚠ dir（直接加密）模式下 CEK 就是密钥本身，不存在「随机生成 CEK」这回事。
       这里若仍 rnd()，加密结果会与官方不一致（RFC 7520 §5.6 暴露）。 */
    var cek = alg === 'dir' && !(opts.cek)
      ? b64uDec(keyJwk.k)
      : (opts.cek ? (typeof opts.cek === 'string' ? b64uDec(opts.cek) : opts.cek) : rnd(E.klen));
    if (cek.length !== E.klen) throw new Error(enc + ' 的 CEK 需 ' + E.klen + ' 字节，收到 ' + cek.length);
    var w = await wrapKey(alg, enc, keyJwk, cek, opts.generated || {});
    var hdr = {};
    if (w.epk) hdr.epk = w.epk;
    if (w.iv) hdr.iv = b64uEnc(w.iv);
    if (w.tag) hdr.tag = b64uEnc(w.tag);
    if (w.p2s) { hdr.p2s = b64uEnc(w.p2s); hdr.p2c = w.p2c; }
    protectedObj = Object.assign({}, protectedObj, opts.protectedExtra || {});
    if (hdr.epk || hdr.iv || hdr.tag || hdr.p2s) {
      /* epk/apu/apv/p2s/p2c 属 per-recipient，放 unprotected；GCMKW 的 iv/tag 也在此 */
      unprotected = Object.assign({}, unprotected, {
        epk: hdr.epk, iv: hdr.iv, tag: hdr.tag, p2s: hdr.p2s, p2c: hdr.p2c,
        apu: (opts.generated || {}).apu, apv: (opts.generated || {}).apv
      });
      Object.keys(unprotected).forEach(function (k) { if (unprotected[k] == null) delete unprotected[k]; });
    }
    /* ⚠ protected 的 JSON 键顺序会改变 base64url，进而改变 AAD 与整个输出。
       要字节级复现 RFC 7520 的 compact，必须用官方给出的编码（opts.protectedB64u），
       不能拿对象重新序列化——官方的顺序是 alg,kid,enc，而 Object.assign 会排成 alg,enc,kid。 */
    var protectedB64u = opts.protectedB64u != null
      ? opts.protectedB64u
      : b64uEnc(utf8(JSON.stringify(protectedObj)));
    var extAadE = opts.aad == null ? null : (typeof opts.aad === 'string' ? utf8(opts.aad) : opts.aad);
    var aad = buildAad(protectedB64u, unprotected, extAadE);
    var iv = opts.iv ? (typeof opts.iv === 'string' ? b64uDec(opts.iv) : opts.iv) : rnd(E.mode === 'gcm' ? 12 : 16);
    var pt = typeof opts.plaintext === 'string' ? utf8(opts.plaintext) : opts.plaintext;
    if (opts.zip === 'DEF') pt = await deflateRaw(pt);
    var r = await encContent(E, cek, iv, pt, aad);
    var compact = [protectedB64u, b64uEnc(w.encryptedKey), b64uEnc(iv), b64uEnc(r.ciphertext), b64uEnc(r.tag)].join('.');
    return { compact: compact, protected: protectedB64u, cek: cek, iv: iv };
  }

  async function jweDecrypt(compact, keyJwk, opts) {
    opts = opts || {};
    var parts = String(compact).trim().split('.');
    if (parts.length !== 5) throw new Error('JWE Compact 必须是 5 段（收到 ' + parts.length + ' 段）');
    var protectedB64u = parts[0];
    /* ⚠ protected 段允许是【空串】（RFC 7520 §5.12「Protecting Content Only」），
       此时 alg/enc 全在 unprotected header 里，JSON.parse('') 会崩，必须先判空。 */
    var protectedObj = protectedB64u ? JSON.parse(utf8d(b64uDec(protectedB64u))) : {};
    var unprotected = opts.unprotected || null;
    /* ⚠ alg/enc 可能只出现在 unprotected header（§5.11 把 alg/kid 放 unprotected、只把 enc 放 protected） */
    var alg = protectedObj.alg || (unprotected && unprotected.alg) || (opts.header && opts.header.alg);
    var enc = protectedObj.enc || (unprotected && unprotected.enc) || (opts.header && opts.header.enc);
    if (!alg) throw new Error('缺少 alg（protected 与 unprotected 中都没有）');
    if (!enc) throw new Error('缺少 enc（protected 与 unprotected 中都没有）');
    var hdr = Object.assign({}, protectedObj, unprotected || {}, opts.header || {});
    var extAad = opts.aad == null ? null : (typeof opts.aad === 'string' ? utf8(opts.aad) : opts.aad);
    var aad = buildAad(protectedB64u, unprotected, extAad);
    var cek = await unwrapKey(alg, enc, keyJwk, b64uDec(parts[1]), hdr);
    var E = encSpec(enc);
    if (cek.length !== E.klen) throw new Error(enc + ' 的 CEK 需 ' + E.klen + ' 字节，解出 ' + cek.length);
    var iv = b64uDec(parts[2]);
    var ct = b64uDec(parts[3]);
    var tag = b64uDec(parts[4]);
    var pt = await decContent(E, cek, iv, ct, tag, aad);
    if (protectedObj.zip) {
      if (protectedObj.zip !== 'DEF') throw new Error('不支持的 zip：' + protectedObj.zip);
      pt = await inflateRaw(pt);
    }
    return { plaintext: pt, protected: protectedObj, cek: cek };
  }

  /* ================= 导出 ================= */
  var API = {
    b64uEnc: b64uEnc, b64uDec: b64uDec, utf8: utf8, utf8d: utf8d,
    JWS_ALGS: JWS_ALGS, ENC_ALGS: ENC_ALGS, ENC_ALIAS: ENC_ALIAS, encSpec: encSpec,
    jwsSign: jwsSign, jwsVerify: jwsVerify, jwsSignInput: jwsSignInput,
    jweEncrypt: jweEncrypt, jweDecrypt: jweDecrypt,
    wrapKey: wrapKey, unwrapKey: unwrapKey, concatKdf: concatKdf,
    rsa15EncWithJwk: rsa15EncWithJwk, rsa15DecWithJwk: rsa15DecWithJwk,
    encContent: encContent, decContent: decContent, buildAad: buildAad
  };
  if (typeof window !== 'undefined') window.JOSE = API;
  if (typeof global !== 'undefined') global.JOSE = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;

  /* ================= 注册到界面（浏览器里 reg 由主逻辑提供） =================
   * 交互约定：加密 = 生成/签名，解密 = 解析/验签。
   *   jose-jws  密钥=签名密钥 JWK（或 oct 的 k），参数=alg；加密出 compact，解密还原原文并验签
   *   jose-jwe  密钥=收件人 JWK（或 PBES2 的口令），参数=alg/enc；加密出 compact，解密还原明文
   *   jose-jwk  密钥=任意 JWK；加密=解析并输出字段与指纹，解密=校验 JWK 结构
   */
  if (typeof reg === 'function') {

    reg({
      id: 'jose-jws', name: 'JWS 签名/验签（RFC 7515）', group: '数字签名', key: true, param: true,
      keyLabel: '签名密钥 JWK（JSON）；HMAC 系可直接填共享密钥字符串',
      paramLabel: 'alg（HS256/HS384/HS512 · RS256/384/512 · PS256/384/512 · ES256/384/512 · EdDSA），留空默认 HS256',
      info: 'JWS（RFC 7515）：对 ASCII(B64U(protected) "." B64U(payload)) 签名，输出 compact 前三段 h.p.s。支持 RFC 7797 的 b64:false。HS256/RS256/EdDSA 确定性，可用 RFC 7520 官方向量复现；PS*/ES* 带随机量只能验签。加密=签名，解密=验签并还原原文。',
      enc: async function (b, k, p, fmt) {
        var alg = String(p || '').trim() || 'HS256';
        var prot = { alg: alg, typ: 'JWT' };
        var key;
        var ks = String(k).trim();
        if (ks.charAt(0) === '{') { try { key = JSON.parse(ks); } catch (e) { throw new Error('密钥不是合法 JSON：' + e.message); } }
        else key = ks;   /* 裸共享密钥字符串 */
        var r = await jwsSign(alg, key, prot, b);
        return r.compact;
      },
      dec: async function (s, k, p, fmt) {
        var parts = String(s).trim().split('.');
        if (parts.length !== 3) throw new Error('JWS compact 必须是 3 段（收到 ' + parts.length + ' 段）');
        var prot = JSON.parse(utf8d(b64uDec(parts[0])));
        var alg = prot.alg || String(p || '').trim() || 'HS256';
        var ks = String(k).trim(), key;
        if (ks.charAt(0) === '{') key = JSON.parse(ks); else key = ks;
        var okSig = await jwsVerify(alg, key, parts[0], parts[1], parts[2], prot.b64 === false ? { b64: false } : {});
        if (!okSig) throw new Error('签名校验失败（内容被篡改或密钥不匹配）');
        return prot.b64 === false ? parts[1] : utf8d(b64uDec(parts[1]));
      }
    });

    reg({
      id: 'jose-jwe', name: 'JWE 加密/解密（RFC 7516）', group: '认证加密', key: true, param: true,
      keyLabel: '收件人 JWK（JSON）；dir/AxxxKW/GCMKW 用 oct 的 k；PBES2 直接填口令',
      paramLabel: 'alg/enc，如 A128KW/A128GCM 或 dir/A256GCM 或 PBES2-HS512+A256KW/A128CBC-HS256（留空默认 A128KW/A128GCM）',
      info: 'JWE（RFC 7516）：compact 五段 = protected.encrypted_key.iv.ciphertext.tag，AAD 为 protected 的 base64url 原文。支持 dir/KW/GCMKW/RSA/RSA-OAEP/ECDH-ES/PBES2 等九类密钥管理，GCM 与 CBC-HS 两类内容加密，zip:DEF 压缩。',
      enc: async function (b, k, p, fmt) {
        var spec = String(p || '').trim() || 'A128KW/A128GCM';
        var sp = spec.split('/');
        if (sp.length !== 2) throw new Error('参数格式应为 alg/enc，例如 A128KW/A128GCM');
        var ks = String(k).trim(), key;
        if (ks.charAt(0) === '{') key = JSON.parse(ks); else key = ks;
        var r = await jweEncrypt({ alg: sp[0].trim(), enc: sp[1].trim(), key: key, plaintext: b });
        return r.compact;
      },
      dec: async function (s, k, p, fmt) {
        var ks = String(k).trim(), key;
        if (ks.charAt(0) === '{') key = JSON.parse(ks); else key = ks;
        var r = await jweDecrypt(String(s).trim(), key, {});
        return utf8d(r.plaintext);
      }
    });

    reg({
      id: 'jose-jwk', name: 'JWK 解析与指纹（RFC 7517/7638）', group: '密钥工具', key: true, param: false,
      keyLabel: 'JWK（JSON）',
      info: 'JWK（RFC 7517）：按 RFC 7638 计算 JWK SHA-256 Thumbprint —— 只取【必需成员】按字典序序列化后取摘要，oct 用 k、RSA 用 e/kty/n、EC 用 crv/kty/x/y、OKP 用 crv/kty/x。多余成员（kid/use/alg/d）一律剔除，否则指纹与别的实现不互通。加密=输出解析结果与指纹，解密=校验 JWK 结构是否合法。',
      enc: async function (b, k, p, fmt) {
        var jwk = JSON.parse(String(k).trim());
        var req = { oct: ['k'], RSA: ['e', 'kty', 'n'], EC: ['crv', 'kty', 'x', 'y'], OKP: ['crv', 'kty', 'x'] }[jwk.kty];
        if (!req) throw new Error('不支持的 kty：' + jwk.kty);
        var o = {};
        req.slice().sort().forEach(function (x) {
          if (jwk[x] === undefined) throw new Error('JWK 缺少必需成员 ' + x);
          o[x] = jwk[x];
        });
        var d = await subtle().digest('SHA-256', utf8(JSON.stringify(o)));
        return 'kty=' + jwk.kty + '\nkid=' + (jwk.kid || '(无)') +
          '\nthumbprint=' + b64uEnc(new Uint8Array(d));
      },
      dec: async function (s, k, p, fmt) {
        var jwk = JSON.parse(String(k).trim());
        if (!jwk.kty) throw new Error('不是合法 JWK（缺 kty）');
        return 'JWK 合法：kty=' + jwk.kty + (jwk.crv ? ' crv=' + jwk.crv : '') + (jwk.d ? '（含私钥）' : '（仅公钥）');
      }
    });
  }
})();
