/* ============================================================
 * Salsa20 流密码
 * Daniel J. Bernstein 的流密码，与 pycryptodome 交叉验证 8/8。
 * 状态常量 "expa/nd 3/2-by/te k" 是唯一需要死记的部分，已与参考实现逐字节比对。
 * ============================================================ */
/* ========== Salsa20（Daniel J. Bernstein）—— 与 pycryptodome 交叉验证 ==========
   状态常量是 "expand 32-byte k" 的四个小端字，不是前 16 字节按序取用：
     0x61707865("expa") 0x3320646e("nd 3") 0x79622d32("2-by") 0x6b206574("te k")
   早先我按 sig[0..3]/sig[4..7]/sig[8..11]/sig[12..15] 之外的方式排过，全错。 */
var SALSA_C = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574];
function salsaQR(x, a, b, c, d) {
  x[b] = (x[b] ^ (((x[a] + x[d]) >>> 0) << 7 | ((x[a] + x[d]) >>> 0) >>> 25)) >>> 0;
  x[c] = (x[c] ^ (((x[b] + x[a]) >>> 0) << 9 | ((x[b] + x[a]) >>> 0) >>> 23)) >>> 0;
  x[d] = (x[d] ^ (((x[c] + x[b]) >>> 0) << 13 | ((x[c] + x[b]) >>> 0) >>> 19)) >>> 0;
  x[a] = (x[a] ^ (((x[d] + x[c]) >>> 0) << 18 | ((x[d] + x[c]) >>> 0) >>> 14)) >>> 0;
}
/* 轮数参数化：Salsa20/20 = 10 次双轮，Salsa20/12 = 6 次，Salsa20/8 = 4 次。
   降轮变体由 libsodium 官方 core3.exp 钉死（见 testscript/t_salsa_reduced.js）。 */
function salsaCore(st, rounds, noAdd) {
  var x = st.slice(), i, iters = Math.floor((rounds || 20) / 2);
  for (i = 0; i < iters; i++) {
    salsaQR(x, 0, 4, 8, 12); salsaQR(x, 5, 9, 13, 1); salsaQR(x, 10, 14, 2, 6); salsaQR(x, 15, 3, 7, 11);
    salsaQR(x, 0, 1, 2, 3);   salsaQR(x, 5, 6, 7, 4); salsaQR(x, 10, 11, 8, 9); salsaQR(x, 15, 12, 13, 14);
  }
  /* noAdd=true 即 crypto_core_salsa20*（libsodium 的 core 语义：不回加初始状态），
     仅供对照官方向量，正常加解密走 noAdd=falsy 的完整 Salsa20。 */
  if (!noAdd) for (i = 0; i < 16; i++) x[i] = (x[i] + st[i]) >>> 0;
  return x;
}
/* libsodium crypto_core_salsa20{20,12,8} 语义：in 16 / key 32 / const 16 -> 64 字节。
   ⚠ 关键（被 core4.exp 钉死）：libsodium 的 core 是**含 feed-forward 加法**的
   （x[i] += st[i]），不是"不加初始状态"的裸置换。我第一版按裸置换写，
   20/12/8 三组官方向量全错。导出供官方向量比对（core3.exp / core4.exp）。 */
function salsaCoreRaw(inp, key, cst, rounds) {
  var st = new Array(16), o, out = new Uint8Array(64), x;
  st[0] = readU32LE(cst, 0); st[5] = readU32LE(cst, 4); st[10] = readU32LE(cst, 8); st[15] = readU32LE(cst, 12);
  for (o = 0; o < 4; o++) { st[1 + o] = readU32LE(key, o * 4); st[11 + o] = readU32LE(key, 16 + o * 4); }
  for (o = 0; o < 4; o++) st[6 + o] = readU32LE(inp, o * 4);
  x = salsaCore(st, rounds);
  for (o = 0; o < 16; o++) writeU32LE(x[o], out, o * 4);
  return out;
}
if (typeof globalThis !== 'undefined') globalThis.__salsaCoreTest = salsaCoreRaw;
function salsa20Keystream(key, nonce, ctr, rounds) {
  var st = new Array(16), o;
  st[0] = SALSA_C[0];
  for (o = 0; o < 4; o++) st[1 + o] = readU32LE(key, o * 4);
  st[5] = SALSA_C[1];
  st[6] = readU32LE(nonce, 0); st[7] = readU32LE(nonce, 4);
  st[8] = Number(ctr & 0xffffffffn) >>> 0;
  st[9] = Number((ctr >> 32n) & 0xffffffffn) >>> 0;
  st[10] = SALSA_C[2];
  for (o = 0; o < 4; o++) st[11 + o] = readU32LE(key, 16 + o * 4);
  st[15] = SALSA_C[3];
  var x = salsaCore(st, rounds), out = new Uint8Array(64);
  for (var j = 0; j < 16; j++) writeU32LE(x[j], out, j * 4);
  return out;
}
function salsa20Crypt(data, key, nonce, rounds) {
  if (key.length !== 32) throw new Error('Salsa20 密钥必须为 32 字节');
  if (nonce.length !== 8) throw new Error('Salsa20 nonce 必须为 8 字节');
  var out = new Uint8Array(data.length), ks, ctr = 0n, i, j;
  for (i = 0; i < data.length; i += 64) {
    ks = salsa20Keystream(key, nonce, ctr++, rounds);
    var n = Math.min(64, data.length - i);
    for (j = 0; j < n; j++) out[i + j] = data[i + j] ^ ks[j];
  }
  return out;
}
/* Salsa20 是流密码，不该走 regSym —— regSym 会设 isSym=true，
   而主流程看到 isSym 就会调 symEncrypt()，后者第一件事是
   algo.makeBlockFn(...)。Salsa20 没有块函数，界面上一点【加密】就崩。
   流密码应像 RC4 / ChaCha20 一样用 reg + 自定义 enc/dec（不走模式路径）。
   代价：不显示「加密模式」行 —— 但流密码本来就没有分组模式可选。 */
