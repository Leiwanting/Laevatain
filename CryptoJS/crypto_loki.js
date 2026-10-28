/* ============================================================================
 * LOKI89 / LOKI91 —— Lawrie Brown 等人的 DES 替代候选（64 位块 / 64 位密钥 / 16 轮 Feistel）
 *
 * 参照物（唯一权威来源）：设计者本人发布的 C 实现
 *   LOKI89：loki89.c（Lawrence Brown & UNSW，v3.0，1990）
 *   LOKI91：loki91.c（Lawrence Brown & UNSW，v3.0，1991）
 *   P 置换表与 sfn（S 盒的生成多项式/指数）取自同包的 loki.i。
 *   验收方式：把官方 C 用 gcc 编译成二进制当裁判做差分，不是"自己写两遍互比"。
 *
 * ⚠⚠ 四处极易写错、且错了【不报错只会静默算错】的地方：
 *   1) 字节序必须是【大端】。loki.h 的注释明确规定 b[0] 装 bits[63..56]（最高字节），
 *      而官方 C 在小端机器上必须 #define LITTLE_ENDIAN 启用 bswap 才是这个语义。
 *      我最初按"不启用"编译，得到的就是字节反转的错误结果（自洽但与规范相反）。
 *   2) 官方 C 里 `typedef unsigned long Long;` 在 64 位 Linux 上 Long 是 8 字节，
 *      ((Long*)key)[1] 会越界读 4 字节 → stack smashing 崩溃。
 *      编译裁判时必须改成 unsigned int（32 位）。这是环境问题不是算法问题。
 *   3) LOKI89 与 LOKI91 的 S 盒【不同】：LOKI89 是 t = c ^ r，
 *      LOKI91 是 t = (c + ((r*17) ^ 0xff)) & 0xff。差一个字节结果全变。
 *   4) LOKI89 有首尾密钥白化（L^=KL / R^=KR 开头，输出再 ^KL / ^KR），
 *      LOKI91 【去掉了白化】—— 这是 91 相对 89 的主要改动之一。
 *      另：LOKI89 每步 ROL12，LOKI91 交替 ROL12 / ROL13。
 * ========================================================================== */
