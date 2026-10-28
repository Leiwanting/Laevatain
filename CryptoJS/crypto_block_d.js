/* ============================================================
 * D 组 · 分组密码补充：LEA / HIGHT / SIMECK / CHAM
 *
 * 全部实现均以 Crypto++ 官方源码（weidai11/cryptopp，master）为参照，
 * 官方向量取自同一个仓库的 TestVectors/*.txt：
 *   lea.txt   30 条（128/192/256 位密钥各 10 条，本批上线 128/192）
 *   hight.txt 15 条（KISA 官方参考 zip）
 *   simeck.txt 20 条（SIMECK-32/64）
 *   cham.txt  30 条（CHAM-64/128）
 *
 * 实现过程中用源码钉死的三处易错点（都是"不报错、只是密文全错"型）：
 *  1) LEA 的 delta 表不是固定常量数组，而是 delta[j][i] = ROL(base[j], i)，
 *     且第 i 轮第 j 条链取 delta[i mod m][i+j]（m 为链数 4/6）——
 *     写成 delta[j][i] 或 base 索引取 j 都会静默算错。
 *  2) LEA 一轮含 3 次字更新，共用 rkey[6i..6i+5]；三次更新全部读【旧值】，
 *     Crypto++ 源码是倒序书写的，正序写会读到已被覆盖的新值。
 *  3) HIGHT / CHAM / SIMECK 的块内字节序是【大端】，LEA 是【小端】。
 *     字节序错不报错，只是密文全错，必须靠向量定。
 * ============================================================ */
