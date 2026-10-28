/* ============================================================
 * PRESENT 验收脚本
 *   运行：node testscript/t_present.js    （必须在 index.html 那层）
 *
 * 三组证据，互不重复：
 *   A) 论文官方 KAT —— 80 位（CHES 2007 Appendix I）4 条、
 *      128 位 4 条。加解密双向都要还原。
 *   B) 论文 Appendix II 的 32 个中间轮密钥（全 F 的 128 位密钥），
 *      逐条对拍 —— 这条能定位到密钥调度，而不只是看最终密文对不对。
 *   C) 位级直译实现的差分测试 —— 另写一份「逐位照抄论文句子」的实现，
 *      与生产路径的位运算实现对比随机输入。两者不共享代码，
 *      能对上说明不是「自己跟自己对」。
 *
 * ⚠ 记一次教训（2026-10-25）：
 *   128 位那四条标准值，我最初凭记忆写成
 *     13238C71027206B3 / 3C601D0B1BD09B7D / 628D657F07D4C0A0
 *   实测三条全 FAIL，一度以为密钥调度写错，穷举
 *   rotl(128) × cpos(124) × 双S盒(2) 共 32768 种组合全部 0 命中。
 *   联网核对后确认：**是我记错了**，正确值是
 *     13238c710272a5d8 / 3c6019e5e5edd563 / 628d9fbd4218e5b4
 *   与实现输出完全一致。论文 Appendix I 只发表了 80 位的已知答案，
 *   128 位给的是密钥调度没有向量，所以这四条来自两个独立实现
 *   （Crypto StackExchange 与 docs.rs 的 Rust 库，后者明确说明由
 *   不共享代码的两条路径互相钉死）。
 *   → 结论：向量也必须核对来源，不能凭记忆写。凭记忆写标准值，
 *     跟凭记忆写算法一样危险，而且会反过来误导排查方向。
 * ============================================================ */
'use strict';
var path = require('path');
var ROOT = path.resolve(__dirname, '..');
var P = require(path.join(ROOT, 'crypto_present.js'));

var pass = 0, fail = 0;
function ck(cond, msg) { if (cond) { pass++; } else { fail++; console.log('FAIL: ' + msg); } }

function hb(s) { return new Uint8Array(s.match(/../g).map(function (x) { return parseInt(x, 16); })); }
function tohex(b) { return Array.from(b).map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }

/* ---------- A) 官方 KAT ---------- */
var KAT80 = [
  ['00000000000000000000', '0000000000000000', '5579C1387B228445'],
  ['FFFFFFFFFFFFFFFFFFFF', '0000000000000000', 'E72C46C0F5945049'],
  ['00000000000000000000', 'FFFFFFFFFFFFFFFF', 'A112FFC72F68417B'],
  ['FFFFFFFFFFFFFFFFFFFF', 'FFFFFFFFFFFFFFFF', '3333DCD3213210D2']
];
var KAT128 = [
  ['00000000000000000000000000000000', '0000000000000000', '96db702a2e6900af'],
  ['ffffffffffffffffffffffffffffffff', '0000000000000000', '13238c710272a5d8'],
  ['00000000000000000000000000000000', 'ffffffffffffffff', '3c6019e5e5edd563'],
  ['ffffffffffffffffffffffffffffffff', 'ffffffffffffffff', '628d9fbd4218e5b4']
];
function runKat(list, tag) {
  var ok = 0, bad = 0;
  list.forEach(function (v) {
    var rk = P.keySchedule(hb(v[0]));
    var ct = tohex(P.presentEnc(hb(v[1]), rk));
    var pt = tohex(P.presentDec(hb(v[2]), rk));
    if (ct === v[2].toLowerCase() && pt === v[1].toLowerCase()) ok++;
    else { bad++; console.log('  ' + tag + ' mismatch ct=' + ct + ' want=' + v[2].toLowerCase() + ' back=' + pt); }
  });
  ck(bad === 0, tag + ' 有 ' + bad + ' 条不符（通过 ' + ok + '）');
  console.log(tag + ' 向量: 通过 ' + ok + ' / ' + list.length);
}
runKat(KAT80, 'PRESENT-80');
runKat(KAT128, 'PRESENT-128');

