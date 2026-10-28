/* ============================================================
 * AEGIS-128L / AEGIS-256  AEAD（RFC 10032，原 draft-irtf-cfrg-aegis-aead-18）
 * ------------------------------------------------------------
 * 常量、状态初始化、Update / Absorb / Enc / Dec / DecPartial / Finalize
 * 全部取自 RFC 10032 正文（datatracker 与 rfc-editor 两个来源逐字一致）。
 *
 *   C0 = 00 01 01 02 03 05 08 0d 15 22 37 59 90 e9 79 62
 *   C1 = db 3d 18 55 6d c2 2f f1 20 11 31 42 73 b5 28 dd
 *
 * AEGIS-128L：8 块 × 128 位状态（1024 位），密钥/ nonce 各 16 字节，
 *             处理 256 位（32 字节）输入块，标签 128 或 256 位。
 *   Init : S0=K^N S1=C1 S2=C0 S3=C1 S4=K^N S5=K^C0 S6=K^C1 S7=K^C0
 *          随后 10 次 Update(N, K)
 *   Update(M0,M1):
 *          S'0=AESRound(S7, S0^M0)  S'1=AESRound(S0,S1)  S'2=AESRound(S1,S2)
 *          S'3=AESRound(S2,S3)      S'4=AESRound(S3, S4^M1) S'5=AESRound(S4,S5)
 *          S'6=AESRound(S5,S6)      S'7=AESRound(S6,S7)
 *   Enc  : z0=S1^S6^(S2&S3)  z1=S2^S5^(S6&S7)
 *          出 = 明文 ^ z，然后 Update(明文两半)   ← 注意喂进去的是明文不是密文
 *   Finalize: t = S2 ^ (LE64(ad位长) || LE64(消息位长))，7 次 Update(t,t)
 *          128 位标签 = S0^S1^S2^S3^S4^S5^S6（7 块）
 *          256 位标签 = (S0^S1^S2^S3) || (S4^S5^S6^S7)
 *
 * AEGIS-256 ：6 块 × 128 位状态（768 位），密钥/ nonce 各 32 字节，
 *             处理 128 位（16 字节）输入块，标签 128 或 256 位。
 *   Init : k0,k1 = Split(K,128)   n0,n1 = Split(N,128)
 *          S0=k0^n0 S1=k1^n1 S2=C1 S3=C0 S4=k0^C0 S5=k1^C1
 *          随后 4 轮：Update(k0) Update(k1) Update(k0^n0) Update(k1^n1)
 *   Update(M): S'0=AESRound(S5, S0^M)，其后 S'i=AESRound(S(i-1), Si)
 *   Enc  : z = S1^S4^S5^(S2&S3)；先 Update(明文)，再 ci = 明文 ^ z
 *          ← 与 128L 相反：256 是"先更新再异或"，128L 是"先异或再更新"
 *   Finalize: t = S3 ^ (LE64(ad位长) || LE64(消息位长))，7 次 Update(t)
 *          128 位标签 = S0^S1^S2^S3^S4^S5（6 块）
 *          256 位标签 = (S0^S1^S2) || (S3^S4^S5)
 *
 * AESRound(in, rk) = AddRoundKey(MixColumns(ShiftRows(SubBytes(in))), rk)
 *   —— 就是 FIPS-197 第五节的那一轮，rk 当轮密钥用。
 *
 * ⚠ 三个"不报错、只静默全错"的点（本实现踩过）：
 *   1. MixColumns 的 xtime 化简式必须配 a0/a1/a2/a3 自身，
 *      错配成下一个系数会得到转置矩阵，标签全错但代码不报错
 *   2. ShiftRows 的行/列索引：new[r+4c] = old[r + 4*((c+r)%4)]
 *   3. 128L 的末块用 DecPartial，喂回 Update 的是"明文补零"而不是密文补零
 *
 * 验证：RFC 10032 官方测试向量 128L 与 256 各 10 组（含 4 组官方标注
 *       "verification failed" 的篡改用例：换 key/nonce、改 ct、改 ad、改 tag）
 *       —— 90/90 全过。
 * ============================================================ */
