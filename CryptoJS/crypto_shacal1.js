/* ============================================================
 * SHACAL-1 —— 基于 SHA-1 压缩函数的分组密码（NESSIE 候选）
 *
 * 分组 160 位（20 字节），密钥 0~512 位（64 字节），不足 512 位时尾部补零。
 * 建议最短 128 位。
 *
 * 加密定义（已用官方向量 confirm）：
 *   明文 = SHA-1 的链接变量 (A..E)，密钥 = SHA-1 的消息块。
 *   跑 80 轮压缩函数，输出「最终 working variables」，
 *   **不加**输入链接变量 —— 这与 SHA-1 不同（SHA-1 最后要做 feed-forward 加法），
 *   也正是 SHACAL-1 可逆的关键。
 *
 * 密钥扩展（512 位 -> 2560 位）：
 *   W[i] = ROTL1( W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16] )，16 <= i <= 79
 *   ⚠ 与 SHA-1 原始消息扩展的索引完全一致（SHA-1 用的是 i-3/i-8/i-14/i-16）。
 *
 * 轮函数（i = 0..79）：
 *   T = ROTL5(A) + f_i(B,C,D) + E + W[i] + K_i
 *   E = D;  D = C;  C = ROTL30(B);  B = A;  A = T
 *   f_i = (B&C)|(~B&D)        0<=i<=19
 *       = B^C^D              20<=i<=39 或 60<=i<=79
 *       = (B&C)|(B&D)|(C&D)  40<=i<=59
 *
 * 向量来源：Crypto3 (hawkynt/Cipher) 的 SHACAL-1 官方测试向量，
 *   三条均由「已公布的 SHA-1 摘要减去 IV」独立导出，可交叉验算。
 * ============================================================ */
(function (global) {
  'use strict';

  function kconst(i) {
    if (i < 20) return 0x5A827999;
    if (i < 40) return 0x6ED9EBA1;
    if (i < 60) return 0x8F1BBCDC;
    return 0xCA62C1D6;
  }
  function rotl(x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0; }
  function rotr(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }

  /* 密钥 -> W[0..79]，与 SHA-1 消息扩展一致；不足 64 字节补零 */
  function expandKey(key) {
    var W = new Int32Array(80), i;
    for (i = 0; i < 16; i++) {
      var o = 4 * i;
      W[i] = (((key[o] || 0) << 24) | ((key[o + 1] || 0) << 16) |
              ((key[o + 2] || 0) << 8) | (key[o + 3] || 0)) | 0;
    }
    for (i = 16; i < 80; i++) {
      W[i] = rotl((W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16]) | 0, 1) >>> 0;
    }
    return W;
  }

  function loadWords(b) {
    var w = new Int32Array(5), i;
    for (i = 0; i < 5; i++) w[i] = ((b[4 * i] << 24) | (b[4 * i + 1] << 16) |
                                    (b[4 * i + 2] << 8) | b[4 * i + 3]) | 0;
    return w;
  }
  function storeWords(w) {
    var b = new Uint8Array(20), i;
    for (i = 0; i < 5; i++) {
      b[4 * i] = (w[i] >>> 24) & 255; b[4 * i + 1] = (w[i] >>> 16) & 255;
      b[4 * i + 2] = (w[i] >>> 8) & 255; b[4 * i + 3] = w[i] & 255;
    }
    return b;
  }

  function f(i, b, c, d) {
    if (i < 20) return ((b & c) | ((~b) & d)) | 0;
    if (i < 40 || i >= 60) return (b ^ c ^ d) | 0;
    return ((b & c) | (b & d) | (c & d)) | 0;
  }

  /* 正向压缩：输出最终 working vars（不加初始链接变量） */
  function compressFwd(h, W) {
    var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], i;
    for (i = 0; i < 80; i++) {
      var t = (rotl(a, 5) + f(i, b, c, d) + e + W[i] + kconst(i)) | 0;
      /* ⚠ 是 ROTL30(B)，不是 ROTR30(B)。写成 rotr(b,30) 等价于 rotl(b,2)，
         结果长度自洽、往返也自洽，但三条官方向量全错——只能靠官方值发现。 */
      e = d; d = c; c = rotl(b, 30) >>> 0; b = a; a = t;
    }
    return [a, b, c, d, e];
  }

  /* 逆向压缩：由输出还原输入。
     第 i 轮输出态 (A',B',C',D',E') 与输入态 (A,B,C,D,E) 的关系：
       A = B',  B = ROTR30(C'),  C = D',  D = E'
       E = A' - ROTL5(A) - f_i(B,C,D) - W[i] - K_i
     注意 ROTR30(C') 是逆 C'=ROTL30(B) 得来的。 */
  function compressBwd(out, W) {
    var a = out[0], b = out[1], c = out[2], d = out[3], e = out[4], i;
    for (i = 79; i >= 0; i--) {
      var oa = a, ob = b, oc = c, od = d;
      var ia = ob, ib = rotr(oc, 30) >>> 0, ic = od, id = e;
      var ie = (oa - rotl(ia, 5) - f(i, ib, ic, id) - W[i] - kconst(i)) | 0;
      a = ia; b = ib; c = ic; d = id; e = ie;
    }
    return [a, b, c, d, e];
  }

  /* 长度护栏：不校验时，19 字节明文会让 b[19] 读到 undefined，
     算出 NaN 却不报错——与第 115 批 Kalyna「密钥长度不对静默算错」同一类病。 */
  function chk(b, n, what) {
    if (!b || b.length !== n) throw new Error('SHACAL-1 ' + what + '必须为 ' + n + ' 字节，收到 ' + (b ? b.length : 'null'));
  }
  function chkKey(key) {
    if (!key || key.length > 64) throw new Error('SHACAL-1 密钥最长 64 字节（512 位），收到 ' + (key ? key.length : 'null'));
  }

  function shacal1Enc(pt, key) { chk(pt, 20, '明文'); chkKey(key); return storeWords(compressFwd(loadWords(pt), expandKey(key))); }
  function shacal1Dec(ct, key) { chk(ct, 20, '密文'); chkKey(key); return storeWords(compressBwd(loadWords(ct), expandKey(key))); }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { shacal1Enc: shacal1Enc, shacal1Dec: shacal1Dec, expandKey: expandKey };
  }
  global.SHACAL1 = { shacal1Enc: shacal1Enc, shacal1Dec: shacal1Dec, expandKey: expandKey };
})(typeof window !== 'undefined' ? window : globalThis);
