/* ============================================================
 * Adiantum（HBSH 构造）— Google 官方规范 + 官方测试向量
 *   流密码 XChaCha{8,12,20} + 块密码 AES-256 + NHPoly1305
 * 参考：github.com/google/adiantum（python/ 官方实现与 test_vectors/ours/）
 * 结构：Hash-Block-Stream-Hash，用于磁盘/文件加密的长度保持加密
 * ============================================================ */
(function () {
  var M32 = 0xffffffffn, M64 = 0xffffffffffffffffn, M128 = (1n << 128n) - 1n;
  var P1305 = (1n << 130n) - 5n;
  var RCLAMP = 0xffffffc0ffffffc0ffffffc0fffffffn;

  /* ---------- 本地小工具（crypto_core.js 的 IIFE 局部函数跨文件取不到） ---------- */
  function rd32(b, o) {
    return ((b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + (b[o + 3] << 24)) >>> 0;
  }
  function wr32(b, o, v) {
    b[o] = v & 255; b[o + 1] = (v >>> 8) & 255; b[o + 2] = (v >>> 16) & 255; b[o + 3] = (v >>> 24) & 255;
  }
  function toBig(b, o, n) { var v = 0n; for (var i = n - 1; i >= 0; i--) v = (v << 8n) | BigInt(b[o + i]); return v; }
  function fromBig(v, n) { var o = new Uint8Array(n); for (var i = 0; i < n; i++) { o[i] = Number(v & 0xffn); v >>= 8n; } return o; }
  function cat() {
    var tot = 0, i;
    for (i = 0; i < arguments.length; i++) tot += arguments[i].length;
    var o = new Uint8Array(tot), p = 0;
    for (i = 0; i < arguments.length; i++) { o.set(arguments[i], p); p += arguments[i].length; }
    return o;
  }
  function hexToBytes(s) {
    s = (s || '').replace(/[^0-9a-fA-F]/g, '');
    if (s.length % 2) throw new Error('十六进制长度必须为偶数');
    var o = new Uint8Array(s.length / 2);
    for (var i = 0; i < o.length; i++) o[i] = parseInt(s.substr(i * 2, 2), 16);
    return o;
  }
  function bytesToHex(b) {
    var s = '';
    for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return s;
  }

  /* ---------- ChaCha（Google latindance 版：8 字节 counter + 8 字节 nonce，轮数可配） ---------- */
  function rotl32(v, n) { return ((v << n) | (v >>> (32 - n))) >>> 0; }
  function chachaQR(x, a, b, c, d) {
    x[a] = (x[a] + x[b]) >>> 0; x[d] = rotl32((x[d] ^ x[a]) >>> 0, 16);
    x[c] = (x[c] + x[d]) >>> 0; x[b] = rotl32((x[b] ^ x[c]) >>> 0, 12);
    x[a] = (x[a] + x[b]) >>> 0; x[d] = rotl32((x[d] ^ x[a]) >>> 0, 8);
    x[c] = (x[c] + x[d]) >>> 0; x[b] = rotl32((x[b] ^ x[c]) >>> 0, 7);
  }
  function chachaInit(key, ctrLo, ctrHi, n0, n1) {
    var x = new Uint32Array(16);
    x[0] = 0x61707865; x[1] = 0x3320646e; x[2] = 0x79622d32; x[3] = 0x6b206574;
    for (var i = 0; i < 8; i++) x[4 + i] = rd32(key, i * 4);
    x[12] = ctrLo >>> 0; x[13] = ctrHi >>> 0; x[14] = n0 >>> 0; x[15] = n1 >>> 0;
    return x;
  }
  function chachaRounds(w, rounds) {
    for (var r = 0; r < (rounds >> 1); r++) {
      chachaQR(w, 0, 4, 8, 12); chachaQR(w, 1, 5, 9, 13);
      chachaQR(w, 2, 6, 10, 14); chachaQR(w, 3, 7, 11, 15);
      chachaQR(w, 0, 5, 10, 15); chachaQR(w, 1, 6, 11, 12);
      chachaQR(w, 2, 7, 8, 13); chachaQR(w, 3, 4, 9, 14);
    }
  }
  function chachaBlock(key, ctr, nonce8, rounds) {
    var init = chachaInit(key, ctr >>> 0, Math.floor(ctr / 4294967296) >>> 0, rd32(nonce8, 0), rd32(nonce8, 4));
    var w = new Uint32Array(init);
    chachaRounds(w, rounds);
    var out = new Uint8Array(64);
    for (var i = 0; i < 16; i++) wr32(out, i * 4, (w[i] + init[i]) >>> 0);
    return out;
  }
  /* HChaCha：state[12..15] = 16 字节 nonceoffset，不加 initstate，输出 state[0..3]‖state[12..15] */
  function hchacha(key, nonce16, rounds) {
    var x = new Uint32Array(16);
    x[0] = 0x61707865; x[1] = 0x3320646e; x[2] = 0x79622d32; x[3] = 0x6b206574;
    for (var i = 0; i < 8; i++) x[4 + i] = rd32(key, i * 4);
    for (i = 0; i < 4; i++) x[12 + i] = rd32(nonce16, i * 4);
    var w = new Uint32Array(x);
    chachaRounds(w, rounds);
    var out = new Uint8Array(32);
    for (i = 0; i < 4; i++) { wr32(out, i * 4, w[i]); wr32(out, 16 + i * 4, w[12 + i]); }
    return out;
  }
  /* XChaCha：subkey = HChaCha(key, nonce[0:16])，再 ChaCha(subkey, nonce[16:24]) */
  function xchachaStream(key, nonce24, rounds, len) {
    if (nonce24.length !== 24) throw new Error('XChaCha nonce 需 24 字节');
    var sub = hchacha(key, nonce24.subarray(0, 16), rounds);
    var n8 = nonce24.subarray(16, 24);
    var out = new Uint8Array(len), pos = 0, ctr = 0, ks, take;
    while (pos < len) {
      ks = chachaBlock(sub, ctr, n8, rounds); ctr++;
      take = Math.min(64, len - pos);
      out.set(ks.subarray(0, take), pos);
      pos += take;
    }
    return out;
  }

  /* ---------- NH（4 passes / stride 2 / word 4 / unit 16 / messagemax 1024 / key 1072） ---------- */
  var NH_UNIT = 16, NH_MSGMAX = 1024, NH_KEYLEN = 1072, NH_PASSES = 4, NH_STRIDE = 2;
  function nhHash(keyBytes, msgBytes) {
    var nInt = msgBytes.length >> 2, i, j, p;
    if (msgBytes.length === 0 || (msgBytes.length % NH_UNIT) !== 0) throw new Error('NH 输入需为 16 字节倍数且非空');
    if (msgBytes.length > NH_MSGMAX) throw new Error('NH 单块输入不得超过 1024 字节');
    if (keyBytes.length !== NH_KEYLEN) throw new Error('NH 密钥需 1072 字节');
    var kI = new Array(keyBytes.length >> 2), mI = new Array(nInt);
    for (i = 0; i < kI.length; i++) kI[i] = BigInt(rd32(keyBytes, i * 4));
    for (i = 0; i < nInt; i++) mI[i] = BigInt(rd32(msgBytes, i * 4));
    var out = new Uint8Array(32);
    for (p = 0; p < NH_PASSES; p++) {
      var off = p * NH_STRIDE * 2, s = 0n, a, b;
      for (i = 0; i < nInt; i += NH_STRIDE * 2) {
        for (j = i; j < i + NH_STRIDE; j++) {
          a = (mI[j] + kI[off + j]) & M32;
          b = (mI[j + NH_STRIDE] + kI[off + j + NH_STRIDE]) & M32;
          s += a * b;
        }
      }
      s &= M64;
      for (i = 0; i < 8; i++) out[p * 8 + i] = Number((s >> BigInt(8 * i)) & 0xffn);
    }
    return out;
  }

  /* ---------- Poly1305 泛哈希（h_rbar：单参数形式，非标准 MAC） ---------- */
  function readR(b) {
    if (b.length !== 16) throw new Error('Poly1305 r 需 16 字节');
    return (toBig(b, 0, 16) & RCLAMP);
  }
  function polyHR(rbar, m) {
    var h = 0n, pos = 0, chunk, c;
    while (pos < m.length) {
      chunk = m.subarray(pos, Math.min(pos + 16, m.length));
      pos += 16;
      c = toBig(chunk, 0, chunk.length) + (1n << BigInt(8 * chunk.length));
      h = ((h + c) * rbar) % P1305;
    }
    return h;
  }

  /* ---------- NH 输出拼接（补零到 16 倍数，按 1024 切块） ---------- */
  function nhAll(nhKey, msg) {
    var pad = ((-msg.length) % NH_UNIT + NH_UNIT) % NH_UNIT;
    var padded = pad ? cat(msg, new Uint8Array(pad)) : msg;
    var parts = [];
    for (var i = 0; i < padded.length; i += NH_MSGMAX) {
      parts.push(nhHash(nhKey, padded.subarray(i, Math.min(i + NH_MSGMAX, padded.length))));
    }
    return cat.apply(null, parts);
  }
  /* 独立 NHPoly1305（Google 的 Hash 类）：key = r(16) ‖ NHkey(1072) = 1088 */
  function nhpoly1305(key, msg) {
    if (key.length !== 1088) throw new Error('NHPoly1305 密钥需 1088 字节（r‖NH 密钥）');
    var h = polyHR(readR(key.subarray(0, 16)), nhAll(key.subarray(16, 16 + NH_KEYLEN), msg));
    return h & M128;
  }
  /* Adiantum 内部哈希：ht = h_rbar(rt, 位长‖tweak)，hm = h_rbar(rm, NH(msg))，返回整数和 */
  function adiHash(rt, rm, nhKey, tweak, msg) {
    var ht = polyHR(rt, cat(fromBig(BigInt(8 * msg.length), 16), tweak));
    return ht + polyHR(rm, nhAll(nhKey, msg));
  }

  /* ---------- Adiantum（HBSH） ---------- */
  var ADI_KEYLEN = 32, ADI_ROUNDS = 12;
  function padNonce(n) {
    /* nonce + b'\1' + b'\0' * (24 - len(nonce) - 1) */
    var o = new Uint8Array(24);
    o.set(n, 0);
    o[n.length] = 1;
    return o;
  }
  function blockAdd(block, toadd) {
    var i = (toBig(block, 0, 16) + toadd) & M128;
    return fromBig(i, 16);
  }
  /* 非 isSym 条目走 runDecrypt 的 else 分支：收到的 b 是界面原始文本，
     必须自己按 fmt 解码成字节。此前直接把字符串当字节用，导致
     adiantum / xchacha 系列「能加密、一点解密就 subarray 报错」。 */
  function decBytes(b, f) { return (typeof b === 'string') ? bytesIn(b, f) : b; }
  function adiSetup(key, rounds) {
    if (key.length !== ADI_KEYLEN) throw new Error('Adiantum 密钥需 32 字节');
    var km = xchachaStream(key, padNonce(new Uint8Array(0)), rounds, 32 + 16 + 16 + NH_KEYLEN);
    return {
      aes: aesMakeBlockFn(km.subarray(0, 32)),
      rt: readR(km.subarray(32, 48)),
      rm: readR(km.subarray(48, 64)),
      nhKey: km.subarray(64, 64 + NH_KEYLEN),
      streamKey: key
    };
  }
  function adiantumCrypt(block, key, tweak, rounds, encrypt) {
    if (block.length < 16) throw new Error('Adiantum 输入至少 16 字节（末尾 16 字节为右半块）');
    tweak = tweak || new Uint8Array(0);
    var S = adiSetup(key, rounds), H = function (m) {
      return adiHash(S.rt, S.rm, S.nhKey, tweak, m);
    };
    var pl, pr, pm, cm, cl, cr;
    if (encrypt) {
      pl = block.subarray(0, block.length - 16);
      pr = block.subarray(block.length - 16);
      pm = blockAdd(pr, H(pl));
      cm = S.aes.enc(pm);
      cl = xorBytes(xchachaStream(S.streamKey, padNonce(cm), rounds, pl.length), pl);
      cr = blockAdd(cm, -H(cl));
      return cat(cl, cr);
    }
    cl = block.subarray(0, block.length - 16);
    cr = block.subarray(block.length - 16);
    cm = blockAdd(cr, H(cl));
    pl = xorBytes(xchachaStream(S.streamKey, padNonce(cm), rounds, cl.length), cl);
    pm = S.aes.dec(cm);
    pr = blockAdd(pm, -H(pl));
    return cat(pl, pr);
  }
  /* 供测试脚本做分层对照（向量里有 offset 参数，界面入口用不到） */
  if (typeof globalThis !== 'undefined') {
    globalThis.__nhTest = nhHash;
    globalThis.__nhpTest = nhpoly1305;
    /* 【第 110 批】HChaCha20 此前是闭包私有函数，libsodium 那 10 条向量虽然进了包，
       却没有任何入口能喂进去，等于「向量在、验不了」。这里导出供 KAT 直接用。 */
    globalThis.__hchachaTest = function (key, nonce16, rounds) { return hchacha(key, nonce16, rounds || 20); };
    globalThis.__xchachaTest = function (key, nonce24, rounds, len, off) {
      var sub = hchacha(key, nonce24.subarray(0, 16), rounds), n8 = nonce24.subarray(16, 24);
      var out = new Uint8Array(len), pos = 0, ctr = off >>> 0, ks, take;
      while (pos < len) {
        ks = chachaBlock(sub, ctr, n8, rounds); ctr++;
        take = Math.min(64, len - pos); out.set(ks.subarray(0, take), pos); pos += take;
      }
      return out;
    };
  }
  function xorBytes(a, b) {
    var o = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) o[i] = a[i] ^ b[i];
    return o;
  }

  /* ---------- 注册 ---------- */
  if (typeof reg !== 'function') return;
  var ADI_INFO = 'Adiantum：Google 提出的长度保持加密（HBSH = Hash-Block-Stream-Hash），' +
    '用于无 AES 指令集设备的磁盘/文件加密（Android、Linux fscrypt）。' +
    '密钥 32 字节；tweak 填十六进制（可空，通常是扇区号）；输出与输入等长。' +
    '已与 Google 官方 python 实现及 180 组官方向量逐字节比对。';

  function entry(rounds) {
    return function (b, k, tweakHex) {
      var tw = tweakHex ? hexToBytes(String(tweakHex)) : new Uint8Array(0);
      return adiantumCrypt(b, k, tw, rounds, this && this.dec === true ? false : true);
    };
  }
  reg({
    id: 'adiantum', name: 'Adiantum 长度保持加密（XChaCha12-AES256）', group: '对称加密',
    key: true, keyLen: 32, param: true,
    keyLabel: '密钥（32 字节，Hex 或字符串）',
    paramLabel: 'tweak（十六进制，可空）',
    enc: function (b, k, tw, f) { return bytesOut(adiantumCrypt(b, k, tw ? hexToBytes(String(tw)) : new Uint8Array(0), 12, true), f); },
    dec: function (b, k, tw, f) { return adiantumCrypt(decBytes(b, f), k, tw ? hexToBytes(String(tw)) : new Uint8Array(0), 12, false); },
    info: ADI_INFO
  });
  reg({
    id: 'adiantum20', name: 'Adiantum（XChaCha20-AES256）', group: '对称加密',
    key: true, keyLen: 32, param: true,
    keyLabel: '密钥（32 字节，Hex 或字符串）',
    paramLabel: 'tweak（十六进制，可空）',
    enc: function (b, k, tw, f) { return bytesOut(adiantumCrypt(b, k, tw ? hexToBytes(String(tw)) : new Uint8Array(0), 20, true), f); },
    dec: function (b, k, tw, f) { return adiantumCrypt(decBytes(b, f), k, tw ? hexToBytes(String(tw)) : new Uint8Array(0), 20, false); },
    info: 'Adiantum 的 20 轮流密码变体（XChaCha20-AES256），结构同 adiantum，安全性余量更大、略慢。' +
      '已与 Google 官方 180 组向量比对。'
  });
  reg({
    id: 'adiantum8', name: 'Adiantum（XChaCha8-AES256）', group: '对称加密',
    key: true, keyLen: 32, param: true,
    keyLabel: '密钥（32 字节，Hex 或字符串）',
    paramLabel: 'tweak（十六进制，可空）',
    enc: function (b, k, tw, f) { return bytesOut(adiantumCrypt(b, k, tw ? hexToBytes(String(tw)) : new Uint8Array(0), 8, true), f); },
    dec: function (b, k, tw, f) { return adiantumCrypt(decBytes(b, f), k, tw ? hexToBytes(String(tw)) : new Uint8Array(0), 8, false); },
    info: 'Adiantum 的 8 轮流密码变体（XChaCha8-AES256），结构同 adiantum，最快但安全余量最小，' +
      '非标准配置（官方默认 12 轮），仅供研究与性能对比。已与 Google 官方 12 组向量比对。'
  });
  reg({
    id: 'xchacha12', name: 'XChaCha12 流密码', group: '对称加密',
    key: true, keyLen: 32, param: true,
    keyLabel: '密钥（32 字节，Hex 或字符串）',
    paramLabel: 'nonce（24 字节 Hex，留空自动生成）',
    ivNeed: true, ivOptional: true, ivLabel: 'Nonce（24 字节 Hex，48 位）；留空则随机生成并前置在密文里',
    enc: function (b, k, nHex, f, k2, ivHex) {
      nHex = String(ivHex || '').replace(/[\s,:_-]/g, '') || nHex;
      var n = nHex ? hexToBytes(String(nHex)) : null;
      if (!n) { n = new Uint8Array(24); if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(n); }
      if (n.length !== 24) throw new Error('XChaCha nonce 需 24 字节');
      return bytesOut(cat(n, xorBytes(xchachaStream(k, n, 12, b.length), b)), f);
    },
    dec: function (b, k, _n, f, k2, ivHex) {
      _n = String(ivHex || '').replace(/[\s,:_-]/g, '') || _n;
      /* 用户显式给了 nonce：整段输入都当作密文，不再剥前 24 字节 */
      if (_n) {
        var nb0 = decBytes(b, f), nn = hexToBytes(_n);
        if (nn.length !== 24) throw new Error('XChaCha nonce 需 24 字节（48 位 Hex），当前 ' + nn.length + ' 字节');
        /* 加密输出自带 24 字节 nonce 前缀，前缀匹配就剥掉，否则整段当密文 */
        var hit = nb0.length >= 24;
        for (var _i = 0; hit && _i < 24; _i++) if (nb0[_i] !== nn[_i]) hit = false;
        var nb = hit ? nb0.subarray(24) : nb0;
        return xorBytes(xchachaStream(k, nn, 12, nb.length), nb);
      }
      var bb = decBytes(b, f);
      if (bb.length < 24) throw new Error('输入需含 24 字节 nonce 前缀');
      var n = bb.subarray(0, 24);
      return xorBytes(xchachaStream(k, n, 12, bb.length - 24), bb.subarray(24));
    },
    info: 'XChaCha12：24 字节 nonce 的扩展 nonce ChaCha（HChaCha12 派生子密钥 + ChaCha12 生成流），' +
      '加密输出为 nonce‖密文。已与 Google 官方 XChaCha12 向量比对。'
  });
  reg({
    id: 'xchacha8', name: 'XChaCha8 流密码', group: '对称加密',
    key: true, keyLen: 32, param: true,
    keyLabel: '密钥（32 字节，Hex 或字符串）',
    paramLabel: 'nonce（24 字节 Hex，留空自动生成）',
    ivNeed: true, ivOptional: true, ivLabel: 'Nonce（24 字节 Hex，48 位）；留空则随机生成并前置在密文里',
    enc: function (b, k, nHex, f, k2, ivHex) {
      nHex = String(ivHex || '').replace(/[\s,:_-]/g, '') || nHex;
      var n = nHex ? hexToBytes(String(nHex)) : null;
      if (!n) { n = new Uint8Array(24); if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(n); }
      if (n.length !== 24) throw new Error('XChaCha nonce 需 24 字节');
      return bytesOut(cat(n, xorBytes(xchachaStream(k, n, 8, b.length), b)), f);
    },
    dec: function (b, k, _n, f, k2, ivHex) {
      _n = String(ivHex || '').replace(/[\s,:_-]/g, '') || _n;
      /* 用户显式给了 nonce：整段输入都当作密文，不再剥前 24 字节 */
      if (_n) {
        var nb0 = decBytes(b, f), nn = hexToBytes(_n);
        if (nn.length !== 24) throw new Error('XChaCha nonce 需 24 字节（48 位 Hex），当前 ' + nn.length + ' 字节');
        /* 加密输出自带 24 字节 nonce 前缀，前缀匹配就剥掉，否则整段当密文 */
        var hit = nb0.length >= 24;
        for (var _i = 0; hit && _i < 24; _i++) if (nb0[_i] !== nn[_i]) hit = false;
        var nb = hit ? nb0.subarray(24) : nb0;
        return xorBytes(xchachaStream(k, nn, 8, nb.length), nb);
      }
      var bb = decBytes(b, f);
      if (bb.length < 24) throw new Error('输入需含 24 字节 nonce 前缀');
      var n = bb.subarray(0, 24);
      return xorBytes(xchachaStream(k, n, 8, bb.length - 24), bb.subarray(24));
    },
    info: 'XChaCha8：24 字节 nonce 的扩展 nonce ChaCha 8 轮变体，结构同 XChaCha12 但只用 8 轮。' +
      '非标准配置（官方默认 12 轮），仅供研究与性能对比。已与 Google 官方 XChaCha8 向量比对。'
  });
  reg({
    id: 'xchacha20', name: 'XChaCha20 流密码', group: '对称加密',
    key: true, keyLen: 32, param: true,
    keyLabel: '密钥（32 字节，Hex 或字符串）',
    paramLabel: 'nonce（24 字节 Hex，留空自动生成）',
    ivNeed: true, ivOptional: true, ivLabel: 'Nonce（24 字节 Hex，48 位）；留空则随机生成并前置在密文里',
    enc: function (b, k, nHex, f, k2, ivHex) {
      nHex = String(ivHex || '').replace(/[\s,:_-]/g, '') || nHex;
      var n = nHex ? hexToBytes(String(nHex)) : null;
      if (!n) { n = new Uint8Array(24); if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(n); }
      if (n.length !== 24) throw new Error('XChaCha nonce 需 24 字节');
      return bytesOut(cat(n, xorBytes(xchachaStream(k, n, 20, b.length), b)), f);
    },
    dec: function (b, k, _n, f, k2, ivHex) {
      _n = String(ivHex || '').replace(/[\s,:_-]/g, '') || _n;
      if (_n) {
        var nb0 = decBytes(b, f), nn = hexToBytes(_n);
        if (nn.length !== 24) throw new Error('XChaCha nonce 需 24 字节（48 位 Hex），当前 ' + nn.length + ' 字节');
        var hit = nb0.length >= 24;
        for (var _i = 0; hit && _i < 24; _i++) if (nb0[_i] !== nn[_i]) hit = false;
        var nb = hit ? nb0.subarray(24) : nb0;
        return xorBytes(xchachaStream(k, nn, 20, nb.length), nb);
      }
      var bb = decBytes(b, f);
      if (bb.length < 24) throw new Error('输入需含 24 字节 nonce 前缀');
      var n = bb.subarray(0, 24);
      return xorBytes(xchachaStream(k, n, 20, bb.length - 24), bb.subarray(24));
    },
    info: 'XChaCha20（draft-irtf-cfrg-xchacha）：先用 HChaCha20(key, nonce[0:16]) 派生 32 字节子密钥，' +
      '再以 12 字节 nonce（4 字节零 ‖ nonce[16:24]）跑标准 20 轮 ChaCha20。24 字节 nonce 可安全随机生成，' +
      '无需计数器。加密输出为 nonce‖密文。已与 libsodium 官方 XChaCha20 流向量 10 条比对（长度 22~91 字节，含跨块）。' +
      '⚠ 本条目的 ChaCha 内核是 8 字节 counter 布局（x[12]=ctrLo, x[13]=ctrHi, x[14..15]=nonce），' +
      'XChaCha20 场景 ctr 从 0 起、ctrHi 恒 0，与 RFC 8439 的 4 字节 counter 布局等价；' +
      '但若把 ctr 推过 2^32，两种布局会分叉（Adiantum 需要 8 字节 counter，不要改）。'
  });
  reg({
    id: 'nhpoly1305', name: 'NHPoly1305 泛哈希', group: '单向哈希',
    key: true, keyLen: 1088,
    keyLabel: '密钥（1088 字节 = rm‖rt‖NH 密钥，留空用全零）',
    param: true, paramLabel: 'tweak（十六进制，可空）',
    enc: function (b, k, _p, f) {
      /* 【第 106 批】原写法：长度不等于 1088 就静默换全零密钥。
         后果：用户粘错长度（比如截断的密钥）会拿到「全零标签」却毫无提示，
         看起来像"算出来了"，实际密钥根本没参与。现在只有「留空」才用全零。 */
      var key;
      if (!k || k.length === 0) key = new Uint8Array(1088);
      else if (k.length !== 1088) throw new Error('NHPoly1305 密钥需 1088 字节（r‖NH 密钥），当前 ' + k.length + ' 字节；不需要密钥请留空（留空用全零）');
      else key = k;
      return bytesOut(fromBig(nhpoly1305(key, b), 16), f);
    },
    info: 'NHPoly1305：Adiantum 使用的快速泛哈希（NH + 双 Poly1305），非抗碰撞哈希，' +
      '仅用于加密构造内部。输出 16 字节（模 2^128 截断）。'
  });
  reg({
    id: 'hchacha20', name: 'HChaCha20 子密钥派生', group: '密钥派生',
    key: true, keyLen: 32,
    keyLabel: '密钥（32 字节 Hex）',
    param: true, paramLabel: 'nonce（16 字节 Hex，32 位，留空则取输入内容）',
    ivNeed: true, ivOptional: true,
    ivLabel: 'Nonce（16 字节 Hex，32 位）；留空则把输入内容当 nonce（需 16 字节）',
    enc: function (b, k, nHex, f, k2, ivHex) {
      if (!k || k.length !== 32) throw new Error('HChaCha20 密钥需 32 字节，当前 ' + (k ? k.length : 0) + ' 字节');
      var n = String(ivHex || nHex || '').replace(/[\s,:_-]/g, '');
      var nb = n ? hexToBytes(n) : b;
      if (!nb || nb.length !== 16) throw new Error('HChaCha20 nonce 需 16 字节，当前 ' + (nb ? nb.length : 0) + ' 字节；请在 Nonce 框填 32 位 Hex，或让输入内容恰好 16 字节');
      return bytesOut(hchacha(k, nb, 20), f);
    },
    info: 'HChaCha20：ChaCha 的「不加初始状态」变体，输入 32 字节密钥 + 16 字节 nonce，输出 32 字节子密钥。' +
      '它是 XChaCha20 的第一步（子密钥 = HChaCha20(key, nonce[0:16])），也可单独用作密钥派生。' +
      '与 ChaCha20 的区别：20 轮结束后只输出 state[0..3]‖state[12..15]，且**不加**轮前的初始状态——' +
      '所以不可逆，只能当单向派生用。' +
      '已与 libsodium 官方 test/default/xchacha20.c 的 tv_hchacha20 共 10 条逐字节比对（全过）。' +
      '⚠ 本条目的轮函数与 XChaCha20 共用同一个 8 字节 counter 布局的内核；HChaCha20 不设 counter ' +
      '（state[12..15] 整体由 nonce 填充），两种布局在此处完全等价，不存在分叉问题。'
  });
})();
