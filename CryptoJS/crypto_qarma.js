/* ==========================================================================
 * QARMA-64 —— 轻量可调分组密码（tweakable block cipher）
 * --------------------------------------------------------------------------
 * 出处：Avanzi, "The QARMA Block Cipher Family" (IACR ePrint 2016/444)，
 *   ToSC 2017。ARMv8.3-A 指针认证（PAC）即基于 QARMA-64。
 *
 * 参照物（两个相互独立的实现，结论一致）：
 *   ① Phantom1003/QARMA64 的 C 参考实现（含论文 check_box 自测向量）
 *   ② dkales/qarma64-python 的 Python 参考实现（期望值与 ① 的 sbox0 一致）
 *   本实现以 ① 编译出的二进制为差分裁判。
 *
 * 参数：块 64 位、密钥 128 位（w0‖k0）、tweak 64 位、轮数 r ∈ {5,6,7}。
 *   密钥栏布局：w0(8B) ‖ k0(8B) ‖ tweak(8B) = 24 字节。
 *   （与 SKINNY 一样，把 tweak 并入 tweakey，因为引擎的 makeBlockFn 只有密钥通道。）
 *
 * ⚠ 四个易错点（改前先跑 testscript/t_qarma.js）：
 *   1. 64 位一律用 BigInt。第一版用 Number + Math.pow(256,7)，而 256^7 ≈ 7.2e16
 *      已超出 2^53 安全整数范围，nibble 提取静默丢精度——不报错，只算错。
 *   2. cell 索引是大端：cell[0] 是最高字节的高 nibble，cell[15] 是最低字节的低 nibble。
 *      AddRoundTweakey 用 (tk >> (4*(15-i))) & 0xF，与之一致；写反不报错、只静默算错。
 *   3. MixColumns 的 M 含 0 项，必须跳过（b==0 时不贡献），不能当 rot(a,0) 参与 XOR。
 *   4. forward/backward 在 r==0 那轮**不做** ShuffleCells + MixColumns（短轮），
 *      但中间轮的 forward/backward 传 r=1，是**做**的。
 * ========================================================================== */
