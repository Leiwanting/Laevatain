/* ============================================================
 * NTRU LPRime（ntrulpr653）—— NTRU Prime 的「另一半」
 *
 * 背景：NTRU Prime 有两族参数
 *   - sntrup761      = Streamlined NTRU Prime（本项目已有 crypto_sntrup.js）
 *   - ntrulpr653/857/1277 = NTRU LPRime（本文件）
 * 两者不是同一算法的不同参数：LPRime 的密文带 Top 位（类 NTRU 的 rounding），
 * 公钥是「种子 + rounded 多项式」，且全程用 AES-256-CTR 而非 SHAKE 展开。
 *
 * 参考实现：PQClean clean 分支（commit 81a0bf97e201）
 *           /data/workspace/ntrup/ntrulpr653/{kem.c,params.h,crypto_*}
 * 裁判：    /data/workspace/ntruori/o_ntrulpr653（同一份 C 编译出的二进制）
 *
 * 转写要点（都是踩过或验证过的点，勿随手改）：
 *   1) Rounded 编解码（653x1541）是「653 个 base-1541 数字 ↔ 865 字节小端」。
 *      PQClean 那份是自动生成的分层实现，这里用 BigInt 直算——数学等价，
 *      已由官方二进制差分钉死。别改回「手抄分层常数」，那玩意儿抄错一位就全错。
 *   2) Round_and_encode = 先 3*round(a/3) 再 base-1541 编码；等价于 vals=t+770
 *      （t=round(a/3)），因为 2310=3*770。别把 770 写成 2310/3 之外的数。
 *   3) Fq 是 int16：core_mult 的入/出是 uint16 位模式，取回后必须按有符号解释，
 *      否则 -1 会变成 65535，Fq_freeze 得到 841 而不是 -1（静默错，不报错）。
 *   4) crypto_sort_uint32 是 bitonic sort，但输出只取 &3，重复值次序无影响，
 *      故用 TypedArray.sort()（数值升序）等价。
 *   5) 随机流顺序：keypair = seed(32) → Short_random(4p) → rho(Inputs_bytes)；
 *      encaps = Inputs_bytes。顺序错位则与官方全不一致且不报错。
 * ============================================================ */
