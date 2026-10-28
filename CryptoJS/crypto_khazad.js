/* ============================================================================
 * KHAZAD —— NESSIE 候选分组密码（Paulo Barreto & Vincent Rijmen，2000）
 *   64 位块 / 128 位密钥 / 8 轮 SPN，结构上是"缩小的 AES"：
 *   每轮 = 字节替换 S → MDS 扩散 → 轮密钥异或；最后一轮只有 S 盒，无扩散。
 *
 * 参照物（本实现的唯一权威来源）：
 *   github.com/red-coracle/khazad-c 的 khazad-tweak.c —— 设计者发布的原版 C 实现。
 *   S 盒与 MDS 由脚本从该文件的 T0..T7 表【反推提取】，不是手抄。
 *   验证：以 S 盒 + MDS + 多项式重建的全部 2048 个 T 表项与官方 C 源码逐位相同。
 *
 * ⚠⚠ 三处极易写错、且错了不报错只会静默算错的地方（本实现全部踩过）：
 *   1) GF(2^8) 的不可约多项式是 0x1D（x^8+x^4+x^3+x^2+1），【不是 AES 的 0x11B】。
 *      用 0x11B 时 T 表 2048 项里绝大部分对不上 —— 我第一版就是这么错的。
 *      判断依据：gmul(0x03, 0xBA) 官方 T 表给的是 0xD3，只有 poly=0x1D 算出 0xD3。
 *   2) 这是 v2.0 的【tweaked S 盒】版本（khazad-tweak.c 的注释明确写了
 *      "Original S-box replaced by the tweaked, hardware-efficient version"），
 *      与 NESSIE 提交的 v1.0 原版 S 盒【不同】。混用会全错且不报错。
 *      所以本条目不与 Khazad v1.0 的公开向量比对，只与官方 C 二进制做差分。
 *   3) 解密轮密钥是 rkD[r] = theta(rkE[R-r])，theta = 先对每字节走一遍 S 盒再走 T；
 *      两端 rkD[0]=rkE[8]、rkD[8]=rkE[0] 直接交换，【不走 theta】。
 *      只测加密会完全漏掉解密索引错位（第 112 批 HIGHT 就是栽在这）。
 * ========================================================================== */