(function () {
  var M = [0, 1, 2, 1,
           1, 0, 1, 2,
           2, 1, 0, 1,
           1, 2, 1, 0];
  var T_PERM = [0, 11, 6, 13, 10, 1, 12, 7, 5, 14, 3, 8, 15, 4, 9, 2];
  var T_INV  = [0, 5, 15, 10, 13, 8, 2, 7, 11, 14, 4, 1, 6, 3, 9, 12];
  var H_PERM = [6, 5, 14, 15, 0, 1, 2, 3, 7, 12, 13, 4, 8, 9, 10, 11];
  var H_INV  = [4, 5, 6, 7, 11, 1, 0, 8, 12, 13, 14, 15, 9, 10, 2, 3];
  /* sbox2 = PRINCE family 轻量 S 盒，QARMA-64 实际采用（论文另给 sbox0/sbox1） */
  var SBOX = [11, 6, 8, 15, 12, 0, 9, 14, 3, 7, 4, 5, 13, 2, 1, 10];
  var SBOX_INV = (function () {
    var r = new Uint8Array(16);
    for (var i = 0; i < 16; i++) r[SBOX[i]] = i;
    return r;
  })();
  var ALPHA = 0xC0AC29B7C97C50DDn;
  var RC = [0x0000000000000000n, 0x13198A2E03707344n,
            0xA4093822299F31D0n, 0x082EFA98EC4E6C89n,
            0x452821E638D01377n, 0xBE5466CF34E90C6Cn,
            0x3F84D5B5B5470917n, 0x9216D5D98979FB1Bn];
  var MASK64 = 0xFFFFFFFFFFFFFFFFn;
  /* LFSR 更新的单元下标（forward/backward 两处相同，勿删减） */
  var LFSR_IDX = [0, 1, 3, 4, 8, 11, 13];

  function b2u64(b, off) {
    off = off || 0;
    var v = 0n;
    for (var i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[off + i] & 0xff);
    return v;
  }
  function u64b(v) {
    var b = new Uint8Array(8);
    for (var i = 7; i >= 0; i--) { b[i] = Number(v & 0xffn); v >>= 8n; }
    return b;
  }
  /* ⚠ 是 ROTR 不是 ROTL：C 参考实现写 ((w0>>1)|(w0<<63))，Python 参考实现同样。
     第一版写成 ROTL，官方向量 3 条 + 差分全错（第 123 批）。 */
  function rotr1(v) { return ((v >> 1n) | (v << 63n)) & MASK64; }

  /* 64 位 → 16 个 nibble（cell[0] 为最高字节的高 nibble） */
  function t2c(v) {
    var c = new Uint8Array(16), j, by;
    for (j = 0; j < 8; j++) {
      by = Number((v >> BigInt(8 * (7 - j))) & 0xffn);
      c[2 * j] = (by >> 4) & 0xf;
      c[2 * j + 1] = by & 0xf;
    }
    return c;
  }
  function c2t(c) {
    var v = 0n, j, by;
    for (j = 0; j < 8; j++) {
      by = BigInt(((c[2 * j] & 0xf) << 4) | (c[2 * j + 1] & 0xf));
      v |= by << BigInt(8 * (7 - j));
    }
    return v;
  }
  function nib(v, i) { return Number((v >> BigInt(4 * (15 - i))) & 0xfn); }
  function rotNib(a, b) { return (((a << b) & 0xf) | (a >> (4 - b))) & 0xf; }

  function mixColumns(cell, mat) {
    var out = new Uint8Array(16), x, y, j, b, a, temp;
    for (x = 0; x < 4; x++) {
      for (y = 0; y < 4; y++) {
        temp = 0;
        for (j = 0; j < 4; j++) {
          b = mat[4 * x + j];
          if (b) {
            a = cell[4 * j + y];
            temp ^= rotNib(a, b);
          }
        }
        out[4 * x + y] = temp & 0xf;
      }
    }
    return out;
  }
  function lfsr(x) {
    var b0 = x & 1, b1 = (x >> 1) & 1, b2 = (x >> 2) & 1, b3 = (x >> 3) & 1;
    return (((b0 ^ b1) << 3) | (b3 << 2) | (b2 << 1) | b1) & 0xf;
  }
  function lfsrInv(x) {
    var b0 = x & 1, b1 = (x >> 1) & 1, b2 = (x >> 2) & 1, b3 = (x >> 3) & 1;
    return (((b0 ^ b3) << 0) | (b0 << 1) | (b1 << 2) | (b2 << 3)) & 0xf;
  }
  function permute(c, P) {
    var o = new Uint8Array(16), i;
    for (i = 0; i < 16; i++) o[i] = c[P[i]];
    return o;
  }
  function fwdUpdateKey(t) {
    var tmp = permute(t2c(t), H_PERM), i;
    for (i = 0; i < LFSR_IDX.length; i++) tmp[LFSR_IDX[i]] = lfsr(tmp[LFSR_IDX[i]]);
    return c2t(tmp);
  }
  function bwdUpdateKey(t) {
    var c = t2c(t), i;
    for (i = 0; i < LFSR_IDX.length; i++) c[LFSR_IDX[i]] = lfsrInv(c[LFSR_IDX[i]]);
    return c2t(permute(c, H_INV));
  }
  function forward(is, tk, r, Sb) {
    var c, i;
    is = (is ^ tk) & MASK64;
    c = t2c(is);
    if (r !== 0) c = mixColumns(permute(c, T_PERM), M);
    for (i = 0; i < 16; i++) c[i] = Sb[c[i]];
    return c2t(c);
  }
  function backward(is, tk, r, Sb) {
    var c = t2c(is), i;
    for (i = 0; i < 16; i++) c[i] = Sb[c[i]];
    if (r !== 0) c = permute(mixColumns(c, M), T_INV);
    return (c2t(c) ^ tk) & MASK64;
  }
  function pseudoReflect(is, tk) {
    var mixed = mixColumns(permute(t2c(is), T_PERM), M), i;
    for (i = 0; i < 16; i++) mixed[i] ^= nib(tk, i);
    return c2t(permute(mixed, T_INV));
  }

  function qarmaEnc(p, t, w0, k0, r) {
    var w1 = (rotr1(w0) ^ (w0 >> 63n)) & MASK64;
    var k1 = k0, is = (p ^ w0) & MASK64, i;
    for (i = 0; i < r; i++) {
      is = forward(is, (k0 ^ t ^ RC[i]) & MASK64, i, SBOX);
      t = fwdUpdateKey(t);
    }
    is = forward(is, (w1 ^ t) & MASK64, 1, SBOX);
    is = pseudoReflect(is, k1);
    is = backward(is, (w0 ^ t) & MASK64, 1, SBOX_INV);
    for (i = r - 1; i >= 0; i--) {
      t = bwdUpdateKey(t);
      is = backward(is, (k0 ^ t ^ RC[i] ^ ALPHA) & MASK64, i, SBOX_INV);
    }
    return (is ^ w1) & MASK64;
  }
  function qarmaDec(c, t, w0, k0, r) {
    var w1 = w0;
    var nw0 = (rotr1(w0) ^ (w0 >> 63n)) & MASK64;
    var k1 = c2t(mixColumns(t2c(k0), M));
    var nk0 = (k0 ^ ALPHA) & MASK64;
    var is = (c ^ nw0) & MASK64, i;
    for (i = 0; i < r; i++) {
      is = forward(is, (nk0 ^ t ^ RC[i]) & MASK64, i, SBOX);
      t = fwdUpdateKey(t);
    }
    is = forward(is, (w1 ^ t) & MASK64, 1, SBOX);
    is = pseudoReflect(is, k1);
    is = backward(is, (nw0 ^ t) & MASK64, 1, SBOX_INV);
    for (i = r - 1; i >= 0; i--) {
      t = bwdUpdateKey(t);
      is = backward(is, (nk0 ^ t ^ RC[i] ^ ALPHA) & MASK64, i, SBOX_INV);
    }
    return (is ^ w1) & MASK64;
  }

  function parseKey(kb) {
    if (!kb || kb.length < 24) throw new Error('QARMA-64 需要 24 字节密钥：w0(8) ‖ k0(8) ‖ tweak(8)');
    return { w0: b2u64(kb, 0), k0: b2u64(kb, 8), t: b2u64(kb, 16) };
  }
  function mk(r) {
    return function (kb) {
      var p = parseKey(kb);
      return {
        enc: function (blk) { return u64b(qarmaEnc(b2u64(blk), p.t, p.w0, p.k0, r)); },
        dec: function (blk) { return u64b(qarmaDec(b2u64(blk), p.t, p.w0, p.k0, r)); }
      };
    };
  }

  var items = [];
  items.push({
    id: 'qarma64-r7', name: 'QARMA-64（7 轮，ARM 指针认证同族）', group: '对称加密',
    blockSize: 8, keyLen: 24, makeBlockFn: mk(7),
    info: 'QARMA-64 是 Avanzi 提出的轻量可调分组密码（IACR ePrint 2016/444 / ToSC 2017），ARMv8.3-A 指针认证（PAC）即基于该族。块 64 位、密钥 128 位（w0‖k0）、tweak 64 位、7 轮，中间含一次 pseudo-reflect（伪反射）结构使其加解密高度对称。已过论文 check_box 官方向量，并与 C / Python 两个独立参考实现交叉验证、再与编译后的 C 参考实现做随机差分比对。⚠ 密钥栏须填 24 字节 Hex，布局为 w0(8 字节) ‖ k0(8 字节) ‖ tweak(8 字节)——引擎只有密钥通道，故 tweak 并入其中（同 SKINNY 的 tweakey 处理）。'
  });
  items.push({
    id: 'qarma64-r6', name: 'QARMA-64（6 轮）', group: '对称加密',
    blockSize: 8, keyLen: 24, makeBlockFn: mk(6),
    info: 'QARMA-64 的 6 轮版本，其余参数与 7 轮版相同。已过论文 check_box 官方向量（r=6），并与编译后的 C 参考实现做随机差分比对。密钥栏填 24 字节 Hex：w0 ‖ k0 ‖ tweak。'
  });
  items.push({
    id: 'qarma64-r5', name: 'QARMA-64（5 轮）', group: '对称加密',
    blockSize: 8, keyLen: 24, makeBlockFn: mk(5),
    info: 'QARMA-64 的 5 轮版本（ARM PAC 实际使用轮数即在此族内），其余参数与 7 轮版相同。已过论文 check_box 官方向量（r=5），并与编译后的 C 参考实现做随机差分比对。密钥栏填 24 字节 Hex：w0 ‖ k0 ‖ tweak。'
  });
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (typeof regSym === 'function') { regSym(it); }
    else if (typeof reg === 'function') { it.key = true; it.isSym = true; reg(it); }
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { qarmaEnc: qarmaEnc, qarmaDec: qarmaDec, t2c: t2c, c2t: c2t };
  }
})();