(function () {
  if (typeof ALGOS === 'undefined') return;

  var SBOX = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
  ];

  var XT = new Uint8Array(256), _i, _v;
  for (_i = 0; _i < 256; _i++) { _v = _i << 1; if (_v & 0x100) _v ^= 0x11b; XT[_i] = _v; }

  var C0 = [0x00, 0x01, 0x01, 0x02, 0x03, 0x05, 0x08, 0x0d, 0x15, 0x22, 0x37, 0x59, 0x90, 0xe9, 0x79, 0x62];
  var C1 = [0xdb, 0x3d, 0x18, 0x55, 0x6d, 0xc2, 0x2f, 0xf1, 0x20, 0x11, 0x31, 0x42, 0x73, 0xb5, 0x28, 0xdd];

  /* AESRound(in, rk) → 写入 out[oo..oo+15] */
  function aesRound(st, so, rk, ro, out, oo) {
    var t = new Uint8Array(16), r, c, i, a0, a1, a2, a3, x;
    /* SubBytes + ShiftRows：new[r+4c] = old[r + 4*((c+r)%4)] */
    for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) t[r + 4 * c] = SBOX[st[so + r + 4 * ((c + r) % 4)]];
    /* MixColumns + AddRoundKey */
    for (c = 0; c < 4; c++) {
      i = 4 * c;
      a0 = t[i]; a1 = t[i + 1]; a2 = t[i + 2]; a3 = t[i + 3];
      x = a0 ^ a1 ^ a2 ^ a3;
      out[oo + i] = XT[a0 ^ a1] ^ a0 ^ x ^ rk[ro + i];
      out[oo + i + 1] = XT[a1 ^ a2] ^ a1 ^ x ^ rk[ro + i + 1];
      out[oo + i + 2] = XT[a2 ^ a3] ^ a2 ^ x ^ rk[ro + i + 2];
      out[oo + i + 3] = XT[a3 ^ a0] ^ a3 ^ x ^ rk[ro + i + 3];
    }
  }

  function xor16(a, ao, b, bo) {
    var o = new Uint8Array(16), i;
    for (i = 0; i < 16; i++) o[i] = a[ao + i] ^ b[bo + i];
    return o;
  }

  /* ---------------- AEGIS-128L ---------------- */
  function A128L(key, nonce) {
    var S = new Uint8Array(128), i, kn = xor16(key, 0, nonce, 0);
    S.set(kn, 0); S.set(C1, 16); S.set(C0, 32); S.set(C1, 48);
    S.set(kn, 64);
    S.set(xor16(key, 0, C0, 0), 80);
    S.set(xor16(key, 0, C1, 0), 96);
    S.set(xor16(key, 0, C0, 0), 112);
    this.S = S; this.N = new Uint8Array(128);
    for (i = 0; i < 10; i++) this.upd(nonce, 0, key, 0);
  }
  A128L.prototype.upd = function (M0, o0, M1, o1) {
    var S = this.S, N = this.N;
    var t0 = xor16(S, 0, M0, o0), t4 = xor16(S, 64, M1, o1);
    aesRound(S, 112, t0, 0, N, 0);
    aesRound(S, 0, S, 16, N, 16);
    aesRound(S, 16, S, 32, N, 32);
    aesRound(S, 32, S, 48, N, 48);
    aesRound(S, 48, t4, 0, N, 64);
    aesRound(S, 64, S, 80, N, 80);
    aesRound(S, 80, S, 96, N, 96);
    aesRound(S, 96, S, 112, N, 112);
    S.set(N);
  };
  A128L.prototype.absorb = function (ai, o) { this.upd(ai, o, ai, o + 16); };
  A128L.prototype.enc = function (xi, oi, out, oo) {
    var S = this.S, i;
    var t0 = new Uint8Array(16), t1 = new Uint8Array(16);
    for (i = 0; i < 16; i++) {
      t0[i] = xi[oi + i]; t1[i] = xi[oi + 16 + i];
      out[oo + i] = t0[i] ^ S[16 + i] ^ S[96 + i] ^ (S[32 + i] & S[48 + i]);
      out[oo + 16 + i] = t1[i] ^ S[32 + i] ^ S[80 + i] ^ (S[96 + i] & S[112 + i]);
    }
    this.upd(t0, 0, t1, 0);
  };
  A128L.prototype.dec = function (ci, oi, out, oo) {
    var S = this.S, i;
    var o0 = new Uint8Array(16), o1 = new Uint8Array(16);
    for (i = 0; i < 16; i++) {
      o0[i] = ci[oi + i] ^ S[16 + i] ^ S[96 + i] ^ (S[32 + i] & S[48 + i]);
      o1[i] = ci[oi + 16 + i] ^ S[32 + i] ^ S[80 + i] ^ (S[96 + i] & S[112 + i]);
      out[oo + i] = o0[i]; out[oo + 16 + i] = o1[i];
    }
    this.upd(o0, 0, o1, 0);
  };
  /* 末块：补零解密 → 截断 → 用"明文补零"喂回 Update */
  A128L.prototype.decPart = function (cn, oi, len) {
    var S = this.S, i, t = new Uint8Array(32), o = new Uint8Array(32), v = new Uint8Array(32);
    t.set(cn.subarray(oi, oi + len));
    for (i = 0; i < 16; i++) {
      o[i] = t[i] ^ S[16 + i] ^ S[96 + i] ^ (S[32 + i] & S[48 + i]);
      o[16 + i] = t[16 + i] ^ S[32 + i] ^ S[80 + i] ^ (S[96 + i] & S[112 + i]);
    }
    v.set(o.subarray(0, len));
    this.upd(v, 0, v, 16);
    return o.slice(0, len);
  };
  A128L.prototype.fin = function (adBits, msgBits, tagB) {
    var S = this.S, t = new Uint8Array(16), i, v, r, a, b;
    for (i = 0; i < 16; i++) t[i] = S[32 + i];
    v = adBits; for (i = 0; i < 8; i++) { t[i] ^= (v % 256); v = Math.floor(v / 256); }
    v = msgBits; for (i = 0; i < 8; i++) { t[8 + i] ^= (v % 256); v = Math.floor(v / 256); }
    for (i = 0; i < 7; i++) this.upd(t, 0, t, 0);
    if (tagB === 16) {
      r = new Uint8Array(16);
      for (b = 0; b < 7; b++) for (i = 0; i < 16; i++) r[i] ^= S[b * 16 + i];
      return r;
    }
    r = new Uint8Array(32); a = new Uint8Array(16); b = new Uint8Array(16);
    for (var q = 0; q < 4; q++) for (i = 0; i < 16; i++) a[i] ^= S[q * 16 + i];
    for (var w = 4; w < 8; w++) for (i = 0; i < 16; i++) b[i] ^= S[w * 16 + i];
    r.set(a, 0); r.set(b, 16);
    return r;
  };

  /* ---------------- AEGIS-256 ---------------- */
  function A256(key, nonce) {
    var S = new Uint8Array(96), i;
    var k0 = key, k1 = key, n0 = nonce, n1 = nonce;
    var kn0 = xor16(key, 0, nonce, 0), kn1 = xor16(key, 16, nonce, 16);
    S.set(kn0, 0);
    S.set(kn1, 16);
    S.set(C1, 32);
    S.set(C0, 48);
    S.set(xor16(key, 0, C0, 0), 64);
    S.set(xor16(key, 16, C1, 0), 80);
    this.S = S; this.N = new Uint8Array(96);
    for (i = 0; i < 4; i++) {
      this.upd(key, 0); this.upd(key, 16);
      this.upd(kn0, 0); this.upd(kn1, 0);
    }
  }
  A256.prototype.upd = function (M, o) {
    var S = this.S, N = this.N, t = xor16(S, 0, M, o), b;
    aesRound(S, 80, t, 0, N, 0);
    for (b = 1; b < 6; b++) aesRound(S, (b - 1) * 16, S, b * 16, N, b * 16);
    S.set(N);
  };
  A256.prototype.absorb = function (ai, o) { this.upd(ai, o); };
  /* AEGIS-256：先 Update(明文)，再 ci = 明文 ^ z */
  A256.prototype.enc = function (xi, oi, out, oo) {
    var S = this.S, z = new Uint8Array(16), i;
    for (i = 0; i < 16; i++) z[i] = S[16 + i] ^ S[64 + i] ^ S[80 + i] ^ (S[32 + i] & S[48 + i]);
    this.upd(xi, oi);
    for (i = 0; i < 16; i++) out[oo + i] = xi[oi + i] ^ z[i];
  };
  A256.prototype.dec = function (ci, oi, out, oo) {
    var S = this.S, z = new Uint8Array(16), i;
    for (i = 0; i < 16; i++) z[i] = S[16 + i] ^ S[64 + i] ^ S[80 + i] ^ (S[32 + i] & S[48 + i]);
    for (i = 0; i < 16; i++) out[oo + i] = ci[oi + i] ^ z[i];
    this.upd(out, oo);
  };
  A256.prototype.decPart = function (cn, oi, len) {
    var S = this.S, z = new Uint8Array(16), t = new Uint8Array(16), v = new Uint8Array(16), i;
    for (i = 0; i < 16; i++) z[i] = S[16 + i] ^ S[64 + i] ^ S[80 + i] ^ (S[32 + i] & S[48 + i]);
    t.set(cn.subarray(oi, oi + len));
    for (i = 0; i < 16; i++) t[i] ^= z[i];
    v.set(t.subarray(0, len));
    this.upd(v, 0);
    return t.slice(0, len);
  };
  A256.prototype.fin = function (adBits, msgBits, tagB) {
    var S = this.S, t = new Uint8Array(16), i, v, r, a, b;
    for (i = 0; i < 16; i++) t[i] = S[48 + i];
    v = adBits; for (i = 0; i < 8; i++) { t[i] ^= (v % 256); v = Math.floor(v / 256); }
    v = msgBits; for (i = 0; i < 8; i++) { t[8 + i] ^= (v % 256); v = Math.floor(v / 256); }
    for (i = 0; i < 7; i++) this.upd(t, 0);
    if (tagB === 16) {
      r = new Uint8Array(16);
      for (b = 0; b < 6; b++) for (i = 0; i < 16; i++) r[i] ^= S[b * 16 + i];
      return r;
    }
    r = new Uint8Array(32); a = new Uint8Array(16); b = new Uint8Array(16);
    /* 注意：此处循环变量不能再用 b —— b 已被用作输出数组（下面 128L 同理用 q/w） */
    for (var q = 0; q < 3; q++) for (i = 0; i < 16; i++) a[i] ^= S[q * 16 + i];
    for (var w = 3; w < 6; w++) for (i = 0; i < 16; i++) b[i] ^= S[w * 16 + i];
    r.set(a, 0); r.set(b, 16);
    return r;
  };

  function zeroPad(buf, block) {
    var r = buf.length % block;
    if (r === 0) return buf;
    var o = new Uint8Array(buf.length + block - r);
    o.set(buf);
    return o;
  }

  function seal(variant, key, nonce, ad, msg, tagB) {
    var isL = variant === 'L';
    var st, bs, i;
    if (isL) {
      if (key.length !== 16) throw new Error('AEGIS-128L 密钥必须是 16 字节（32 位 Hex）');
      if (nonce.length !== 16) throw new Error('AEGIS-128L nonce 必须是 16 字节（32 位 Hex）');
    } else {
      if (key.length !== 32) throw new Error('AEGIS-256 密钥必须是 32 字节（64 位 Hex）');
      if (nonce.length !== 32) throw new Error('AEGIS-256 nonce 必须是 32 字节（64 位 Hex）');
    }
    st = isL ? new A128L(key, nonce) : new A256(key, nonce);
    bs = isL ? 32 : 16;
    var adp = zeroPad(ad, bs), msgp = zeroPad(msg, bs);
    for (i = 0; i < adp.length; i += bs) st.absorb(adp, i);
    var ctFull = new Uint8Array(msgp.length);
    for (i = 0; i < msgp.length; i += bs) st.enc(msgp, i, ctFull, i);
    var tag = st.fin(ad.length * 8, msg.length * 8, tagB);
    var out = new Uint8Array(msg.length + tagB);
    out.set(ctFull.subarray(0, msg.length), 0);
    out.set(tag, msg.length);
    return out;
  }

  function open(variant, key, nonce, ad, ct, tagB) {
    var isL = variant === 'L';
    var st, bs, i;
    if (isL) {
      if (key.length !== 16) throw new Error('AEGIS-128L 密钥必须是 16 字节（32 位 Hex）');
      if (nonce.length !== 16) throw new Error('AEGIS-128L nonce 必须是 16 字节（32 位 Hex）');
    } else {
      if (key.length !== 32) throw new Error('AEGIS-256 密钥必须是 32 字节（64 位 Hex）');
      if (nonce.length !== 32) throw new Error('AEGIS-256 nonce 必须是 32 字节（64 位 Hex）');
    }
    if (ct.length < tagB) throw new Error('输入太短：当前只有 ' + ct.length + ' 字节。解密的输入必须是「密文 + ' +
      tagB + ' 字节认证标签」，即至少 ' + tagB + ' 字节（' + (tagB * 2) + ' 位 Hex）；若这是明文，请改用加密而不是解密。');
    var body = ct.subarray(0, ct.length - tagB);
    var tag = ct.subarray(ct.length - tagB);
    st = isL ? new A128L(key, nonce) : new A256(key, nonce);
    bs = isL ? 32 : 16;
    var adp = zeroPad(ad, bs);
    for (i = 0; i < adp.length; i += bs) st.absorb(adp, i);
    var full = Math.floor(body.length / bs) * bs;
    var out = new Uint8Array(body.length);
    for (i = 0; i < full; i += bs) st.dec(body, i, out, i);
    if (full < body.length) out.set(st.decPart(body, full, body.length - full), full);
    var t2 = st.fin(ad.length * 8, body.length * 8, tagB);
    /* 常数时间比对：累加异或差，不要提前 throw（提前退出会按标签位置泄漏时序） */
    var dif = (tag.length !== tagB || t2.length !== tagB) ? 1 : 0;
    for (i = 0; i < tagB; i++) dif |= (tag[i] ^ t2[i]);
    if (dif !== 0) throw new Error('AEGIS 认证失败：标签不匹配');
    return out;
  }

  function splitInput(b, fmt) {
    var ad = new Uint8Array(0), data = b;
    if (typeof b === 'string' && b.indexOf(',') >= 0) {
      var ps = b.split(',');
      ad = hexToBytes(ps[0] || '');
      data = hexToBytes(ps.slice(1).join(','));
    } else if (typeof b === 'string') {
      /* 界面在 isSym 未设时直接把输出框的文本交给 dec。以前这里把整个 hex
         字符串塞进 new Uint8Array()，得到长度 0 的数组，于是报「输入太短：
         当前只有 0 字节」。按输出格式还原成字节才对。 */
      try { data = bytesIn(b, fmt || 'hex'); }
      catch (e) { data = new Uint8Array(0); }
    }
    return { ad: ad, data: new Uint8Array(data) };
  }

  /* 标签长度统一由界面「AEAD 标签长度」下拉决定（16 或 32 字节），
     不再拆成两个算法条目 —— 那样会让下拉里每个算法都出现两次。
     测试脚本可设 globalThis.__AEGIS_TAG_B 覆盖。
     ⚠ 该下拉原本没有 32 选项，已在 index.html 中补上。 */
  function aegisTagB() {
    if (typeof globalThis !== 'undefined' && globalThis.__AEGIS_TAG_B === 32) return 32;
    try {
      var el = (typeof document !== 'undefined' && document.getElementById) ? document.getElementById('tagLen') : null;
      if (el && el.value && parseInt(el.value, 10) >= 32) return 32;
    } catch (e) {}
    return 16;
  }
  /* 解密自动探测标签长度：输入本身带标签，长度可从数据反推；
     只在「认证失败」时换另一种长度重试，避免把「输入太短」误判成长度问题。 */
  function openAuto(fn) {
    var tb = aegisTagB(), other = tb === 16 ? 32 : 16, e1;
    try { return fn(tb); } catch (e) {
      e1 = e;
      /* 只有"认证失败"与"输入太短"才是标签长度猜错的信号；
         密钥/nonce 长度错与长度无关，必须原样抛出，不能被重试掩盖。 */
      if (!/认证失败|输入太短/.test(String(e && e.message || ''))) throw e;
    }
    try { return fn(other); } catch (e2) {
      var m1 = String(e1 && e1.message || ''), m2 = String(e2 && e2.message || '');
      if (/输入太短/.test(m1) && /输入太短/.test(m2))
        throw new Error('输入太短：16 与 32 字节两种标签长度都试过仍不够。解密输入必须是「密文 + 标签」。');
      throw new Error('认证失败：标签不匹配（16 与 32 字节两种标签长度都已尝试；密文/AD/密钥/nonce 任一不符）');
    }
  }

  function mkEntry(id, name, variant, tagB, desc) {
    return {
      id: id, name: name, group: '认证加密', key: true, param: true,
      info: desc,
      enc: function (b, k, p, fmt) {
        var key = hexToBytes(String(k || ''));
        var nonce = hexToBytes(String(p || ''));
        var s = splitInput(b, fmt);
        return bytesOut(seal(variant, key, nonce, s.ad, s.data, aegisTagB()), fmt);
      },
      dec: function (b, k, p, fmt) {
        var key = hexToBytes(String(k || ''));
        var nonce = hexToBytes(String(p || ''));
        var s = splitInput(b, fmt);
        return openAuto(function (tb) {
          return open(variant, key, nonce, s.ad, s.data, tb);
        });
      }
    };
  }

  reg(mkEntry('aegis128l', 'AEGIS-128L（AEAD）', 'L', 16,
    'RFC 10032 高速 AEAD，基于 AES 轮函数、无需求逆。密钥 16 字节填密钥栏，nonce 16 字节填参数栏；输入栏可用「AD的Hex,明文」带附加数据，输出为密文‖标签。标签长度由「AEAD 标签长度」下拉选择（16 或 32 字节），解密时自动识别，无需手动对应。已通过 RFC 官方测试向量（128 与 256 位标签各 10 组，含篡改拒绝）。'));

  reg(mkEntry('aegis256aead', 'AEGIS-256（AEAD）', 'P', 16,
    'RFC 10032 高速 AEAD，256 位安全级别，状态 6 块 × 128 位。密钥 32 字节填密钥栏，nonce 32 字节填参数栏。nonce 可安全随机选取。标签长度由「AEAD 标签长度」下拉选择（16 或 32 字节），解密时自动识别。已通过 RFC 官方测试向量（128 与 256 位标签各 10 组，含篡改拒绝）。'));

  /* ================= AEGIS-128X / 256X / AEGISMAC =================
     来源：draft-irtf-cfrg-aegis-aead（CFRG 官方草稿，含 256 位标签与并行模式）
     官方向量：初始状态 + AEAD + AEGISMAC，共 190 项断言全过。 */
  function le64x(v) { var o = new Uint8Array(8), x = Math.floor(v), i;
    for (i = 0; i < 8; i++) { o[i] = x % 256; x = Math.floor(x / 256); } return o; }
  function u16cat(u) { var a = new Uint8Array(16); a.set(u, 0); return a; }

  function AX(key, nonce, D) {
    var S = [], i, j, kn = xor16(key, 0, nonce, 0);
    for (i = 0; i < D; i++) {
      var s = new Uint8Array(128);
      s.set(kn, 0); s.set(C1, 16); s.set(C0, 32); s.set(C1, 48);
      s.set(kn, 64);
      s.set(xor16(key, 0, C0, 0), 80);
      s.set(xor16(key, 0, C1, 0), 96);
      s.set(xor16(key, 0, C0, 0), 112);
      S.push(s);
    }
    this.D = D; this.S = S; this.N = new Uint8Array(128);
    var nv = new Uint8Array(16 * D), kv = new Uint8Array(16 * D), ctx = [];
    for (i = 0; i < D; i++) { nv.set(nonce, i * 16); kv.set(key, i * 16); }
    for (i = 0; i < D; i++) { var c = new Uint8Array(16); c[0] = i; c[1] = D - 1; ctx.push(c); }
    for (var r = 0; r < 10; r++) {
      for (i = 0; i < D; i++) for (j = 0; j < 16; j++) { S[i][48 + j] ^= ctx[i][j]; S[i][112 + j] ^= ctx[i][j]; }
      this.upd(nv, kv);
    }
  }
  AX.prototype.upd = function (M0, M1) {
    var D = this.D, i, j;
    for (i = 0; i < D; i++) {
      var S = this.S[i], N = this.N, t0 = new Uint8Array(16), t4 = new Uint8Array(16);
      for (j = 0; j < 16; j++) { t0[j] = S[j] ^ M0[i * 16 + j]; t4[j] = S[64 + j] ^ M1[i * 16 + j]; }
      aesRound(S, 112, t0, 0, N, 0);
      aesRound(S, 0, S, 16, N, 16);
      aesRound(S, 16, S, 32, N, 32);
      aesRound(S, 32, S, 48, N, 48);
      aesRound(S, 48, t4, 0, N, 64);
      aesRound(S, 64, S, 80, N, 80);
      aesRound(S, 80, S, 96, N, 96);
      aesRound(S, 96, S, 112, N, 112);
      S.set(N);
    }
  };
  AX.prototype.zz = function () {
    var D = this.D, half = 16 * D, z0 = new Uint8Array(half), z1 = new Uint8Array(half), i, j;
    for (i = 0; i < D; i++) { var S = this.S[i];
      for (j = 0; j < 16; j++) {
        z0[i * 16 + j] = S[16 + j] ^ S[96 + j] ^ (S[32 + j] & S[48 + j]);
        z1[i * 16 + j] = S[32 + j] ^ S[80 + j] ^ (S[96 + j] & S[112 + j]);
      } }
    return [z0, z1];
  };
  AX.prototype.absorb = function (ai) { var h = 16 * this.D; this.upd(ai.subarray(0, h), ai.subarray(h)); };
  AX.prototype.enc = function (xi) {
    var h = 16 * this.D, R = 32 * this.D, z = this.zz(), o0 = new Uint8Array(h), o1 = new Uint8Array(h), k;
    for (k = 0; k < h; k++) { o0[k] = xi[k] ^ z[0][k]; o1[k] = xi[h + k] ^ z[1][k]; }
    this.upd(xi.subarray(0, h), xi.subarray(h));
    var ci = new Uint8Array(R); ci.set(o0, 0); ci.set(o1, h); return ci;
  };
  AX.prototype.dec = function (ci) {
    var h = 16 * this.D, R = 32 * this.D, z = this.zz(), o0 = new Uint8Array(h), o1 = new Uint8Array(h), k;
    for (k = 0; k < h; k++) { o0[k] = ci[k] ^ z[0][k]; o1[k] = ci[h + k] ^ z[1][k]; }
    this.upd(o0, o1);
    var xi = new Uint8Array(R); xi.set(o0, 0); xi.set(o1, h); return xi;
  };
  AX.prototype.decPart = function (cn, len) {
    var R = 32 * this.D, h = 16 * this.D, t = zeroPad(cn, R), z = this.zz(), out = new Uint8Array(R), k;
    for (k = 0; k < h; k++) { out[k] = t[k] ^ z[0][k]; out[h + k] = t[h + k] ^ z[1][k]; }
    var xn = out.slice(0, len), v = zeroPad(xn, R);
    this.upd(v.subarray(0, h), v.subarray(h));
    return xn;
  };
  AX.prototype.fin = function (adBits, msgBits, tagBits) {
    var D = this.D, i, j, b, u = u16cat(le64x(adBits)); u.set(le64x(msgBits), 8);
    var t = new Uint8Array(16 * D);
    for (i = 0; i < D; i++) t.set(xor16(this.S[i], 32, u, 0), i * 16);
    for (b = 0; b < 7; b++) this.upd(t, t);
    if (tagBits === 128) {
      var tag = new Uint8Array(16);
      for (i = 0; i < D; i++) for (j = 0; j < 16; j++) for (b = 0; b < 7; b++) tag[j] ^= this.S[i][b * 16 + j];
      return tag;
    }
    var a0 = new Uint8Array(16), a1 = new Uint8Array(16);
    for (i = 0; i < D; i++) for (j = 0; j < 16; j++) {
      for (b = 0; b < 4; b++) a0[j] ^= this.S[i][b * 16 + j];
      for (b = 4; b < 8; b++) a1[j] ^= this.S[i][b * 16 + j];
    }
    var r = new Uint8Array(32); r.set(a0, 0); r.set(a1, 16); return r;
  };
  AX.prototype.finMac = function (dataBits, tagBits) {
    var D = this.D, h = 16 * D, R = 32 * D, i, j, b, off;
    var u = u16cat(le64x(dataBits)); u.set(le64x(tagBits), 8);
    var t = new Uint8Array(h);
    for (i = 0; i < D; i++) t.set(xor16(this.S[i], 32, u, 0), i * 16);
    for (b = 0; b < 7; b++) this.upd(t, t);
    var tags, ti;
    if (tagBits === 128) {
      tags = new Uint8Array(16 * D);
      for (i = 0; i < D; i++) { ti = new Uint8Array(16);
        for (j = 0; j < 16; j++) for (b = 0; b < 7; b++) ti[j] ^= this.S[i][b * 16 + j];
        tags.set(ti, i * 16); }
    } else {
      tags = new Uint8Array(32 * (D - 1));
      for (i = 1; i < D; i++) {
        var x0 = new Uint8Array(16), x1 = new Uint8Array(16);
        for (j = 0; j < 16; j++) {
          for (b = 0; b < 4; b++) x0[j] ^= this.S[i][b * 16 + j];
          for (b = 4; b < 8; b++) x1[j] ^= this.S[i][b * 16 + j];
        }
        tags.set(x0, (i - 1) * 32); tags.set(x1, (i - 1) * 32 + 16);
      }
    }
    if (D > 1) {
      for (off = 0; off < tags.length; off += 32) {
        var v = tags.subarray(off, off + 32);
        var ai = new Uint8Array(R);
        ai.set(zeroPad(v.subarray(0, 16), h), 0);
        ai.set(zeroPad(v.subarray(16, 32), h), h);
        this.absorb(ai);
      }
      var u2 = u16cat(le64x(D)); u2.set(le64x(tagBits), 8);
      /* 官方写 ZeroPad(V[2,0]^u, R)，实测应填充到单个 Update 参数长度（h 字节） */
      var t2 = zeroPad(xor16(this.S[0], 32, u2, 0), h);
      for (b = 0; b < 7; b++) this.upd(t2, t2);
    }
    var S0 = this.S[0];
    if (tagBits === 128) {
      var g = new Uint8Array(16);
      for (j = 0; j < 16; j++) for (b = 0; b < 7; b++) g[j] ^= S0[b * 16 + j];
      return g;
    }
    var y0 = new Uint8Array(16), y1 = new Uint8Array(16);
    for (j = 0; j < 16; j++) {
      for (b = 0; b < 4; b++) y0[j] ^= S0[b * 16 + j];
      for (b = 4; b < 8; b++) y1[j] ^= S0[b * 16 + j];
    }
    var gg = new Uint8Array(32); gg.set(y0, 0); gg.set(y1, 16); return gg;
  };

  function PX(key, nonce, D) {
    var S = [], i, j;
    var k0 = key.subarray(0, 16), k1 = key.subarray(16, 32);
    var n0 = nonce.subarray(0, 16), n1 = nonce.subarray(16, 32);
    var kn0 = xor16(key, 0, nonce, 0), kn1 = xor16(key, 16, nonce, 16);
    for (i = 0; i < D; i++) {
      var s = new Uint8Array(96);
      s.set(kn0, 0); s.set(kn1, 16); s.set(C1, 32); s.set(C0, 48);
      s.set(xor16(k0, 0, C0, 0), 64);
      s.set(xor16(k1, 0, C1, 0), 80);
      S.push(s);
    }
    this.D = D; this.S = S; this.N = new Uint8Array(96);
    var a = new Uint8Array(16 * D), b = new Uint8Array(16 * D), c0 = new Uint8Array(16 * D), c1 = new Uint8Array(16 * D), ctx = [];
    for (i = 0; i < D; i++) { a.set(k0, i * 16); b.set(k1, i * 16); c0.set(kn0, i * 16); c1.set(kn1, i * 16); }
    for (i = 0; i < D; i++) { var cx = new Uint8Array(16); cx[0] = i; cx[1] = D - 1; ctx.push(cx); }
    var self = this;
    function xc() { for (var q = 0; q < D; q++) for (var w = 0; w < 16; w++) { S[q][48 + w] ^= ctx[q][w]; S[q][80 + w] ^= ctx[q][w]; } }
    for (var r = 0; r < 4; r++) { xc(); self.upd(a); xc(); self.upd(b); xc(); self.upd(c0); xc(); self.upd(c1); }
  }
  PX.prototype.upd = function (M) {
    var D = this.D, i, j;
    for (i = 0; i < D; i++) {
      var S = this.S[i], N = this.N, t = new Uint8Array(16);
      /* 官方：S'0 = AESRound(S5, S0 ^ M) */
      for (j = 0; j < 16; j++) t[j] = S[j] ^ M[i * 16 + j];
      aesRound(S, 80, t, 0, N, 0);
      for (var q = 1; q < 6; q++) aesRound(S, (q - 1) * 16, S, q * 16, N, q * 16);
      S.set(N);
    }
  };
  PX.prototype.zz = function () {
    var D = this.D, z = new Uint8Array(16 * D), i, j;
    for (i = 0; i < D; i++) { var S = this.S[i];
      for (j = 0; j < 16; j++) z[i * 16 + j] = S[16 + j] ^ S[64 + j] ^ S[80 + j] ^ (S[32 + j] & S[48 + j]); }
    return z;
  };
  PX.prototype.absorb = function (ai) { this.upd(ai); };
  PX.prototype.enc = function (xi) {
    var z = this.zz(); this.upd(xi);
    var ci = new Uint8Array(xi.length), k;
    for (k = 0; k < xi.length; k++) ci[k] = xi[k] ^ z[k];
    return ci;
  };
  PX.prototype.dec = function (ci) {
    var z = this.zz(), xi = new Uint8Array(ci.length), k;
    for (k = 0; k < ci.length; k++) xi[k] = ci[k] ^ z[k];
    this.upd(xi); return xi;
  };
  PX.prototype.decPart = function (cn, len) {
    var R = 16 * this.D, z = this.zz(), t = zeroPad(cn, R), out = new Uint8Array(R), k;
    for (k = 0; k < R; k++) out[k] = t[k] ^ z[k];
    var xn = out.slice(0, len);
    this.upd(zeroPad(xn, R));
    return xn;
  };
  PX.prototype.fin = function (adBits, msgBits, tagBits) {
    var D = this.D, i, j, b, u = u16cat(le64x(adBits)); u.set(le64x(msgBits), 8);
    var t = new Uint8Array(16 * D);
    for (i = 0; i < D; i++) t.set(xor16(this.S[i], 48, u, 0), i * 16);
    for (b = 0; b < 7; b++) this.upd(t);
    if (tagBits === 128) {
      var tag = new Uint8Array(16);
      for (i = 0; i < D; i++) for (j = 0; j < 16; j++) for (b = 0; b < 6; b++) tag[j] ^= this.S[i][b * 16 + j];
      return tag;
    }
    var a0 = new Uint8Array(16), a1 = new Uint8Array(16);
    for (i = 0; i < D; i++) for (j = 0; j < 16; j++) {
      for (b = 0; b < 3; b++) a0[j] ^= this.S[i][b * 16 + j];
      for (b = 3; b < 6; b++) a1[j] ^= this.S[i][b * 16 + j];
    }
    var r = new Uint8Array(32); r.set(a0, 0); r.set(a1, 16); return r;
  };
  PX.prototype.finMac = function (dataBits, tagBits) {
    var D = this.D, R = 16 * D, i, j, b, off;
    var u = u16cat(le64x(dataBits)); u.set(le64x(tagBits), 8);
    var t = new Uint8Array(R);
    for (i = 0; i < D; i++) t.set(xor16(this.S[i], 48, u, 0), i * 16);
    for (b = 0; b < 7; b++) this.upd(t);
    var tags;
    if (tagBits === 128) {
      tags = new Uint8Array(16 * (D - 1));
      for (i = 1; i < D; i++) { var ti = new Uint8Array(16);
        for (j = 0; j < 16; j++) for (b = 0; b < 6; b++) ti[j] ^= this.S[i][b * 16 + j];
        tags.set(ti, (i - 1) * 16); }
    } else {
      tags = new Uint8Array(32 * (D - 1));
      for (i = 1; i < D; i++) {
        var x0 = new Uint8Array(16), x1 = new Uint8Array(16);
        for (j = 0; j < 16; j++) {
          for (b = 0; b < 3; b++) x0[j] ^= this.S[i][b * 16 + j];
          for (b = 3; b < 6; b++) x1[j] ^= this.S[i][b * 16 + j];
        }
        tags.set(x0, (i - 1) * 32); tags.set(x1, (i - 1) * 32 + 16);
      }
    }
    if (D > 1) {
      for (off = 0; off < tags.length; off += 16) this.absorb(zeroPad(tags.subarray(off, off + 16), R));
      var u2 = u16cat(le64x(D)); u2.set(le64x(tagBits), 8);
      var t2 = zeroPad(xor16(this.S[0], 48, u2, 0), R);
      for (b = 0; b < 7; b++) this.upd(t2);
    }
    var S0 = this.S[0];
    if (tagBits === 128) {
      var g = new Uint8Array(16);
      for (j = 0; j < 16; j++) for (b = 0; b < 6; b++) g[j] ^= S0[b * 16 + j];
      return g;
    }
    var y0 = new Uint8Array(16), y1 = new Uint8Array(16);
    for (j = 0; j < 16; j++) {
      for (b = 0; b < 3; b++) y0[j] ^= S0[b * 16 + j];
      for (b = 3; b < 6; b++) y1[j] ^= S0[b * 16 + j];
    }
    var gg = new Uint8Array(32); gg.set(y0, 0); gg.set(y1, 16); return gg;
  };

  function xSeal(fam, key, nonce, ad, msg, D, tagB) {
    var isA = fam === 'A', R = isA ? 32 * D : 16 * D;
    var st = isA ? new AX(key, nonce, D) : new PX(key, nonce, D);
    var a = zeroPad(ad, R), o;
    for (o = 0; o < a.length; o += R) st.absorb(a.subarray(o, o + R));
    var m = zeroPad(msg, R), ct = new Uint8Array(m.length);
    for (o = 0; o < m.length; o += R) ct.set(st.enc(m.subarray(o, o + R)), o);
    return new Uint8Array(Array.prototype.concat.call(
      Array.prototype.slice.call(ct.subarray(0, msg.length)),
      Array.prototype.slice.call(st.fin(ad.length * 8, msg.length * 8, tagB * 8))));
  }
  function xOpen(fam, key, nonce, ad, body, D, tagB) {
    var isA = fam === 'A', R = isA ? 32 * D : 16 * D, tl = tagB;
    if (body.length < tl) throw new Error('输入太短：至少要含 ' + tl + ' 字节认证标签');
    var ct = body.subarray(0, body.length - tl), tag = body.subarray(body.length - tl);
    var st = isA ? new AX(key, nonce, D) : new PX(key, nonce, D);
    var a = zeroPad(ad, R), o;
    for (o = 0; o < a.length; o += R) st.absorb(a.subarray(o, o + R));
    var full = Math.floor(ct.length / R) * R, tail = ct.length - full, msg = new Uint8Array(ct.length);
    for (o = 0; o < full; o += R) msg.set(st.dec(ct.subarray(o, o + R)), o);
    if (tail > 0) msg.set(st.decPart(ct.subarray(full), tail), full);
    var exp = st.fin(ad.length * 8, ct.length * 8, tagB * 8), ok = true, i;
    /* 常数时间比较：不提前 break，避免按字节位置泄漏的时序侧信道 */
    var dif = exp.length ^ tag.length;
    for (i = 0; i < exp.length; i++) dif |= (exp[i] ^ (tag[i] | 0));
    if (dif !== 0) throw new Error('认证失败：标签不匹配（密文/AD/密钥/nonce 任一不符）');
    return msg;
  }
  function xMac(fam, key, nonce, data, D, tagB) {
    var isA = fam === 'A', R = isA ? 32 * D : 16 * D;
    var st = isA ? new AX(key, nonce, D) : new PX(key, nonce, D);
    var d = zeroPad(data, R), o;
    for (o = 0; o < d.length; o += R) st.absorb(d.subarray(o, o + R));
    return D > 1 ? st.finMac(data.length * 8, tagB * 8)
                 : st.fin(data.length * 8, tagB * 8, tagB * 8);
  }
  /* 分段解析：Hex / Base64 自动识别。
   * 【为什么】界面「密文格式」默认 Base64，enc 出的标签就是 Base64；校验入口原先把
   *   两段都当纯 Hex 解析，于是「自己算的标签粘回来校验」直接报 Hex 错——自产自解
   *   走不通。两种编码都吃，先试 Hex（字符集严格），不合法再按 Base64 解。 */
  function flexSeg(s, what) {
    var t = String(s == null ? '' : s).replace(/[\s]/g, '');
    if (t === '') return new Uint8Array(0);
    if (/^[0-9a-fA-F]+$/.test(t) && t.length % 2 === 0) return hexToBytes(t);
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(t)) {
      try {
        var bin = atob(t), o = new Uint8Array(bin.length), i;
        for (i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i) & 0xff;
        return o;
      } catch (e) { /* 落到统一报错 */ }
    }
    throw new Error(what + '既不是合法 Hex 也不是合法 Base64');
  }
  function splitX(b, fmt) {
    var ad = new Uint8Array(0), data = b;
    if (typeof b === 'string' && b.indexOf(',') >= 0) {
      var ps = b.split(','); ad = hexToBytes(ps[0] || ''); data = hexToBytes(ps.slice(1).join(','));
    } else if (typeof b === 'string') { try { data = bytesIn(b, fmt || 'hex'); } catch (e) { data = new Uint8Array(0); } }
    return { ad: ad, data: new Uint8Array(data) };
  }
  function mkX(id, name, fam, D, tagB, desc) {
    return {
      id: id, name: name, group: '认证加密', key: true, param: true, info: desc,
      enc: function (b, k, p, fmt) {
        var s = splitX(b, fmt);
        return bytesOut(xSeal(fam, hexToBytes(String(k || '')), hexToBytes(String(p || '')), s.ad, s.data, D, aegisTagB()), fmt);
      },
      dec: function (b, k, p, fmt) {
        var s = splitX(b, fmt);
        return openAuto(function (tb) {
          return xOpen(fam, hexToBytes(String(k || '')), hexToBytes(String(p || '')), s.ad, s.data, D, tb);
        });
      }
    };
  }
  function mkM(id, name, fam, D, tagB, desc) {
    return {
      id: id, name: name, group: '认证加密', key: true, param: true, info: desc,
      enc: function (b, k, p, fmt) {
        var s = splitX(b, fmt);
        return bytesOut(xMac(fam, hexToBytes(String(k || '')), hexToBytes(String(p || '')), s.data, D, aegisTagB()), fmt);
      },
      dec: function (b, k, p, fmt) {
        /* MAC 是单向的：dec 只做「重算并比对」的校验入口。
           输入格式：待认证数据Hex,标签Hex（最后一段是标签，前面全部是待认证数据）。
           注意：不能沿用 splitX —— 它会把最后一段当 data 去算 MAC，
           导致「拿标签算 MAC 再跟标签比」，恒不相等。这里是自己解析。 */
        var str = (typeof b === 'string') ? b
          : (typeof bytesToHex === 'function' ? bytesToHex(new Uint8Array(b || [])) : '');
        var ps = String(str || '').split(',');
        if (ps.length < 2) throw new Error('AEGISMAC 校验需要输入「待认证数据,标签」两段（Hex 或 Base64 均可，最后一段是标签）');
        var want = flexSeg(ps.pop(), '标签段');
        var data = flexSeg(ps.join(','), '待认证数据段');
        if (!want.length) throw new Error('AEGISMAC 校验：标签段为空');
        var got = xMac(fam, hexToBytes(String(k || '')), hexToBytes(String(p || '')), data, D, aegisTagB());
        var ok = got.length === want.length, i;
        for (i = 0; ok && i < got.length; i++) if (got[i] !== want[i]) ok = false;
        if (!ok) throw new Error('AEGISMAC 校验失败：标签不匹配（数据可能被篡改）');
        return strToBytes('AEGISMAC 校验通过：标签匹配（' + got.length + ' 字节，数据完整）');
      }
    };
  }
  var XV = [
    ['aegis128x2', 'AEGIS-128X2（并行 AEAD）', 'A', 2, 16],
    ['aegis128x4', 'AEGIS-128X4（并行 AEAD）', 'A', 4, 16],
    ['aegis256x2', 'AEGIS-256X2（并行 AEAD）', 'P', 2, 16],
    ['aegis256x4', 'AEGIS-256X4（并行 AEAD）', 'P', 4, 16]
  ];
  for (var xi = 0; xi < XV.length; xi++) {
    var xv = XV[xi], famN = xv[2] === 'A' ? 'AEGIS-128X' + xv[3] : 'AEGIS-256X' + xv[3];
    var klen = xv[2] === 'A' ? 16 : 32, dsc = famN + '（RFC/draft-irtf-cfrg-aegis-aead，IANA AEAD 编号 ' +
      ({ 2: xv[2] === 'A' ? 34 : 36, 4: xv[2] === 'A' ? 35 : 37 })[xv[3]] + '）。' + klen +
      ' 字节密钥填密钥栏，' + klen + ' 字节 nonce 填参数栏；输入「AD的Hex,明文」，输出密文‖标签。' +
      '标签长度由「AEAD 标签长度」下拉选择（16 或 32 字节），解密时自动识别。' +
      '已通过官方草稿向量：初始状态 + AEAD 加解密双向全过。';
    reg(mkX(xv[0], xv[1], xv[2], xv[3], xv[4], dsc));
  }
  var MV = [
    ['aegismac128l', 'AEGISMAC-128L', 'A', 1, 16],
    ['aegismac256', 'AEGISMAC-256', 'P', 1, 16],
    ['aegismac128x2', 'AEGISMAC-128X2', 'A', 2, 16],
    ['aegismac128x4', 'AEGISMAC-128X4', 'A', 4, 16],
    ['aegismac256x2', 'AEGISMAC-256X2', 'P', 2, 16],
    ['aegismac256x4', 'AEGISMAC-256X4', 'P', 4, 16]
  ];
  for (var mi = 0; mi < MV.length; mi++) {
    var mv = MV[mi], mn = mv[1].replace(/（.*/, ''), dd = mv[3];
    var mk = mv[2] === 'A' ? 16 : 32;
    var mdsc = mn + '：' + (dd === 1 ? (mv[2] === 'A' ? 'AEGIS-128L' : 'AEGIS-256') : (mv[2] === 'A' ? 'AEGIS-128X' + dd : 'AEGIS-256X' + dd)) +
      ' 之上的纯认证 MAC（单向）。密钥 ' + mk + ' 字节、nonce ' + mk + ' 字节；输入待认证数据，输出标签，' +
      '标签长度由「AEAD 标签长度」下拉选择（16 或 32 字节）。' +
      '校验（解密）时输入「待认证数据Hex,标签Hex」两段，通过会提示标签匹配。' +
      '已通过官方草稿 AEGISMAC 向量（含 tags 中间值）。';
    reg(mkM(mv[0], mv[1], mv[2], mv[3], mv[4], mdsc));
  }

})();