(function () {
  'use strict';
  var root = (typeof globalThis !== 'undefined') ? globalThis : this;

  /* ---- S 盒：从官方 T7 表的低字节提取（已断言双射） ---- */
  var SBOX = [
    0xba, 0x54, 0x2f, 0x74, 0x53, 0xd3, 0xd2, 0x4d, 0x50, 0xac, 0x8d, 0xbf, 0x70, 0x52, 0x9a, 0x4c,
    0xea, 0xd5, 0x97, 0xd1, 0x33, 0x51, 0x5b, 0xa6, 0xde, 0x48, 0xa8, 0x99, 0xdb, 0x32, 0xb7, 0xfc,
    0xe3, 0x9e, 0x91, 0x9b, 0xe2, 0xbb, 0x41, 0x6e, 0xa5, 0xcb, 0x6b, 0x95, 0xa1, 0xf3, 0xb1, 0x02,
    0xcc, 0xc4, 0x1d, 0x14, 0xc3, 0x63, 0xda, 0x5d, 0x5f, 0xdc, 0x7d, 0xcd, 0x7f, 0x5a, 0x6c, 0x5c,
    0xf7, 0x26, 0xff, 0xed, 0xe8, 0x9d, 0x6f, 0x8e, 0x19, 0xa0, 0xf0, 0x89, 0x0f, 0x07, 0xaf, 0xfb,
    0x08, 0x15, 0x0d, 0x04, 0x01, 0x64, 0xdf, 0x76, 0x79, 0xdd, 0x3d, 0x16, 0x3f, 0x37, 0x6d, 0x38,
    0xb9, 0x73, 0xe9, 0x35, 0x55, 0x71, 0x7b, 0x8c, 0x72, 0x88, 0xf6, 0x2a, 0x3e, 0x5e, 0x27, 0x46,
    0x0c, 0x65, 0x68, 0x61, 0x03, 0xc1, 0x57, 0xd6, 0xd9, 0x58, 0xd8, 0x66, 0xd7, 0x3a, 0xc8, 0x3c,
    0xfa, 0x96, 0xa7, 0x98, 0xec, 0xb8, 0xc7, 0xae, 0x69, 0x4b, 0xab, 0xa9, 0x67, 0x0a, 0x47, 0xf2,
    0xb5, 0x22, 0xe5, 0xee, 0xbe, 0x2b, 0x81, 0x12, 0x83, 0x1b, 0x0e, 0x23, 0xf5, 0x45, 0x21, 0xce,
    0x49, 0x2c, 0xf9, 0xe6, 0xb6, 0x28, 0x17, 0x82, 0x1a, 0x8b, 0xfe, 0x8a, 0x09, 0xc9, 0x87, 0x4e,
    0xe1, 0x2e, 0xe4, 0xe0, 0xeb, 0x90, 0xa4, 0x1e, 0x85, 0x60, 0x00, 0x25, 0xf4, 0xf1, 0x94, 0x0b,
    0xe7, 0x75, 0xef, 0x34, 0x31, 0xd4, 0xd0, 0x86, 0x7e, 0xad, 0xfd, 0x29, 0x30, 0x3b, 0x9f, 0xf8,
    0xc6, 0x13, 0x06, 0x05, 0xc5, 0x11, 0x77, 0x7c, 0x7a, 0x78, 0x36, 0x1c, 0x39, 0x59, 0x18, 0x56,
    0xb3, 0xb0, 0x24, 0x20, 0xb2, 0x92, 0xa3, 0xc0, 0x44, 0x62, 0x10, 0xb4, 0x84, 0x43, 0x93, 0xc2,
    0x4a, 0xbd, 0x8f, 0x2d, 0xbc, 0x9c, 0x6a, 0x40, 0xcf, 0xa2, 0x80, 0x4f, 0x1f, 0xca, 0xaa, 0x42,
  ];

  /* ---- MDS 矩阵：MDS[k][j] = T_j[S^-1(1)] 的第 k 字节（GF 乘法单位元处取值） ---- */
  var MDS = [
  [1, 3, 4, 5, 6, 8, 11, 7,],
  [3, 1, 5, 4, 8, 6, 7, 11,],
  [4, 5, 1, 3, 11, 7, 6, 8,],
  [5, 4, 3, 1, 7, 11, 8, 6,],
  [6, 8, 11, 7, 1, 3, 4, 5,],
  [8, 6, 7, 11, 3, 1, 5, 4,],
  [11, 7, 6, 8, 4, 5, 1, 3,],
  [7, 11, 8, 6, 5, 4, 3, 1,],
  ];

  /* ---- 轮常量 c[0..8]，取自官方 C 的 static const u64 c[R+1] ---- */
  var C = [
  [0xba542f74, 0x53d3d24d],
  [0x50ac8dbf, 0x70529a4c],
  [0xead597d1, 0x33515ba6],
  [0xde48a899, 0xdb32b7fc],
  [0xe39e919b, 0xe2bb416e],
  [0xa5cb6b95, 0xa1f3b102],
  [0xccc41d14, 0xc363da5d],
  [0x5fdc7dcd, 0x7f5a6c5c],
  [0xf726ffed, 0xe89d6f8e],
  ];

  /* ---- GF(2^8) 乘法，多项式 0x1D ---- */
  function gmul(a, b) {
    var r = 0, i;
    for (i = 0; i < 8; i++) {
      if (b & 1) r ^= a;
      var hi = a & 0x80;
      a = (a << 1) & 0xff;
      if (hi) a ^= 0x1d;          /* ← 0x1D，不是 0x1B */
      b >>= 1;
    }
    return r;
  }

  /* ---- 预计算 T_j 表（等价于官方 T0..T7，已全量 2048 项验证） ----
     TH[j][s] / TL[j][s] = T_j[s] 的高 32 位 / 低 32 位。
     T_j[i] 的第 k 字节 = gmul(MDS[k][j], S(i))，即"MDS 第 j 列 × S(i)"。 */
  var TH = [], TL = [];
  (function buildTables() {
    for (var j = 0; j < 8; j++) {
      var h = new Int32Array(256), l = new Int32Array(256);
      for (var s = 0; s < 256; s++) {
        var vh = 0, vl = 0;
        for (var k = 0; k < 8; k++) {
          var p = gmul(MDS[k][j], s);
          if (k < 4) vh = (vh << 8) | p; else vl = (vl << 8) | p;
        }
        h[s] = vh | 0; l[s] = vl | 0;
      }
      TH.push(h); TL.push(l);
    }
  })();

  var R = 8;

  function rd64(b, o) {
    return [((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]),
            ((b[o + 4] << 24) | (b[o + 5] << 16) | (b[o + 6] << 8) | b[o + 7])];
  }
  function wr64(out, o, hi, lo) {
    out[o] = (hi >>> 24) & 0xff; out[o + 1] = (hi >>> 16) & 0xff;
    out[o + 2] = (hi >>> 8) & 0xff; out[o + 3] = hi & 0xff;
    out[o + 4] = (lo >>> 24) & 0xff; out[o + 5] = (lo >>> 16) & 0xff;
    out[o + 6] = (lo >>> 8) & 0xff; out[o + 7] = lo & 0xff;
  }

  /* T(x)：字节替换 + MDS 扩散 */
  function Tx(hi, lo) {
    var nh = 0, nl = 0, j, s;
    s = (hi >>> 24) & 0xff; s = SBOX[s]; nh ^= TH[0][s]; nl ^= TL[0][s];
    s = (hi >>> 16) & 0xff; s = SBOX[s]; nh ^= TH[1][s]; nl ^= TL[1][s];
    s = (hi >>> 8) & 0xff;  s = SBOX[s]; nh ^= TH[2][s]; nl ^= TL[2][s];
    s = hi & 0xff;          s = SBOX[s]; nh ^= TH[3][s]; nl ^= TL[3][s];
    s = (lo >>> 24) & 0xff; s = SBOX[s]; nh ^= TH[4][s]; nl ^= TL[4][s];
    s = (lo >>> 16) & 0xff; s = SBOX[s]; nh ^= TH[5][s]; nl ^= TL[5][s];
    s = (lo >>> 8) & 0xff;  s = SBOX[s]; nh ^= TH[6][s]; nl ^= TL[6][s];
    s = lo & 0xff;          s = SBOX[s]; nh ^= TH[7][s]; nl ^= TL[7][s];
    return [nh, nl];
  }

  /* theta(x)：先每字节过 S 盒，再过 T（用于解密轮密钥） */
  function theta(hi, lo) {
    return Tx(((SBOX[(hi >>> 24) & 0xff] << 24) | (SBOX[(hi >>> 16) & 0xff] << 16) |
               (SBOX[(hi >>> 8) & 0xff] << 8) | SBOX[hi & 0xff]),
              ((SBOX[(lo >>> 24) & 0xff] << 24) | (SBOX[(lo >>> 16) & 0xff] << 16) |
               (SBOX[(lo >>> 8) & 0xff] << 8) | SBOX[lo & 0xff]));
  }

  function keySchedule(keyBytes) {
    var K2 = rd64(keyBytes, 0), K1 = rd64(keyBytes, 8);
    var rkE = new Array(R + 1);
    var r;
    for (r = 0; r <= R; r++) {
      var t = Tx(K1[0], K1[1]);
      rkE[r] = [(t[0] ^ C[r][0] ^ K2[0]), (t[1] ^ C[r][1] ^ K2[1])];
      K2 = K1; K1 = rkE[r];
    }
    var rkD = new Array(R + 1);
    rkD[0] = rkE[R];
    for (r = 1; r < R; r++) rkD[r] = theta(rkE[R - r][0], rkE[R - r][1]);
    rkD[R] = rkE[0];
    return { enc: rkE, dec: rkD };
  }

  function cryptBlock(b, rk) {
    var st = rd64(b, 0);
    var hi = (st[0] ^ rk[0][0]), lo = (st[1] ^ rk[0][1]);
    var r, t;
    for (r = 1; r < R; r++) {          /* R-1 = 7 个完整轮 */
      t = Tx(hi, lo);
      hi = (t[0] ^ rk[r][0]); lo = (t[1] ^ rk[r][1]);
    }
    /* 末轮：只做 S 盒替换，【不做】MDS 扩散 */
    hi = ((SBOX[(hi >>> 24) & 0xff] << 24) | (SBOX[(hi >>> 16) & 0xff] << 16) |
          (SBOX[(hi >>> 8) & 0xff] << 8) | SBOX[hi & 0xff]) ^ rk[R][0];
    lo = ((SBOX[(lo >>> 24) & 0xff] << 24) | (SBOX[(lo >>> 16) & 0xff] << 16) |
          (SBOX[(lo >>> 8) & 0xff] << 8) | SBOX[lo & 0xff]) ^ rk[R][1];
    var out = new Uint8Array(8);
    wr64(out, 0, hi, lo);
    return out;
  }

  function khazadMake(keyBytes) {
    if (!keyBytes || keyBytes.length !== 16) {
      throw new Error('KHAZAD 密钥必须是 16 字节（128 位），实得 ' + (keyBytes ? keyBytes.length : 0));
    }
    var ks = keySchedule(keyBytes);
    return {
      enc: function (b) {
        if (!b || b.length !== 8) throw new Error('KHAZAD 块必须是 8 字节，实得 ' + (b ? b.length : 0));
        return cryptBlock(b, ks.enc);
      },
      dec: function (b) {
        if (!b || b.length !== 8) throw new Error('KHAZAD 块必须是 8 字节，实得 ' + (b ? b.length : 0));
        return cryptBlock(b, ks.dec);
      }
    };
  }

  /* ======================= 注册 ======================= */
  function regKhazad() {
    var regSym = root.regSym || (typeof regSym === 'function' ? regSym : null);
    if (typeof regSym !== 'function') return false;
    regSym({
      id: 'khazad', name: 'KHAZAD（NESSIE 候选，v2.0 tweaked S 盒）', group: '对称加密',
      blockSize: 8, keyLen: 16,
      keyLabel: '密钥（口令派生 16 字节；原始密钥模式填 32 位 Hex）',
      makeBlockFn: khazadMake,
      info: 'KHAZAD（Barreto & Rijmen，2000，NESSIE 候选）：64 位块 / 128 位密钥 / 8 轮 SPN，' +
            '结构上相当于"缩小的 AES"。⚠ 这是 v2.0 的 tweaked S 盒版本，与 NESSIE 提交的 v1.0 原版不同，' +
            '两者不兼容（混用会全错且不报错），解密旧数据前请确认是哪一版。' +
            '⚠ 64 位块存在 Sweet32 类生日攻击风险，不推荐新系统使用。'
    });
    if (typeof root.SEC_RULES === 'object') {
      root.SEC_RULES.khazad = { level: 'warn', msg: 'KHAZAD 是 64 位块密码，长连接下有 Sweet32 生日攻击风险；且本实现为 v2.0 tweaked S 盒版，与 v1.0 原版不兼容。' };
    }
    return true;
  }

  root.__khazad = {
    SBOX: SBOX, MDS: MDS, C: C, gmul: gmul,
    TH: TH, TL: TL,
    keySchedule: keySchedule,
    make: khazadMake,
    reg: regKhazad
  };
  if (typeof root.__regHooks === 'object') root.__regHooks.khazad = regKhazad;
  regKhazad();
})();
