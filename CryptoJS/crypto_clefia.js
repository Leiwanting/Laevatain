/* ============================================================
 * CLEFIA —— 索尼 128 位轻量分组密码（ISO/IEC 29192-2 / RFC 6114 / CRYPTREC）
 *
 * 参照物：索尼官方参考代码 clefia_ref.c Version 1.0.1 (2008-08-26)
 *         用户提供，路径 /data/inputs/Sony CLEFIA ReferenceCodev1.0.1.txt
 * 本文件是那份 C 代码的逐行转写；S0/S1 两个 S 盒由脚本从官方源码直接提取
 * （256 项、已断言是双射），不手工抄写，避免抄错。
 *
 * 参数：128 位块；密钥 128/192/256 位；轮数 18/22/26。
 *
 * 用官方源码钉死的四处易错点（都是"不报错、只是密文全错"型）：
 *  1) F0/F1 不是纯函数，是【F0Xor / F1Xor】：写 8 字节 = [src 前 4 字节原样,
 *     后 4 字节 ^ F(rk, src 前 4 字节)]。只算 F 再整体 XOR 会全错。
 *  2) GFN 的字轮换在【最后一轮不做】（源码里 if(r) 守卫），
 *     末轮多轮换一次同样不报错、只是密文不同。
 *  3) 密钥调度里 con 的读取偏移是 i*16 + 4*24（128 位）/ i*16 + 4*40（192/256 位），
 *     不是从 con 数组开头读——写成 i*16 会静默算错。
 *  4) 白化密钥作用位置是【块内第 2、第 4 个 32 位字】（字节 4..7 和 12..15），
 *     不是首尾字节。
 * 另：C 的 ~ 是 unsigned char 取反，转写必须 & 0xff；
 *     ConSet 里 tmp = (t0 << 7) 也要截断到 8 位再参与拼接。
 * ============================================================ */
