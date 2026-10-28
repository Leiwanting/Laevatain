/* crypto_safer.js — SAFER (Secure And Fast Encryption Routine)
 *
 * James Massey（IDEA 设计者之一）为 Cylink Corp 设计，1993。
 * 四个变体：K-64 / K-128（原版密钥调度），SK-64 / SK-128（Knudsen 强化密钥调度）。
 *
 * ── 参照物（三个互相独立的来源，非自证）────────────────────────────
 *  1. Massey 原论文附录 C：SAFER K-64 六轮的**逐轮中间值**（4 组，精确到每一轮）
 *  2. Crypto++ 公开测试向量：K-64 四条（6 轮）、K-128 四条（12 轮）
 *  3. LibTomCrypt src/ciphers/safer/safer.c：
 *       · 内嵌官方向量（K-64 6 轮 / SK-64 6 轮 / SK-128 10 轮）
 *       · 密钥调度源码，作者 Richard De Moliner, ETH Zurich（SAFER 官方实现者）
 *     另有 DarkCrypt SAFER-SK128 三条（8 轮）作第四方交叉验证
 *
 * ── 三个必须记住的坑（改错任何一个都会「不报错、只静默算错」）────────
 *  ⚠ PHT 三级：第二/三级不是朴素相邻配对，而是「配对 + 输出位置映射」的交织，
 *     等价于 LibTomCrypt 的 PHT(a,c)(e,g)(b,d)(f,h) → PHT(a,e)(b,f)(c,g)(d,h) → shuffle。
 *     朴素写法（(0,1)(2,3)(4,5)(6,7) / (0,2)(1,3)(4,6)(5,7) / (0,4)(1,5)(2,6)(3,7)）
 *     会得到一个「长度正确、加解密自洽、但与官方值逐字节不同」的结果。
 *  ⚠ 密钥调度：ka 初值 = ROL5(userkey_1)，kb 初值 = userkey_2（原始，且 K[1] = userkey_2）；
 *     之后每轮 ka/kb 各自 ROL6。不是论文伪码那种「累积 ROL3」的直觉写法
 *     （两者在 K-64 上数学等价，但只有 LTC 写法能正确推广到 128 位密钥）。
 *  ⚠ K-128 的 K[1] 取自**后半** userkey_2，不是前半。前后两半分别生成 K[2i] / K[2i+1]。
 */
