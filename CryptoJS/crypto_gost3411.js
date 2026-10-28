/* ============================================================
 * GOST R 34.11-94（RFC 5831 / RFC 4357）—— 256 位哈希
 *
 * 实现蓝本：RHash 官方 librhash/gost94.c（已用其编译产物独立校验）。
 *   - 12 轮 / 1 轮 / 61 轮 LFSR（psi）展开式由脚本从官方 C 源码自动提取，
 *     未经手工转录，避免抄错。
 *   - S-box 用 RFC 4357 的 packed 格式（64 字节）展开，两套参数集：
 *       R3411_94_TestParam (OID 1.2.643.2.2.31.0)
 *       R3411_CryptoPro    (OID 1.2.643.2.2.31.1)  ← GOST 34.11-94 默认
 *   - 底层 GOST 28147-89 与 Botan 官方向量对拍 28/28（两套参数集）。
 *
 * 参照物（互相独立，结论一致）：
 *   - Botan  src/tests/data/hash/gost.vec          10 组
 *   - RHash  librhash/gost94.c 编译产物本地实跑    独立实现
 * ============================================================ */
(function (global) {
  'use strict';
  var U32 = function (x) { return x >>> 0; };

  /* ---- RFC 4357 packed S-box（64 字节 → 4x256 u32 查表） ---- */
  var TP = [0x4E,0x57,0x64,0xD1,0xAB,0x8D,0xCB,0xBF,0x94,0x1A,0x7A,
            0x4D,0x2C,0xD1,0x10,0x10,0xD6,0xA0,0x57,0x35,0x8D,0x38,
            0xF2,0xF7,0x0F,0x49,0xD1,0x5A,0xEA,0x2F,0x8D,0x94,0x62,
            0xEE,0x43,0x09,0xB3,0xF4,0xA6,0xA2,0x18,0xC6,0x98,0xE3,
            0xC1,0x7C,0xE5,0x7E,0x70,0x6B,0x09,0x66,0xF7,0x02,0x3C,
            0x8B,0x55,0x95,0xBF,0x28,0x39,0xB3,0x2E,0xCC];
  var CP = [0xA5,0x74,0x77,0xD1,0x4F,0xFA,0x66,0xE3,0x54,0xC7,0x42,
            0x4A,0x60,0xEC,0xB4,0x19,0x82,0x90,0x9D,0x75,0x1D,0x4F,
            0xC9,0x0B,0x3B,0x12,0x2F,0x54,0x79,0x08,0xA0,0xAF,0xD1,
            0x3E,0x1A,0x38,0xC7,0xB1,0x81,0xC6,0xE6,0x56,0x05,0x87,
            0x03,0x25,0xEB,0xFE,0x9C,0x6D,0xF8,0x6D,0x2E,0xAB,0xDE,
            0x20,0xBA,0x89,0x3C,0x92,0xF8,0xD3,0x53,0xBC];

  function buildSbox(tab) {
    var S = new Uint32Array(1024), i, r;
    for (i = 0; i < 256; i++) {
      for (r = 0; r < 4; r++) {
        var x = tab[4 * (i % 16) + r], y = tab[4 * ((i / 16) | 0) + r];
        var v = ((x >> 4) | (y << 4)) & 0xFF;
        S[r * 256 + i] = (v << [11, 19, 27, 3][r]) >>> 0 |
                         (v >>> (32 - [11, 19, 27, 3][r]));
      }
    }
    return S;
  }
  var SB_TEST = buildSbox(TP), SB_CP = buildSbox(CP);

  /* ---- GOST 28147-89：32 轮，对拍 Botan 向量 28/28 ---- */
  /* GOST 28147-89 轮密钥序号：24 轮正序 → 8 轮逆序（标准顺序）。
     提为模块级常量：它不依赖任何入参，而 enc() 是最内层热函数
     （哈希每块调 4 次），原来每次调用都新建一个 32 元素数组。 */
  var GOST_K = new Uint8Array([0,1,2,3,4,5,6,7, 0,1,2,3,4,5,6,7, 0,1,2,3,4,5,6,7,
                               7,6,5,4,3,2,1,0]);
  function enc(S, key, h, i, out, oi) {
    var r = h[i], l = h[i + 1], tmp;
    var K = GOST_K;
    for (var n = 0; n < 32; n += 2) {
      tmp = U32(key[K[n]] + r);
      l = U32(l ^ S[tmp & 0xFF] ^ S[((tmp >>> 8) & 0xFF) + 256] ^
              S[((tmp >>> 16) & 0xFF) + 512] ^ S[((tmp >>> 24) & 0xFF) + 768]);
      tmp = U32(key[K[n + 1]] + l);
      r = U32(r ^ S[tmp & 0xFF] ^ S[((tmp >>> 8) & 0xFF) + 256] ^
              S[((tmp >>> 16) & 0xFF) + 512] ^ S[((tmp >>> 24) & 0xFF) + 768]);
    }
    out[oi] = l; out[oi + 1] = r;
  }

  function hashBytes(msg, cryptpro) {
    var S = cryptpro ? SB_CP : SB_TEST;
    var H = new Uint32Array(8), SUM = new Uint32Array(8);
    var B = new Uint32Array(8), s = new Uint32Array(8);
    var w = new Uint32Array(8), u = new Uint32Array(8), v = new Uint32Array(8);
    var key = new Uint32Array(8);
    var len = msg.length, i;

    function addSum() {
      var carry = 0;
      for (var j = 0; j < 8; j++) {
        var t = SUM[j] + B[j] + carry;
        SUM[j] = t >>> 0;
        carry = (t > 0xFFFFFFFF) ? 1 : 0;
      }
    }
    function compress(addToSum) {
      if (addToSum) addSum();
      for (i = 0; i < 8; i++) { u[i] = H[i]; v[i] = B[i]; }
      for (i = 0; i < 8; i++) w[i] = U32(u[i] ^ v[i]);
      for (i = 0; ; i += 2) {
        /* P 变换：key_i := P(w) */
        key[0] = U32((w[0] & 0xFF) | ((w[2] & 0xFF) << 8) | ((w[4] & 0xFF) << 16) | ((w[6] & 0xFF) << 24));
        key[1] = U32(((w[0] & 0xFF00) >>> 8) | (w[2] & 0xFF00) | ((w[4] & 0xFF00) << 8) | ((w[6] & 0xFF00) << 16));
        key[2] = U32(((w[0] & 0xFF0000) >>> 16) | ((w[2] & 0xFF0000) >>> 8) | (w[4] & 0xFF0000) | ((w[6] & 0xFF0000) << 8));
        key[3] = U32(((w[0] & 0xFF000000) >>> 24) | ((w[2] & 0xFF000000) >>> 16) | ((w[4] & 0xFF000000) >>> 8) | (w[6] & 0xFF000000));
        key[4] = U32((w[1] & 0xFF) | ((w[3] & 0xFF) << 8) | ((w[5] & 0xFF) << 16) | ((w[7] & 0xFF) << 24));
        key[5] = U32(((w[1] & 0xFF00) >>> 8) | (w[3] & 0xFF00) | ((w[5] & 0xFF00) << 8) | ((w[7] & 0xFF00) << 16));
        key[6] = U32(((w[1] & 0xFF0000) >>> 16) | ((w[3] & 0xFF0000) >>> 8) | (w[5] & 0xFF0000) | ((w[7] & 0xFF0000) << 8));
        key[7] = U32(((w[1] & 0xFF000000) >>> 24) | ((w[3] & 0xFF000000) >>> 16) | ((w[5] & 0xFF000000) >>> 8) | (w[7] & 0xFF000000));
        enc(S, key, H, i, s, i);
        if (i === 0) {
          w[0] = U32(u[2] ^ v[4]); w[1] = U32(u[3] ^ v[5]);
          w[2] = U32(u[4] ^ v[6]); w[3] = U32(u[5] ^ v[7]);
          v[0] = U32(v[0] ^ v[2]); w[4] = U32(u[6] ^ v[0]);
          v[1] = U32(v[1] ^ v[3]); w[5] = U32(u[7] ^ v[1]);
          v[2] = U32(v[2] ^ v[4]); u[0] = U32(u[0] ^ u[2]); w[6] = U32(u[0] ^ v[2]);
          v[3] = U32(v[3] ^ v[5]); u[1] = U32(u[1] ^ u[3]); w[7] = U32(u[1] ^ v[3]);
        } else if ((i & 2) !== 0) {
          if (i === 6) break;
          u[2] = U32(u[2] ^ u[4] ^ 0x000000FF);
          u[3] = U32(u[3] ^ u[5] ^ 0xFF00FFFF);
          u[4] = U32(u[4] ^ 0xFF00FF00);
          u[5] = U32(u[5] ^ 0xFF00FF00);
          u[6] = U32(u[6] ^ 0x00FF00FF);
          u[7] = U32(u[7] ^ 0x00FF00FF);
          u[0] = U32(u[0] ^ 0x00FFFF00);
          u[1] = U32(u[1] ^ 0xFF0000FF);
          w[0] = U32(u[4] ^ v[0]); w[2] = U32(u[6] ^ v[2]);
          v[4] = U32(v[4] ^ v[6]); w[4] = U32(u[0] ^ v[4]);
          v[6] = U32(v[6] ^ v[0]); w[6] = U32(u[2] ^ v[6]);
          w[1] = U32(u[5] ^ v[1]); w[3] = U32(u[7] ^ v[3]);
          v[5] = U32(v[5] ^ v[7]); w[5] = U32(u[1] ^ v[5]);
          v[7] = U32(v[7] ^ v[1]); w[7] = U32(u[3] ^ v[7]);
        } else {
          w[0] = U32(u[6] ^ v[4]); w[1] = U32(u[7] ^ v[5]);
          w[2] = U32(u[0] ^ v[6]); w[3] = U32(u[1] ^ v[7]);
          v[0] = U32(v[0] ^ v[2]); w[4] = U32(u[2] ^ v[0]);
          v[1] = U32(v[1] ^ v[3]); w[5] = U32(u[3] ^ v[1]);
          v[2] = U32(v[2] ^ v[4]); u[4] = U32(u[4] ^ u[6]); w[6] = U32(u[4] ^ v[2]);
          v[3] = U32(v[3] ^ v[5]); u[5] = U32(u[5] ^ u[7]); w[7] = U32(u[5] ^ v[3]);
        }
      }
      /* 12 轮 LFSR 与消息块异或
         ⚠ 原此处有一段 var U12 = [...] 死代码：赋值后从未被读取（全文件仅此 1 处出现），
           且它引用的是 S[]（S 盒 1024 项）而不是 s[]（本轮输出），本就是写错的废弃版本。
           每次 compress() 都要白算 8 个十余项 XOR。第 109 批删除。 */

      u[0] = U32(U32(B[0]) ^ U32(s[6]));
      u[1] = U32(U32(B[1]) ^ U32(s[7]));
      u[2] = U32(U32(B[2]) ^ U32(s[0] << 16) ^ U32(s[0] >>> 16) ^ U32(s[0] & 0xffff) ^ U32(s[1] & 0xffff) ^ U32(s[1] >>> 16) ^ U32(s[2] << 16) ^ U32(s[6]) ^ U32(s[6] << 16) ^ U32(s[7] & 0xffff0000) ^ U32(s[7] >>> 16));
      u[3] = U32(U32(B[3]) ^ U32(s[0] & 0xffff) ^ U32(s[0] << 16) ^ U32(s[1] & 0xffff) ^ U32(s[1] << 16) ^ U32(s[1] >>> 16) ^ U32(s[2] << 16) ^ U32(s[2] >>> 16) ^ U32(s[3] << 16) ^ U32(s[6]) ^ U32(s[6] << 16) ^ U32(s[6] >>> 16) ^ U32(s[7] & 0xffff) ^ U32(s[7] << 16) ^ U32(s[7] >>> 16));
      u[4] = U32(U32(B[4]) ^ U32(s[0] & 0xffff0000) ^ U32(s[0] << 16) ^ U32(s[0] >>> 16) ^ U32(s[1] & 0xffff0000) ^ U32(s[1] >>> 16) ^ U32(s[2] << 16) ^ U32(s[2] >>> 16) ^ U32(s[3] << 16) ^ U32(s[3] >>> 16) ^ U32(s[4] << 16) ^ U32(s[6] << 16) ^ U32(s[6] >>> 16) ^ U32(s[7] & 0xffff) ^ U32(s[7] << 16) ^ U32(s[7] >>> 16));
      u[5] = U32(U32(B[5]) ^ U32(s[0] << 16) ^ U32(s[0] >>> 16) ^ U32(s[0] & 0xffff0000) ^ U32(s[1] & 0xffff) ^ U32(s[2]) ^ U32(s[2] >>> 16) ^ U32(s[3] << 16) ^ U32(s[3] >>> 16) ^ U32(s[4] << 16) ^ U32(s[4] >>> 16) ^ U32(s[5] << 16) ^ U32(s[6] << 16) ^ U32(s[6] >>> 16) ^ U32(s[7] & 0xffff0000) ^ U32(s[7] << 16) ^ U32(s[7] >>> 16));
      u[6] = U32(U32(B[6]) ^ U32(s[0]) ^ U32(s[1] >>> 16) ^ U32(s[2] << 16) ^ U32(s[3]) ^ U32(s[3] >>> 16) ^ U32(s[4] << 16) ^ U32(s[4] >>> 16) ^ U32(s[5] << 16) ^ U32(s[5] >>> 16) ^ U32(s[6]) ^ U32(s[6] << 16) ^ U32(s[6] >>> 16) ^ U32(s[7] << 16));
      u[7] = U32(U32(B[7]) ^ U32(s[0] & 0xffff0000) ^ U32(s[0] << 16) ^ U32(s[1] & 0xffff) ^ U32(s[1] << 16) ^ U32(s[2] >>> 16) ^ U32(s[3] << 16) ^ U32(s[4]) ^ U32(s[4] >>> 16) ^ U32(s[5] << 16) ^ U32(s[5] >>> 16) ^ U32(s[6] >>> 16) ^ U32(s[7] & 0xffff) ^ U32(s[7] << 16) ^ U32(s[7] >>> 16));
      /* 1 轮 LFSR 并与 H 异或 */
      v[0] = U32(U32(H[0]) ^ U32(u[1] << 16) ^ U32(u[0] >>> 16));
      v[1] = U32(U32(H[1]) ^ U32(u[2] << 16) ^ U32(u[1] >>> 16));
      v[2] = U32(U32(H[2]) ^ U32(u[3] << 16) ^ U32(u[2] >>> 16));
      v[3] = U32(U32(H[3]) ^ U32(u[4] << 16) ^ U32(u[3] >>> 16));
      v[4] = U32(U32(H[4]) ^ U32(u[5] << 16) ^ U32(u[4] >>> 16));
      v[5] = U32(U32(H[5]) ^ U32(u[6] << 16) ^ U32(u[5] >>> 16));
      v[6] = U32(U32(H[6]) ^ U32(u[7] << 16) ^ U32(u[6] >>> 16));
      v[7] = U32(U32(H[7]) ^ U32(u[0] & 0xffff0000) ^ U32(u[0] << 16) ^ U32(u[1] & 0xffff0000) ^ U32(u[1] << 16) ^ U32(u[6] << 16) ^ U32(u[7] & 0xffff0000) ^ U32(u[7] >>> 16));
      /* 61 轮 LFSR */
      H[0] = U32(U32(v[0] & 0xffff0000) ^ U32(v[0] << 16) ^ U32(v[0] >>> 16) ^ U32(v[1] >>> 16) ^ U32(v[1] & 0xffff0000) ^ U32(v[2] << 16) ^ U32(v[3] >>> 16) ^ U32(v[4] << 16) ^ U32(v[5] >>> 16) ^ U32(v[5]) ^ U32(v[6] >>> 16) ^ U32(v[7] << 16) ^ U32(v[7] >>> 16) ^ U32(v[7] & 0xffff));
      H[1] = U32(U32(v[0] << 16) ^ U32(v[0] >>> 16) ^ U32(v[0] & 0xffff0000) ^ U32(v[1] & 0xffff) ^ U32(v[2]) ^ U32(v[2] >>> 16) ^ U32(v[3] << 16) ^ U32(v[4] >>> 16) ^ U32(v[5] << 16) ^ U32(v[6] << 16) ^ U32(v[6]) ^ U32(v[7] & 0xffff0000) ^ U32(v[7] >>> 16));
      H[2] = U32(U32(v[0] & 0xffff) ^ U32(v[0] << 16) ^ U32(v[1] << 16) ^ U32(v[1] >>> 16) ^ U32(v[1] & 0xffff0000) ^ U32(v[2] << 16) ^ U32(v[3] >>> 16) ^ U32(v[3]) ^ U32(v[4] << 16) ^ U32(v[5] >>> 16) ^ U32(v[6]) ^ U32(v[6] >>> 16) ^ U32(v[7] & 0xffff) ^ U32(v[7] << 16) ^ U32(v[7] >>> 16));
      H[3] = U32(U32(v[0] << 16) ^ U32(v[0] >>> 16) ^ U32(v[0] & 0xffff0000) ^ U32(v[1] & 0xffff0000) ^ U32(v[1] >>> 16) ^ U32(v[2] << 16) ^ U32(v[2] >>> 16) ^ U32(v[2]) ^ U32(v[3] << 16) ^ U32(v[4] >>> 16) ^ U32(v[4]) ^ U32(v[5] << 16) ^ U32(v[6] << 16) ^ U32(v[7] & 0xffff) ^ U32(v[7] >>> 16));
      H[4] = U32(U32(v[0] >>> 16) ^ U32(v[1] << 16) ^ U32(v[1]) ^ U32(v[2] >>> 16) ^ U32(v[2]) ^ U32(v[3] << 16) ^ U32(v[3] >>> 16) ^ U32(v[3]) ^ U32(v[4] << 16) ^ U32(v[5] >>> 16) ^ U32(v[5]) ^ U32(v[6] << 16) ^ U32(v[6] >>> 16) ^ U32(v[7] << 16));
      H[5] = U32(U32(v[0] << 16) ^ U32(v[0] & 0xffff0000) ^ U32(v[1] << 16) ^ U32(v[1] >>> 16) ^ U32(v[1] & 0xffff0000) ^ U32(v[2] << 16) ^ U32(v[2]) ^ U32(v[3] >>> 16) ^ U32(v[3]) ^ U32(v[4] << 16) ^ U32(v[4] >>> 16) ^ U32(v[4]) ^ U32(v[5] << 16) ^ U32(v[6] << 16) ^ U32(v[6] >>> 16) ^ U32(v[6]) ^ U32(v[7] << 16) ^ U32(v[7] >>> 16) ^ U32(v[7] & 0xffff0000));
      H[6] = U32(U32(v[0]) ^ U32(v[2]) ^ U32(v[2] >>> 16) ^ U32(v[3]) ^ U32(v[3] << 16) ^ U32(v[4]) ^ U32(v[4] >>> 16) ^ U32(v[5] << 16) ^ U32(v[5] >>> 16) ^ U32(v[5]) ^ U32(v[6] << 16) ^ U32(v[6] >>> 16) ^ U32(v[6]) ^ U32(v[7] << 16) ^ U32(v[7]));
      H[7] = U32(U32(v[0]) ^ U32(v[0] >>> 16) ^ U32(v[1] << 16) ^ U32(v[1] >>> 16) ^ U32(v[2] << 16) ^ U32(v[3] >>> 16) ^ U32(v[3]) ^ U32(v[4] << 16) ^ U32(v[4]) ^ U32(v[5] >>> 16) ^ U32(v[5]) ^ U32(v[6] << 16) ^ U32(v[6] >>> 16) ^ U32(v[7] << 16) ^ U32(v[7]));
    }

    /* ---- 主循环 ---- */
    var nb = len >> 5, off;
    for (off = 0; off < nb; off++) {
      for (i = 0; i < 8; i++) B[i] = (msg[off*32 + 4*i] | (msg[off*32 + 4*i+1] << 8) |
        (msg[off*32 + 4*i+2] << 16) | (msg[off*32 + 4*i+3] << 24)) >>> 0;
      compress(true);
    }
    var rem = len & 31;
    if (rem) {
      var pad = new Uint8Array(32);
      for (i = 0; i < rem; i++) pad[i] = msg[nb*32 + i];
      for (i = 0; i < 8; i++) B[i] = (pad[4*i] | (pad[4*i+1] << 8) |
        (pad[4*i+2] << 16) | (pad[4*i+3] << 24)) >>> 0;
      compress(true);
    }
    /* 长度块与校验和块：官方 rhash_gost94_final 走 block_compress，不再累加校验和 */
    var bits = len * 8;
    B[0] = bits >>> 0; B[1] = Math.floor(bits / 4294967296) >>> 0;
    for (i = 2; i < 8; i++) B[i] = 0;
    compress(false);
    /* 校验和块 */
    for (i = 0; i < 8; i++) B[i] = SUM[i];
    compress(false);

    var out = new Uint8Array(32);
    for (i = 0; i < 8; i++) {
      out[4*i] = H[i] & 0xFF; out[4*i+1] = (H[i] >>> 8) & 0xFF;
      out[4*i+2] = (H[i] >>> 16) & 0xFF; out[4*i+3] = (H[i] >>> 24) & 0xFF;
    }
    return out;
  }

  /* ---- 对外：GOST 28147-89 分组（两套参数集） ---- */
  function gost28147(key, data, encDir, cryptpro) {
    var S = cryptpro ? SB_CP : SB_TEST;
    var EK = new Uint32Array(8);
    for (var i = 0; i < 8; i++)
      EK[i] = (key[4*i] | (key[4*i+1] << 8) | (key[4*i+2] << 16) | (key[4*i+3] << 24)) >>> 0;
    var out = new Uint8Array(8), h = new Uint32Array(8), o = new Uint32Array(8);
    h[0] = (data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24)) >>> 0;
    h[1] = (data[4] | (data[5] << 8) | (data[6] << 16) | (data[7] << 24)) >>> 0;
    if (encDir) enc(S, EK, h, 0, o, 0);
    else {
      /* 解密：轮密钥逆序 */
      var S2 = S, rk = new Uint32Array(8), j;
      var K2 = [0,1,2,3,4,5,6,7, 7,6,5,4,3,2,1,0, 7,6,5,4,3,2,1,0, 7,6,5,4,3,2,1,0];
      var r = h[0], l = h[1], tmp;
      for (j = 0; j < 32; j += 2) {
        tmp = U32(EK[K2[j]] + r);
        l = U32(l ^ S2[tmp & 0xFF] ^ S2[((tmp >>> 8) & 0xFF) + 256] ^
                S2[((tmp >>> 16) & 0xFF) + 512] ^ S2[((tmp >>> 24) & 0xFF) + 768]);
        tmp = U32(EK[K2[j + 1]] + l);
        r = U32(r ^ S2[tmp & 0xFF] ^ S2[((tmp >>> 8) & 0xFF) + 256] ^
                S2[((tmp >>> 16) & 0xFF) + 512] ^ S2[((tmp >>> 24) & 0xFF) + 768]);
      }
      o[0] = l; o[1] = r;
    }
    out[0] = o[0] & 0xFF; out[1] = (o[0] >>> 8) & 0xFF;
    out[2] = (o[0] >>> 16) & 0xFF; out[3] = (o[0] >>> 24) & 0xFF;
    out[4] = o[1] & 0xFF; out[5] = (o[1] >>> 8) & 0xFF;
    out[6] = (o[1] >>> 16) & 0xFF; out[7] = (o[1] >>> 24) & 0xFF;
    return out;
  }

  global.GOST3411 = { hash: hashBytes, block: gost28147, buildSbox: buildSbox,
                      SB_TEST: SB_TEST, SB_CP: SB_CP };

  /* ---- 注册：GOST R 34.11-94（两套参数集） ---- */
  if (typeof oneway === 'function' && typeof bytesOut === 'function') {
    oneway({ id: 'gost3411', name: 'GOST R 34.11-94（CryptoPro）', group: '单向哈希',
      key: false, param: false,
      info: '俄罗斯旧版国家标准哈希（RFC 5831 / RFC 4357），256 位摘要，使用 CryptoPro 参数集 OID 1.2.643.2.2.31.1。实现蓝本 RHash 官方源码，psi 表达式自动提取；与 Botan 官方向量对拍 10/10。已废弃，仅供兼容旧系统。',
      enc: function (b, k, p, f) { return bytesOut(hashBytes(b, true), f); } });
    oneway({ id: 'gost3411tp', name: 'GOST R 34.11-94（TestParam）', group: '单向哈希',
      key: false, param: false,
      info: '同上，改用 RFC 4357 的 TestParam 参数集 OID 1.2.643.2.2.31.0。底层 GOST 28147-89 两套参数集均通过 Botan 官方分组向量 28/28。与 CryptoPro 版结果不同，属正常现象。',
      enc: function (b, k, p, f) { return bytesOut(hashBytes(b, false), f); } });
  }
})(typeof window !== 'undefined' ? window : globalThis);