(function () {
  var S0 = [
    0x57,0x49,0xd1,0xc6,0x2f,0x33,0x74,0xfb,0x95,0x6d,0x82,0xea,0x0e,0xb0,0xa8,0x1c,
    0x28,0xd0,0x4b,0x92,0x5c,0xee,0x85,0xb1,0xc4,0x0a,0x76,0x3d,0x63,0xf9,0x17,0xaf,
    0xbf,0xa1,0x19,0x65,0xf7,0x7a,0x32,0x20,0x06,0xce,0xe4,0x83,0x9d,0x5b,0x4c,0xd8,
    0x42,0x5d,0x2e,0xe8,0xd4,0x9b,0x0f,0x13,0x3c,0x89,0x67,0xc0,0x71,0xaa,0xb6,0xf5,
    0xa4,0xbe,0xfd,0x8c,0x12,0x00,0x97,0xda,0x78,0xe1,0xcf,0x6b,0x39,0x43,0x55,0x26,
    0x30,0x98,0xcc,0xdd,0xeb,0x54,0xb3,0x8f,0x4e,0x16,0xfa,0x22,0xa5,0x77,0x09,0x61,
    0xd6,0x2a,0x53,0x37,0x45,0xc1,0x6c,0xae,0xef,0x70,0x08,0x99,0x8b,0x1d,0xf2,0xb4,
    0xe9,0xc7,0x9f,0x4a,0x31,0x25,0xfe,0x7c,0xd3,0xa2,0xbd,0x56,0x14,0x88,0x60,0x0b,
    0xcd,0xe2,0x34,0x50,0x9e,0xdc,0x11,0x05,0x2b,0xb7,0xa9,0x48,0xff,0x66,0x8a,0x73,
    0x03,0x75,0x86,0xf1,0x6a,0xa7,0x40,0xc2,0xb9,0x2c,0xdb,0x1f,0x58,0x94,0x3e,0xed,
    0xfc,0x1b,0xa0,0x04,0xb8,0x8d,0xe6,0x59,0x62,0x93,0x35,0x7e,0xca,0x21,0xdf,0x47,
    0x15,0xf3,0xba,0x7f,0xa6,0x69,0xc8,0x4d,0x87,0x3b,0x9c,0x01,0xe0,0xde,0x24,0x52,
    0x7b,0x0c,0x68,0x1e,0x80,0xb2,0x5a,0xe7,0xad,0xd5,0x23,0xf4,0x46,0x3f,0x91,0xc9,
    0x6e,0x84,0x72,0xbb,0x0d,0x18,0xd9,0x96,0xf0,0x5f,0x41,0xac,0x27,0xc5,0xe3,0x3a,
    0x81,0x6f,0x07,0xa3,0x79,0xf6,0x2d,0x38,0x1a,0x44,0x5e,0xb5,0xd2,0xec,0xcb,0x90,
    0x9a,0x36,0xe5,0x29,0xc3,0x4f,0xab,0x64,0x51,0xf8,0x10,0xd7,0xbc,0x02,0x7d,0x8e,
  ];
  var S1 = [
    0x6c,0xda,0xc3,0xe9,0x4e,0x9d,0x0a,0x3d,0xb8,0x36,0xb4,0x38,0x13,0x34,0x0c,0xd9,
    0xbf,0x74,0x94,0x8f,0xb7,0x9c,0xe5,0xdc,0x9e,0x07,0x49,0x4f,0x98,0x2c,0xb0,0x93,
    0x12,0xeb,0xcd,0xb3,0x92,0xe7,0x41,0x60,0xe3,0x21,0x27,0x3b,0xe6,0x19,0xd2,0x0e,
    0x91,0x11,0xc7,0x3f,0x2a,0x8e,0xa1,0xbc,0x2b,0xc8,0xc5,0x0f,0x5b,0xf3,0x87,0x8b,
    0xfb,0xf5,0xde,0x20,0xc6,0xa7,0x84,0xce,0xd8,0x65,0x51,0xc9,0xa4,0xef,0x43,0x53,
    0x25,0x5d,0x9b,0x31,0xe8,0x3e,0x0d,0xd7,0x80,0xff,0x69,0x8a,0xba,0x0b,0x73,0x5c,
    0x6e,0x54,0x15,0x62,0xf6,0x35,0x30,0x52,0xa3,0x16,0xd3,0x28,0x32,0xfa,0xaa,0x5e,
    0xcf,0xea,0xed,0x78,0x33,0x58,0x09,0x7b,0x63,0xc0,0xc1,0x46,0x1e,0xdf,0xa9,0x99,
    0x55,0x04,0xc4,0x86,0x39,0x77,0x82,0xec,0x40,0x18,0x90,0x97,0x59,0xdd,0x83,0x1f,
    0x9a,0x37,0x06,0x24,0x64,0x7c,0xa5,0x56,0x48,0x08,0x85,0xd0,0x61,0x26,0xca,0x6f,
    0x7e,0x6a,0xb6,0x71,0xa0,0x70,0x05,0xd1,0x45,0x8c,0x23,0x1c,0xf0,0xee,0x89,0xad,
    0x7a,0x4b,0xc2,0x2f,0xdb,0x5a,0x4d,0x76,0x67,0x17,0x2d,0xf4,0xcb,0xb1,0x4a,0xa8,
    0xb5,0x22,0x47,0x3a,0xd5,0x10,0x4c,0x72,0xcc,0x00,0xf9,0xe0,0xfd,0xe2,0xfe,0xae,
    0xf8,0x5f,0xab,0xf1,0x1b,0x42,0x81,0xd6,0xbe,0x44,0x29,0xa6,0x57,0xb9,0xaf,0xf2,
    0xd4,0x75,0x66,0xbb,0x68,0x9f,0x50,0x02,0x01,0x3c,0x7f,0x8d,0x1a,0x88,0xbd,0xac,
    0xf7,0xe4,0x79,0x96,0xa2,0xfc,0x6d,0xb2,0x6b,0x03,0xe1,0x2e,0x7d,0x14,0x95,0x1d,
  ];

  function mul2(x) { if (x & 0x80) x ^= 0x0e; return ((x << 1) | (x >> 7)) & 0xff; }
  function mul4(x) { return mul2(mul2(x)); }
  function mul6(x) { return mul2(x) ^ mul4(x); }
  function mul8(x) { return mul2(mul4(x)); }
  function mulA(x) { return mul2(x) ^ mul8(x); }

  /* F0Xor：dst[0..3]=src[0..3]，dst[4..7]=src[4..7] ^ F0(rk, src[0..3]) */
  function f0xor(out, o, src, s, rk, k) {
    var z0 = S0[src[s] ^ rk[k]], z1 = S1[src[s + 1] ^ rk[k + 1]],
        z2 = S0[src[s + 2] ^ rk[k + 2]], z3 = S1[src[s + 3] ^ rk[k + 3]];
    var y0 = z0 ^ mul2(z1) ^ mul4(z2) ^ mul6(z3);
    var y1 = mul2(z0) ^ z1 ^ mul6(z2) ^ mul4(z3);
    var y2 = mul4(z0) ^ mul6(z1) ^ z2 ^ mul2(z3);
    var y3 = mul6(z0) ^ mul4(z1) ^ mul2(z2) ^ z3;
    out[o] = src[s]; out[o + 1] = src[s + 1]; out[o + 2] = src[s + 2]; out[o + 3] = src[s + 3];
    out[o + 4] = src[s + 4] ^ y0; out[o + 5] = src[s + 5] ^ y1;
    out[o + 6] = src[s + 6] ^ y2; out[o + 7] = src[s + 7] ^ y3;
  }
  /* F1Xor：同构，S 盒顺序 S1,S0,S1,S0，扩散矩阵 M1 */
  function f1xor(out, o, src, s, rk, k) {
    var z0 = S1[src[s] ^ rk[k]], z1 = S0[src[s + 1] ^ rk[k + 1]],
        z2 = S1[src[s + 2] ^ rk[k + 2]], z3 = S0[src[s + 3] ^ rk[k + 3]];
    var y0 = z0 ^ mul8(z1) ^ mul2(z2) ^ mulA(z3);
    var y1 = mul8(z0) ^ z1 ^ mulA(z2) ^ mul2(z3);
    var y2 = mul2(z0) ^ mulA(z1) ^ z2 ^ mul8(z3);
    var y3 = mulA(z0) ^ mul2(z1) ^ mul8(z2) ^ z3;
    out[o] = src[s]; out[o + 1] = src[s + 1]; out[o + 2] = src[s + 2]; out[o + 3] = src[s + 3];
    out[o + 4] = src[s + 4] ^ y0; out[o + 5] = src[s + 5] ^ y1;
    out[o + 6] = src[s + 6] ^ y2; out[o + 7] = src[s + 7] ^ y3;
  }

  /* GFN_{4,r}：末轮不做字轮换（源码 if(r) 守卫） */
  function gfn4(x, xs, rk, k0, r) {
    var fin = new Uint8Array(16), fout = new Uint8Array(16), i, k = k0;
    for (i = 0; i < 16; i++) fin[i] = x[xs + i];
    while (r-- > 0) {
      f0xor(fout, 0, fin, 0, rk, k);
      f1xor(fout, 8, fin, 8, rk, k + 4);
      k += 8;
      if (r) {
        for (i = 0; i < 12; i++) fin[i] = fout[4 + i];
        for (i = 0; i < 4; i++) fin[12 + i] = fout[i];
      }
    }
    return fout;
  }
  /* GFN_{8,r}：密钥调度用（192/256 位密钥生成 L） */
  function gfn8(x, xs, rk, k0, r) {
    var fin = new Uint8Array(32), fout = new Uint8Array(32), i, k = k0;
    for (i = 0; i < 32; i++) fin[i] = x[xs + i];
    while (r-- > 0) {
      f0xor(fout, 0, fin, 0, rk, k);
      f1xor(fout, 8, fin, 8, rk, k + 4);
      f0xor(fout, 16, fin, 16, rk, k + 8);
      f1xor(fout, 24, fin, 24, rk, k + 12);
      k += 16;
      if (r) {
        for (i = 0; i < 28; i++) fin[i] = fout[4 + i];
        for (i = 0; i < 4; i++) fin[28 + i] = fout[i];
      }
    }
    return fout;
  }
  /* GFN^{-1}_{4,r}：轮密钥【倒序】取，字轮换方向相反，末轮同样不轮换 */
  function gfn4inv(x, xs, rk, k0, r) {
    var fin = new Uint8Array(16), fout = new Uint8Array(16), i, k = k0 + (r - 1) * 8;
    for (i = 0; i < 16; i++) fin[i] = x[xs + i];
    while (r-- > 0) {
      f0xor(fout, 0, fin, 0, rk, k);
      f1xor(fout, 8, fin, 8, rk, k + 4);
      k -= 8;
      if (r) {
        for (i = 0; i < 4; i++) fin[i] = fout[12 + i];
        for (i = 0; i < 12; i++) fin[4 + i] = fout[i];
      }
    }
    return fout;
  }

  /* DoubleSwap：16 字节整体左移 1 位，高低两字节跨接（源码逐字节拼） */
  function doubleSwap(b, off) {
    var t = new Uint8Array(16), i;
    for (i = 0; i < 7; i++) t[i] = ((b[off + i] << 7) | (b[off + i + 1] >> 1)) & 0xff;
    t[7] = ((b[off + 7] << 7) | (b[off + 15] & 0x7f)) & 0xff;
    t[8] = ((b[off + 8] >> 7) | (b[off + 0] & 0xfe)) & 0xff;
    for (i = 9; i < 16; i++) t[i] = ((b[off + i] >> 7) | (b[off + i - 1] << 1)) & 0xff;
    for (i = 0; i < 16; i++) b[off + i] = t[i];
  }

  /* ConSet：由 2 字节 IV 生成 8*lk 字节常量。
     IV 取三次根的小数部分：128->0x428a(立方根2) 192->0x7137(立方根3) 256->0xb5c0(立方根5)。
     P16=0xb7e1(自然对数) Q16=0x243f(圆周率)，T 的更新多项式是 0xa830。 */
  function conSet(iv0, iv1, lk) {
    var con = new Uint8Array(8 * lk), t0 = iv0, t1 = iv1, idx = 0, tmp;
    for (var n = 0; n < lk; n++) {
      con[idx] = t0 ^ 0xb7;
      con[idx + 1] = t1 ^ 0xe1;
      con[idx + 2] = (~(((t0 << 1) & 0xff) | (t1 >> 7))) & 0xff;
      con[idx + 3] = (~(((t1 << 1) & 0xff) | (t0 >> 7))) & 0xff;
      con[idx + 4] = (~t0 & 0xff) ^ 0x24;
      con[idx + 5] = (~t1 & 0xff) ^ 0x3f;
      con[idx + 6] = t1;
      con[idx + 7] = t0;
      idx += 8;
      if (t1 & 0x01) { t0 ^= 0xa8; t1 ^= 0x30; }
      tmp = (t0 << 7) & 0xff;
      t0 = ((t0 >> 1) | (t1 << 7)) & 0xff;
      t1 = ((t1 >> 1) | tmp) & 0xff;
    }
    return con;
  }

  function keySet128(sk) {
    var con = conSet(0x42, 0x8a, 30);          /* CON^(128)：60 个 32 位字 */
    var lk = gfn4(sk, 0, con, 0, 12);          /* GFN_{4,12} 由 K 生成 L */
    var rk = new Uint8Array(8 * 18 + 16), o = 0, i, j;
    for (i = 0; i < 8; i++) rk[o++] = sk[i];   /* WK0, WK1 */
    for (i = 0; i < 9; i++) {
      for (j = 0; j < 16; j++) rk[o + j] = lk[j] ^ con[i * 16 + (4 * 24) + j];
      if (i % 2) for (j = 0; j < 16; j++) rk[o + j] ^= sk[j];
      doubleSwap(lk, 0);
      o += 16;
    }
    for (i = 0; i < 8; i++) rk[o++] = sk[8 + i]; /* WK2, WK3 */
    return rk;
  }

  function keySet192(sk) {
    var skey256 = new Uint8Array(32), i, j;
    for (i = 0; i < 24; i++) skey256[i] = sk[i];
    for (i = 0; i < 8; i++) skey256[i + 24] = (~sk[i]) & 0xff;  /* 后 8 字节 = 前 8 字节取反 */
    var con = conSet(0x71, 0x37, 42);
    var lk = gfn8(skey256, 0, con, 0, 10);
    var rk = new Uint8Array(8 * 22 + 16), o = 0;
    for (i = 0; i < 8; i++) rk[o++] = skey256[i] ^ skey256[16 + i];
    for (i = 0; i < 11; i++) {
      var base = i * 16 + (4 * 40);
      if (((i / 2) | 0) % 2) {                  /* 用 LR（lk 高半） */
        for (j = 0; j < 16; j++) rk[o + j] = lk[16 + j] ^ con[base + j];
        if (i % 2) for (j = 0; j < 16; j++) rk[o + j] ^= skey256[j];      /* 混入 KL */
        doubleSwap(lk, 16);
      } else {                                  /* 用 LL（lk 低半） */
        for (j = 0; j < 16; j++) rk[o + j] = lk[j] ^ con[base + j];
        if (i % 2) for (j = 0; j < 16; j++) rk[o + j] ^= skey256[16 + j]; /* 混入 KR */
        doubleSwap(lk, 0);
      }
      o += 16;
    }
    for (i = 0; i < 8; i++) rk[o++] = skey256[8 + i] ^ skey256[24 + i];
    return rk;
  }

  function keySet256(sk) {
    var con = conSet(0xb5, 0xc0, 46);
    var lk = gfn8(sk, 0, con, 0, 10);
    var rk = new Uint8Array(8 * 26 + 16), o = 0, i, j;
    for (i = 0; i < 8; i++) rk[o++] = sk[i] ^ sk[16 + i];
    for (i = 0; i < 13; i++) {
      var base = i * 16 + (4 * 40);
      if (((i / 2) | 0) % 2) {
        for (j = 0; j < 16; j++) rk[o + j] = lk[16 + j] ^ con[base + j];
        if (i % 2) for (j = 0; j < 16; j++) rk[o + j] ^= sk[j];
        doubleSwap(lk, 16);
      } else {
        for (j = 0; j < 16; j++) rk[o + j] = lk[j] ^ con[base + j];
        if (i % 2) for (j = 0; j < 16; j++) rk[o + j] ^= sk[16 + j];
        doubleSwap(lk, 0);
      }
      o += 16;
    }
    for (i = 0; i < 8; i++) rk[o++] = sk[8 + i] ^ sk[24 + i];
    return rk;
  }

  /* 白化只作用于块内第 2、第 4 个 32 位字（字节 4..7 / 12..15） */
  function clefiaEncBlock(pt, rk, r) {
    var rin = new Uint8Array(16), i;
    for (i = 0; i < 16; i++) rin[i] = pt[i];
    for (i = 0; i < 4; i++) { rin[4 + i] ^= rk[i]; rin[12 + i] ^= rk[4 + i]; }
    var rout = gfn4(rin, 0, rk, 8, r);
    var w = 8 + r * 8;
    for (i = 0; i < 4; i++) { rout[4 + i] ^= rk[w + i]; rout[12 + i] ^= rk[w + 4 + i]; }
    return rout;
  }
  function clefiaDecBlock(ct, rk, r) {
    var rin = new Uint8Array(16), i;
    for (i = 0; i < 16; i++) rin[i] = ct[i];
    /* 解密先剥 WK2/WK3。注意：Encrypt 里是 rk 先 +=8 再取 rk[r*8]（绝对 8+r*8），
       Decrypt 里是在 rk +=8 【之前】取 rk[r*8+8]（绝对同样是 8+r*8）——两者绝对
       偏移相同但写法不同。我第一版照搬 Encrypt 的"已 +8"口径写成 r*8+16，
       结果加密全对、解密全错，且不报错。 */
    var w = 8 + r * 8;
    for (i = 0; i < 4; i++) { rin[4 + i] ^= rk[w + i]; rin[12 + i] ^= rk[w + 4 + i]; }
    var rout = gfn4inv(rin, 0, rk, 8, r);
    for (i = 0; i < 4; i++) { rout[4 + i] ^= rk[i]; rout[12 + i] ^= rk[4 + i]; }
    return rout;
  }

  function clefiaMake(keyLenBytes, rounds) {
    return function (keyBytes) {
      if (!keyBytes || keyBytes.length !== keyLenBytes) {
        throw new Error('CLEFIA-' + (keyLenBytes * 8) + ' 密钥必须恰好是 ' + keyLenBytes +
          ' 字节，实得 ' + (keyBytes ? keyBytes.length : 0) + ' 字节（不自动补齐也不截断）。');
      }
      var rk = (keyLenBytes === 16) ? keySet128(keyBytes)
             : (keyLenBytes === 24) ? keySet192(keyBytes)
             : keySet256(keyBytes);
      return {
        enc: function (b) { return clefiaEncBlock(b, rk, rounds); },
        dec: function (b) { return clefiaDecBlock(b, rk, rounds); }
      };
    };
  }

  if (typeof globalThis !== 'undefined') {
    globalThis.__clefiaTest = {
      encBlock: clefiaEncBlock, decBlock: clefiaDecBlock,
      keyset: function (kb) {
        return kb.length === 16 ? keySet128(kb) : kb.length === 24 ? keySet192(kb) : keySet256(kb);
      },
      rounds: function (kb) { return kb.length === 16 ? 18 : kb.length === 24 ? 22 : 26; },
      S0: S0, S1: S1, conSet: conSet, make: clefiaMake
    };
    globalThis.CRYPTO_CLEFIA = globalThis.__clefiaTest;
  }

  if (typeof regSym === 'function') {
    regSym({
      id: 'clefia128', name: 'CLEFIA-128（索尼轻量分组，ISO 29192-2）', group: '对称加密',
      keyLabel: '密钥（16 字节 Hex，128 位）',
      blockSize: 16, keyLen: 16, makeBlockFn: clefiaMake(16, 18),
      info: 'CLEFIA 是索尼 2007 年发布的 128 位块轻量分组密码，入选 ISO/IEC 29192-2 与日本 CRYPTREC。' +
        '18 轮，4 分支 Type-2 广义 Feistel，双 S 盒 + DSM（两个不同扩散矩阵），首尾各有白化密钥。' +
        '实现逐行转写自索尼官方参考代码 clefia_ref.c v1.0.1，S0/S1 由脚本从官方源码直接提取（256 项双射）。' +
        '官方向量：RFC 6114 / 规范 v1.0 附录 A 三组（128/192/256 位密钥）全过。' +
        '注意：块 128 位，密钥必须恰好 16 字节。'
    });
    regSym({
      id: 'clefia192', name: 'CLEFIA-192（索尼轻量分组）', group: '对称加密',
      keyLabel: '密钥（24 字节 Hex，192 位）',
      blockSize: 16, keyLen: 24, makeBlockFn: clefiaMake(24, 22),
      info: 'CLEFIA 的 192 位密钥版本，22 轮。密钥调度与 128 位【结构不同】：' +
        '先把 24 字节补成 32 字节（后 8 字节 = 前 8 字节取反），再用 8 分支 GFN_{8,10} 生成 L，' +
        '轮密钥在 LL / LR 两半之间交替取（不是 128 位那样单一 L）。' +
        '官方向量：RFC 6114 / 规范 v1.0 附录 A 全过。'
    });
    regSym({
      id: 'clefia256', name: 'CLEFIA-256（索尼轻量分组）', group: '对称加密',
      keyLabel: '密钥（32 字节 Hex，256 位）',
      blockSize: 16, keyLen: 32, makeBlockFn: clefiaMake(32, 26),
      info: 'CLEFIA 的 256 位密钥版本，26 轮，密钥调度同 192 位结构（GFN_{8,10} + LL/LR 交替）。' +
        '官方向量：RFC 6114 / 规范 v1.0 附录 A 全过。'
    });
  }
})();