(function () {
  if (typeof reg !== 'function') return;

  var SETS = [
    {
      id: 'ntrulpr653', name: 'NTRU-LPRime 653',
      p: 653, q: 4621, w: 252, I: 256,
      tau0: 2175, tau1: 113, tau2: 2031, tau3: 290, q31: 464722,
      roundedBytes: 865, topBytes: 128, smallBytes: 164, inputsBytes: 32
    },
    {
      id: 'ntrulpr857', name: 'NTRU-LPRime 857',
      p: 857, q: 5167, w: 281, I: 256,
      tau0: 2433, tau1: 101, tau2: 2265, tau3: 324, q31: 415615,
      roundedBytes: 1152, topBytes: 128, smallBytes: 215, inputsBytes: 32
    },
    {
      id: 'ntrulpr1277', name: 'NTRU-LPRime 1277',
      p: 1277, q: 7879, w: 429, I: 256,
      tau0: 3724, tau1: 66, tau2: 3469, tau3: 496, q31: 272557,
      roundedBytes: 1815, topBytes: 128, smallBytes: 320, inputsBytes: 32
    }
  ];

  /* ------------------------------------------------------------
   * CODERS：base-m 分层打包编解码器
   * 全部由 _gen_lpr.py 从 PQClean 官方 C 逐行转译，非手抄。
   * 不要手改：层数 10+、每层基数与输出字节数都不同，
   * 而且编解码互为逆运算——抄错了往返照样全过，
   * 只有与官方二进制逐字节比对才会暴露。
   * ------------------------------------------------------------ */
  var CODERS = {
    ntrulpr653: function (p, RoundedBytes) {
    /* enc 653x1541 —— 由 PQClean 官方 C 逐行转译，勿手改 */
    function encM(R0) {
      var out = new Uint8Array(RoundedBytes), o = 0, i, r0, r1, r2;
    var R = new Uint32Array(327);
    for (i = 0; i < 326; i++) {
      r0 = (((R0[2 * i] + 2310) & 16383) * 10923) >> 15;
      r1 = (((R0[2 * i + 1] + 2310) & 16383) * 10923) >> 15;
      r2 = r0 + r1 * 1541;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    R[326] = (((R0[652] + 2310) & 16383) * 10923) >> 15;
    for (i = 0; i < 163; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 9277;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    R[163] = R[326];
    for (i = 0; i < 82; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 1314;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    for (i = 0; i < 41; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 6745;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    for (i = 0; i < 20; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 695;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    R[20] = R[40];
    for (i = 0; i < 10; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 1887;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    R[10] = R[20];
    for (i = 0; i < 5; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 13910;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    R[5] = R[10];
    for (i = 0; i < 2; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 2953;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    r0 = R[4];
    r1 = R[5];
      r2 = r0 + r1 * 2953;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
    R[2] = r2 & 0xFFFF;
    r0 = R[0];
    r1 = R[1];
      r2 = r0 + r1 * 134;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
    R[0] = r2 & 0xFFFF;
    R[1] = R[2];
    r0 = R[0];
    r1 = R[1];
      r2 = r0 + r1 * 71;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
    R[0] = r2 & 0xFFFF;
    r0 = R[0];
      out[o++] = r0 & 0xFF;
      r0 >>>= 8;
      out[o++] = r0 & 0xFF;
      return out;
    }

    /* dec 653x1541 —— 由 PQClean 官方 C 逐行转译，勿手改 */
    function decM(s) {
      var R0 = new Int16Array(p), i, r0 = 0, r1, r2, q;
    var R1 = new Uint32Array(327);
    var R2 = new Uint32Array(164);
    var R3 = new Uint32Array(82);
    var R4 = new Uint32Array(41);
    var R5 = new Uint32Array(21);
    var R6 = new Uint32Array(11);
    var R7 = new Uint32Array(6);
    var R8 = new Uint32Array(3);
    var R9 = new Uint32Array(2);
    var R10 = new Uint32Array(1);
    var idx = s.length;
    r1 = 0;
    r1 = (r1 << 8) | s[--idx];
    r1 = (r1 << 8) | s[--idx];
    r1 = r1 % 2608;
    R10[0] = r1;
    r2 = R10[0];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 71); r0 = r2 - q * 71; r1 = q;
    R9[0] = r0;
    r1 = r1 % 9402;
    R9[1] = r1;
    R8[2] = R9[1];
    r2 = R9[0];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 134); r0 = r2 - q * 134; r1 = q;
    R8[0] = r0;
    r1 = r1 % 134;
    R8[1] = r1;
    r2 = R8[2];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 2953); r0 = r2 - q * 2953; r1 = q;
    R7[4] = r0;
    r1 = r1 % 815;
    R7[5] = r1;
    for (i = 1; i >= 0; --i) {
    r2 = R8[i];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 2953); r0 = r2 - q * 2953; r1 = q;
    R7[2 * i] = r0;
    r1 = r1 % 2953;
    R7[2 * i + 1] = r1;
    }
    R6[10] = R7[5];
    for (i = 4; i >= 0; --i) {
    r2 = R7[i];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 13910); r0 = r2 - q * 13910; r1 = q;
    R6[2 * i] = r0;
    r1 = r1 % 13910;
    R6[2 * i + 1] = r1;
    }
    R5[20] = R6[10];
    for (i = 9; i >= 0; --i) {
    r2 = R6[i];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 1887); r0 = r2 - q * 1887; r1 = q;
    R5[2 * i] = r0;
    r1 = r1 % 1887;
    R5[2 * i + 1] = r1;
    }
    R4[40] = R5[20];
    for (i = 19; i >= 0; --i) {
    r2 = R5[i];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 695); r0 = r2 - q * 695; r1 = q;
    R4[2 * i] = r0;
    r1 = r1 % 695;
    R4[2 * i + 1] = r1;
    }
    r2 = R4[40];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 6745); r0 = r2 - q * 6745; r1 = q;
    R3[80] = r0;
    r1 = r1 % 7910;
    R3[81] = r1;
    for (i = 39; i >= 0; --i) {
    r2 = R4[i];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 6745); r0 = r2 - q * 6745; r1 = q;
    R3[2 * i] = r0;
    r1 = r1 % 6745;
    R3[2 * i + 1] = r1;
    }
    r2 = R3[81];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 1314); r0 = r2 - q * 1314; r1 = q;
    R2[162] = r0;
    r1 = r1 % 1541;
    R2[163] = r1;
    for (i = 80; i >= 0; --i) {
    r2 = R3[i];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 1314); r0 = r2 - q * 1314; r1 = q;
    R2[2 * i] = r0;
    r1 = r1 % 1314;
    R2[2 * i + 1] = r1;
    }
    R1[326] = R2[163];
    for (i = 162; i >= 0; --i) {
    r2 = R2[i];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 9277); r0 = r2 - q * 9277; r1 = q;
    R1[2 * i] = r0;
    r1 = r1 % 9277;
    R1[2 * i + 1] = r1;
    }
    R0[652] = 3 * R1[326] - 2310;
    for (i = 325; i >= 0; --i) {
    r2 = R1[i];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 1541); r0 = r2 - q * 1541; r1 = q;
    R0[2 * i] = 3 * r0 - 2310;
    r1 = r1 % 1541;
    R0[2 * i + 1] = 3 * r1 - 2310;
    }
      return R0;
    }

      return { enc: encM, dec: decM };
    },
    ntrulpr857: function (p, RoundedBytes) {
    /* enc 857x1723 —— 由 PQClean 官方 C 逐行转译，勿手改 */
    function encM(R0) {
      var out = new Uint8Array(RoundedBytes), o = 0, i, r0, r1, r2;
    var R = new Uint32Array(429);
    for (i = 0; i < 428; i++) {
      r0 = (((R0[2 * i] + 2583) & 16383) * 10923) >> 15;
      r1 = (((R0[2 * i + 1] + 2583) & 16383) * 10923) >> 15;
      r2 = r0 + r1 * 1723;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    R[428] = (((R0[856] + 2583) & 16383) * 10923) >> 15;
    for (i = 0; i < 214; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 11597;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    R[214] = R[428];
    for (i = 0; i < 107; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 2053;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    R[107] = R[214];
    for (i = 0; i < 53; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 65;
      R[i] = r2 & 0xFFFF;
    }
    r0 = R[106];
    r1 = R[107];
      r2 = r0 + r1 * 65;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
    R[53] = r2 & 0xFFFF;
    for (i = 0; i < 26; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 4225;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    r0 = R[52];
    r1 = R[53];
      r2 = r0 + r1 * 4225;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
    R[26] = r2 & 0xFFFF;
    for (i = 0; i < 13; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 273;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    R[13] = R[26];
    for (i = 0; i < 7; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 292;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    for (i = 0; i < 3; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 334;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    R[3] = R[6];
    for (i = 0; i < 2; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 436;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    r0 = R[0];
    r1 = R[1];
      r2 = r0 + r1 * 743;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
    R[0] = r2 & 0xFFFF;
    r0 = R[0];
      out[o++] = r0 & 0xFF;
      return out;
    }

    /* dec 857x1723 —— 由 PQClean 官方 C 逐行转译，勿手改 */
    function decM(s) {
      var R0 = new Int16Array(p), i, r0 = 0, r1, r2, q;
    var R1 = new Uint32Array(429);
    var R2 = new Uint32Array(215);
    var R3 = new Uint32Array(108);
    var R4 = new Uint32Array(54);
    var R5 = new Uint32Array(27);
    var R6 = new Uint32Array(14);
    var R7 = new Uint32Array(7);
    var R8 = new Uint32Array(4);
    var R9 = new Uint32Array(2);
    var R10 = new Uint32Array(1);
    var idx = s.length;
    r1 = 0;
    r1 = (r1 << 8) | s[--idx];
    r1 = r1 % 160;
    R10[0] = r1;
    r2 = R10[0];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 743); r0 = r2 - q * 743; r1 = q;
    R9[0] = r0;
    r1 = r1 % 14044;
    R9[1] = r1;
    r2 = R9[1];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 436); r0 = r2 - q * 436; r1 = q;
    R8[2] = r0;
    r1 = r1 % 8246;
    R8[3] = r1;
    r2 = R9[0];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 436); r0 = r2 - q * 436; r1 = q;
    R8[0] = r0;
    r1 = r1 % 436;
    R8[1] = r1;
    R7[6] = R8[3];
    for (i = 2; i >= 0; --i) {
    r2 = R8[i];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 334); r0 = r2 - q * 334; r1 = q;
    R7[2 * i] = r0;
    r1 = r1 % 334;
    R7[2 * i + 1] = r1;
    }
    r2 = R7[6];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 292); r0 = r2 - q * 292; r1 = q;
    R6[12] = r0;
    r1 = r1 % 7229;
    R6[13] = r1;
    for (i = 5; i >= 0; --i) {
    r2 = R7[i];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 292); r0 = r2 - q * 292; r1 = q;
    R6[2 * i] = r0;
    r1 = r1 % 292;
    R6[2 * i + 1] = r1;
    }
    R5[26] = R6[13];
    for (i = 12; i >= 0; --i) {
    r2 = R6[i];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 273); r0 = r2 - q * 273; r1 = q;
    R5[2 * i] = r0;
    r1 = r1 % 273;
    R5[2 * i + 1] = r1;
    }
    r2 = R5[26];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 4225); r0 = r2 - q * 4225; r1 = q;
    R4[52] = r0;
    r1 = r1 % 438;
    R4[53] = r1;
    for (i = 25; i >= 0; --i) {
    r2 = R5[i];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 4225); r0 = r2 - q * 4225; r1 = q;
    R4[2 * i] = r0;
    r1 = r1 % 4225;
    R4[2 * i + 1] = r1;
    }
    r2 = R4[53];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 65); r0 = r2 - q * 65; r1 = q;
    R3[106] = r0;
    r1 = r1 % 1723;
    R3[107] = r1;
    for (i = 52; i >= 0; --i) {
    r2 = R4[i];
    q = Math.floor(r2 / 65); r0 = r2 - q * 65; r1 = q;
    R3[2 * i] = r0;
    r1 = r1 % 65;
    R3[2 * i + 1] = r1;
    }
    R2[214] = R3[107];
    for (i = 106; i >= 0; --i) {
    r2 = R3[i];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 2053); r0 = r2 - q * 2053; r1 = q;
    R2[2 * i] = r0;
    r1 = r1 % 2053;
    R2[2 * i + 1] = r1;
    }
    R1[428] = R2[214];
    for (i = 213; i >= 0; --i) {
    r2 = R2[i];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 11597); r0 = r2 - q * 11597; r1 = q;
    R1[2 * i] = r0;
    r1 = r1 % 11597;
    R1[2 * i + 1] = r1;
    }
    R0[856] = 3 * R1[428] - 2583;
    for (i = 427; i >= 0; --i) {
    r2 = R1[i];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 1723); r0 = r2 - q * 1723; r1 = q;
    R0[2 * i] = 3 * r0 - 2583;
    r1 = r1 % 1723;
    R0[2 * i + 1] = 3 * r1 - 2583;
    }
      return R0;
    }

      return { enc: encM, dec: decM };
    },
    ntrulpr1277: function (p, RoundedBytes) {
    /* enc 1277x2627 —— 由 PQClean 官方 C 逐行转译，勿手改 */
    function encM(R0) {
      var out = new Uint8Array(RoundedBytes), o = 0, i, r0, r1, r2;
    var R = new Uint32Array(639);
    for (i = 0; i < 638; i++) {
      r0 = (((R0[2 * i] + 3939) & 16383) * 10923) >> 15;
      r1 = (((R0[2 * i + 1] + 3939) & 16383) * 10923) >> 15;
      r2 = r0 + r1 * 2627;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    R[638] = (((R0[1276] + 3939) & 16383) * 10923) >> 15;
    for (i = 0; i < 319; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 106;
      R[i] = r2 & 0xFFFF;
    }
    R[319] = R[638];
    for (i = 0; i < 160; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 11236;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    for (i = 0; i < 80; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 1927;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    for (i = 0; i < 40; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 14506;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    for (i = 0; i < 19; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 3211;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    r0 = R[38];
    r1 = R[39];
      r2 = r0 + r1 * 3211;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
    R[19] = r2 & 0xFFFF;
    for (i = 0; i < 10; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 158;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    for (i = 0; i < 4; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 98;
      R[i] = r2 & 0xFFFF;
    }
    r0 = R[8];
    r1 = R[9];
      r2 = r0 + r1 * 98;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
    R[4] = r2 & 0xFFFF;
    for (i = 0; i < 2; i++) {
      r0 = R[2 * i];
      r1 = R[2 * i + 1];
      r2 = r0 + r1 * 9604;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      R[i] = r2 & 0xFFFF;
    }
    R[2] = R[4];
    r0 = R[0];
    r1 = R[1];
      r2 = r0 + r1 * 1408;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
    R[0] = r2 & 0xFFFF;
    R[1] = R[2];
    r0 = R[0];
    r1 = R[1];
      r2 = r0 + r1 * 7744;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
      out[o++] = r2 & 0xFF;
      r2 >>>= 8;
    R[0] = r2 & 0xFFFF;
    r0 = R[0];
      out[o++] = r0 & 0xFF;
      r0 >>>= 8;
      out[o++] = r0 & 0xFF;
      return out;
    }

    /* dec 1277x2627 —— 由 PQClean 官方 C 逐行转译，勿手改 */
    function decM(s) {
      var R0 = new Int16Array(p), i, r0 = 0, r1, r2, q;
    var R1 = new Uint32Array(639);
    var R2 = new Uint32Array(320);
    var R3 = new Uint32Array(160);
    var R4 = new Uint32Array(80);
    var R5 = new Uint32Array(40);
    var R6 = new Uint32Array(20);
    var R7 = new Uint32Array(10);
    var R8 = new Uint32Array(5);
    var R9 = new Uint32Array(3);
    var R10 = new Uint32Array(2);
    var R11 = new Uint32Array(1);
    var idx = s.length;
    r1 = 0;
    r1 = (r1 << 8) | s[--idx];
    r1 = (r1 << 8) | s[--idx];
    r1 = r1 % 264;
    R11[0] = r1;
    r2 = R11[0];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 7744); r0 = r2 - q * 7744; r1 = q;
    R10[0] = r0;
    r1 = r1 % 2229;
    R10[1] = r1;
    R9[2] = R10[1];
    r2 = R10[0];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 1408); r0 = r2 - q * 1408; r1 = q;
    R9[0] = r0;
    r1 = r1 % 1408;
    R9[1] = r1;
    R8[4] = R9[2];
    for (i = 1; i >= 0; --i) {
    r2 = R9[i];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 9604); r0 = r2 - q * 9604; r1 = q;
    R8[2 * i] = r0;
    r1 = r1 % 9604;
    R8[2 * i + 1] = r1;
    }
    r2 = R8[4];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 98); r0 = r2 - q * 98; r1 = q;
    R7[8] = r0;
    r1 = r1 % 5822;
    R7[9] = r1;
    for (i = 3; i >= 0; --i) {
    r2 = R8[i];
    q = Math.floor(r2 / 98); r0 = r2 - q * 98; r1 = q;
    R7[2 * i] = r0;
    r1 = r1 % 98;
    R7[2 * i + 1] = r1;
    }
    r2 = R7[9];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 158); r0 = r2 - q * 158; r1 = q;
    R6[18] = r0;
    r1 = r1 % 9433;
    R6[19] = r1;
    for (i = 8; i >= 0; --i) {
    r2 = R7[i];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 158); r0 = r2 - q * 158; r1 = q;
    R6[2 * i] = r0;
    r1 = r1 % 158;
    R6[2 * i + 1] = r1;
    }
    r2 = R6[19];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 3211); r0 = r2 - q * 3211; r1 = q;
    R5[38] = r0;
    r1 = r1 % 752;
    R5[39] = r1;
    for (i = 18; i >= 0; --i) {
    r2 = R6[i];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 3211); r0 = r2 - q * 3211; r1 = q;
    R5[2 * i] = r0;
    r1 = r1 % 3211;
    R5[2 * i + 1] = r1;
    }
    r2 = R5[39];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 14506); r0 = r2 - q * 14506; r1 = q;
    R4[78] = r0;
    r1 = r1 % 3395;
    R4[79] = r1;
    for (i = 38; i >= 0; --i) {
    r2 = R5[i];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 14506); r0 = r2 - q * 14506; r1 = q;
    R4[2 * i] = r0;
    r1 = r1 % 14506;
    R4[2 * i + 1] = r1;
    }
    r2 = R4[79];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 1927); r0 = r2 - q * 1927; r1 = q;
    R3[158] = r0;
    r1 = r1 % 451;
    R3[159] = r1;
    for (i = 78; i >= 0; --i) {
    r2 = R4[i];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 1927); r0 = r2 - q * 1927; r1 = q;
    R3[2 * i] = r0;
    r1 = r1 % 1927;
    R3[2 * i + 1] = r1;
    }
    r2 = R3[159];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 11236); r0 = r2 - q * 11236; r1 = q;
    R2[318] = r0;
    r1 = r1 % 2627;
    R2[319] = r1;
    for (i = 158; i >= 0; --i) {
    r2 = R3[i];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 11236); r0 = r2 - q * 11236; r1 = q;
    R2[2 * i] = r0;
    r1 = r1 % 11236;
    R2[2 * i + 1] = r1;
    }
    R1[638] = R2[319];
    for (i = 318; i >= 0; --i) {
    r2 = R2[i];
    q = Math.floor(r2 / 106); r0 = r2 - q * 106; r1 = q;
    R1[2 * i] = r0;
    r1 = r1 % 106;
    R1[2 * i + 1] = r1;
    }
    R0[1276] = 3 * R1[638] - 3939;
    for (i = 637; i >= 0; --i) {
    r2 = R1[i];
    r2 = (r2 << 8) | s[--idx];
    r2 = (r2 << 8) | s[--idx];
    q = Math.floor(r2 / 2627); r0 = r2 - q * 2627; r1 = q;
    R0[2 * i] = 3 * r0 - 3939;
    r1 = r1 % 2627;
    R0[2 * i + 1] = 3 * r1 - 3939;
    }
      return R0;
    }

      return { enc: encM, dec: decM };
    },
  };

  function makeNtruLpr(P) {
    var p = P.p, q = P.q, w = P.w, I = P.I, Q31 = P.q31;
    var q12 = (q - 1) / 2;                       /* 2310 */
    var COD = CODERS[P.id](p, P.roundedBytes);

    var SeedsBytes = 32;
    var RoundedBytes = P.roundedBytes;           /* 865 */
    var TopBytes = P.topBytes;                   /* 128 */
    var SmallBytes = P.smallBytes;               /* 164 */
    var InputsBytes = P.inputsBytes;             /* 32 */
    var PublicKeysBytes = SeedsBytes + RoundedBytes;         /* 897 */
    var CiphertextsBytes = RoundedBytes + TopBytes;          /* 993 */
    var SecretKeysBytes = SmallBytes;                        /* 164 */
    var ConfirmBytes = 32;
    var PKB = PublicKeysBytes;                              /* 897 */
    var CTB = CiphertextsBytes + ConfirmBytes;              /* 1025 */
    var SKB = SecretKeysBytes + PublicKeysBytes + InputsBytes + 32; /* 1125 */

    var ZERO16 = new Uint8Array(16);

    /* ---------- mod q ---------- */
    /* C 的 Fq_freeze 用两次乘-移位逼近；这里直接用「mod q 取对称代表」，
       数学等价（输出都落在 [-(q-1)/2,(q-1)/2]），且不受输入范围限制。 */
    function Fq_freeze(x) {
      var r = x % q;
      if (r > q12) r -= q;
      else if (r < -q12) r += q;
      return r;
    }
    /* Fq_bigfreeze：输入是 uint32，输出 [0,q)。照 C 的步骤，x*q31 需 64 位，
       此处用 Number（<2^53，安全）。
       ⚠ 坑：q31 这个名字里的 31 是【右移位数】，即除以 2^31 而不是 2^32。
         写成 /4294967296 时 Generator 出来的 aG 会落在 [-9505,…] 这种
         远超 ±2310 的值域，且【不报错】——只有与官方向量比对才会暴露。 */
    function Fq_bigfreeze(x) {
      x = x >>> 0;
      var t = Math.floor(x * Q31 / 2147483648);   /* (x*q31) >> 31 */
      x = (x - q * t) >>> 0;
      t = Math.floor(x * Q31 / 2147483648);
      x = (x - q * t) >>> 0;
      x = (x - q) >>> 0;
      if (x >>> 31) x = (x + q) >>> 0;
      return x;
    }

    function Top(C) { return (P.tau1 * (C + P.tau0) + 16384) >> 15; }
    function Right(T) { return Fq_freeze(P.tau3 * T - P.tau2); }

    /* ---------- base-1541 ↔ 字节：逐字对齐 PQClean 自动生成代码 ----------
     * ⚠ 这不是「标准小端 radix 表示」（即 N = Σ x_i·1541^i 的字节展开）。
     *   它做的是【分层打包】：每层把相邻两项合并成 [0, m²)，输出【固定字节数】，
     *   余数以 ceil(m²/2^k) 作为下一层的基数：
     *     1541 → 9277 → 1314 → 6745 → 695 → 1887 → 13910 → 2953 → 134 → 71 → 2608
     *   两者从首字节就不同，且【不报错】——只有与官方二进制比对才暴露。
     *   曾经用 BigInt 直算 N=Σ x_i·1541^i 代替过，结果是 pk 全错。勿再"简化"。
     *   常数全部来自 crypto_encode_653x1541.c / crypto_decode_653x1541.c。
     */
    
    
    /* ---------- Rounded ---------- */
    /* Round_and_encode: 先 x = 3*round(a/3)（crypto_encode_653x1541round），
       再走 base-1541 分层打包。 */
    function roundedEncode(a) {
      var x = new Int16Array(p), i;
      for (i = 0; i < p; i++) x[i] = 3 * ((10923 * a[i] + 16384) >> 15);
      return COD.enc(x);
    }
    function roundedDecode(s) { return COD.dec(s); }

    /* ---------- Small（2 bit/系数） ---------- */
    function smallEncode(f) {
      var s = new Uint8Array(SmallBytes), i, k = 0, x, n4 = p >> 2;
      for (i = 0; i < n4; i++) {
        x = f[k++] + 1;
        x += (f[k++] + 1) << 2;
        x += (f[k++] + 1) << 4;
        x += (f[k++] + 1) << 6;
        s[i] = x & 0xFF;
      }
      s[n4] = (f[4 * n4] + 1) & 0xFF;            /* p=653 → 余 1 个系数 */
      return s;
    }
    function smallDecode(s) {
      var f = new Int8Array(p), i, k = 0, x, n4 = p >> 2;
      for (i = 0; i < n4; i++) {
        x = s[i];
        f[k++] = (x & 3) - 1; x >>= 2;
        f[k++] = (x & 3) - 1; x >>= 2;
        f[k++] = (x & 3) - 1; x >>= 2;
        f[k++] = (x & 3) - 1;
      }
      f[4 * n4] = (s[n4] & 3) - 1;
      return f;
    }

    /* ---------- Top（4 bit/系数） ---------- */
    function topEncode(T) {
      var s = new Uint8Array(TopBytes), i;
      for (i = 0; i < 128; i++) s[i] = (T[2 * i] + (T[2 * i + 1] << 4)) & 0xFF;
      return s;
    }
    function topDecode(s) {
      var T = new Int8Array(I), i;
      for (i = 0; i < 128; i++) { T[2 * i] = s[i] & 15; T[2 * i + 1] = s[i] >> 4; }
      return T;
    }

    /* ---------- Inputs（1 bit/系数） ---------- */
    function inputsEncode(r) {
      var s = new Uint8Array(InputsBytes), i;
      for (i = 0; i < 256; i++) s[i >> 3] |= (r[i] & 1) << (i & 7);
      return s;
    }
    function inputsDecode(s) {
      var r = new Int8Array(I), i;
      for (i = 0; i < 256; i++) r[i] = 1 & (s[i >> 3] >> (i & 7));
      return r;
    }

    /* ---------- AES-256-CTR（16 字节 IV，末 4 字节大端计数） ---------- */
    /* PQClean common/aes.c 的 aes_ctr：IV 前 12 字节固定，后 4 字节为大端计数器，
       每块 +1（inc4_be）。即标准 NIST CTR。 */
    function aesCtrStream(key, iv, outLen) {
      var ks = aesExpandKey(key);
      var out = new Uint8Array(outLen), blk = new Uint8Array(16), i, n, e, ctr = 0, off;
      for (i = 0; i < 12; i++) blk[i] = iv[i];
      for (off = 0; off < outLen; off += 16) {
        blk[12] = (ctr >>> 24) & 0xFF; blk[13] = (ctr >>> 16) & 0xFF;
        blk[14] = (ctr >>> 8) & 0xFF; blk[15] = ctr & 0xFF;
        e = aesEncryptBlockJSRef(blk, ks);
        n = Math.min(16, outLen - off);
        for (i = 0; i < n; i++) out[off + i] = e[i];
        ctr++;
      }
      return out;
    }
    function u32FromBytes(b) {
      var L = new Uint32Array(p), i;
      for (i = 0; i < p; i++) {
        L[i] = (b[4 * i] | (b[4 * i + 1] << 8) | (b[4 * i + 2] << 16) | (b[4 * i + 3] << 24)) >>> 0;
      }
      return L;
    }

    /* ---------- Short_fromlist ---------- */
    function Short_fromlist(in32) {
      var L = new Uint32Array(p), i;
      for (i = 0; i < w; i++) L[i] = (in32[i] & 0xFFFFFFFE) >>> 0;         /* -2 */
      for (i = w; i < p; i++) L[i] = ((in32[i] & 0xFFFFFFFD) | 1) >>> 0;   /* -3 | 1 */
      L.sort();
      var out = new Int8Array(p);
      for (i = 0; i < p; i++) out[i] = (L[i] & 3) - 1;
      return out;
    }

    /* ---------- Hash = SHA-512 的前 32 字节 ---------- */
    function Hash32(input) {
      return sha512Digest(input).subarray(0, 32);
    }

    /* ---------- Rq_mult_small ---------- */
    function pxint16Decode(b) {
      var f = new Int32Array(p), i, v;
      for (i = 0; i < p; i++) {
        v = b[2 * i] | (b[2 * i + 1] << 8);
        if (v & 0x8000) v -= 0x10000;            /* 必须按 int16 解释 */
        f[i] = v;
      }
      return f;
    }
    function pxint16Encode(f) {
      var b = new Uint8Array(2 * p), i, u;
      for (i = 0; i < p; i++) {
        u = f[i] & 0xFFFF;
        b[2 * i] = u & 0xFF; b[2 * i + 1] = (u >> 8) & 0xFF;
      }
      return b;
    }
    /* crypto_core_multsntrup653 */
    function coreMult(hbytes, gbytes) {
      var f = pxint16Decode(hbytes), g = new Int8Array(p), i, j, gi, gi0;
      for (i = 0; i < p; i++) f[i] = Fq_freeze(f[i]);
      for (i = 0; i < p; i++) {
        gi = gbytes[i];                          /* Int8Array：-1/0/1 */
        gi0 = gi & 1;
        g[i] = gi0 - (gi & (gi0 << 1));
      }
      var fg = new Int32Array(2 * p - 1), r;
      for (i = 0; i < p; i++) {
        r = 0;
        for (j = 0; j <= i; j++) r += f[j] * g[i - j];
        fg[i] = Fq_freeze(r);
      }
      for (i = p; i < 2 * p - 1; i++) {
        r = 0;
        for (j = i - p + 1; j < p; j++) r += f[j] * g[i - j];
        fg[i] = Fq_freeze(r);
      }
      for (i = 2 * p - 2; i >= p; i--) {
        fg[i - p] = Fq_freeze(fg[i - p] + fg[i]);
        fg[i - p + 1] = Fq_freeze(fg[i - p + 1] + fg[i]);
      }
      return pxint16Encode(fg);
    }
    function Rq_mult_small(h, g) {
      var hb = pxint16Encode(h), ob = coreMult(hb, g), i, v;
      for (i = 0; i < p; i++) {
        v = ob[2 * i] | (ob[2 * i + 1] << 8);
        if (v & 0x8000) v -= 0x10000;
        h[i] = v;
      }
    }

    /* ---------- Generator ---------- */
    function Generator(G, pk) {
      var buf = aesCtrStream(pk.subarray(0, 32), ZERO16, 4 * p), L = u32FromBytes(buf), i;
      for (i = 0; i < p; i++) G[i] = Fq_bigfreeze(L[i]) - q12;
    }

    /* ---------- Hide ---------- */
    function Hide(r, pk, cache) {
      var rEnc = inputsEncode(r), i;
      var s = new Uint8Array(1 + InputsBytes);
      s[0] = 5; s.set(rEnc, 1);
      var h = Hash32(s);
      var b = Short_fromlist(u32FromBytes(aesCtrStream(h, ZERO16, 4 * p)));

      var c = new Uint8Array(CiphertextsBytes + ConfirmBytes);

      var bG = new Int16Array(p);
      Generator(bG, pk);
      Rq_mult_small(bG, b);
      c.set(roundedEncode(bG), 0);

      var bA = roundedDecode(pk.subarray(SeedsBytes, SeedsBytes + RoundedBytes));
      Rq_mult_small(bA, b);
      var T = new Int8Array(I);
      for (i = 0; i < I; i++) T[i] = Top(Fq_freeze(bA[i] + r[i] * q12));
      c.set(topEncode(T), RoundedBytes);

      var x = new Uint8Array(1 + InputsBytes + 32);
      x[0] = 2; x.set(rEnc, 1); x.set(cache, 1 + InputsBytes);
      c.set(Hash32(x), CiphertextsBytes);
      return { c: c, rEnc: rEnc };
    }

    /* ---------- 常数时间比较：相等返回 0，否则 -1 ---------- */
    function ctVerify(x, y) {
      var d = 0, i;
      for (i = 0; i < x.length; i++) d |= x[i] ^ y[i];
      return (1 & ((d - 1) >> 8)) - 1;
    }

    /* ---------- KEM 三件套 ---------- */
    function keypair(rnd) {
      var pk = new Uint8Array(PKB), sk = new Uint8Array(SKB), i;
      pk.set(rnd(SeedsBytes), 0);
      var aG = new Int16Array(p);
      Generator(aG, pk);
      var a = Short_fromlist(u32FromBytes(rnd(4 * p)));
      Rq_mult_small(aG, a);
      sk.set(smallEncode(a), 0);
      pk.set(roundedEncode(aG), SeedsBytes);

      var sksave = sk[SecretKeysBytes - 1];
      for (i = 0; i < PublicKeysBytes; i++) sk[SecretKeysBytes + i] = pk[i];
      sk[SecretKeysBytes - 1] = 4;
      sk.set(Hash32(sk.subarray(SecretKeysBytes - 1, SecretKeysBytes - 1 + 1 + PublicKeysBytes)),
        SecretKeysBytes + PublicKeysBytes + InputsBytes);
      sk[SecretKeysBytes - 1] = sksave;
      sk.set(rnd(InputsBytes), SecretKeysBytes + PublicKeysBytes);
      return { pk: pk, sk: sk };
    }

    function encaps(pk, rnd) {
      var y = new Uint8Array(1 + PKB), i;
      y[0] = 4;
      for (i = 0; i < PKB; i++) y[1 + i] = pk[i];
      var cache = Hash32(y);
      var r = inputsDecode(rnd(InputsBytes));
      var hd = Hide(r, pk, cache);
      var x = new Uint8Array(1 + InputsBytes + CiphertextsBytes + ConfirmBytes);
      x[0] = 1; x.set(hd.rEnc, 1); x.set(hd.c, 1 + InputsBytes);
      return { ct: hd.c, ss: Hash32(x) };
    }

    function decaps(ct, sk) {
      var pkOff = SecretKeysBytes, i;
      var pk = sk.subarray(pkOff, pkOff + PKB);
      var rho = sk.subarray(pkOff + PKB, pkOff + PKB + InputsBytes);
      var cache = sk.subarray(pkOff + PKB + InputsBytes, pkOff + PKB + InputsBytes + 32);

      var aB = roundedDecode(ct.subarray(0, RoundedBytes));
      Rq_mult_small(aB, smallDecode(sk.subarray(0, SecretKeysBytes)));
      var T = topDecode(ct.subarray(RoundedBytes, RoundedBytes + TopBytes));
      var r = new Int8Array(I);
      for (i = 0; i < I; i++) {
        r[i] = -(Fq_freeze(Right(T[i]) - aB[i] + 4 * w + 1) < 0 ? -1 : 0);
      }

      var hd = Hide(r, pk, cache);
      var mask = ctVerify(ct, hd.c);
      var x = new Uint8Array(1 + InputsBytes + CiphertextsBytes + ConfirmBytes);
      x[0] = 1 + mask;
      x.set(hd.rEnc, 1);
      for (i = 0; i < InputsBytes; i++) x[1 + i] ^= (mask & (x[1 + i] ^ rho[i]));
      x.set(ct, 1 + InputsBytes);
      return Hash32(x);
    }

    return {
      PKBYTES: PKB, SKBYTES: SKB, CTBYTES: CTB, SSBYTES: 32,
      FGBYTES: SeedsBytes + 4 * p, RMBYTES: InputsBytes,
      keypair: keypair, encaps: encaps, decaps: decaps,
      /* 内部件：仅用于 t_ntrulpr.js 定位差异，不参与条目层 */
      _dbg: {
        Generator: Generator, Rq_mult_small: Rq_mult_small,
        roundedEncode: roundedEncode, roundedDecode: roundedDecode,
        Short_fromlist: Short_fromlist, Hide: Hide, Fq_bigfreeze: Fq_bigfreeze
      }
    };
  }

  function rndBytes(n) {
    var b = new Uint8Array(n);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b);
    else { for (var i = 0; i < n; i++) b[i] = (Math.random() * 256) | 0; }
    return b;
  }

  SETS.forEach(function (S) {
    var K = makeNtruLpr(S);
    var info = S.name + '：NTRU Prime 的 LPRime 族（与 sntrup761 不同族，不是同一算法的另一参数）。\n' +
      '参数 p=' + S.p + ' · q=' + S.q + ' · w=' + S.w + ' · I=' + S.I + '；' +
      '公钥 ' + K.PKBYTES + ' 字节 · 私钥 ' + K.SKBYTES + ' 字节 · 密文 ' + K.CTBYTES + ' 字节 · 共享密钥 32 字节。\n' +
      '结构特征：公钥 = 32 字节种子 + rounded 多项式；密文 = rounded + Top 位 + 32 字节确认值；\n' +
      '随机展开用 AES-256-CTR（零 IV），摘要用 SHA-512 前 32 字节。\n' +
      '实现照 PQClean clean 官方实现转写，由官方二进制差分验证。\n' +
      '封装需要随机性（每次不同）；解封装确定（同 ct+sk 必得同 ss）。';

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

  /* 供 testscript/t_ntrulpr.js 与官方二进制做差分（绕过条目层格式化） */
  var KATS = {};
  SETS.forEach(function (S) { KATS[S.id] = makeNtruLpr(S); });
  globalThis.__ntrulprKat = KATS;
})();
