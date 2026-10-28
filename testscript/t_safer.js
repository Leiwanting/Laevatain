/* SAFER 四变体验收：K-64 / K-128 / SK-64 / SK-128
 *
 * 期望值全部来自**外部**，不是本实现自产：
 *  A. Massey 原论文附录 C（SAFER K-64 六轮，4 组 + 逐轮中间值）
 *  B. Crypto++ 公开向量：K-64 四条（6 轮）、K-128 四条（12 轮）
 *  C. LibTomCrypt src/ciphers/safer/safer.c 内嵌向量：K-64(6) / SK-64(6) / SK-128(10)
 *  D. DarkCrypt SAFER-SK128 三条（8 轮）
 *
 * ⚠ 手抄标准答案是本项目踩过两次的坑（PRESENT、SK-64），本文件所有期望值
 *   均直接取自上述来源原文，改动前请回查，不要凭记忆改数字。
 *
 * 运行：在 index.html 所在目录执行  node testscript/t_safer.js
 */
'use strict';
require('../CryptoJS/crypto_safer.js');
var S = globalThis.__safer;

var pass = 0, fail = 0;
function ck(cond, tag, detail) {
  if (cond) pass++;
  else { if (fail < 6) console.log('  FAIL ' + tag + (detail ? '  ' + detail : '')); fail++; }
}
function h2b(s) { var o = []; for (var i = 0; i < s.length; i += 2) o.push(parseInt(s.substr(i, 2), 16)); return new Uint8Array(o); }
function b2h(b) { var s = ''; for (var i = 0; i < b.length; i++) s += ('0' + b[i].toString(16)).slice(-2); return s; }

/* ── A. Massey 原论文附录 C：SAFER K-64 六轮 ───────────────────── */
console.log('A) Massey 原论文（SAFER K-64，6 轮）');
[
  { pt: [1, 2, 3, 4, 5, 6, 7, 8], key: [0, 0, 0, 0, 0, 0, 0, 0], ct: [125, 40, 3, 134, 51, 185, 46, 180] },
  { pt: [0, 0, 0, 0, 0, 0, 0, 0], key: [1, 2, 3, 4, 5, 6, 7, 8], ct: [90, 178, 127, 114, 20, 163, 58, 225] },
  { pt: [1, 2, 3, 4, 5, 6, 7, 8], key: [8, 7, 6, 5, 4, 3, 2, 1], ct: [200, 242, 156, 221, 135, 120, 62, 217] },
  { pt: [0, 0, 0, 0, 0, 0, 0, 0], key: [0, 0, 0, 0, 0, 0, 0, 0], ct: [3, 40, 8, 201, 14, 231, 171, 127] }
].forEach(function (v, idx) {
  var c = S.make(6, false, 8)(new Uint8Array(v.key));
  var ct = c.enc(new Uint8Array(v.pt));
  var dt = c.dec(ct);
  ck(b2h(ct) === b2h(new Uint8Array(v.ct)), 'paper#' + idx, 'want ' + b2h(new Uint8Array(v.ct)) + ' got ' + b2h(ct));
  ck(b2h(dt) === b2h(new Uint8Array(v.pt)), 'paper#' + idx + ' 往返');
});

/* 论文逐轮中间值（第 1 组：PT=1..8、KEY 全 0）
   全 0 密钥时子密钥 = exptab[exptab[9i+j]]，可纯手算复现，是最强的定位材料：
   PHT 配对写错时长度与加解密都自洽，只有逐轮中间值能抓出来。 */
(function () {
  var rounds = [
    [0, 46, 170, 144, 255, 118, 2, 238], [35, 175, 193, 103, 246, 87, 43, 202],
    [64, 252, 4, 38, 1, 140, 36, 104], [2, 62, 127, 41, 25, 97, 179, 196],
    [59, 221, 9, 152, 113, 50, 224, 52], [242, 255, 38, 130, 179, 219, 71, 133]
  ];
  var K = S.expand(new Uint8Array(8), new Uint8Array(8), 6, false);
  var cur = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  for (var r = 1; r <= 6; r++) {
    cur = S.roundEnc(K, r, cur);
    ck(b2h(cur) === b2h(new Uint8Array(rounds[r - 1])),
       'paper 逐轮#' + r, 'want ' + b2h(new Uint8Array(rounds[r - 1])) + ' got ' + b2h(cur));
  }
  console.log('  论文逐轮中间值已比对 6 轮');
})();

/* ── B1. Crypto++ SAFER K-64（6 轮）─────────────────────────────── */
console.log('B1) Crypto++ SAFER K-64（6 轮）');
[
  ['0000000000000000', '0000000000000000', '032808c90ee7ab7f'],
  ['0000000000000000', '0102030405060708', '7d28038633b92eb4'],
  ['0102030405060708', '1011121314151617', '71e5cf7f083a59c5'],
  ['0102030405060708', '18191a1b1c1d1e1f', '356f702cc7fa8161']
].forEach(function (v, i) {
  var c = S.make(6, false, 8)(h2b(v[0]));
  var ct = c.enc(h2b(v[1]));
  ck(b2h(ct) === v[2], 'cpp-k64#' + i, 'want ' + v[2] + ' got ' + b2h(ct));
  ck(b2h(c.dec(ct)) === v[1], 'cpp-k64#' + i + ' 往返');
});