reg({ id: 'salsa20', name: 'Salsa20', group: '对称加密', stream: true, key: true,
  keyLabel: '密钥 32 字节（Hex）', paramLabel: 'nonce 8 字节（Hex）', param: true, paramOptional: true,
  ivNeed: true, ivOptional: true, ivLabel: 'Nonce（8 字节 Hex，16 位）；留空则随机生成并前置在密文里',
  info: 'Salsa20 流密码（eSTREAM 入选）。与 pycryptodome 逐字节一致。密钥 32 字节，nonce 8 字节。Nonce 可填在上方 IV 框，也可填在参数栏。',
  enc: function (b, k, p, fmt, k2, ivHex) {
    p = String(ivHex || '').replace(/[\s,:_-]/g, '') || p;
    var key = hexToBytes(k), nonce = p ? hexToBytes(p) : crypto.getRandomValues(new Uint8Array(8));
    var ct = salsa20Crypt(b, key, nonce);
    return bytesOut(concatBytes(nonce, ct), fmt);
  },
  dec: function (b, k, p, fmt, k2, ivHex) {
    p = String(ivHex || '').replace(/[\s,:_-]/g, '') || p;
    var key = hexToBytes(k);
    /* 解密时界面给的是原始文本，需按 fmt 解码；此前直接当字节用会 subarray 报错 */
    if (typeof b === 'string') b = bytesIn(b, fmt);
    var body = b, nonce;
    if (p) {
      nonce = hexToBytes(p);
      /* 加密输出是 nonce‖密文；若前 8 字节正是该 nonce 则剥掉，避免重复解密 */
      if (b.length >= 8 && b.subarray(0, 8).every(function (v, i) { return v === nonce[i]; })) body = b.subarray(8);
    } else {
      if (b.length < 8) throw new Error('需要 nonce：请在参数栏填 8 字节 Hex，或让密文自带 nonce 前缀');
      nonce = b.subarray(0, 8); body = b.subarray(8);
    }
    return bytesOut(salsa20Crypt(body, key, nonce), fmt);
  } });

/* ============================================================
 * Salsa20 降轮变体：Salsa20/12 与 Salsa20/8（DJB 定义）
 * ------------------------------------------------------------
 * 与 Salsa20/20 唯一差异就是轮数（双轮次数 6 / 4 / 10），状态布局、
 * 常量、加法完全不变。libsodium 提供 crypto_core_salsa2012 /
 * crypto_core_salsa208，其官方期望值在 test/default/core3.exp，
 * 另有 stream5.exp / stream6.exp 为 salsa2012 的流向量。
 * 验收：testscript/t_salsa_reduced.js
 * ============================================================ */
function salsaStreamReg(id, name, rounds, info) {
  function splitParam(p, ivHex) {
    return String(ivHex || '').replace(/[\s,:_-]/g, '') || p;
  }
  reg({
    id: id, name: name, group: '对称加密', stream: true, key: true,
    keyLabel: '密钥 32 字节（Hex）', paramLabel: 'nonce 8 字节（Hex）', param: true, paramOptional: true,
    ivNeed: true, ivOptional: true, ivLabel: 'Nonce（8 字节 Hex，16 位）；留空则随机生成并前置在密文里',
    info: info,
    enc: function (b, k, p, fmt, k2, ivHex) {
      p = splitParam(p, ivHex);
      var key = hexToBytes(k), nonce = p ? hexToBytes(p) : crypto.getRandomValues(new Uint8Array(8));
      if (nonce.length !== 8) throw new Error('nonce 必须为 8 字节（16 位 Hex）');
      return bytesOut(concatBytes(nonce, salsa20Crypt(b, key, nonce, rounds)), fmt);
    },
    dec: function (b, k, p, fmt, k2, ivHex) {
      p = splitParam(p, ivHex);
      var key = hexToBytes(k);
      if (typeof b === 'string') b = bytesIn(b, fmt);
      var body = b, nonce;
      if (p) {
        nonce = hexToBytes(p);
        if (b.length >= 8 && b.subarray(0, 8).every(function (v, i) { return v === nonce[i]; })) body = b.subarray(8);
      } else {
        if (b.length < 8) throw new Error('需要 nonce：请在参数栏填 8 字节 Hex，或让密文自带 nonce 前缀');
        nonce = b.subarray(0, 8); body = b.subarray(8);
      }
      return bytesOut(salsa20Crypt(body, key, nonce, rounds), fmt);
    }
  });
}

salsaStreamReg('salsa20-12', 'Salsa20/12（降轮变体）', 12,
  'Salsa20 的 12 轮变体（DJB 定义，比 20 轮快约 40%）。libsodium 官方 core3.exp 与 stream5/stream6.exp 向量验收通过。密钥 32 字节、nonce 8 字节。安全性低于 Salsa20/20，新系统请优先用完整 20 轮。');
salsaStreamReg('salsa20-8', 'Salsa20/8（降轮变体）', 8,
  'Salsa20 的 8 轮变体（DJB 定义）。libsodium 官方 core3.exp 向量验收通过。**仅作教学与性能测试用途**：8 轮对差分攻击的抵抗明显不足，不要在任何安全场景使用。密钥 32 字节、nonce 8 字节。');
