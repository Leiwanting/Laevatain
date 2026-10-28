/* ============================================================
 * NTRU-HPS / NTRU-HRSS（NIST Round 3 KEM，非 FIPS 203 体系）
 * 参考实现：PQClean clean 分支（commit 81a0bf97e201）
 * 转写方式：逐函数对齐 C 源码语义；poly_Rq_mul 用 schoolbook 直算
 *           （Toom-4 与 schoolbook 在「系数 mod 2^16、再 mod (x^N-1)」
 *             下完全等价，已由官方二进制差分 800+ 组钉死）
 * ============================================================ */
(function () {
  if (typeof reg !== 'function') return;

  function makeNtru(P) {
    var N = P.N, LOGQ = P.LOGQ, Q = 1 << LOGQ, MASKQ = Q - 1;
    var PACKDEG = N - 1;
    var PT = Math.floor((PACKDEG + 4) / 5);          /* PACK_TRINARY_BYTES */
    var PUB = Math.floor((LOGQ * PACKDEG + 7) / 8);  /* 公钥 = 密文长度 */
    var CTB = PUB;
    var OWSK = 2 * PT + PUB;
    var SKB = OWSK + 32;
    var MSGB = 2 * PT;
    var WEIGHT = P.hrss ? 0 : (Q / 8 - 2);
    var IIDB = N - 1;
    var FTB = Math.floor((30 * (N - 1) + 7) / 8);
    var FGB = P.hrss ? 2 * IIDB : IIDB + FTB;
    var RMB = FGB;

    function newPoly() { return new Uint16Array(N); }

    /* ---- poly_Rq_mul：schoolbook + mod (x^N-1)，每步截断到 16 位 ---- */
    function rqMul(a, b) {
      var r = new Float64Array(2 * N - 1), i, j, ai;
      for (i = 0; i < N; i++) {
        ai = a[i];
        if (!ai) continue;
        for (j = 0; j < N; j++) r[i + j] += ai * b[j];
      }
      var out = new Float64Array(N);
      for (i = 0; i < 2 * N - 1; i++) out[i % N] += r[i];
      var o = newPoly();
      for (i = 0; i < N; i++) o[i] = out[i] & 0xffff;
      return o;
    }

    /* 累加值 < 2^53（N ≤ 821，每项 ≤ 2^32），& 0xffff 与 C 的 uint16 截断同余 */
    function modQ(x) { return x & MASKQ; }

    /* ---- mod3：{0..65535} -> {0,1,2} ---- */
    function mod3(a) {
      var r = (a >> 8) + (a & 0xff);
      r = (r >> 4) + (r & 0xf);
      r = (r >> 2) + (r & 0x3);
      r = (r >> 2) + (r & 0x3);
      var t = r - 3, c = t >> 15;
      return (c & r) ^ (~c & t);
    }
    function mod3b(a) { /* a in 0..9 */
      a = (a >> 2) + (a & 3);
      var t = a - 3, c = t >> 5;
      return t ^ (c & (a ^ t));
    }

    function mod3Phi(r) {
      var last = r[N - 1], i;
      for (i = 0; i < N; i++) r[i] = mod3(r[i] + 2 * last);
      return r;
    }
    function modQPhi(r) {
      var last = r[N - 1], i;
      for (i = 0; i < N; i++) r[i] = (r[i] - last) & 0xffff;
      return r;
    }
    function Z3toZq(r) {
      for (var i = 0; i < N; i++) r[i] = r[i] | ((-(r[i] >> 1)) & MASKQ);
      return r;
    }
    function trinaryZqToZ3(r) {
      for (var i = 0; i < N; i++) {
        r[i] = modQ(r[i]);
        r[i] = 3 & (r[i] ^ (r[i] >> (LOGQ - 1)));
      }
      return r;
    }
    function SqMul(a, b) { return modQPhi(rqMul(a, b)); }
    function S3Mul(a, b) {
      var r = rqMul(a, b), i;
      for (i = 0; i < N; i++) r[i] = modQ(r[i]);
      return mod3Phi(r);
    }
    function RqToS3(a) {
      var r = newPoly(), i, flag, add = 1 << (1 - (LOGQ & 1));
      for (i = 0; i < N; i++) {
        r[i] = modQ(a[i]);
        flag = r[i] >> (LOGQ - 1);
        r[i] += flag * add;
      }
      return mod3Phi(r);
    }
    /* ---- poly_lift ----
     * ★ HPS 与 HRSS 的 poly_lift 是两个完全不同的函数，混用必错：
     *   · HPS  (ntruhps2048509/clean/poly_lift.c)：仅复制 + Z3_to_Zq
     *   · HRSS (ntruhrss701/clean/poly_lift.c)   ：先算 b = a/(x-1) mod (3, Phi_n)，
     *            再 mod_3_Phi_n → Z3_to_Zq → 乘 (x-1)，使结果满足 sum-zero
     *            且系数落在 {0,1,2,q-2,q-1}（不再是简单的 {0,1,q-1}）。
     *   第 125 批即因 HRSS 误用 HPS 版 lift 导致 encaps 与官方全不一致。勿改回。 */
    function liftHrss(a) {
      var b = new Array(N), i, t = 3 - (N % 3), zj = 0;
      b[0] = a[0] * (2 - t) + a[1] * 0 + a[2] * t;
      b[1] = a[1] * (2 - t) + a[2] * 0;
      b[2] = a[2] * (2 - t);
      for (i = 3; i < N; i++) {
        b[0] += a[i] * (zj + 2 * t);
        b[1] += a[i] * (zj + t);
        b[2] += a[i] * zj;
        zj = (zj + t) % 3;
      }
      b[1] += a[0] * (zj + t);
      b[2] += a[0] * zj;
      b[2] += a[1] * (zj + t);
      for (i = 3; i < N; i++) b[i] = b[i - 3] + 2 * (a[i] + a[i - 1] + a[i - 2]);
      var last = b[N - 1];
      for (i = 0; i < N; i++) b[i] = mod3(b[i] + 2 * last);
      for (i = 0; i < N; i++) b[i] = b[i] | ((-(b[i] >> 1)) & MASKQ);
      var r = newPoly();
      r[0] = (-b[0]) & 0xffff;
      for (i = 0; i < N - 1; i++) r[i + 1] = (b[i] - b[i + 1]) & 0xffff;
      return r;
    }
    function lift(a) { return P.hrss ? liftHrss(a) : Z3toZq(new Uint16Array(a)); }

    /* ---- poly_R2_inv（mod 2 求逆，逐行对齐 core.c） ---- */
    function R2inv(a) {
      var f = newPoly(), g = newPoly(), v = newPoly(), w = newPoly();
      var i, loop, delta, sign, swap, t;
      w[0] = 1;
      for (i = 0; i < N; i++) f[i] = 1;
      for (i = 0; i < N - 1; i++) g[N - 2 - i] = (a[i] ^ a[N - 1]) & 1;
      delta = 1;
      for (loop = 0; loop < 2 * (N - 1) - 1; loop++) {
        for (i = N - 1; i > 0; i--) v[i] = v[i - 1];
        v[0] = 0;
        sign = g[0] & f[0];
        swap = ((-delta) & (-g[0])) >> 15;
        delta ^= swap & (delta ^ -delta);
        delta = (delta + 1) << 16 >> 16;
        for (i = 0; i < N; i++) {
          t = swap & (f[i] ^ g[i]); f[i] ^= t; g[i] ^= t;
          t = swap & (v[i] ^ w[i]); v[i] ^= t; w[i] ^= t;
        }
        for (i = 0; i < N; i++) g[i] = g[i] ^ (sign & f[i]);
        for (i = 0; i < N; i++) w[i] = w[i] ^ (sign & v[i]);
        for (i = 0; i < N - 1; i++) g[i] = g[i + 1];
        g[N - 1] = 0;
      }
      var r = newPoly();
      for (i = 0; i < N - 1; i++) r[i] = v[N - 2 - i];
      return r;
    }
    /* ---- poly_S3_inv（mod 3 求逆） ---- */
    function S3inv(a) {
      var f = newPoly(), g = newPoly(), v = newPoly(), w = newPoly();
      var i, loop, delta, sign, swap, t;
      w[0] = 1;
      for (i = 0; i < N; i++) f[i] = 1;
      for (i = 0; i < N - 1; i++) g[N - 2 - i] = mod3b((a[i] & 3) + 2 * (a[N - 1] & 3));
      delta = 1;
      for (loop = 0; loop < 2 * (N - 1) - 1; loop++) {
        for (i = N - 1; i > 0; i--) v[i] = v[i - 1];
        v[0] = 0;
        sign = mod3b(2 * g[0] * f[0]);
        swap = ((-delta) & (-g[0])) >> 15;
        delta ^= swap & (delta ^ -delta);
        delta = (delta + 1) << 16 >> 16;
        for (i = 0; i < N; i++) {
          t = swap & (f[i] ^ g[i]); f[i] ^= t; g[i] ^= t;
          t = swap & (v[i] ^ w[i]); v[i] ^= t; w[i] ^= t;
        }
        for (i = 0; i < N; i++) g[i] = mod3b(g[i] + sign * f[i]);
        for (i = 0; i < N; i++) w[i] = mod3b(w[i] + sign * v[i]);
        for (i = 0; i < N - 1; i++) g[i] = g[i + 1];
        g[N - 1] = 0;
      }
      sign = f[0];
      var r = newPoly();
      for (i = 0; i < N - 1; i++) r[i] = mod3b(sign * v[N - 2 - i]);
      return r;
    }
    /* ---- R2_inv -> Rq_inv（牛顿迭代，5 次 Rq_mul） ---- */
    function Rqinv(a) {
      var ai = R2inv(a), b = newPoly(), r = newPoly(), c, s, i;
      for (i = 0; i < N; i++) { b[i] = (-a[i]) & 0xffff; r[i] = ai[i]; }
      c = rqMul(r, b); c[0] = (c[0] + 2) & 0xffff;
      s = rqMul(c, r);
      c = rqMul(s, b); c[0] = (c[0] + 2) & 0xffff;
      r = rqMul(c, s);
      c = rqMul(r, b); c[0] = (c[0] + 2) & 0xffff;
      s = rqMul(c, r);
      c = rqMul(s, b); c[0] = (c[0] + 2) & 0xffff;
      return rqMul(c, s);
    }

    /* ---- pack3 ---- */
    function S3tobytes(a) {
      var msg = new Uint8Array(PT), i, j, c;
      for (i = 0; i < Math.floor(PACKDEG / 5); i++) {
        c = a[5 * i + 4] & 255;
        c = (3 * c + a[5 * i + 3]) & 255;
        c = (3 * c + a[5 * i + 2]) & 255;
        c = (3 * c + a[5 * i + 1]) & 255;
        c = (3 * c + a[5 * i + 0]) & 255;
        msg[i] = c;
      }
      if (PACKDEG % 5 !== 0) {
        i = Math.floor(PACKDEG / 5); c = 0;
        for (j = PACKDEG - 5 * i - 1; j >= 0; j--) c = (3 * c + a[5 * i + j]) & 255;
        msg[i] = c;
      }
      return msg;
    }
    function S3frombytes(msg) {
      var r = newPoly(), i, j, c;
      for (i = 0; i < Math.floor(PACKDEG / 5); i++) {
        c = msg[i];
        r[5 * i + 0] = c;
        r[5 * i + 1] = c * 171 >> 9;
        r[5 * i + 2] = c * 57 >> 9;
        r[5 * i + 3] = c * 19 >> 9;
        r[5 * i + 4] = c * 203 >> 14;
      }
      if (PACKDEG % 5 !== 0) {
        i = Math.floor(PACKDEG / 5); c = msg[i];
        for (j = 0; (5 * i + j) < PACKDEG; j++) { r[5 * i + j] = c; c = c * 171 >> 9; }
      }
      r[N - 1] = 0;
      return mod3Phi(r);
    }

    /* ---- packq：三种位宽（11/12/13 bits）各自特化 ---- */
    function Sqtobytes(a) {
      var r = new Uint8Array(PUB), i, j, t = new Uint16Array(8);
      if (LOGQ === 11) {
        for (i = 0; i < Math.floor(PACKDEG / 8); i++) {
          for (j = 0; j < 8; j++) t[j] = modQ(a[8 * i + j]);
          r[11 * i + 0] = t[0] & 0xff;
          r[11 * i + 1] = (t[0] >> 8) | ((t[1] & 0x1f) << 3);
          r[11 * i + 2] = (t[1] >> 5) | ((t[2] & 0x03) << 6);
          r[11 * i + 3] = (t[2] >> 2) & 0xff;
          r[11 * i + 4] = (t[2] >> 10) | ((t[3] & 0x7f) << 1);
          r[11 * i + 5] = (t[3] >> 7) | ((t[4] & 0x0f) << 4);
          r[11 * i + 6] = (t[4] >> 4) | ((t[5] & 0x01) << 7);
          r[11 * i + 7] = (t[5] >> 1) & 0xff;
          r[11 * i + 8] = (t[5] >> 9) | ((t[6] & 0x3f) << 2);
          r[11 * i + 9] = (t[6] >> 6) | ((t[7] & 0x07) << 5);
          r[11 * i + 10] = (t[7] >> 3);
        }
        for (j = 0; j < PACKDEG - 8 * i; j++) t[j] = modQ(a[8 * i + j]);
        for (; j < 8; j++) t[j] = 0;
        if ((PACKDEG & 7) === 4) {
          r[11 * i + 0] = t[0] & 0xff;
          r[11 * i + 1] = (t[0] >> 8) | ((t[1] & 0x1f) << 3);
          r[11 * i + 2] = (t[1] >> 5) | ((t[2] & 0x03) << 6);
          r[11 * i + 3] = (t[2] >> 2) & 0xff;
          r[11 * i + 4] = (t[2] >> 10) | ((t[3] & 0x7f) << 1);
          r[11 * i + 5] = (t[3] >> 7) | ((t[4] & 0x0f) << 4);
        } else if ((PACKDEG & 7) === 2) {
          r[11 * i + 0] = t[0] & 0xff;
          r[11 * i + 1] = (t[0] >> 8) | ((t[1] & 0x1f) << 3);
          r[11 * i + 2] = (t[1] >> 5) | ((t[2] & 0x03) << 6);
        }
        return r;
      }
      if (LOGQ === 12) {
        for (i = 0; i < Math.floor(PACKDEG / 2); i++) {
          r[3 * i + 0] = modQ(a[2 * i + 0]) & 0xff;
          r[3 * i + 1] = (modQ(a[2 * i + 0]) >> 8) | ((modQ(a[2 * i + 1]) & 0x0f) << 4);
          r[3 * i + 2] = (modQ(a[2 * i + 1]) >> 4);
        }
        return r;
      }
      /* LOGQ === 13 */
      for (i = 0; i < Math.floor(PACKDEG / 8); i++) {
        for (j = 0; j < 8; j++) t[j] = modQ(a[8 * i + j]);
        r[13 * i + 0] = t[0] & 0xff;
        r[13 * i + 1] = (t[0] >> 8) | ((t[1] & 0x07) << 5);
        r[13 * i + 2] = (t[1] >> 3) & 0xff;
        r[13 * i + 3] = (t[1] >> 11) | ((t[2] & 0x3f) << 2);
        r[13 * i + 4] = (t[2] >> 6) | ((t[3] & 0x01) << 7);
        r[13 * i + 5] = (t[3] >> 1) & 0xff;
        r[13 * i + 6] = (t[3] >> 9) | ((t[4] & 0x0f) << 4);
        r[13 * i + 7] = (t[4] >> 4) & 0xff;
        r[13 * i + 8] = (t[4] >> 12) | ((t[5] & 0x7f) << 1);
        r[13 * i + 9] = (t[5] >> 7) | ((t[6] & 0x03) << 6);
        r[13 * i + 10] = (t[6] >> 2) & 0xff;
        r[13 * i + 11] = (t[6] >> 10) | ((t[7] & 0x1f) << 3);
        r[13 * i + 12] = (t[7] >> 5);
      }
      for (j = 0; j < PACKDEG - 8 * i; j++) t[j] = modQ(a[8 * i + j]);
      for (; j < 8; j++) t[j] = 0;
      if ((PACKDEG & 7) === 4) {
        r[13 * i + 0] = t[0] & 0xff;
        r[13 * i + 1] = (t[0] >> 8) | ((t[1] & 0x07) << 5);
        r[13 * i + 2] = (t[1] >> 3) & 0xff;
        r[13 * i + 3] = (t[1] >> 11) | ((t[2] & 0x3f) << 2);
        r[13 * i + 4] = (t[2] >> 6) | ((t[3] & 0x01) << 7);
        r[13 * i + 5] = (t[3] >> 1) & 0xff;
        r[13 * i + 6] = (t[3] >> 9) | ((t[4] & 0x0f) << 4);
      } else if ((PACKDEG & 7) === 2) {
        r[13 * i + 0] = t[0] & 0xff;
        r[13 * i + 1] = (t[0] >> 8) | ((t[1] & 0x07) << 5);
        r[13 * i + 2] = (t[1] >> 3) & 0xff;
        r[13 * i + 3] = (t[1] >> 11) | ((t[2] & 0x3f) << 2);
      }
      return r;
    }
    function Sqfrombytes(buf) {
      var r = newPoly(), i, a = buf;
      if (LOGQ === 11) {
        for (i = 0; i < Math.floor(PACKDEG / 8); i++) {
          r[8 * i + 0] = (a[11 * i + 0] >> 0) | ((a[11 * i + 1] & 0x07) << 8);
          r[8 * i + 1] = (a[11 * i + 1] >> 3) | ((a[11 * i + 2] & 0x3f) << 5);
          r[8 * i + 2] = (a[11 * i + 2] >> 6) | ((a[11 * i + 3] & 0xff) << 2) | ((a[11 * i + 4] & 0x01) << 10);
          r[8 * i + 3] = (a[11 * i + 4] >> 1) | ((a[11 * i + 5] & 0x0f) << 7);
          r[8 * i + 4] = (a[11 * i + 5] >> 4) | ((a[11 * i + 6] & 0x7f) << 4);
          r[8 * i + 5] = (a[11 * i + 6] >> 7) | ((a[11 * i + 7] & 0xff) << 1) | ((a[11 * i + 8] & 0x03) << 9);
          r[8 * i + 6] = (a[11 * i + 8] >> 2) | ((a[11 * i + 9] & 0x1f) << 6);
          r[8 * i + 7] = (a[11 * i + 9] >> 5) | ((a[11 * i + 10] & 0xff) << 3);
        }
        if ((PACKDEG & 7) === 4) {
          r[8 * i + 0] = (a[11 * i + 0] >> 0) | ((a[11 * i + 1] & 0x07) << 8);
          r[8 * i + 1] = (a[11 * i + 1] >> 3) | ((a[11 * i + 2] & 0x3f) << 5);
          r[8 * i + 2] = (a[11 * i + 2] >> 6) | ((a[11 * i + 3] & 0xff) << 2) | ((a[11 * i + 4] & 0x01) << 10);
          r[8 * i + 3] = (a[11 * i + 4] >> 1) | ((a[11 * i + 5] & 0x0f) << 7);
        } else if ((PACKDEG & 7) === 2) {
          r[8 * i + 0] = (a[11 * i + 0] >> 0) | ((a[11 * i + 1] & 0x07) << 8);
          r[8 * i + 1] = (a[11 * i + 1] >> 3) | ((a[11 * i + 2] & 0x3f) << 5);
        }
        r[N - 1] = 0;
        return r;
      }
      if (LOGQ === 12) {
        for (i = 0; i < Math.floor(PACKDEG / 2); i++) {
          r[2 * i + 0] = (a[3 * i + 0] >> 0) | ((a[3 * i + 1] & 0x0f) << 8);
          r[2 * i + 1] = (a[3 * i + 1] >> 4) | ((a[3 * i + 2] & 0xff) << 4);
        }
        r[N - 1] = 0;
        return r;
      }
      for (i = 0; i < Math.floor(PACKDEG / 8); i++) {
        r[8 * i + 0] = a[13 * i + 0] | ((a[13 * i + 1] & 0x1f) << 8);
        r[8 * i + 1] = (a[13 * i + 1] >> 5) | (a[13 * i + 2] << 3) | ((a[13 * i + 3] & 0x03) << 11);
        r[8 * i + 2] = (a[13 * i + 3] >> 2) | ((a[13 * i + 4] & 0x7f) << 6);
        r[8 * i + 3] = (a[13 * i + 4] >> 7) | (a[13 * i + 5] << 1) | ((a[13 * i + 6] & 0x0f) << 9);
        r[8 * i + 4] = (a[13 * i + 6] >> 4) | (a[13 * i + 7] << 4) | ((a[13 * i + 8] & 0x01) << 12);
        r[8 * i + 5] = (a[13 * i + 8] >> 1) | ((a[13 * i + 9] & 0x3f) << 7);
        r[8 * i + 6] = (a[13 * i + 9] >> 6) | (a[13 * i + 10] << 2) | ((a[13 * i + 11] & 0x07) << 10);
        r[8 * i + 7] = (a[13 * i + 11] >> 3) | (a[13 * i + 12] << 5);
      }
      if ((PACKDEG & 7) === 4) {
        r[8 * i + 0] = a[13 * i + 0] | ((a[13 * i + 1] & 0x1f) << 8);
        r[8 * i + 1] = (a[13 * i + 1] >> 5) | (a[13 * i + 2] << 3) | ((a[13 * i + 3] & 0x03) << 11);
        r[8 * i + 2] = (a[13 * i + 3] >> 2) | ((a[13 * i + 4] & 0x7f) << 6);
        r[8 * i + 3] = (a[13 * i + 4] >> 7) | (a[13 * i + 5] << 1) | ((a[13 * i + 6] & 0x0f) << 9);
      } else if ((PACKDEG & 7) === 2) {
        r[8 * i + 0] = a[13 * i + 0] | ((a[13 * i + 1] & 0x1f) << 8);
        r[8 * i + 1] = (a[13 * i + 1] >> 5) | (a[13 * i + 2] << 3) | ((a[13 * i + 3] & 0x03) << 11);
      }
      r[N - 1] = 0;
      return r;
    }
    /* sum-zero：把末系数补成「系数和为 0 mod q」 */
    function sumZeroFrombytes(buf) {
      var r = Sqfrombytes(buf), i, s = 0;
      for (i = 0; i < PACKDEG; i++) s -= r[i];
      r[N - 1] = s & 0xffff;
      return r;
    }

    /* ---- 采样 ---- */
    function sampleIid(u) {
      var r = newPoly(), i;
      for (i = 0; i < N - 1; i++) r[i] = mod3(u[i]);
      return r;
    }
    function sampleFixedType(u) {
      var s = new Int32Array(N - 1), i;
      for (i = 0; i < Math.floor((N - 1) / 4); i++) {
        s[4 * i + 0] = (u[15 * i + 0] << 2) + (u[15 * i + 1] << 10) + (u[15 * i + 2] << 18) + (u[15 * i + 3] << 26);
        s[4 * i + 1] = ((u[15 * i + 3] & 0xc0) >> 4) + (u[15 * i + 4] << 4) + (u[15 * i + 5] << 12) + (u[15 * i + 6] << 20) + (u[15 * i + 7] << 28);
        s[4 * i + 2] = ((u[15 * i + 7] & 0xf0) >> 2) + (u[15 * i + 8] << 6) + (u[15 * i + 9] << 14) + (u[15 * i + 10] << 22) + (u[15 * i + 11] << 30);
        s[4 * i + 3] = (u[15 * i + 11] & 0xfc) + (u[15 * i + 12] << 8) + (u[15 * i + 13] << 16) + (u[15 * i + 14] << 24);
      }
      for (i = 0; i < WEIGHT / 2; i++) s[i] |= 1;
      for (i = WEIGHT / 2; i < WEIGHT; i++) s[i] |= 2;
      /* crypto_sort_int32 = 有符号升序排序（C 用排序网络，JS 用 Int32Array.sort） */
      Array.prototype.sort.call(s, function (a, b) { return a - b; });
      var r = newPoly();
      for (i = 0; i < N - 1; i++) r[i] = s[i] & 3;
      return r;
    }
    function sampleIidPlus(u) {
      var r = sampleIid(u), i, s = 0;
      for (i = 0; i < N - 1; i++) r[i] = r[i] | (-(r[i] >> 1));
      for (i = 0; i < N - 1; i++) s = (s + r[i + 1] * r[i]) & 0xffff;
      s = 1 | (-(s >> 15));
      for (i = 0; i < N; i += 2) r[i] = (s * r[i]) & 0xffff;
      for (i = 0; i < N; i++) r[i] = 3 & (r[i] ^ (r[i] >> 15));
      return r;
    }
    function sampleFg(u) {
      if (P.hrss) return { f: sampleIidPlus(u.subarray(0, IIDB)), g: sampleIidPlus(u.subarray(IIDB, IIDB + IIDB)) };
      return { f: sampleIid(u.subarray(0, IIDB)), g: sampleFixedType(u.subarray(IIDB)) };
    }
    function sampleRm(u) {
      if (P.hrss) return { r: sampleIid(u.subarray(0, IIDB)), m: sampleIid(u.subarray(IIDB, IIDB + IIDB)) };
      return { r: sampleIid(u.subarray(0, IIDB)), m: sampleFixedType(u.subarray(IIDB)) };
    }

    /* ---- 常量时间校验 ---- */
    function checkCiphertext(c) {
      var t = c[CTB - 1] & ((0xff << (8 - (7 & (LOGQ * PACKDEG)))) & 0xffff);
      return 1 & ((~t + 1) >> 15);
    }
    function checkR(r) {
      var t = 0, i, c;
      for (i = 0; i < N - 1; i++) {
        c = r[i];
        t |= (c + 1) & (Q - 4);
        t |= (c + 2) & 4;
      }
      t |= r[N - 1];
      return 1 & ((~(t | 0) + 1) >> 31);
    }
    function checkM(m) {
      var t = 0, ps = 0, ms = 0, i;
      for (i = 0; i < N; i++) { ps += m[i] & 1; ms += m[i] & 2; }
      t |= ps ^ (ms >> 1);
      t |= ms ^ WEIGHT;
      return 1 & ((~(t | 0) + 1) >> 31);
    }

    /* ---- OWCPA ---- */
    function owcpaKeypair(seed) {
      var fg = sampleFg(seed), f = fg.f, g = fg.g, i;
      var invf3 = S3inv(f);
      var sk = new Uint8Array(OWSK);
      sk.set(S3tobytes(f), 0);
      sk.set(S3tobytes(invf3), PT);
      Z3toZq(f); Z3toZq(g);
      if (P.hrss) {
        /* g = 3*(x-1)*g —— HRSS 与 HPS 的关键差异之一 */
        var old = new Uint16Array(g);
        for (i = N - 1; i > 0; i--) g[i] = (3 * (old[i - 1] - old[i])) & 0xffff;
        g[0] = (-(3 * old[0])) & 0xffff;
      } else {
        for (i = 0; i < N; i++) g[i] = 3 * g[i];
      }
      var gf = rqMul(g, f);
      var invgf = Rqinv(gf);
      var tmp = rqMul(invgf, f);
      var invh = SqMul(tmp, f);
      sk.set(Sqtobytes(invh), 2 * PT);
      tmp = rqMul(invgf, g);
      var h = rqMul(tmp, g);
      return { pk: Sqtobytes(h), sk: sk };
    }
    function owcpaEnc(r, m, pk) {
      var h = sumZeroFrombytes(pk);
      var ct = rqMul(r, h);
      var lm = lift(m), i;
      for (i = 0; i < N; i++) ct[i] = (ct[i] + lm[i]) & 0xffff;
      return Sqtobytes(ct);
    }
    function owcpaDec(ciphertext, sk) {
      var c = sumZeroFrombytes(ciphertext);
      var f = S3frombytes(sk.subarray(0, PT));
      Z3toZq(f);
      var cf = rqMul(c, f);
      var mf = RqToS3(cf);
      var finv3 = S3frombytes(sk.subarray(PT, 2 * PT));
      var m = S3Mul(mf, finv3);
      var rm = new Uint8Array(MSGB), i;
      rm.set(S3tobytes(m), PT);
      var fail = 0;
      fail |= checkCiphertext(ciphertext);
      if (!P.hrss) fail |= checkM(m);
      var lm = lift(m);
      var b = newPoly();
      for (i = 0; i < N; i++) b[i] = (c[i] - lm[i]) & 0xffff;
      var invh = Sqfrombytes(sk.subarray(2 * PT));
      var r = SqMul(b, invh);
      fail |= checkR(r);
      trinaryZqToZ3(r);
      rm.set(S3tobytes(r), 0);
      return { rm: rm, fail: fail };
    }
    function cmov(dst, src, b) {
      var m = (~b + 1) & 0xff, i;
      for (i = 0; i < dst.length; i++) dst[i] ^= m & (src[i] ^ dst[i]);
    }

    /* ---- KEM（与 PQClean kem.c 逐行对应） ---- */
    function keypair(rnd) {
      var seed = rnd(FGB);
      var kp = owcpaKeypair(seed);
      var sk = new Uint8Array(SKB);
      sk.set(kp.sk, 0);
      sk.set(rnd(32), OWSK);
      return { pk: kp.pk, sk: sk };
    }
    function encaps(pk, rnd) {
      var rmSeed = rnd(RMB);
      var sm = sampleRm(rmSeed), r = sm.r, m = sm.m;
      var rm = new Uint8Array(MSGB);
      rm.set(S3tobytes(r), 0);
      rm.set(S3tobytes(m), PT);
      var ss = sha3_256(rm);
      Z3toZq(r);
      return { ct: owcpaEnc(r, m, pk), ss: ss };
    }
    function decaps(ct, sk) {
      var d = owcpaDec(ct, sk.subarray(0, OWSK));
      var ss = sha3_256(d.rm);
      var buf = new Uint8Array(32 + CTB);
      buf.set(sk.subarray(OWSK, OWSK + 32), 0);
      buf.set(ct, 32);
      cmov(ss, sha3_256(buf), d.fail ? 1 : 0);
      return ss;
    }
    return {
      PKBYTES: PUB, SKBYTES: SKB, CTBYTES: CTB, SSBYTES: 32,
      FGBYTES: FGB, RMBYTES: RMB,
      keypair: keypair, encaps: encaps, decaps: decaps,
      owcpaKeypair: owcpaKeypair, owcpaEnc: owcpaEnc, owcpaDec: owcpaDec,
      sampleRm: sampleRm, sampleFg: sampleFg, RMBYTES: RMB, IIDB: IIDB
    };
  }

  function rndBytes(n) {
    var b = new Uint8Array(n);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b);
    else { for (var i = 0; i < n; i++) b[i] = (Math.random() * 256) | 0; }
    return b;
  }

  var SETS = [
    { id: 'ntruhps2048509', name: 'NTRU-HPS 2048-509', N: 509, LOGQ: 11 },
    { id: 'ntruhps2048677', name: 'NTRU-HPS 2048-677', N: 677, LOGQ: 11 },
    { id: 'ntruhps4096821', name: 'NTRU-HPS 4096-821', N: 821, LOGQ: 12 },
    { id: 'ntruhrss701', name: 'NTRU-HRSS 701', N: 701, LOGQ: 13, hrss: true }
  ];

  SETS.forEach(function (S) {
    var K = makeNtru(S);
    var info = S.name + '：NTRU 系 IND-CCA2 KEM（NIST Round 3 决赛候选，未被 FIPS 203 收录）。\n' +
      '参数 N=' + S.N + ' · q=2^' + S.LOGQ + (S.hrss ? ' · HRSS 采样（sample_iid_plus）' : ' · HPS 采样（iid + fixed_type）') + '；' +
      '公钥 ' + K.PKBYTES + ' 字节 · 私钥 ' + K.SKBYTES + ' 字节 · 密文 ' + K.CTBYTES + ' 字节 · 共享密钥 32 字节。\n' +
      '实现照 PQClean clean 官方实现转写，由官方二进制差分验证。\n' +
      '封装需要随机性（每次不同）；解封装确定（同 ct+sk 必得同 ss）。' +
      (S.hrss ? '\nHRSS 与 HPS 的两处结构差异已在代码注释中标明：g=3(x-1)g、无 owcpa_check_m。' : '');

    reg({
      id: S.id + '-keygen', name: S.name + ' 密钥生成',
      group: '后量子密码', key: false, param: true,
      paramLabel: '留空=同时输出公私钥；填 sk=只输出私钥',
      info: info,
      enc: function (b, kk, pp, fmt) {
        var kp = K.keypair(rndBytes);
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
        if (pk.length !== K.PKBYTES) throw new Error('公钥长度应为 ' + K.PKBYTES + ' 字节，实得 ' + pk.length);
        var out = K.encaps(pk, rndBytes);
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
        if (sk.length !== K.SKBYTES) throw new Error('私钥长度应为 ' + K.SKBYTES + ' 字节，实得 ' + sk.length);
        var ct = bytesIn(String(b), fmt);
        if (ct.length !== K.CTBYTES) throw new Error('密文长度应为 ' + K.CTBYTES + ' 字节，实得 ' + ct.length);
        return bytesOut(K.decaps(ct, sk), fmt);
      }, dec: false
    });
  });

  /* 供 testscript/t_ntru.js 与官方二进制做差分（绕过条目层格式化） */
  var KATS = {};
  SETS.forEach(function (S) { KATS[S.id] = makeNtru(S); });
  globalThis.__ntruKat = KATS;
})();