(function () {
  var U32 = function (x) { return x >>> 0; };
  var ROL32 = function (x, n) { return U32((x << n) | (x >>> (32 - n))); };
  var ROL16 = function (x, n) { x &= 0xffff; return ((x << n) | (x >>> (16 - n))) & 0xffff; };

  function rdLE(b, o) { return U32(b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)); }
  function wrLE(v, b, o) { b[o] = v & 255; b[o + 1] = (v >>> 8) & 255; b[o + 2] = (v >>> 16) & 255; b[o + 3] = (v >>> 24) & 255; }
  function rdBE(b, o) { return U32(((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3])) >>> 0; }
  function wrBE(v, b, o) { b[o] = (v >>> 24) & 255; b[o + 1] = (v >>> 16) & 255; b[o + 2] = (v >>> 8) & 255; b[o + 3] = v & 255; }
  function rdBE16(b, o) { return ((b[o] << 8) | b[o + 1]) & 0xffff; }
  function wrBE16(v, b, o) { b[o] = (v >>> 8) & 255; b[o + 1] = v & 255; }

  /* ======================= LEA ======================= */
  /* LEA：韩国 KISA 轻量分组密码（Hong 等，2013）。128 位块，密钥 128/192/256。
   * 纯 ARX 结构（加法/异或/循环移位），无 S 盒，通用处理器上很快。
   * LEABASE 是 8 个 delta 链的种子，delta[j][i] = ROL(LEABASE[j], i)。 */
  var LEABASE = [0xc3efe9db, 0x44626b02, 0x79e27c8a, 0x78df30ec, 0x715ea49e, 0xc785da0a, 0xe04ef22a, 0xe5c40957];
  var LEAROT = [1, 3, 6, 11, 13, 17, 19, 23];

  function leaKeySchedule(key /* number[] 32位字 */, rounds, m) {
    var T = key.slice(0, m);
    var rk = new Array(rounds * 6);
    for (var i = 0; i < rounds; i++) {
      for (var j = 0; j < m; j++) {
        T[j] = ROL32(U32(T[j] + ROL32(LEABASE[i % m], i + j)), LEAROT[j]);
      }
      rk[6 * i + 0] = T[0];
      rk[6 * i + 2] = T[2];
      if (m >= 6) {
        rk[6 * i + 1] = T[1]; rk[6 * i + 3] = T[3]; rk[6 * i + 4] = T[4]; rk[6 * i + 5] = T[5];
      } else {
        /* LEA-128：只有 4 条链，RK_i = [T0, T1, T2, T1, T3, T1] */
        rk[6 * i + 1] = rk[6 * i + 3] = rk[6 * i + 5] = T[1];
        rk[6 * i + 4] = T[3];
      }
    }
    return rk;
  }

  function leaEncBlock(p, rk, rounds) {
    var t = [rdLE(p, 0), rdLE(p, 4), rdLE(p, 8), rdLE(p, 12)];
    for (var i = 0; i < rounds; i++) {
      var j = i % 4, b = 6 * i;
      /* 三次更新全部读旧值（Crypto++ 源码倒序书写，等价于此） */
      var a = ROL32(U32((t[j] ^ rk[b + 0]) + U32(t[(j + 1) % 4] ^ rk[b + 1])), 9);
      var c = U32((t[(j + 1) % 4] ^ rk[b + 2]) + U32(t[(j + 2) % 4] ^ rk[b + 3]));
      var e = U32((t[(j + 2) % 4] ^ rk[b + 4]) + U32(t[(j + 3) % 4] ^ rk[b + 5]));
      t[(j + 1) % 4] = a;
      t[(j + 2) % 4] = U32((c >>> 5) | (c << 27));
      t[(j + 3) % 4] = U32((e >>> 3) | (e << 29));
    }
    var o = new Uint8Array(16);
    wrLE(t[0], o, 0); wrLE(t[1], o, 4); wrLE(t[2], o, 8); wrLE(t[3], o, 12);
    return o;
  }

  /* LEA-256 密钥调度：按 Crypto++ lea.cpp 的 SetKey256 原文逐条转写（192 条赋值）。
   * 与 128/192 【不同】：256 版不是“每轮更新 m 条链”，而是 8 条链 × 24 步，
   * 落点 rkey[c + 8*t]（链主序）；轮函数仍按 rk[6i..6i+5] 取，故两套索引不对齐。
   * 曾按 128/192 的公式套 m=8/32 轮，30 条官方向量全错，因此改为逐条转写，不再推公式。
   * 六列含义：目标下标 / 左旋位数 / 取 key(0) 还是 rkey(1) / 源下标 / delta 链 / delta 序号。 */
  var LEA256_D = [
      0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120,
      128, 136, 144, 152, 160, 168, 176, 184, 1, 9, 17, 25, 33, 41, 49, 57,
      65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185,
      2, 10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106, 114, 122,
      130, 138, 146, 154, 162, 170, 178, 186, 3, 11, 19, 27, 35, 43, 51, 59,
      67, 75, 83, 91, 99, 107, 115, 123, 131, 139, 147, 155, 163, 171, 179, 187,
      4, 12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92, 100, 108, 116, 124,
      132, 140, 148, 156, 164, 172, 180, 188, 5, 13, 21, 29, 37, 45, 53, 61,
      69, 77, 85, 93, 101, 109, 117, 125, 133, 141, 149, 157, 165, 173, 181, 189,
      6, 14, 22, 30, 38, 46, 54, 62, 70, 78, 86, 94, 102, 110, 118, 126,
      134, 142, 150, 158, 166, 174, 182, 190, 7, 15, 23, 31, 39, 47, 55, 63,
      71, 79, 87, 95, 103, 111, 119, 127, 135, 143, 151, 159, 167, 175, 183, 191
    ];
  var LEA256_R = [
      1, 6, 13, 1, 6, 13, 1, 6, 13, 1, 6, 13, 1, 6, 13, 1,
      6, 13, 1, 6, 13, 1, 6, 13, 3, 11, 17, 3, 11, 17, 3, 11,
      17, 3, 11, 17, 3, 11, 17, 3, 11, 17, 3, 11, 17, 3, 11, 17,
      6, 13, 1, 6, 13, 1, 6, 13, 1, 6, 13, 1, 6, 13, 1, 6,
      13, 1, 6, 13, 1, 6, 13, 1, 11, 17, 3, 11, 17, 3, 11, 17,
      3, 11, 17, 3, 11, 17, 3, 11, 17, 3, 11, 17, 3, 11, 17, 3,
      13, 1, 6, 13, 1, 6, 13, 1, 6, 13, 1, 6, 13, 1, 6, 13,
      1, 6, 13, 1, 6, 13, 1, 6, 17, 3, 11, 17, 3, 11, 17, 3,
      11, 17, 3, 11, 17, 3, 11, 17, 3, 11, 17, 3, 11, 17, 3, 11,
      1, 6, 13, 1, 6, 13, 1, 6, 13, 1, 6, 13, 1, 6, 13, 1,
      6, 13, 1, 6, 13, 1, 6, 13, 3, 11, 17, 3, 11, 17, 3, 11,
      17, 3, 11, 17, 3, 11, 17, 3, 11, 17, 3, 11, 17, 3, 11, 17
    ];
  var LEA256_F = [
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
    ];
  var LEA256_S = [
      0, 0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112,
      120, 128, 136, 144, 152, 160, 168, 176, 1, 1, 9, 17, 25, 33, 41, 49,
      57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177,
      2, 2, 10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106, 114,
      122, 130, 138, 146, 154, 162, 170, 178, 3, 3, 11, 19, 27, 35, 43, 51,
      59, 67, 75, 83, 91, 99, 107, 115, 123, 131, 139, 147, 155, 163, 171, 179,
      4, 4, 12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92, 100, 108, 116,
      124, 132, 140, 148, 156, 164, 172, 180, 5, 5, 13, 21, 29, 37, 45, 53,
      61, 69, 77, 85, 93, 101, 109, 117, 125, 133, 141, 149, 157, 165, 173, 181,
      6, 6, 14, 22, 30, 38, 46, 54, 62, 70, 78, 86, 94, 102, 110, 118,
      126, 134, 142, 150, 158, 166, 174, 182, 7, 7, 15, 23, 31, 39, 47, 55,
      63, 71, 79, 87, 95, 103, 111, 119, 127, 135, 143, 151, 159, 167, 175, 183
    ];
  var LEA256_C = [
      0, 1, 2, 4, 5, 6, 0, 1, 2, 4, 5, 6, 0, 1, 2, 4,
      5, 6, 0, 1, 2, 4, 5, 6, 0, 1, 2, 4, 5, 6, 0, 1,
      2, 4, 5, 6, 0, 1, 2, 4, 5, 6, 0, 1, 2, 4, 5, 6,
      0, 1, 3, 4, 5, 7, 0, 1, 3, 4, 5, 7, 0, 1, 3, 4,
      5, 7, 0, 1, 3, 4, 5, 7, 0, 1, 3, 4, 5, 7, 0, 1,
      3, 4, 5, 7, 0, 1, 3, 4, 5, 7, 0, 1, 3, 4, 5, 7,
      0, 2, 3, 4, 6, 7, 0, 2, 3, 4, 6, 7, 0, 2, 3, 4,
      6, 7, 0, 2, 3, 4, 6, 7, 0, 2, 3, 4, 6, 7, 0, 2,
      3, 4, 6, 7, 0, 2, 3, 4, 6, 7, 0, 2, 3, 4, 6, 7,
      1, 2, 3, 5, 6, 7, 1, 2, 3, 5, 6, 7, 1, 2, 3, 5,
      6, 7, 1, 2, 3, 5, 6, 7, 1, 2, 3, 5, 6, 7, 1, 2,
      3, 5, 6, 7, 1, 2, 3, 5, 6, 7, 1, 2, 3, 5, 6, 7
    ];
  var LEA256_I = [
      0, 3, 6, 4, 7, 10, 8, 11, 14, 12, 15, 18, 16, 19, 22, 20,
      23, 26, 24, 27, 30, 28, 31, 2, 1, 4, 7, 5, 8, 11, 9, 12,
      15, 13, 16, 19, 17, 20, 23, 21, 24, 27, 25, 28, 31, 29, 0, 3,
      2, 5, 3, 6, 9, 7, 10, 13, 11, 14, 17, 15, 18, 21, 19, 22,
      25, 23, 26, 29, 27, 30, 1, 31, 3, 6, 4, 7, 10, 8, 11, 14,
      12, 15, 18, 16, 19, 22, 20, 23, 26, 24, 27, 30, 28, 31, 2, 0,
      4, 2, 5, 8, 6, 9, 12, 10, 13, 16, 14, 17, 20, 18, 21, 24,
      22, 25, 28, 26, 29, 0, 30, 1, 5, 3, 6, 9, 7, 10, 13, 11,
      14, 17, 15, 18, 21, 19, 22, 25, 23, 26, 29, 27, 30, 1, 31, 2,
      1, 4, 7, 5, 8, 11, 9, 12, 15, 13, 16, 19, 17, 20, 23, 21,
      24, 27, 25, 28, 31, 29, 0, 3, 2, 5, 8, 6, 9, 12, 10, 13,
      16, 14, 17, 20, 18, 21, 24, 22, 25, 28, 26, 29, 0, 30, 1, 4
    ];
  function leaKeySchedule256(key) {
    var rk = new Array(192);
    for (var i = 0; i < 192; i++) {
      var a = LEA256_F[i] === 0 ? key[LEA256_S[i]] : rk[LEA256_S[i]];
      rk[LEA256_D[i]] = ROL32(U32(a + ROL32(LEABASE[LEA256_C[i]], LEA256_I[i])), LEA256_R[i]);
    }
    return rk;
  }

  function leaDecBlock(c, rk, rounds) {
    var t = [rdLE(c, 0), rdLE(c, 4), rdLE(c, 8), rdLE(c, 12)];
    for (var i = rounds - 1; i >= 0; i--) {
      var j = i % 4, b = 6 * i;
      var n1 = t[(j + 1) % 4], n2 = t[(j + 2) % 4], n3 = t[(j + 3) % 4];
      /* a = ROL9((x ^ rk0) + (y ^ rk1))  →  y = ROR9(a) - (x ^ rk0) ^ rk1 */
      var s1 = U32((n1 >>> 9) | (n1 << 23));
      t[(j + 1) % 4] = U32(s1 - U32(t[j] ^ rk[b + 0])) ^ rk[b + 1];
      var s2 = U32((n2 << 5) | (n2 >>> 27));
      t[(j + 2) % 4] = U32(s2 - U32(t[(j + 1) % 4] ^ rk[b + 2])) ^ rk[b + 3];
      var s3 = U32((n3 << 3) | (n3 >>> 29));
      t[(j + 3) % 4] = U32(s3 - U32(t[(j + 2) % 4] ^ rk[b + 4])) ^ rk[b + 5];
    }
    var o = new Uint8Array(16);
    wrLE(t[0], o, 0); wrLE(t[1], o, 4); wrLE(t[2], o, 8); wrLE(t[3], o, 12);
    return o;
  }

  function leaMake(keyLenBytes, rounds, m) {
    return function (keyBytes) {
      if (!keyBytes || keyBytes.length !== keyLenBytes) {
        throw new Error('LEA 密钥必须是 ' + keyLenBytes + ' 字节（' + (keyLenBytes * 8) + ' 位），实得 ' + (keyBytes ? keyBytes.length : 0));
      }
      var k = [];
      for (var i = 0; i < keyBytes.length / 4; i++) k.push(rdLE(keyBytes, i * 4));
      var rk = (m === 8) ? leaKeySchedule256(k) : leaKeySchedule(k, rounds, m);
      return {
        enc: function (b) { return leaEncBlock(b, rk, rounds); },
        dec: function (b) { return leaDecBlock(b, rk, rounds); }
      };
    };
  }

  /* ======================= HIGHT ======================= */
  /* HIGHT：韩国 KISA 超轻量分组密码（ISO/IEC 29192-2）。64 位块 / 128 位密钥 / 32 轮。
   * 8 位字节上的 ARX，带两个 8 位 S 盒 F0/F1（由 4 位 S 盒复合而来）。
   * 三个表 HIGHT_DELTA/F0/F1 直接从 Crypto++ hight.cpp 提取，共 640 字节。 */
  var HIGHT_DELTA=[0x5a,0x6d,0x36,0x1b,0x0d,0x06,0x03,0x41,0x60,0x30,0x18,0x4c,0x66,0x33,0x59,0x2c,0x56,0x2b,0x15,0x4a,0x65,0x72,0x39,0x1c,0x4e,0x67,0x73,0x79,0x3c,0x5e,0x6f,0x37,0x5b,0x2d,0x16,0x0b,0x05,0x42,0x21,0x50,0x28,0x54,0x2a,0x55,0x6a,0x75,0x7a,0x7d,0x3e,0x5f,0x2f,0x17,0x4b,0x25,0x52,0x29,0x14,0x0a,0x45,0x62,0x31,0x58,0x6c,0x76,0x3b,0x1d,0x0e,0x47,0x63,0x71,0x78,0x7c,0x7e,0x7f,0x3f,0x1f,0x0f,0x07,0x43,0x61,0x70,0x38,0x5c,0x6e,0x77,0x7b,0x3d,0x1e,0x4f,0x27,0x53,0x69,0x34,0x1a,0x4d,0x26,0x13,0x49,0x24,0x12,0x09,0x04,0x02,0x01,0x40,0x20,0x10,0x08,0x44,0x22,0x11,0x48,0x64,0x32,0x19,0x0c,0x46,0x23,0x51,0x68,0x74,0x3a,0x5d,0x2e,0x57,0x6b,0x35,0x5a];
var HIGHT_F0=[0x00,0x86,0x0d,0x8b,0x1a,0x9c,0x17,0x91,0x34,0xb2,0x39,0xbf,0x2e,0xa8,0x23,0xa5,0x68,0xee,0x65,0xe3,0x72,0xf4,0x7f,0xf9,0x5c,0xda,0x51,0xd7,0x46,0xc0,0x4b,0xcd,0xd0,0x56,0xdd,0x5b,0xca,0x4c,0xc7,0x41,0xe4,0x62,0xe9,0x6f,0xfe,0x78,0xf3,0x75,0xb8,0x3e,0xb5,0x33,0xa2,0x24,0xaf,0x29,0x8c,0x0a,0x81,0x07,0x96,0x10,0x9b,0x1d,0xa1,0x27,0xac,0x2a,0xbb,0x3d,0xb6,0x30,0x95,0x13,0x98,0x1e,0x8f,0x09,0x82,0x04,0xc9,0x4f,0xc4,0x42,0xd3,0x55,0xde,0x58,0xfd,0x7b,0xf0,0x76,0xe7,0x61,0xea,0x6c,0x71,0xf7,0x7c,0xfa,0x6b,0xed,0x66,0xe0,0x45,0xc3,0x48,0xce,0x5f,0xd9,0x52,0xd4,0x19,0x9f,0x14,0x92,0x03,0x85,0x0e,0x88,0x2d,0xab,0x20,0xa6,0x37,0xb1,0x3a,0xbc,0x43,0xc5,0x4e,0xc8,0x59,0xdf,0x54,0xd2,0x77,0xf1,0x7a,0xfc,0x6d,0xeb,0x60,0xe6,0x2b,0xad,0x26,0xa0,0x31,0xb7,0x3c,0xba,0x1f,0x99,0x12,0x94,0x05,0x83,0x08,0x8e,0x93,0x15,0x9e,0x18,0x89,0x0f,0x84,0x02,0xa7,0x21,0xaa,0x2c,0xbd,0x3b,0xb0,0x36,0xfb,0x7d,0xf6,0x70,0xe1,0x67,0xec,0x6a,0xcf,0x49,0xc2,0x44,0xd5,0x53,0xd8,0x5e,0xe2,0x64,0xef,0x69,0xf8,0x7e,0xf5,0x73,0xd6,0x50,0xdb,0x5d,0xcc,0x4a,0xc1,0x47,0x8a,0x0c,0x87,0x01,0x90,0x16,0x9d,0x1b,0xbe,0x38,0xb3,0x35,0xa4,0x22,0xa9,0x2f,0x32,0xb4,0x3f,0xb9,0x28,0xae,0x25,0xa3,0x06,0x80,0x0b,0x8d,0x1c,0x9a,0x11,0x97,0x5a,0xdc,0x57,0xd1,0x40,0xc6,0x4d,0xcb,0x6e,0xe8,0x63,0xe5,0x74,0xf2,0x79,0xff];
var HIGHT_F1=[0x00,0x58,0xb0,0xe8,0x61,0x39,0xd1,0x89,0xc2,0x9a,0x72,0x2a,0xa3,0xfb,0x13,0x4b,0x85,0xdd,0x35,0x6d,0xe4,0xbc,0x54,0x0c,0x47,0x1f,0xf7,0xaf,0x26,0x7e,0x96,0xce,0x0b,0x53,0xbb,0xe3,0x6a,0x32,0xda,0x82,0xc9,0x91,0x79,0x21,0xa8,0xf0,0x18,0x40,0x8e,0xd6,0x3e,0x66,0xef,0xb7,0x5f,0x07,0x4c,0x14,0xfc,0xa4,0x2d,0x75,0x9d,0xc5,0x16,0x4e,0xa6,0xfe,0x77,0x2f,0xc7,0x9f,0xd4,0x8c,0x64,0x3c,0xb5,0xed,0x05,0x5d,0x93,0xcb,0x23,0x7b,0xf2,0xaa,0x42,0x1a,0x51,0x09,0xe1,0xb9,0x30,0x68,0x80,0xd8,0x1d,0x45,0xad,0xf5,0x7c,0x24,0xcc,0x94,0xdf,0x87,0x6f,0x37,0xbe,0xe6,0x0e,0x56,0x98,0xc0,0x28,0x70,0xf9,0xa1,0x49,0x11,0x5a,0x02,0xea,0xb2,0x3b,0x63,0x8b,0xd3,0x2c,0x74,0x9c,0xc4,0x4d,0x15,0xfd,0xa5,0xee,0xb6,0x5e,0x06,0x8f,0xd7,0x3f,0x67,0xa9,0xf1,0x19,0x41,0xc8,0x90,0x78,0x20,0x6b,0x33,0xdb,0x83,0x0a,0x52,0xba,0xe2,0x27,0x7f,0x97,0xcf,0x46,0x1e,0xf6,0xae,0xe5,0xbd,0x55,0x0d,0x84,0xdc,0x34,0x6c,0xa2,0xfa,0x12,0x4a,0xc3,0x9b,0x73,0x2b,0x60,0x38,0xd0,0x88,0x01,0x59,0xb1,0xe9,0x3a,0x62,0x8a,0xd2,0x5b,0x03,0xeb,0xb3,0xf8,0xa0,0x48,0x10,0x99,0xc1,0x29,0x71,0xbf,0xe7,0x0f,0x57,0xde,0x86,0x6e,0x36,0x7d,0x25,0xcd,0x95,0x1c,0x44,0xac,0xf4,0x31,0x69,0x81,0xd9,0x50,0x08,0xe0,0xb8,0xf3,0xab,0x43,0x1b,0x92,0xca,0x22,0x7a,0xb4,0xec,0x04,0x5c,0xd5,0x8d,0x65,0x3d,0x76,0x2e,0xc6,0x9e,0x17,0x4f,0xa7,0xff];

  function hightKeySchedule(key) {
    var rk = new Uint8Array(136);
    for (var i = 0; i < 4; i++) { rk[i] = key[i + 12]; rk[i + 4] = key[i]; }
    for (var i2 = 0; i2 < 8; i2++) {
      for (var j = 0; j < 8; j++) {
        rk[8 + 16 * i2 + j] = (key[(j - i2) & 7] + HIGHT_DELTA[16 * i2 + j]) & 0xff;
      }
      for (var j2 = 0; j2 < 8; j2++) {
        rk[8 + 16 * i2 + j2 + 8] = (key[((j2 - i2) & 7) + 8] + HIGHT_DELTA[16 * i2 + j2 + 8]) & 0xff;
      }
    }
    return rk;
  }

  function hightEncBlock(p, rk) {
    var x = new Uint8Array(8);
    x[1] = p[1]; x[3] = p[3]; x[5] = p[5]; x[7] = p[7];
    x[0] = (p[0] + rk[0]) & 0xff;
    x[2] = p[2] ^ rk[1];
    x[4] = (p[4] + rk[2]) & 0xff;
    x[6] = p[6] ^ rk[3];
    for (var k = 2; k <= 33; k++) {
      var i0 = (9 - k) % 8; if (i0 < 0) i0 += 8;
      var m0 = i0, m1 = (i0 + 7) % 8, m2 = (i0 + 6) % 8, m3 = (i0 + 5) % 8,
          m4 = (i0 + 4) % 8, m5 = (i0 + 3) % 8, m6 = (i0 + 2) % 8, m7 = (i0 + 1) % 8;
      var b = 4 * k;
      /* 与 Crypto++ 的 HIGHT_ENC 宏一致：i0=m0, i1=m1, i2=m2, i3=m3, i4=m4, i5=m5, i6=m6, i7=m7 */
      var a0 = x[m0] ^ ((HIGHT_F0[x[m1]] + rk[b + 3]) & 0xff);
      var a2 = (x[m2] + ((HIGHT_F1[x[m3]] ^ rk[b + 2]) & 0xff)) & 0xff;
      var a4 = x[m4] ^ ((HIGHT_F0[x[m5]] + rk[b + 1]) & 0xff);
      var a6 = (x[m6] + ((HIGHT_F1[x[m7]] ^ rk[b + 0]) & 0xff)) & 0xff;
      x[m0] = a0 & 0xff; x[m2] = a2; x[m4] = a4 & 0xff; x[m6] = a6;
    }
    var o = new Uint8Array(8);
    o[1] = x[2]; o[3] = x[4]; o[5] = x[6]; o[7] = x[0];
    o[0] = (x[1] + rk[4]) & 0xff;
    o[2] = x[3] ^ rk[5];
    o[4] = (x[5] + rk[6]) & 0xff;
    o[6] = x[7] ^ rk[7];
    return o;
  }

  function hightDecBlock(c, rk) {
    var x = new Uint8Array(8);
    x[2] = c[1]; x[4] = c[3]; x[6] = c[5]; x[0] = c[7];
    x[1] = (c[0] - rk[4]) & 0xff;
    x[3] = c[2] ^ rk[5];
    x[5] = (c[4] - rk[6]) & 0xff;
    x[7] = c[6] ^ rk[7];
    for (var k = 33; k >= 2; k--) {
      var i0 = (9 - k) % 8; if (i0 < 0) i0 += 8;
      var m0 = i0, m1 = (i0 + 7) % 8, m2 = (i0 + 6) % 8, m3 = (i0 + 5) % 8,
          m4 = (i0 + 4) % 8, m5 = (i0 + 3) % 8, m6 = (i0 + 2) % 8, m7 = (i0 + 1) % 8;
      var b = 4 * k;
      /* HIGHT_DEC：先减 m1，再异或 m3，再减 m5，最后异或 m7 —— 顺序不可调换 */
      var d1 = (x[m2] - ((HIGHT_F1[x[m3]] ^ rk[b + 2]) & 0xff)) & 0xff;
      var d3 = x[m4] ^ ((HIGHT_F0[x[m5]] + rk[b + 1]) & 0xff);
      var d5 = (x[m6] - ((HIGHT_F1[x[m7]] ^ rk[b + 0]) & 0xff)) & 0xff;
      var d7 = x[m0] ^ ((HIGHT_F0[x[m1]] + rk[b + 3]) & 0xff);
      x[m2] = d1; x[m4] = d3 & 0xff; x[m6] = d5; x[m0] = d7 & 0xff;
    }
    var o = new Uint8Array(8);
    o[1] = x[1]; o[3] = x[3]; o[5] = x[5]; o[7] = x[7];
    o[0] = (x[0] - rk[0]) & 0xff;
    o[2] = x[2] ^ rk[1];
    o[4] = (x[4] - rk[2]) & 0xff;
    o[6] = x[6] ^ rk[3];
    return o;
  }

  function hightMake(keyBytes) {
    if (!keyBytes || keyBytes.length !== 16) {
      throw new Error('HIGHT 密钥必须是 16 字节（128 位），实得 ' + (keyBytes ? keyBytes.length : 0));
    }
    var rk = hightKeySchedule(keyBytes);
    return { enc: function (b) { return hightEncBlock(b, rk); }, dec: function (b) { return hightDecBlock(b, rk); } };
  }

  /* ======================= SIMECK ======================= */
  /* SIMECK：Simon 的简化变体（Yang 等，2015），轮函数只用与/异或/循环移位。
   * SIMECK-32/64：32 位块 / 64 位密钥 / 32 轮（16 位字）
   * SIMECK-64/128：64 位块 / 128 位密钥 / 44 轮（32 位字）
   * 字节序【大端】（与 Simon/SPECK 的小端不同——这是最容易搞混的一处）。 */
  function simeckMake(wordBits, rounds, seqHi0, seqLo0, constBase) {
    return function (keyBytes) {
      /* ⚠【第 118 批修复】seqHi/seqLo 是轮常量序列，在密钥调度循环里被逐位右移消耗。
         原写法直接修改 simeckMake 的【外层参数】，于是同一个工厂第二次 makeBlockFn(key)
         拿到的是已被耗尽为 0 的序列——结果"自洽"（加解密互逆）但完全偏离官方 KAT，
         且不报错。这是最危险的一类：官方向量只在第一次调用时才对。
         必须每次调用用局部副本重新初始化，保证任意次调用结果一致。 */
      var seqHi = seqHi0, seqLo = seqLo0;
      var wb = wordBits / 8;
      if (!keyBytes || keyBytes.length !== 4 * wb) {
        throw new Error('SIMECK-' + (wordBits * 2) + ' 密钥必须是 ' + (4 * wb) + ' 字节，实得 ' + (keyBytes ? keyBytes.length : 0));
      }
      var rdr = (wb === 2) ? rdBE16 : rdBE;
      var t = [0, 0, 0, 0], tmp = [0, 0, 0, 0, 0];
      /* kblock(m_t[3])(m_t[2])(m_t[1])(m_t[0]) —— 密钥首字进 t[3] */
      t[3] = rdr(keyBytes, 0); t[2] = rdr(keyBytes, wb);
      t[1] = rdr(keyBytes, 2 * wb); t[0] = rdr(keyBytes, 3 * wb);
      var rk = [];
      for (var i = 0; i < rounds; i++) {
        rk.push(t[0]);
        /* 顺序不可调换：先取当前最低位，再把序列右移（Crypto++ 是 |= sequence&1 后 sequence>>=1） */
        var cbit = seqLo & 1;
        seqLo = ((seqLo >>> 1) | ((seqHi & 1) << 31)) >>> 0; seqHi = seqHi >>> 1;
        var c = (constBase & ~3) | cbit;
        /* SIMECK_Encryption(c, t[1], t[0]) */
        var L = t[1], R = t[0], rot = (wb === 2) ? ROL16 : ROL32, bits = (wb === 2) ? 16 : 32;
        var nl = (L & rot(L, 5)) ^ rot(L, 1) ^ R ^ (c & ((bits === 16) ? 0xffff : 0xffffffff));
        t[0] = L; t[1] = nl & ((bits === 16) ? 0xffff : 0xffffffff);
        tmp[4] = t[1]; t[1] = t[2]; t[2] = t[3]; t[3] = tmp[4];
      }
      var mask = (wb === 2) ? 0xffff : 0xffffffff;
      var rotl = (wb === 2) ? ROL16 : ROL32;
      function encBlock(b) {
        var x1 = rdr(b, 0), x0 = rdr(b, wb);
        for (var i = 0; i < rounds; i++) {
          var L = x1, R = x0;
          x1 = ((L & rotl(L, 5)) ^ rotl(L, 1) ^ R ^ rk[i]) & mask;
          x0 = L;
        }
        var o = new Uint8Array(2 * wb);
        if (wb === 2) { wrBE16(x1, o, 0); wrBE16(x0, o, 2); } else { wrBE(x1, o, 0); wrBE(x0, o, 4); }
        return o;
      }
      /* 解密的加载顺序与加密相反：Crypto++ 的 Dec 是 iblock(m_t[0])(m_t[1])，
       * 即 left = 第 1 个字、right = 第 0 个字；输出也反过来 oblock(m_t[0])(m_t[1])。
       * 轮函数本身与加密完全相同，只是轮密钥倒序使用。 */
      function decBlock(b) {
        var x1 = rdr(b, wb), x0 = rdr(b, 0);
        for (var i = rounds - 1; i >= 0; i--) {
          var nl = ((x1 & rotl(x1, 5)) ^ rotl(x1, 1) ^ x0 ^ rk[i]) & mask;
          x0 = x1; x1 = nl;
        }
        var o = new Uint8Array(2 * wb);
        if (wb === 2) { wrBE16(x0, o, 0); wrBE16(x1, o, 2); } else { wrBE(x0, o, 0); wrBE(x1, o, 4); }
        return o;
      }
      return { enc: encBlock, dec: decBlock };
    };
  }

  /* ======================= CHAM ======================= */
  /* CHAM：韩国轻量分组密码（Korea, 2017），ARX 结构。
   * CHAM-64/128：64 位块 / 128 位密钥 / 80 轮（16 位字）
   * CHAM-128/128：128 位块 / 128 位密钥 / 80 轮（32 位字）
   * CHAM-128/256：128 位块 / 256 位密钥 / 96 轮
   * 轮 i 写 x[i%4]，读 x[i%4] 与 x[(i+1)%4]；i 偶数时移位量 (1,8)，奇数时 (8,1)。 */
  function chamMake(wordBytes, rounds) {
    return function (keyBytes) {
      var wb = wordBytes;                       /* 2 = CHAM64, 4 = CHAM128 */
      var kw = keyBytes.length / wb;            /* 密钥字数 */
      var KW = 2 * kw;
      if (!keyBytes || (keyBytes.length !== 16 && keyBytes.length !== 32)) {
        throw new Error('CHAM 密钥必须是 16 或 32 字节，实得 ' + (keyBytes ? keyBytes.length : 0));
      }
      var rk = new Array(KW);
      var rdr = (wb === 2) ? rdBE16 : rdBE;
      var rotl = (wb === 2) ? ROL16 : ROL32;
      var mask = (wb === 2) ? 0xffff : 0xffffffff;
      var step = (wb === 2) ? 4 : 4;            /* 每次读 4 字节 */
      var per = (wb === 2) ? 2 : 1;             /* 每次读 4 字节产出几个字 */
      var idx = 0;
      for (var i = 0; i < kw; idx += step) {
        var r = rdBE(keyBytes, idx);
        if (wb === 2) {
          var r1 = (r >>> 16) & 0xffff, r2 = r & 0xffff;
          rk[i] = (r1 ^ ROL16(r1, 1) ^ ROL16(r1, 8)) & 0xffff;
          rk[(i + kw) ^ 1] = (r1 ^ ROL16(r1, 1) ^ ROL16(r1, 11)) & 0xffff;
          i++;
          rk[i] = (r2 ^ ROL16(r2, 1) ^ ROL16(r2, 8)) & 0xffff;
          rk[(i + kw) ^ 1] = (r2 ^ ROL16(r2, 1) ^ ROL16(r2, 11)) & 0xffff;
          i++;
        } else {
          rk[i] = (r ^ ROL32(r, 1) ^ ROL32(r, 8)) >>> 0;
          rk[(i + kw) ^ 1] = (r ^ ROL32(r, 1) ^ ROL32(r, 11)) >>> 0;
          i++;
        }
      }
      function encBlock(b) {
        var x = [rdr(b, 0), rdr(b, wb), rdr(b, 2 * wb), rdr(b, 3 * wb)];
        for (var i = 0; i < rounds; i++) {
          var j = i % 4, j1 = (i + 1) % 4;
          var R1 = (i % 2 === 0) ? 1 : 8, R2 = (i % 2 === 0) ? 8 : 1;
          var aa = (x[j] ^ (i & mask)) & mask;
          var bb = (rotl(x[j1], R1) ^ rk[i % KW]) & mask;
          x[j] = rotl((aa + bb) & mask, R2) & mask;
        }
        var o = new Uint8Array(4 * wb);
        for (var q = 0; q < 4; q++) { if (wb === 2) wrBE16(x[q], o, q * 2); else wrBE(x[q], o, q * 4); }
        return o;
      }
      function decBlock(b) {
        var x = [rdr(b, 0), rdr(b, wb), rdr(b, 2 * wb), rdr(b, 3 * wb)];
        for (var i = rounds - 1; i >= 0; i--) {
          var j = i % 4, j1 = (i + 1) % 4;
          var R1 = (i % 2 === 0) ? 1 : 8, R2 = (i % 2 === 0) ? 8 : 1;
          var shift = (wb === 2) ? (16 - R2) : (32 - R2);
          var v = (wb === 2) ? (((x[j] << shift) | (x[j] >>> R2)) & 0xffff)
                             : U32((x[j] >>> R2) | (x[j] << shift));
          x[j] = (U32(v - ((rotl(x[j1], R1) ^ rk[i % KW]) & mask)) ^ (i & mask)) & mask;
        }
        var o = new Uint8Array(4 * wb);
        for (var q = 0; q < 4; q++) { if (wb === 2) wrBE16(x[q], o, q * 2); else wrBE(x[q], o, q * 4); }
        return o;
      }
      return { enc: encBlock, dec: decBlock };
    };
  }

  globalThis.CRYPTO_BLOCK_D = {
    leaMake: leaMake, hightMake: hightMake, simeckMake: simeckMake, chamMake: chamMake
  };

  if (typeof regSym !== 'function') return;

  regSym({
    id: 'lea128', name: 'LEA-128（韩国 KS X 3246 轻量分组）', group: '对称加密',
    blockSize: 16, keyLen: 16, makeBlockFn: leaMake(16, 24, 4),
    info: '韩国 KISA 2013 年发布的轻量分组密码，128 位块 / 128 位密钥 / 24 轮。' +
      '纯 ARX 结构（加法+异或+循环移位，无 S 盒），在通用处理器上比 AES 快。' +
      '官方向量：Crypto++ TestVectors/lea.txt 10 条（含 16~160 字节多块）全过。' +
      '注意字节序是【小端】；delta 表是 ROL(base[j], i) 不是固定数组。'
  });
  regSym({
    id: 'lea192', name: 'LEA-192（韩国 KS X 3246 轻量分组）', group: '对称加密',
    blockSize: 16, keyLen: 24, makeBlockFn: leaMake(24, 28, 6),
    info: 'LEA 的 192 位密钥版本，128 位块 / 28 轮，密钥调度用 6 条 delta 链。' +
      '官方向量：Crypto++ TestVectors/lea.txt 10 条全过。'
  });
  regSym({
    id: 'lea256', name: 'LEA-256（韩国 KS X 3246 轻量分组）', group: '对称加密',
    blockSize: 16, keyLen: 32, makeBlockFn: leaMake(32, 32, 8),
    info: 'LEA 的 256 位密钥版本，128 位块 / 32 轮。' +
      '注意：256 位的密钥调度与 128/192 【结构不同】——不是每轮更新 8 条链，' +
      '而是 8 条链 × 24 步、落点 rkey[c+8t]，因此不能套用 128/192 的公式。' +
      '官方向量：Crypto++ TestVectors/lea.txt 10 条（16~160 字节多块）全过。'
  });
  regSym({
    id: 'hight', name: 'HIGHT（韩国 ISO/IEC 29192-2 超轻量）', group: '对称加密',
    blockSize: 8, keyLen: 16, makeBlockFn: hightMake,
    info: '韩国 KISA 超轻量分组密码，64 位块 / 128 位密钥 / 32 轮，8 位字节上的 ARX。' +
      '面向极低硬件成本场景（RFID、传感器）。' +
      '官方向量：Crypto++ TestVectors/hight.txt 15 条（源自 KISA 官方参考 zip）全过。' +
      '注意块只有 8 字节，与 AES 的 16 字节不同。'
  });
  regSym({
    id: 'simeck32', name: 'SIMECK-32/64（Simon 简化变体）', group: '对称加密',
    blockSize: 4, keyLen: 8, makeBlockFn: simeckMake(16, 32, 0, 0x9A42BB1F, 0xFFFC),
    info: 'SIMECK-32/64：32 位块 / 64 位密钥 / 32 轮，16 位字运算。' +
      '轮函数只用与、异或、循环移位，是 Simon 的极简变体。' +
      '官方向量：Crypto++ TestVectors/simeck.txt 10 条全过。' +
      '注意字节序是【大端】——与 Simon/SPECK 的小端相反。'
  });
  regSym({
    id: 'simeck64', name: 'SIMECK-64/128（Simon 简化变体）', group: '对称加密',
    blockSize: 8, keyLen: 16, makeBlockFn: simeckMake(32, 44, 0x938, 0xBCA3083F, 0xFFFFFFFC),
    info: 'SIMECK-64/128：64 位块 / 128 位密钥 / 44 轮，32 位字运算。' +
      '轮函数只用与、异或、循环移位。' +
      '官方向量：Crypto++ TestVectors/simeck.txt 10 条全过。字节序【大端】。'
  });
  regSym({
    id: 'cham64', name: 'CHAM-64/128（韩国轻量分组密码）', group: '对称加密',
    blockSize: 8, keyLen: 16, makeBlockFn: chamMake(2, 80),
    info: 'CHAM-64/128：64 位块 / 128 位密钥 / 80 轮，16 位字 ARX。' +
      '官方向量：Crypto++ TestVectors/cham.txt 10 条全过。字节序【大端】。'
  });
  regSym({
    id: 'cham128', name: 'CHAM-128/128（韩国轻量分组密码）', group: '对称加密',
    blockSize: 16, keyLen: 16, makeBlockFn: chamMake(4, 80),
    info: 'CHAM-128/128：128 位块 / 128 位密钥 / 80 轮，32 位字 ARX。' +
      '官方向量：Crypto++ TestVectors/cham.txt 全过。字节序【大端】。'
  });
  regSym({
    id: 'cham128-256', name: 'CHAM-128/256（韩国轻量分组密码）', group: '对称加密',
    blockSize: 16, keyLen: 32, makeBlockFn: chamMake(4, 96),
    info: 'CHAM-128/256：128 位块 / 256 位密钥 / 96 轮（密钥更长时轮数从 80 增到 96）。' +
      '官方向量：Crypto++ TestVectors/cham.txt 全过。字节序【大端】。'
  });
})();
