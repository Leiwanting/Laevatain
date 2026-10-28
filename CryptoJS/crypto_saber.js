/* ============================================================
 * Saber —— 基于模格（MLWR）的 IND-CCA2 密钥封装机制
 *   LightSaber (L=2, MU=10, ET=3) / Saber (L=3, MU=8, ET=4) / FireSaber (L=4, MU=6, ET=6)
 * ------------------------------------------------------------
 * 参照物：KULeuven-COSIC/SABER 官方 Reference_Implementation_KEM
 *        （cbd.c / poly.c / pack_unpack.c / SABER_indcpa.c / kem.c 逐行转写）
 * 向量：官方 KAT/PQCkemKAT_*.rsp，每组含 count/seed/pk/sk/ct/ss
 * ------------------------------------------------------------
 * ⚠ 四个实测踩过的坑（改代码前务必读）：
 *   1. indcpa_kem_keypair 里 seed_A 被【就地覆盖】：
 *        randombytes(seed_A,32); shake128(seed_A,32,seed_A,32); randombytes(seed_s,32);
 *      即 GenMatrix 用的不是 DRBG 直接输出，而是 shake128 之后的值。
 *      漏掉这一步 → pk 完全对不上，且不报错。
 *   2. cbd() 写目标数组时【必须带多项式偏移】sOff。三个多项式若都写进
 *      s[0..255]，采样结果仍然"像合法 CBD 分布"（都在 [-μ,μ] 内），
 *      自洽测试发现不了，只有官方 KAT 能抓出来。
 *   3. MU=10（LightSaber）的 d 可达 40 位，必须用 BigInt。
 *      用 Math.floor(d/2**k) & 0x1f 时 `&` 会先把操作数转 int32，
 *      高 8 位被截掉 → 采样全错。
 *   4. 多项式乘法系数运算在【uint16 环】上（mod 2^16），不是 mod 2^13。
 *      s 用 16 位补码表示负数（如 -1 → 65535），乘积累加自然回绕；
 *      打包成 13 bit 时才落到 mod 2^13。中途强行 mod 2^13 会全错。
 * ============================================================ */
