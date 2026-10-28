/* ============================================================
 * PRESENT —— 超轻量分组密码（CHES 2007, Bogdanov / Knudsen / Leander 等）
 *
 *   块 64 位（8 字节），密钥 80 位（10 字节）或 128 位（16 字节），31 轮。
 *   结构：SPN —— 每轮 addRoundKey → sBoxLayer → pLayer，共 31 轮，
 *   最后再 addRoundKey(K32)。共需 32 个轮密钥。
 *
 * 位序约定（最容易写错的地方，务必读）：
 *   状态记作 b63..b0，b63 是最高位；字节数组 b[0] 的 MSB 即 b63。
 *   密钥寄存器记作 reg[0..len-1]，reg[0] = k_{len-1}（最高位），
 *   故 key[0] 的最高位落在 reg[0]。
 *   轮密钥 Ki = 寄存器最高 64 位 = reg[0..63]，正好与状态字节一一对齐，
 *   所以 addRoundKey 就是 8 字节逐字节 XOR（不需要再做位重排）。
 *
 * S 盒（4 位）：C56B90AD3EF84712 —— 注意它**不是**自逆的，
 *   解密必须用下面程序生成的 SBOX_INV，别图省事复用 SBOX。
 *
 * pLayer：位 i 移动到位 P(i)，P(i) = (i*16) mod 63（i<63），P(63)=63。
 *   ⚠ 写成反方向（out[i] = bits[P(i)]）时长度完全自洽、往返也自洽，
 *     只有官方向量能发现 —— 与 SHACAL-1 的 ROTL30 是同一类病。
 *
 * 密钥更新（每轮一次，生成下一个轮密钥）：
 *   reg <<< 61
 *   最高 nibble 过 S 盒（128 位版是最高**两个** nibble 各过一次）
 *   reg[cpos..cpos+4] ^= round_counter（5 位，高位在前）
 *     ⚠ cpos 两个版本不同：80 位是 60，128 位是 61。写成同一个数会静默算错。
 * ============================================================ */
(function (global) {
  'use strict';

  var SBOX = [0xC, 0x5, 0x6, 0xB, 0x9, 0x0, 0xA, 0xD,
              0x3, 0xE, 0xF, 0x8, 0x4, 0x7, 0x1, 0x2];
  var SBOX_INV = (function () {
    var inv = new Uint8Array(16), i;
    for (i = 0; i < 16; i++) inv[SBOX[i]] = i;
    return inv;
  })();

  /* 字节数组 <-> 位数组（bits[i] = b_i，bits[63] 是最高位） */
  function bytesToBits(b) {
    var bits = new Uint8Array(64), j, m;
    for (j = 0; j < 8; j++)
      for (m = 0; m < 8; m++) bits[63 - 8 * j - m] = (b[j] >> (7 - m)) & 1;
    return bits;
  }
  function bitsToBytes(bits) {
    var b = new Uint8Array(8), j, m;
    for (j = 0; j < 8; j++) {
      var v = 0;
      for (m = 0; m < 8; m++) v |= (bits[63 - 8 * j - m] & 1) << (7 - m);
      b[j] = v;
    }
    return b;
  }

  function pLayer(b) {
    var bits = bytesToBits(b), out = new Uint8Array(64), i;
    for (i = 0; i < 63; i++) out[(i * 16) % 63] = bits[i];
    out[63] = bits[63];
    return bitsToBytes(out);
  }
  function pLayerInv(b) {
    var bits = bytesToBits(b), out = new Uint8Array(64), i;
    for (i = 0; i < 63; i++) out[i] = bits[(i * 16) % 63];
    out[63] = bits[63];
    return bitsToBytes(out);
  }

  /* nibble k = b_{63-4k}..b_{60-4k}，正好是字节 k/2 的高/低半字节，
     所以逐字节处理即可，不需要位数组。 */
  function sBoxLayer(b, box) {
    var o = new Uint8Array(8), i;
    for (i = 0; i < 8; i++) o[i] = (box[(b[i] >> 4) & 15] << 4) | box[b[i] & 15];
    return o;
  }

  function addRoundKey(st, k) {
    var i;
    for (i = 0; i < 8; i++) st[i] ^= k[i];
  }

  function keySchedule(key) {
    var len = key.length === 10 ? 80 : (key.length === 16 ? 128 : 0);
    if (!len) throw new Error('PRESENT 密钥必须为 10 字节（80 位）或 16 字节（128 位），收到 ' + (key ? key.length : 'null'));
    var reg = new Uint8Array(len), i, j, m;
    for (j = 0; j < key.length; j++)
      for (m = 0; m < 8; m++) reg[8 * j + m] = (key[j] >> (7 - m)) & 1;

    var rk = [];
    for (i = 1; i <= 32; i++) {
      var rkb = new Uint8Array(8);
      for (j = 0; j < 8; j++) {
        var v = 0;
        for (m = 0; m < 8; m++) v |= (reg[8 * j + m] & 1) << (7 - m);
        rkb[j] = v;
      }
      rk.push(rkb);
      if (i === 32) break;

      /* reg <<< 61 */
      var nr = new Uint8Array(len);
      for (j = 0; j < len; j++) nr[j] = reg[(j + 61) % len];
      reg = nr;

      /* 最高 nibble（128 位版是最高的两个）过 S 盒 */
      var nib = (reg[0] << 3) | (reg[1] << 2) | (reg[2] << 1) | reg[3];
      var sn = SBOX[nib];
      reg[0] = (sn >> 3) & 1; reg[1] = (sn >> 2) & 1; reg[2] = (sn >> 1) & 1; reg[3] = sn & 1;
      if (len === 128) {
        var nib2 = (reg[4] << 3) | (reg[5] << 2) | (reg[6] << 1) | reg[7];
        var sn2 = SBOX[nib2];
        reg[4] = (sn2 >> 3) & 1; reg[5] = (sn2 >> 2) & 1; reg[6] = (sn2 >> 1) & 1; reg[7] = sn2 & 1;
      }

      /* round_counter（5 位）异或；⚠ 80 位在 reg[60]，128 位在 reg[61] */
      var cpos = (len === 80) ? 60 : 61;
      for (m = 0; m < 5; m++) reg[cpos + m] ^= (i >> (4 - m)) & 1;
    }
    return rk;
  }

  function presentEnc(pt, rk) {
    if (!pt || pt.length !== 8) throw new Error('PRESENT 明文必须为 8 字节，收到 ' + (pt ? pt.length : 'null'));
    var st = new Uint8Array(pt), i;
    for (i = 0; i < 31; i++) {
      addRoundKey(st, rk[i]);
      st = sBoxLayer(st, SBOX);
      st = pLayer(st);
    }
    addRoundKey(st, rk[31]);
    return st;
  }
  function presentDec(ct, rk) {
    if (!ct || ct.length !== 8) throw new Error('PRESENT 密文必须为 8 字节，收到 ' + (ct ? ct.length : 'null'));
    var st = new Uint8Array(ct), i;
    addRoundKey(st, rk[31]);
    for (i = 30; i >= 0; i--) {
      st = pLayerInv(st);
      st = sBoxLayer(st, SBOX_INV);
      addRoundKey(st, rk[i]);
    }
    return st;
  }

  var api = {
    SBOX: SBOX, SBOX_INV: SBOX_INV,
    keySchedule: keySchedule,
    presentEnc: presentEnc, presentDec: presentDec,
    pLayer: pLayer, pLayerInv: pLayerInv, sBoxLayer: sBoxLayer
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.PRESENT = api;
})(typeof window !== 'undefined' ? window : globalThis);