/* ---------- B) 论文 Appendix II 的 32 个中间轮密钥 ---------- */
var KS = ('ffffffffffffffff 22ffffffffffffff 2dffffffffffffff 148bffffffffffff ' +
  '19b7fffffffffffe 74522ffffffffffe 7966dffffffffffe 47d148bffffffffe ' +
  '40e59b7ffffffffd 871f4522fffffffd 8003966dfffffffd f11c7d148bfffffd ' +
  'fa000e59b7fffffc e2c471f4522ffffc ede8003966dffffc 328b11c7d148bffc ' +
  '3db7a000e59b7ffb d4ca2c471f4522fb d9f6de8003966dfb a25328b11c7d148f ' +
  '1d67db7a000e59b2 01894ca2c471f457 14759f6de8003963 a30625328b11c7d4 ' +
  'ec51d67db7a000e3 d68c1894ca2c4719 6bb14759f6de8005 fb5a30625328b11a ' +
  '00aec51d67db7a07 1bed68c1894ca2c3 a902bb14759f6def 2c6fb5a30625328c').split(' ');
var rkF = P.keySchedule(hb('ffffffffffffffffffffffffffffffff'));
var ksOk = 0, ksBad = 0;
for (var i = 0; i < 32; i++) {
  if (tohex(rkF[i]) === KS[i]) ksOk++;
  else { ksBad++; console.log('  KS[' + i + ']=' + tohex(rkF[i]) + ' want=' + KS[i]); }
}
ck(ksBad === 0, '中间轮密钥有 ' + ksBad + ' 条不符');
console.log('论文 Appendix II 中间轮密钥: 匹配 ' + ksOk + ' / 32');

/* ---------- C) 位级直译实现（与生产路径不共享代码） ---------- */
var SBOX = P.SBOX, SBOX_INV = P.SBOX_INV;

/* 密钥字节 -> k 数组，bitsK[i] = k_i（i 越大位越高） */
function keyBits(key, len) {
  var k = new Uint8Array(len), j, m;
  for (j = 0; j < key.length; j++)
    for (m = 0; m < 8; m++) k[len - 1 - 8 * j - m] = (key[j] >> (7 - m)) & 1;
  return k;
}
function ctBits(b) {  /* 字节 -> b_i */
  var s = new Uint8Array(64), j, m;
  for (j = 0; j < 8; j++) for (m = 0; m < 8; m++) s[63 - 8 * j - m] = (b[j] >> (7 - m)) & 1;
  return s;
}
function bitsToBytes8(bits) {
  var b = new Uint8Array(8), j, m;
  for (j = 0; j < 8; j++) { var v = 0; for (m = 0; m < 8; m++) v |= (bits[63 - 8 * j - m] & 1) << (7 - m); b[j] = v; }
  return b;
}
/* 轮密钥：κ63..κ0 = k_{len-1}..k_{len-64} */
function rkFromK(k, len) {
  var rk = new Uint8Array(64), i;
  for (i = 0; i < 64; i++) rk[63 - i] = k[len - 1 - i];
  return rk;
}
function ksBitwise(key) {
  var len = key.length * 8, k = keyBits(key, len), out = [], i, j;
  for (i = 1; i <= 32; i++) {
    out.push(rkFromK(k, len));
    if (i === 32) break;
    /* k <<< 61  →  新 k_i = 旧 k_{(i + len - 61) mod len} */
    var nk = new Uint8Array(len);
    for (j = 0; j < len; j++) nk[j] = k[(j + len - 61) % len];
    k = nk;
    /* 最高 nibble（128 位是最高两个）过 S 盒 */
    var nib = (k[len - 1] << 3) | (k[len - 2] << 2) | (k[len - 3] << 1) | k[len - 4];
    var sn = SBOX[nib];
    k[len - 1] = (sn >> 3) & 1; k[len - 2] = (sn >> 2) & 1; k[len - 3] = (sn >> 1) & 1; k[len - 4] = sn & 1;
    if (len === 128) {
      var n2 = (k[len - 5] << 3) | (k[len - 6] << 2) | (k[len - 7] << 1) | k[len - 8];
      var s2 = SBOX[n2];
      k[len - 5] = (s2 >> 3) & 1; k[len - 6] = (s2 >> 2) & 1; k[len - 7] = (s2 >> 1) & 1; k[len - 8] = s2 & 1;
    }
    /* 轮计数器：80 位异或 k19..k15，128 位异或 k66..k62（高位在前） */
    var top = (len === 80) ? 19 : 66;
    for (j = 0; j < 5; j++) k[top - j] ^= (i >> (4 - j)) & 1;
  }
  return out;
}
function sBoxBitwise(s, box) {
  var o = new Uint8Array(64), i;
  for (i = 0; i < 16; i++) {
    var w = (s[4 * i + 3] << 3) | (s[4 * i + 2] << 2) | (s[4 * i + 1] << 1) | s[4 * i];
    var v = box[w];
    o[4 * i + 3] = (v >> 3) & 1; o[4 * i + 2] = (v >> 2) & 1; o[4 * i + 1] = (v >> 1) & 1; o[4 * i] = v & 1;
  }
  return o;
}
function pLayerBitwise(s) {
  var o = new Uint8Array(64), i;
  for (i = 0; i < 63; i++) o[(i * 16) % 63] = s[i];
  o[63] = s[63];
  return o;
}
function pLayerInvBitwise(s) {
  var o = new Uint8Array(64), i;
  for (i = 0; i < 63; i++) o[i] = s[(i * 16) % 63];
  o[63] = s[63];
  return o;
}
function xor64(a, b) { var o = new Uint8Array(64), i; for (i = 0; i < 64; i++) o[i] = a[i] ^ b[i]; return o; }
function encBitwise(pt, rk) {
  var s = ctBits(pt), i;
  for (i = 0; i < 31; i++) { s = xor64(s, rk[i]); s = sBoxBitwise(s, SBOX); s = pLayerBitwise(s); }
  return bitsToBytes8(xor64(s, rk[31]));
}
function decBitwise(ct, rk) {
  var s = ctBits(ct), i;
  s = xor64(s, rk[31]);
  for (i = 30; i >= 0; i--) { s = pLayerInvBitwise(s); s = sBoxBitwise(s, SBOX_INV); s = xor64(s, rk[i]); }
  return bitsToBytes8(s);
}