(function () {
  'use strict';
  var root = (typeof globalThis !== 'undefined') ? globalThis : this;

  /* ---- P 置换：P[o] = "输出位 o（自 MSB 数起）取自输入的第 P[o] 位" ---- */
  var P = [31, 23, 15, 7, 30, 22, 14, 6, 29, 21, 13, 5, 28, 20, 12, 4,
           27, 19, 11, 3, 26, 18, 10, 2, 25, 17, 9, 1, 24, 16, 8, 0];

  /* ---- sfn：16 个 S 函数各自的不可约多项式 gen 与指数 exp（exp 全为 31） ---- */
  var SFN = [375, 379, 391, 395, 397, 415, 419, 425, 433, 445, 451, 463, 471, 477, 487, 499];
  var SFN_EXP = 31;

  /* ---- GF(2^8) 乘法（官方 mult8）。gen 是 9 位：x^8 项 + 低 8 位 ---- */
  function mult8(a, b, gen) {
    var product = 0;
    while (b !== 0) {
      if (b & 1) product ^= a;
      a <<= 1;
      if (a >= 256) a ^= gen;      /* gen 含 x^8 位，异或后自然回到 8 位 */
      b >>= 1;
    }
    return product & 0xff;
  }
  function exp8(base, exponent, gen) {
    var accum = base, result = 1;
    if (base === 0) return 0;
    while (exponent !== 0) {
      if (exponent & 1) result = mult8(result, accum, gen);
      exponent >>= 1;
      accum = mult8(accum, accum, gen);
    }
    return result & 0xff;
  }

  /* ---- 预计算 12 位输入的 S 盒（4096 项）---- */
  function buildS(mode) {
    var S = new Uint8Array(4096);
    for (var i = 0; i < 4096; i++) {
      var r = ((i >> 8) & 0xc) | (i & 0x3);
      var c = (i >> 2) & 0xff;
      /* LOKI89: t = c ^ r ; LOKI91: t = (c + ((r*17) ^ 0xff)) & 0xff */
      var t = (mode === 89) ? (c ^ r) : ((c + ((r * 17) ^ 0xff)) & 0xff);
      S[i] = exp8(t, SFN_EXP, SFN[r]);
    }
    return S;
  }
  var S89 = buildS(89), S91 = buildS(91);

  function perm32(x) {
    var out = 0;
    for (var o = 0; o < 32; o++) {
      if ((x >>> P[o]) & 1) out |= (0x80000000 >>> o);
    }
    return out | 0;
  }

  function mkF(S) {
    return function (r, k) {
      var a = (r ^ k) | 0;
      var b = (S[a & 0xfff] |
               (S[(a >>> 8) & 0xfff] << 8) |
               (S[(a >>> 16) & 0xfff] << 16) |
               (S[((a >>> 24) | (a << 8)) & 0xfff] << 24)) | 0;
      return perm32(b);
    };
  }
  var f89 = mkF(S89), f91 = mkF(S91);

  function ROL(b, n) { return ((b << n) | (b >>> (32 - n))) | 0; }
  function ROR(b, n) { return ((b >>> n) | (b << (32 - n))) | 0; }

  function rd32(b, o) {
    return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) | 0;
  }
  function wr32(out, o, v) {
    out[o] = (v >>> 24) & 0xff; out[o + 1] = (v >>> 16) & 0xff;
    out[o + 2] = (v >>> 8) & 0xff; out[o + 3] = v & 0xff;
  }

  /* ======================= LOKI89 ======================= */
  function loki89Make(keyBytes) {
    if (!keyBytes || keyBytes.length !== 8) {
      throw new Error('LOKI89 密钥必须是 8 字节（64 位），实得 ' + (keyBytes ? keyBytes.length : 0));
    }
    var KL = rd32(keyBytes, 0), KR = rd32(keyBytes, 4);
    return {
      enc: function (b) {
        if (!b || b.length !== 8) throw new Error('LOKI89 块必须是 8 字节，实得 ' + (b ? b.length : 0));
        var k1 = KL, k2 = KR;
        var L = (rd32(b, 0) ^ k1) | 0, R = (rd32(b, 4) ^ k2) | 0;
        for (var i = 0; i < 8; i++) {
          L = (L ^ f89(R, k1)) | 0; k1 = ROL(k1, 12);
          R = (R ^ f89(L, k2)) | 0; k2 = ROL(k2, 12);
        }
        var o = new Uint8Array(8);
        wr32(o, 0, (R ^ k2) | 0); wr32(o, 4, (L ^ k1) | 0);
        return o;
      },
      dec: function (b) {
        if (!b || b.length !== 8) throw new Error('LOKI89 块必须是 8 字节，实得 ' + (b ? b.length : 0));
        var k1 = KL, k2 = KR;
        /* 解密：先 ROR12 再用（与加密的"先用再 ROL12"相反），且首步 XOR 的是 KR/KL 交换位 */
        var L = (rd32(b, 0) ^ k2) | 0, R = (rd32(b, 4) ^ k1) | 0;
        for (var i = 0; i < 8; i++) {
          k2 = ROR(k2, 12); L = (L ^ f89(R, k2)) | 0;
          k1 = ROR(k1, 12); R = (R ^ f89(L, k1)) | 0;
        }
        var o = new Uint8Array(8);
        wr32(o, 0, (R ^ k1) | 0); wr32(o, 4, (L ^ k2) | 0);
        return o;
      }
    };
  }

  /* ======================= LOKI91 ======================= */
  function loki91Make(keyBytes) {
    if (!keyBytes || keyBytes.length !== 8) {
      throw new Error('LOKI91 密钥必须是 8 字节（64 位），实得 ' + (keyBytes ? keyBytes.length : 0));
    }
    var kL = rd32(keyBytes, 0), kR = rd32(keyBytes, 4);
    var sk = new Array(16), i;
    for (i = 0; i < 16; i += 4) {
      sk[i] = kL; kL = ROL(kL, 12);
      sk[i + 1] = kL; kL = ROL(kL, 13);
      sk[i + 2] = kR; kR = ROL(kR, 12);
      sk[i + 3] = kR; kR = ROL(kR, 13);
    }
    return {
      enc: function (b) {
        if (!b || b.length !== 8) throw new Error('LOKI91 块必须是 8 字节，实得 ' + (b ? b.length : 0));
        var L = rd32(b, 0), R = rd32(b, 4);   /* LOKI91 无白化 */
        for (var j = 0; j < 16; j += 2) {
          L = (L ^ f91(R, sk[j])) | 0;
          R = (R ^ f91(L, sk[j + 1])) | 0;
        }
        var o = new Uint8Array(8);
        wr32(o, 0, R); wr32(o, 4, L);
        return o;
      },
      dec: function (b) {
        if (!b || b.length !== 8) throw new Error('LOKI91 块必须是 8 字节，实得 ' + (b ? b.length : 0));
        var L = rd32(b, 0), R = rd32(b, 4);
        for (var j = 16; j > 0; j -= 2) {
          L = (L ^ f91(R, sk[j - 1])) | 0;
          R = (R ^ f91(L, sk[j - 2])) | 0;
        }
        var o = new Uint8Array(8);
        wr32(o, 0, R); wr32(o, 4, L);
        return o;
      }
    };
  }

  /* ======================= 注册 ======================= */
  function regLoki() {
    if (typeof root.regSym !== 'function') return false;
    var warn = '⚠ 64 位块 + 64 位密钥：密钥空间可被穷举，且长连接下有 Sweet32 类生日攻击风险；' +
               'LOKI 系列还存在相关密钥差分攻击。仅作学术研究/解密遗留数据，禁止用于新系统。';
    root.regSym({
      id: 'loki89', name: 'LOKI89', group: '对称加密', blockSize: 8, keyLen: 8,
      keyLabel: '密钥（口令派生 8 字节；原始密钥模式填 16 位 Hex）',
      makeBlockFn: loki89Make,
      info: 'LOKI89（Brown/Pieprzyk/Seberry，1990）：64 位块 / 64 位密钥 / 16 轮 Feistel，' +
            'S 盒由 GF(2^8) 上的指数运算生成（16 个不可约多项式 × 指数 31），有首尾密钥白化。' + warn
    });
    root.regSym({
      id: 'loki91', name: 'LOKI91', group: '对称加密', blockSize: 8, keyLen: 8,
      keyLabel: '密钥（口令派生 8 字节；原始密钥模式填 16 位 Hex）',
      makeBlockFn: loki91Make,
      info: 'LOKI91（Brown 等，1991）：LOKI89 的改进版 —— 去掉首尾白化、换 S 盒（t = (c + ((r*17)^0xff)) & 0xff）、' +
            '轮密钥改为交替 ROL12/ROL13。' + warn
    });
    if (typeof root.SEC_RULES === 'object') {
      root.SEC_RULES.loki89 = { level: 'danger', msg: warn };
      root.SEC_RULES.loki91 = { level: 'danger', msg: warn };
    }
    return true;
  }

  root.__loki = { S89: S89, S91: S91, P: P, SFN: SFN, mult8: mult8, exp8: exp8,
                  loki89: loki89Make, loki91: loki91Make, reg: regLoki };
  regLoki();
})();
