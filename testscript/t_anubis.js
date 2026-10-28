/* ANUBIS 验收
 * 向量来源：LibTomCrypt src/ciphers/anubis.c —— 文件头写明
 *   "Anubis implementation derived from public domain source,
 *    Authors: Paulo S.L.M. Barreto and Vincent Rijmen"（设计者发布的原版实现）。
 *   取的是 #else 分支的【原版】表，不是 LTC_ANUBIS_TWEAK（内核）那套。
 * anubis_ltc.vec 每行：K<keylen> <key hex> <pt hex> <ct hex> <dec(ct) hex>
 *   前 14 行 = 官方 tests[] 公开向量（7 种密钥长度 × 2）；
 *   其余 = 官方 C 编译出的 oracle 对随机 (key, pt) 跑出的差分数据。
 *
 * ⚠ 我（测试脚本）踩过的坑，别重犯：
 *   行首是 "K16" 这种标记，split 后【parts[0] 就是它】——
 *   写成 [,ks,key,pt,ct] 会整体错位一格，于是拿 pt 当密钥、ct 当明文，
 *   表现是"全部失败"，但其实实现完全正确。第 116 批就是这么误判的。
 *
 * 运行：在 index.html 所在目录执行  node testscript/t_anubis.js
 */
'use strict';
require('../CryptoJS/crypto_anubis.js');
var fs = require('fs');
var A = globalThis.__anubis;
var b2h = function (b) { return Buffer.from(b).toString('hex'); };
var h2b = function (h) { return new Uint8Array(Buffer.from(h, 'hex')); };

var lines = fs.readFileSync('testvectors/anubis_ltc.vec', 'utf8').trim().split('\n');
var pass = 0, fail = 0, nPub = 0, pubFail = 0;

for (var i = 0; i < lines.length; i++) {
  var a = lines[i].trim().split(/\s+/);
  if (a.length !== 5) { console.log('BADLINE#' + i); fail++; continue; }
  var kl = parseInt(a[0].slice(1), 10);
  var key = h2b(a[1]), pt = h2b(a[2]);
  if (key.length !== kl) { console.log('KLEN#' + i, kl, key.length); fail++; continue; }
  var c = A.make(key);
  var got = b2h(c.enc(pt));
  var gotd = b2h(c.dec(h2b(a[3])));
  if (i < 14) nPub++;
  if (got === a[3] && gotd === a[4]) {
    pass++;
  } else {
    if (i < 14) pubFail++;
    if (fail < 3) console.log('FAIL#' + i, 'K' + kl, 'want', a[3], 'got', got, '| wantdec', a[4], 'gotdec', gotd);
    fail++;
  }
}

var desc = 'ANUBIS 官方公开向量(14) + 官方C差分(' + (lines.length - 14) + ')';
console.log(desc + '   PASS ' + pass + '  FAIL ' + fail + '   (公开向量失败 ' + pubFail + '/' + nPub + ')');

/* ---- 边界：密钥长度 / 块长度非法必须抛错，不能静默算错 ---- */
var bPass = 0, bFail = 0;
function mustThrow(fn, tag) {
  var threw = false;
  try { fn(); } catch (e) { threw = true; }
  if (threw) bPass++; else { bFail++; console.log('NOTHROW ' + tag); }
}
[15, 17, 21, 41, 0].forEach(function (n) {
  mustThrow(function () { A.make(new Uint8Array(n)); }, 'keylen=' + n);
});
var bad = [12, 13, 15, 17, 20, 24, 28, 32, 36, 40];
mustThrow(function () { A.make(new Uint8Array(16)).enc(new Uint8Array(8)); }, 'block=8');
/* 合法长度全部可用：7 种密钥长度各跑一轮往返 */
for (var kv = 16; kv <= 40; kv += 4) {
  var k = new Uint8Array(kv); for (var q = 0; q < kv; q++) k[q] = (q * 37 + kv) & 0xff;
  var cc = A.make(k);
  var p = new Uint8Array(16); for (var w = 0; w < 16; w++) p[w] = w * 11 & 0xff;
  var r = cc.dec(cc.enc(p));
  if (b2h(r) === b2h(p)) bPass++; else { bFail++; console.log('RTFAIL K' + kv); }
}
console.log('ANUBIS 边界与往返          PASS ' + bPass + '  FAIL ' + bFail);
pass += bPass; fail += bFail;

console.log('ANUBIS 合计                PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