(function () {
  'use strict';
  if (typeof ALGOS === 'undefined') return;

  /* ---------------- 参数化内核 ---------------- */
  function makeSaber(P) {
    var N = 256, EQ = 13, EP = 10;
    var L = P.L, MU = P.MU, ET = P.ET;
    var POLYBYTES = EQ * N / 8;                    // 416
    var POLYVECBYTES = L * POLYBYTES;
    var POLYCOINBYTES = MU * N / 8;
    var POLYCOMPRESSEDBYTES = EP * N / 8;          // 320
    var POLYVECCOMPRESSEDBYTES = L * POLYCOMPRESSEDBYTES;
    var SCALEBYTES_KEM = ET * N / 8;
    var INCPA_PKBYTES = POLYVECCOMPRESSEDBYTES + 32;
    var PKBYTES = INCPA_PKBYTES;
    var SKBYTES = POLYVECBYTES + INCPA_PKBYTES + 32 + 32;
    var CTBYTES = POLYVECCOMPRESSEDBYTES + SCALEBYTES_KEM;
    var h1 = 1 << (EQ - EP - 1);
    var h2 = (1 << (EP - 2)) - (1 << (EP - ET - 1)) + (1 << (EQ - EP - 1));

    function BS2POLq(by, off, d, doff) {
      for (var j = 0; j < N / 8; j++) {
        var ob = off + 13 * j, od = doff + 8 * j;
        d[od + 0] = (by[ob + 0] & 0xff) | ((by[ob + 1] & 0x1f) << 8);
        d[od + 1] = ((by[ob + 1] >> 5) & 0x07) | ((by[ob + 2] & 0xff) << 3) | ((by[ob + 3] & 0x03) << 11);
        d[od + 2] = ((by[ob + 3] >> 2) & 0x3f) | ((by[ob + 4] & 0x7f) << 6);
        d[od + 3] = ((by[ob + 4] >> 7) & 0x01) | ((by[ob + 5] & 0xff) << 1) | ((by[ob + 6] & 0x0f) << 9);
        d[od + 4] = ((by[ob + 6] >> 4) & 0x0f) | ((by[ob + 7] & 0xff) << 4) | ((by[ob + 8] & 0x01) << 12);
        d[od + 5] = ((by[ob + 8] >> 1) & 0x7f) | ((by[ob + 9] & 0x3f) << 7);
        d[od + 6] = ((by[ob + 9] >> 6) & 0x03) | ((by[ob + 10] & 0xff) << 2) | ((by[ob + 11] & 0x07) << 10);
        d[od + 7] = ((by[ob + 11] >> 3) & 0x1f) | ((by[ob + 12] & 0xff) << 5);
      }
    }
    function POLq2BS(d, doff, by, off) {
      for (var j = 0; j < N / 8; j++) {
        var ob = off + 13 * j, od = doff + 8 * j;
        by[ob + 0] = d[od + 0] & 0xff;
        by[ob + 1] = ((d[od + 0] >> 8) & 0x1f) | ((d[od + 1] & 0x07) << 5);
        by[ob + 2] = (d[od + 1] >> 3) & 0xff;
        by[ob + 3] = ((d[od + 1] >> 11) & 0x03) | ((d[od + 2] & 0x3f) << 2);
        by[ob + 4] = ((d[od + 2] >> 6) & 0x7f) | ((d[od + 3] & 0x01) << 7);
        by[ob + 5] = (d[od + 3] >> 1) & 0xff;
        by[ob + 6] = ((d[od + 3] >> 9) & 0x0f) | ((d[od + 4] & 0x0f) << 4);
        by[ob + 7] = (d[od + 4] >> 4) & 0xff;
        by[ob + 8] = ((d[od + 4] >> 12) & 0x01) | ((d[od + 5] & 0x7f) << 1);
        by[ob + 9] = ((d[od + 5] >> 7) & 0x3f) | ((d[od + 6] & 0x03) << 6);
        by[ob + 10] = (d[od + 6] >> 2) & 0xff;
        by[ob + 11] = ((d[od + 6] >> 10) & 0x07) | ((d[od + 7] & 0x1f) << 3);
        by[ob + 12] = (d[od + 7] >> 5) & 0xff;
      }
    }
    function POLp2BS(d, doff, by, off) {
      for (var j = 0; j < N / 4; j++) {
        var ob = off + 5 * j, od = doff + 4 * j;
        by[ob + 0] = d[od + 0] & 0xff;
        by[ob + 1] = ((d[od + 0] >> 8) & 0x03) | ((d[od + 1] & 0x3f) << 2);
        by[ob + 2] = ((d[od + 1] >> 6) & 0x0f) | ((d[od + 2] & 0x0f) << 4);
        by[ob + 3] = ((d[od + 2] >> 4) & 0x3f) | ((d[od + 3] & 0x03) << 6);
        by[ob + 4] = (d[od + 3] >> 2) & 0xff;
      }
    }
    function BS2POLp(by, off, d, doff) {
      for (var j = 0; j < N / 4; j++) {
        var ob = off + 5 * j, od = doff + 4 * j;
        d[od + 0] = (by[ob + 0] & 0xff) | ((by[ob + 1] & 0x03) << 8);
        d[od + 1] = ((by[ob + 1] >> 2) & 0x3f) | ((by[ob + 2] & 0x0f) << 6);
        d[od + 2] = ((by[ob + 2] >> 4) & 0x0f) | ((by[ob + 3] & 0x3f) << 4);
        d[od + 3] = ((by[ob + 3] >> 6) & 0x03) | ((by[ob + 4] & 0xff) << 2);
      }
    }
    function POLT2BS(d, doff, by, off) {
      var j, ob, od;
      if (ET === 3) {
        for (j = 0; j < N / 8; j++) {
          ob = off + 3 * j; od = doff + 8 * j;
          by[ob + 0] = (d[od + 0] & 0x7) | ((d[od + 1] & 0x7) << 3) | ((d[od + 2] & 0x3) << 6);
          by[ob + 1] = ((d[od + 2] >> 2) & 0x01) | ((d[od + 3] & 0x7) << 1) | ((d[od + 4] & 0x7) << 4) | ((d[od + 5] & 0x01) << 7);
          by[ob + 2] = ((d[od + 5] >> 1) & 0x03) | ((d[od + 6] & 0x7) << 2) | ((d[od + 7] & 0x7) << 5);
        }
      } else if (ET === 4) {
        for (j = 0; j < N / 2; j++) { by[off + j] = (d[doff + 2 * j] & 0x0f) | ((d[doff + 2 * j + 1] & 0x0f) << 4); }
      } else {
        for (j = 0; j < N / 4; j++) {
          ob = off + 3 * j; od = doff + 4 * j;
          by[ob + 0] = (d[od + 0] & 0x3f) | ((d[od + 1] & 0x03) << 6);
          by[ob + 1] = ((d[od + 1] >> 2) & 0x0f) | ((d[od + 2] & 0x0f) << 4);
          by[ob + 2] = ((d[od + 2] >> 4) & 0x03) | ((d[od + 3] & 0x3f) << 2);
        }
      }
    }
    function BS2POLT(by, off, d, doff) {
      var j, ob, od;
      if (ET === 3) {
        for (j = 0; j < N / 8; j++) {
          ob = off + 3 * j; od = doff + 8 * j;
          d[od + 0] = by[ob + 0] & 0x07;
          d[od + 1] = (by[ob + 0] >> 3) & 0x07;
          d[od + 2] = ((by[ob + 0] >> 6) & 0x03) | ((by[ob + 1] & 0x01) << 2);
          d[od + 3] = (by[ob + 1] >> 1) & 0x07;
          d[od + 4] = (by[ob + 1] >> 4) & 0x07;
          d[od + 5] = ((by[ob + 1] >> 7) & 0x01) | ((by[ob + 2] & 0x03) << 1);
          d[od + 6] = (by[ob + 2] >> 2) & 0x07;
          d[od + 7] = (by[ob + 2] >> 5) & 0x07;
        }
      } else if (ET === 4) {
        for (j = 0; j < N / 2; j++) { d[doff + 2 * j] = by[off + j] & 0x0f; d[doff + 2 * j + 1] = (by[off + j] >> 4) & 0x0f; }
      } else {
        for (j = 0; j < N / 4; j++) {
          ob = off + 3 * j; od = doff + 4 * j;
          d[od + 0] = by[ob + 0] & 0x3f;
          d[od + 1] = ((by[ob + 0] >> 6) & 0x03) | ((by[ob + 1] & 0x0f) << 2);
          d[od + 2] = ((by[ob + 1] & 0xff) >> 4) | ((by[ob + 2] & 0x03) << 4);
          d[od + 3] = ((by[ob + 2] & 0xff) >> 2);
        }
      }
    }
    function BS2POLmsg(by, off, d) { for (var j = 0; j < 32; j++) for (var i = 0; i < 8; i++) d[j * 8 + i] = (by[off + j] >> i) & 0x01; }
    function POLmsg2BS(d, by, off) {
      for (var i = 0; i < 32; i++) by[off + i] = 0;
      for (var j = 0; j < 32; j++) for (var i2 = 0; i2 < 8; i2++) by[off + j] |= ((d[j * 8 + i2] & 0x01) << i2);
    }
    /* CBD 噪声采样：s[k] = popcount(a) - popcount(b)，用 16 位补码表示负数 */
    function cbd(buf, off, s, sOff) {
      var i, j, k, t, d;
      if (MU === 8) {
        for (i = 0; i < N / 4; i++) {
          t = 0; for (k = 0; k < 4; k++) t |= buf[off + 4 * i + k] << (8 * k);
          d = 0; for (j = 0; j < 4; j++) d += (t >>> j) & 0x11111111;
          s[sOff + 4 * i + 0] = ((d & 0xf) - ((d >> 4) & 0xf)) & 0xffff;
          s[sOff + 4 * i + 1] = (((d >> 8) & 0xf) - ((d >> 12) & 0xf)) & 0xffff;
          s[sOff + 4 * i + 2] = (((d >> 16) & 0xf) - ((d >> 20) & 0xf)) & 0xffff;
          s[sOff + 4 * i + 3] = (((d >> 24) & 0xf) - ((d >> 28) & 0xf)) & 0xffff;
        }
      } else if (MU === 6) {
        for (i = 0; i < N / 4; i++) {
          t = 0; for (k = 0; k < 3; k++) t |= buf[off + 3 * i + k] << (8 * k);
          d = 0; for (j = 0; j < 3; j++) d += (t >>> j) & 0x249249;
          s[sOff + 4 * i + 0] = ((d & 0x7) - ((d >> 3) & 0x7)) & 0xffff;
          s[sOff + 4 * i + 1] = (((d >> 6) & 0x7) - ((d >> 9) & 0x7)) & 0xffff;
          s[sOff + 4 * i + 2] = (((d >> 12) & 0x7) - ((d >> 15) & 0x7)) & 0xffff;
          s[sOff + 4 * i + 3] = (((d >> 18) & 0x7) - (d >> 21)) & 0xffff;
        }
      } else {
        /* MU=10：d 可达 40 位，必须 BigInt（见文件头坑 3） */
        for (i = 0; i < N / 4; i++) {
          var tb = 0n;
          for (k = 0; k < 5; k++) tb |= BigInt(buf[off + 5 * i + k]) << BigInt(8 * k);
          var db = 0n; var MASK = 0x0842108421n;
          for (j = 0; j < 5; j++) db += (tb >> BigInt(j)) & MASK;
          var ex = function (sh) { return Number((db >> BigInt(sh)) & 0x1fn); };
          s[sOff + 4 * i + 0] = (ex(0) - ex(5)) & 0xffff;
          s[sOff + 4 * i + 1] = (ex(10) - ex(15)) & 0xffff;
          s[sOff + 4 * i + 2] = (ex(20) - ex(25)) & 0xffff;
          s[sOff + 4 * i + 3] = (ex(30) - ex(35)) & 0xffff;
        }
      }
    }
    /* res += a*b (mod x^256+1)，系数运算在 uint16 环上（见文件头坑 4） */
    function polyMulAcc(a, ao, b, bo, res, ro) {
      var c = new Uint16Array(2 * N), i, j;
      for (i = 0; i < N; i++) {
        var ai = a[ao + i]; if (!ai) continue;
        for (j = 0; j < N; j++) c[i + j] = (c[i + j] + ai * b[bo + j]) & 0xffff;
      }
      for (i = N; i < 2 * N; i++) res[ro + i - N] = (res[ro + i - N] + (c[i - N] - c[i])) & 0xffff;
    }
    function GenMatrix(seed) {
      var buf = shake128Digest(seed, L * POLYVECBYTES), A = [], i, k;
      for (i = 0; i < L; i++) { var v = new Uint16Array(L * N); for (k = 0; k < L; k++) BS2POLq(buf, i * POLYVECBYTES + k * POLYBYTES, v, k * N); A.push(v); }
      return A;
    }
    function GenSecret(seed) {
      var buf = shake128Digest(seed, L * POLYCOINBYTES), s = new Uint16Array(L * N);
      for (var i = 0; i < L; i++) cbd(buf, i * POLYCOINBYTES, s, i * N);
      return s;
    }
    function mvmul(A, s, tr) {
      var res = new Uint16Array(L * N);
      for (var i = 0; i < L; i++) for (var j = 0; j < L; j++) {
        if (tr) polyMulAcc(A[j], i * N, s, j * N, res, i * N);
        else polyMulAcc(A[i], j * N, s, j * N, res, i * N);
      }
      return res;
    }
    function innerProd(b, s) { var res = new Uint16Array(N); for (var j = 0; j < L; j++) polyMulAcc(b, j * N, s, j * N, res, 0); return res; }
    function indcpaKeygen(seedA, seedS) {
      var A = GenMatrix(seedA), s = GenSecret(seedS), b = mvmul(A, s, 1), i, j;
      for (i = 0; i < L; i++) for (j = 0; j < N; j++) b[i * N + j] = (b[i * N + j] + h1) >>> (EQ - EP);
      var sk = new Uint8Array(POLYVECBYTES), pk = new Uint8Array(INCPA_PKBYTES);
      for (i = 0; i < L; i++) { POLq2BS(s, i * N, sk, i * POLYBYTES); POLp2BS(b, i * N, pk, i * POLYCOMPRESSEDBYTES); }
      pk.set(seedA, POLYVECCOMPRESSEDBYTES);
      return { pk: pk, sk: sk };
    }
    function indcpaEnc(m, seedSp, pk) {
      var seedA = pk.subarray(POLYVECCOMPRESSEDBYTES, POLYVECCOMPRESSEDBYTES + 32);
      var A = GenMatrix(seedA), sp = GenSecret(seedSp), bp = mvmul(A, sp, 0), i, j;
      for (i = 0; i < L; i++) for (j = 0; j < N; j++) bp[i * N + j] = (bp[i * N + j] + h1) >>> (EQ - EP);
      var ct = new Uint8Array(CTBYTES), b = new Uint16Array(L * N);
      for (i = 0; i < L; i++) { POLp2BS(bp, i * N, ct, i * POLYCOMPRESSEDBYTES); BS2POLp(pk, i * POLYCOMPRESSEDBYTES, b, i * N); }
      var vp = innerProd(b, sp), mp = new Uint16Array(N);
      BS2POLmsg(m, 0, mp);
      for (j = 0; j < N; j++) vp[j] = (vp[j] - (mp[j] << (EP - 1)) + h1) >>> (EP - ET);
      POLT2BS(vp, 0, ct, POLYVECCOMPRESSEDBYTES);
      return ct;
    }
    function indcpaDec(sk, ct) {
      var s = new Uint16Array(L * N), b = new Uint16Array(L * N), i;
      for (i = 0; i < L; i++) { BS2POLq(sk, i * POLYBYTES, s, i * N); BS2POLp(ct, i * POLYCOMPRESSEDBYTES, b, i * N); }
      var v = innerProd(b, s), cm = new Uint16Array(N);
      BS2POLT(ct, POLYVECCOMPRESSEDBYTES, cm, 0);
      for (i = 0; i < N; i++) v[i] = (v[i] + h2 - (cm[i] << (EP - ET))) >>> (EP - 1);
      var m = new Uint8Array(32); POLmsg2BS(v, m, 0);
      return m;
    }
    /* 完整 IND-CCA2 KEM */
    function kemKeygen(rnd) {
      var seedA0 = rnd(32);
      var seedA = shake128Digest(seedA0, 32);          /* 坑 1：就地覆盖 */
      var seedS = rnd(32);
      var kg = indcpaKeygen(seedA, seedS);
      var sk = new Uint8Array(SKBYTES);
      sk.set(kg.sk, 0); sk.set(kg.pk, POLYVECBYTES);
      sk.set(sha3_256(kg.pk), SKBYTES - 64);
      sk.set(rnd(32), SKBYTES - 32);
      return { pk: kg.pk, sk: sk };
    }
    function kemEncaps(pk, rnd) {
      if (pk.length !== PKBYTES) throw new Error('公钥长度应为 ' + PKBYTES + ' 字节，实得 ' + pk.length);
      var rbuf = rnd(32), m = sha3_256(rbuf), b2 = new Uint8Array(64);
      b2.set(m, 0); b2.set(sha3_256(pk), 32);
      var kr = sha3_512(b2), ct = indcpaEnc(m, kr.subarray(32, 64), pk);
      var kr2 = new Uint8Array(64);
      kr2.set(kr.subarray(0, 32), 0); kr2.set(sha3_256(ct), 32);
      return { ct: ct, ss: sha3_256(kr2) };
    }
    function kemDecaps(ct, sk) {
      if (ct.length !== CTBYTES) throw new Error('密文长度应为 ' + CTBYTES + ' 字节，实得 ' + ct.length);
      if (sk.length !== SKBYTES) throw new Error('私钥长度应为 ' + SKBYTES + ' 字节，实得 ' + sk.length);
      var pk = sk.subarray(POLYVECBYTES, POLYVECBYTES + PKBYTES);
      var m = indcpaDec(sk, ct), b3 = new Uint8Array(64);
      b3.set(m, 0); b3.set(sk.subarray(SKBYTES - 64, SKBYTES - 32), 32);
      var kr = sha3_512(b3), cmp = indcpaEnc(m, kr.subarray(32, 64), pk), fail = 0;
      for (var i = 0; i < cmp.length; i++) if (cmp[i] !== ct[i]) { fail = 1; break; }
      var kr2 = new Uint8Array(64);
      kr2.set(fail ? sk.subarray(SKBYTES - 32, SKBYTES) : kr.subarray(0, 32), 0);
      kr2.set(sha3_256(ct), 32);
      return sha3_256(kr2);
    }
    return { L: L, PKBYTES: PKBYTES, SKBYTES: SKBYTES, CTBYTES: CTBYTES, SSBYTES: 32, POLYVECBYTES: POLYVECBYTES, kemKeygen: kemKeygen, kemEncaps: kemEncaps, kemDecaps: kemDecaps };
  }

  function rndBytes(n) {
    var b = new Uint8Array(n);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b);
    else { for (var i = 0; i < n; i++) b[i] = (Math.random() * 256) | 0; }
    return b;
  }

  var SETS = [
    { id: 'lightsaber', name: 'LightSaber', L: 2, MU: 10, ET: 3 },
    { id: 'saber', name: 'Saber', L: 3, MU: 8, ET: 4 },
    { id: 'firesaber', name: 'FireSaber', L: 4, MU: 6, ET: 6 }
  ];

  SETS.forEach(function (S) {
    var K = makeSaber(S);
    var info = S.name + '：基于模格 MLWR 的 IND-CCA2 KEM（NIST Round 3 决赛候选）。\n' +
      '参数 L=' + S.L + ' · μ=' + S.MU + ' · T=2^' + S.ET + '；' +
      '公钥 ' + K.PKBYTES + ' 字节 · 私钥 ' + K.SKBYTES + ' 字节 · 密文 ' + K.CTBYTES + ' 字节 · 共享密钥 32 字节。\n' +
      '实现照 KULeuven-COSIC/SABER 官方参考实现转写，官方 KAT 全参数集通过。\n' +
      '封装需要随机性（每次结果不同）；解封装确定（同 ct+sk 必得同 ss）。';

    reg({
      id: S.id + '-keygen', name: S.name + ' 密钥生成',
      group: '后量子密码', key: false, param: true,
      paramLabel: '留空=同时输出公私钥；填 sk=只输出私钥',
      info: info,
      enc: function (b, kk, pp, fmt) {
        var kp = K.kemKeygen(rndBytes);
        if (pp && /sk/i.test(String(pp))) return bytesOut(kp.sk, fmt);
        return bytesOut(kp.pk, fmt) + '\n::K::' + bytesOut(kp.sk, fmt);
      }, dec: false
    });
    reg({
      id: S.id + '-encaps', name: S.name + ' 封装（公钥加密）',
      group: '后量子密码', key: true, param: false,
      keyLabel: '封装公钥（' + K.PKBYTES + ' 字节 Hex，' + K.PKBYTES * 2 + ' 字符）',
      info: info,
      enc: function (b, kk, pp, fmt) {
        if (!kk) throw new Error('请在密钥栏填入封装公钥（Hex，' + K.PKBYTES * 2 + ' 字符）');
        var pk = hexToBytes(String(kk).replace(/\s/g, ''));
        var out = K.kemEncaps(pk, rndBytes);
        return bytesOut(out.ct, fmt) + '\n::K::' + bytesOut(out.ss, fmt);
      }, dec: false
    });
    reg({
      id: S.id + '-decaps', name: S.name + ' 解封装（私钥解密）',
      group: '后量子密码', key: true, param: false,
      keyLabel: '解封装私钥（' + K.SKBYTES + ' 字节 Hex，' + K.SKBYTES * 2 + ' 字符）',
      info: info,
      enc: function (b, kk, pp, fmt) {
        if (!kk) throw new Error('请在密钥栏填入解封装私钥（Hex，' + K.SKBYTES * 2 + ' 字符）');
        var sk = hexToBytes(String(kk).replace(/\s/g, ''));
        var ct = bytesIn(String(b), fmt);
        return bytesOut(K.kemDecaps(ct, sk), fmt);
      }, dec: false
    });
  });

  /* 供 testscript/t_saber.js 直接比对官方 KAT（绕过条目层格式化） */
  var KATS = {};
  SETS.forEach(function (S) { KATS[S.id] = makeSaber(S); });
  globalThis.__saberKat = KATS;
})();