/* ── B2. Crypto++ SAFER K-128（12 轮）───────────────────────────── */
console.log('B2) Crypto++ SAFER K-128（12 轮）');
[
  ['08070605040302010807060504030201', '5051525354555657', '38e64dbf6e0f896e'],
  ['08070605040302010807060504030201', '58595a5b5c5d5e5f', '7d8f014a902480fe'],
  ['01020304050607080807060504030201', '6061626364656667', '113511c22e7936df'],
  ['01020304050607080807060504030201', '68696a6b6c6d6e6f', '9eeb2d17c0581437']
].forEach(function (v, i) {
  var c = S.make(12, false, 16)(h2b(v[0]));
  var ct = c.enc(h2b(v[1]));
  ck(b2h(ct) === v[2], 'cpp-k128#' + i, 'want ' + v[2] + ' got ' + b2h(ct));
  ck(b2h(c.dec(ct)) === v[1], 'cpp-k128#' + i + ' 往返');
});

/* ── C. LibTomCrypt 内嵌向量 ─────────────────────────────────────── */
console.log('C) LibTomCrypt 内嵌向量（safer.c）');
[
  { nm: 'K-64 r6', r: 6, sk: false, kl: 8, key: [8, 7, 6, 5, 4, 3, 2, 1], pt: [1, 2, 3, 4, 5, 6, 7, 8], ct: [200, 242, 156, 221, 135, 120, 62, 217] },
  { nm: 'SK-64 r6', r: 6, sk: true, kl: 8, key: [1, 2, 3, 4, 5, 6, 7, 8], pt: [1, 2, 3, 4, 5, 6, 7, 8], ct: [95, 206, 155, 162, 5, 132, 56, 199] },
  { nm: 'SK-128 r10', r: 10, sk: true, kl: 16, key: [1, 2, 3, 4, 5, 6, 7, 8, 0, 0, 0, 0, 0, 0, 0, 0], pt: [1, 2, 3, 4, 5, 6, 7, 8], ct: [255, 120, 17, 228, 179, 167, 46, 113] }
].forEach(function (v) {
  var c = S.make(v.r, v.sk, v.kl)(new Uint8Array(v.key));
  var ct = c.enc(new Uint8Array(v.pt));
  ck(b2h(ct) === b2h(new Uint8Array(v.ct)), 'ltc-' + v.nm, 'want ' + b2h(new Uint8Array(v.ct)) + ' got ' + b2h(ct));
  ck(b2h(c.dec(ct)) === b2h(new Uint8Array(v.pt)), 'ltc-' + v.nm + ' 往返');
});

/* ── D. DarkCrypt SAFER-SK128（8 轮）─────────────────────────────── */
console.log('D) DarkCrypt SAFER-SK128（8 轮）');
[
  ['00000000000000000000000000000000', '0000000000000000', '62c4803deb82506d'],
  ['000102030405060708090a0b0c0d0e0f', '0001020304050607', 'f9820c2fd85d91b6'],
  ['0102030405060708090a0b0c0d0e0f10', '1011121314151617', '4334e11aac2fdd2c']
].forEach(function (v, i) {
  var c = S.make(8, true, 16)(h2b(v[0]));
  var ct = c.enc(h2b(v[1]));
  ck(b2h(ct) === v[2], 'darkcrypt#' + i, 'want ' + v[2] + ' got ' + b2h(ct));
  ck(b2h(c.dec(ct)) === v[1], 'darkcrypt#' + i + ' 往返');
});

/* ── E. 条目层（ALGOS 注册的四个变体）随机往返 ──────────────────── */
console.log('E) 条目层随机往返');
S.variants.forEach(function (v) {
  var mk = S.make(v.r, v.sk, v.kl);
  var ok = 0, n = 50;
  for (var t = 0; t < n; t++) {
    var key = new Uint8Array(v.kl), pt = new Uint8Array(8);
    for (var i = 0; i < v.kl; i++) key[i] = (Math.random() * 256) | 0;
    for (var j = 0; j < 8; j++) pt[j] = (Math.random() * 256) | 0;
    var c = mk(key);
    if (b2h(c.dec(c.enc(pt))) === b2h(pt)) ok++;
  }
  ck(ok === n, v.id + ' 往返', ok + '/' + n);
  console.log('  ' + v.id + ' 往返 ' + ok + '/' + n);
});

/* ── F. 边界：错误长度必须抛错 ───────────────────────────────────── */
console.log('F) 边界');
S.variants.forEach(function (v) {
  var threw = false;
  try { S.make(v.r, v.sk, v.kl)(new Uint8Array(v.kl === 8 ? 16 : 8)); } catch (e) { threw = true; }
  ck(threw, v.id + ' 错误密钥长度应抛错');
});
var threw2 = false;
try { S.make(6, false, 8)(new Uint8Array(8)).enc(new Uint8Array(16)); } catch (e) { threw2 = true; }
ck(threw2, '错误块长度应抛错');

console.log('\nSAFER 验收: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