(function (root) {
  'use strict';

  /* ── S 盒：45^x mod 257 ─────────────────────────────────────────
     值域 1..256；45^128 ≡ 256 (mod 257)，约定以 0 表示，故 EXP[128]=0、LOG[0]=128。 */
  var EXP = new Uint8Array(256);
  var LOG = new Uint8Array(256);
  (function () {
    /* ⚠ 必须用普通数组暂存，不能直接写进 Uint8Array：
       45^128 ≡ 256 (mod 257)，而 256 超出 Uint8Array 的 0..255 范围会被**静默截断成 0**，
       于是下一项 45*EXP[128] 变成 45*0，从第 129 项起整张表塌成全 0 —— 不报错，
       只是加密结果全错。Python 原型用 list 存得下 256，所以这个坑在原型里不会暴露。
       正确顺序：先在普通数组里算完（含 256），再把 128 号位置改写成 0。 */
    var e = [];
    e[0] = 1;
    for (var i = 1; i < 256; i++) e[i] = (45 * e[i - 1]) % 257;
    e[128] = 0;                       // 约定：45^128 ≡ 256，以 0 表示
    for (var j = 1; j < 256; j++) LOG[e[j]] = j;
    LOG[0] = 128;                     // 上一步 j=128 时 e[128] 已是 0，这里等价
    for (var k = 0; k < 256; k++) EXP[k] = e[k];
  })();

  function rol8(x, n) { return ((x << n) | ((x & 0xFF) >> (8 - n))) & 0xFF; }

  /* 位置分组：0,3,4,7 与 1,2,5,6 两组，交替使用 XOR/add 与 exp/log */
  function isA(j) { return j === 0 || j === 3 || j === 4 || j === 7; }

  /* ── 密钥调度（严格照 LibTomCrypt safer_expand_userkey）───────────
     uk1/uk2 各 8 字节：K-64/SK-64 传同一份密钥；K-128/SK-128 传前后两半。
     ka/kb 各 9 字节，第 9 字节是 parity byte（仅 SK 版通过循环索引用到）。 */
  function expand(uk1, uk2, r, strengthened) {
    var ka = new Uint8Array(9), kb = new Uint8Array(9);
    var K = [], i, j, k;
    for (i = 0; i <= 2 * r + 1; i++) K.push(new Uint8Array(8));

    for (j = 0; j < 8; j++) {
      ka[j] = rol8(uk1[j], 5); ka[8] ^= ka[j];
      kb[j] = uk2[j]; K[1][j] = uk2[j]; kb[8] ^= kb[j];
    }
    for (i = 1; i <= r; i++) {
      for (j = 0; j < 9; j++) { ka[j] = rol8(ka[j], 6); kb[j] = rol8(kb[j], 6); }
      k = strengthened ? (2 * i - 1) % 9 : 0;
      for (j = 0; j < 8; j++) {
        var b1 = EXP[EXP[(18 * i + j + 1) & 0xFF]];
        K[2 * i][j] = ((strengthened ? ka[k] : ka[j]) + b1) & 0xFF;
        if (strengthened) { k++; if (k === 9) k = 0; }
      }
      k = strengthened ? (2 * i) % 9 : 0;
      for (j = 0; j < 8; j++) {
        var b2 = EXP[EXP[(18 * i + j + 10) & 0xFF]];
        K[2 * i + 1][j] = ((strengthened ? kb[k] : kb[j]) + b2) & 0xFF;
        if (strengthened) { k++; if (k === 9) k = 0; }
      }
    }
    return K;
  }

  /* ── PHT（Pseudo-Hadamard Transform）─────────────────────────────
     mat1(x,y) -> (2x+y, x+y)；逆 IPHT(u,v) -> (u-v, 2v-u)，注意第二个分量用**新**的 u
     （LibTomCrypt: {x -= y; y -= x;}）。 */
  function fL1(a) {
    var o = new Uint8Array(8), p = [[0, 1], [2, 3], [4, 5], [6, 7]], i;
    for (i = 0; i < 4; i++) {
      var x = a[p[i][0]], y = a[p[i][1]], s = (x + y) & 0xFF;
      o[p[i][0]] = (s + x) & 0xFF; o[p[i][1]] = s;
    }
    return o;
  }
  /* 交织层：配对 (0,2)(4,6)(1,3)(5,7)，结果依次落到 (0,1)(2,3)(4,5)(6,7) */
  var M2 = [[0, 2, 0, 1], [4, 6, 2, 3], [1, 3, 4, 5], [5, 7, 6, 7]];
  function fL2(a) {
    var o = new Uint8Array(8), i;
    for (i = 0; i < 4; i++) {
      var x = a[M2[i][0]], y = a[M2[i][1]], s = (x + y) & 0xFF;
      o[M2[i][2]] = (s + x) & 0xFF; o[M2[i][3]] = s;
    }
    return o;
  }
  function iL1(a) {
    var o = new Uint8Array(8), p = [[0, 1], [2, 3], [4, 5], [6, 7]], i;
    for (i = 0; i < 4; i++) {
      var u = a[p[i][0]], v = a[p[i][1]], x = (u - v) & 0xFF;
      o[p[i][0]] = x; o[p[i][1]] = (v - x) & 0xFF;
    }
    return o;
  }
  function iL2(a) {
    var o = new Uint8Array(8), i;
    for (i = 0; i < 4; i++) {
      var u = a[M2[i][2]], v = a[M2[i][3]], x = (u - v) & 0xFF;
      o[M2[i][0]] = x; o[M2[i][1]] = (v - x) & 0xFF;
    }
    return o;
  }

  function cryptBlock(K, r, pt, doEnc) {
    var a = new Uint8Array(8), b = new Uint8Array(8), i, j;
    for (j = 0; j < 8; j++) a[j] = pt[j];

    if (doEnc) {
      for (i = 1; i <= r; i++) {
        for (j = 0; j < 8; j++) { if (isA(j)) a[j] ^= K[2 * i - 1][j]; else a[j] = (a[j] + K[2 * i - 1][j]) & 0xFF; }
        for (j = 0; j < 8; j++) b[j] = isA(j) ? EXP[a[j]] : LOG[a[j]];
        for (j = 0; j < 8; j++) a[j] = b[j];
        for (j = 0; j < 8; j++) { if (isA(j)) a[j] = (a[j] + K[2 * i][j]) & 0xFF; else a[j] ^= K[2 * i][j]; }
        a = fL2(fL2(fL1(a)));
      }
      for (j = 0; j < 8; j++) { if (isA(j)) a[j] ^= K[2 * r + 1][j]; else a[j] = (a[j] + K[2 * r + 1][j]) & 0xFF; }
    } else {
      for (j = 0; j < 8; j++) { if (isA(j)) a[j] ^= K[2 * r + 1][j]; else a[j] = (a[j] - K[2 * r + 1][j]) & 0xFF; }
      for (i = r; i >= 1; i--) {
        a = iL2(a); a = iL2(a); a = iL1(a);   // 正向 fL1→fL2→fL2 的逆：iL2→iL2→iL1
        for (j = 0; j < 8; j++) { if (isA(j)) a[j] = (a[j] - K[2 * i][j]) & 0xFF; else a[j] ^= K[2 * i][j]; }
        for (j = 0; j < 8; j++) b[j] = isA(j) ? LOG[a[j]] : EXP[a[j]];
        for (j = 0; j < 8; j++) a[j] = b[j];
        for (j = 0; j < 8; j++) { if (isA(j)) a[j] ^= K[2 * i - 1][j]; else a[j] = (a[j] - K[2 * i - 1][j]) & 0xFF; }
      }
    }
    return a;
  }

  /* 单轮加密（第 i 轮，不含输出变换）—— 用于比对 Massey 论文的逐轮中间值 */
  function roundEnc(K, i, a) {
    var b = new Uint8Array(8), t = new Uint8Array(8), j;
    for (j = 0; j < 8; j++) b[j] = a[j];
    for (j = 0; j < 8; j++) { if (isA(j)) b[j] ^= K[2 * i - 1][j]; else b[j] = (b[j] + K[2 * i - 1][j]) & 0xFF; }
    for (j = 0; j < 8; j++) t[j] = isA(j) ? EXP[b[j]] : LOG[b[j]];
    for (j = 0; j < 8; j++) b[j] = t[j];
    for (j = 0; j < 8; j++) { if (isA(j)) b[j] = (b[j] + K[2 * i][j]) & 0xFF; else b[j] ^= K[2 * i][j]; }
    return fL2(fL2(fL1(b)));
  }

  function saferMake(tag, r, strengthened, keyLen) {
    return function (keyBytes) {
      if (!keyBytes || keyBytes.length !== keyLen) {
        throw new Error('SAFER ' + tag + ' 密钥必须是 ' + keyLen + ' 字节（' + (keyLen * 8) +
          ' 位），实得 ' + (keyBytes ? keyBytes.length : 0));
      }
      var u1 = new Uint8Array(8), u2 = new Uint8Array(8), i;
      for (i = 0; i < 8; i++) { u1[i] = keyBytes[i]; u2[i] = keyLen === 16 ? keyBytes[8 + i] : keyBytes[i]; }
      var K = expand(u1, u2, r, strengthened);
      return {
        enc: function (b) {
          if (!b || b.length !== 8) throw new Error('SAFER 块必须是 8 字节，实得 ' + (b ? b.length : 0));
          return cryptBlock(K, r, b, true);
        },
        dec: function (b) {
          if (!b || b.length !== 8) throw new Error('SAFER 块必须是 8 字节，实得 ' + (b ? b.length : 0));
          return cryptBlock(K, r, b, false);
        }
      };
    };
  }

  var VARIANTS = [
    { id: 'safer-k64',   name: 'SAFER K-64',   r: 6,  sk: false, kl: 8  },
    { id: 'safer-k128',  name: 'SAFER K-128',  r: 12, sk: false, kl: 16 },
    { id: 'safer-sk64',  name: 'SAFER SK-64',  r: 8,  sk: true,  kl: 8  },
    { id: 'safer-sk128', name: 'SAFER SK-128', r: 10, sk: true,  kl: 16 }
  ];

  function regSafer() {
    if (!root || typeof root.regSym !== 'function') return false;
    var warn = '⚠ 64 位分组：同密钥下加密超过约 2^32 个块（≈32GB）后生日攻击风险显著；' +
               'SAFER 系列已被 SAFER+/SAFER++ 取代，本实现主要用于互操作与教学。';
    VARIANTS.forEach(function (v) {
      root.regSym({
        id: v.id, name: v.name, group: '对称加密',
        blockSize: 8, keyLen: v.kl,
        keyLabel: '密钥（口令派生 ' + v.kl + ' 字节；原始密钥模式填 ' + (v.kl * 2) + ' 位 Hex）',
        makeBlockFn: saferMake(v.name, v.r, v.sk, v.kl),
        info: v.name + '（Massey, Cylink, 1993' + (v.sk ? '；Knudsen 强化密钥调度 1995' : '') + '）：' +
              '64 位块 / ' + (v.kl * 8) + ' 位密钥 / ' + v.r + ' 轮，非 Feistel 结构。' +
              '每轮 = 子密钥混合（XOR 与 mod 256 加交替）→ S 盒层（45^x 与 log_45 交替）→ ' +
              '子密钥混合 → 三级 PHT 扩散。' + warn
      });
      if (typeof root.SEC_RULES === 'object') {
        root.SEC_RULES[v.id] = { level: 'danger', msg: warn };
      }
    });
    return true;
  }

  regSafer();

  root.__safer = {
    EXP: EXP, LOG: LOG, expand: expand, cryptBlock: cryptBlock, roundEnc: roundEnc,
    variants: VARIANTS,
    /* 供测试：用任意轮数构造（官方向量里有 6 轮的 SK-64） */
    make: function (r, strengthened, keyLen) { return saferMake('r' + r, r, strengthened, keyLen); },
    reg: regSafer
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