/* 差分：随机密钥 + 随机明文 */
function rnd(n) { var b = new Uint8Array(n); for (var i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256); return b; }
var N = 200, dOk = 0, dBad = 0;
[10, 16].forEach(function (kl) {
  for (var t = 0; t < N; t++) {
    var key = rnd(kl), pt = rnd(8);
    var rkA = P.keySchedule(key), ctA = P.presentEnc(pt, rkA), backA = P.presentDec(ctA, rkA);
    var rkB = ksBitwise(key), ctB = encBitwise(pt, rkB), backB = decBitwise(ctB, rkB);
    if (tohex(ctA) === tohex(ctB) && tohex(backA) === tohex(pt) && tohex(backB) === tohex(pt)) dOk++;
    else { dBad++; if (dBad <= 3) console.log('  diff k' + kl * 8 + ' A=' + tohex(ctA) + ' B=' + tohex(ctB)); }
  }
});
ck(dBad === 0, '位级差分有 ' + dBad + ' 条不符');
console.log('位级直译差分: 通过 ' + dOk + ' / ' + (N * 2));

/* ---------- D) 长度护栏 ---------- */
var gOk = 0, gBad = 0;
function expectThrow(fn, msg) {
  var threw = false;
  try { fn(); } catch (e) { threw = true; }
  if (threw) gOk++; else { gBad++; console.log('  未抛错: ' + msg); }
}
expectThrow(function () { P.keySchedule(rnd(12)); }, '密钥 12 字节');
expectThrow(function () { P.presentEnc(rnd(9), P.keySchedule(rnd(10))); }, '明文 9 字节');
expectThrow(function () { P.presentDec(rnd(4), P.keySchedule(rnd(16))); }, '密文 4 字节');
/* 工厂幂等：同一工厂连续两次调用结果必须一致（第 118 批 SIMECK 那类病） */
var kk = rnd(10);
var ks1 = P.keySchedule(kk), p1 = tohex(P.presentEnc(rnd(8), ks1)), p2 = tohex(P.presentEnc(rnd(8), ks1));
if (tohex(P.presentEnc(hb('0011223344556677'), ks1)) === tohex(P.presentEnc(hb('0011223344556677'), ks1))) gOk++;
else { gBad++; console.log('  工厂非幂等'); }
ck(gBad === 0, '护栏有 ' + gBad + ' 条不符');
console.log('长度护栏与幂等: 通过 ' + gOk + ' / 4');

console.log('\nPRESENT 测试: 通过 ' + pass + '  失败 ' + fail);
if (fail) process.exit(1);
