/* ============================================================
 * t_kalyna.js —— Kalyna（DSTU 7624:2014）官方向量验收
 *
 * 运行（必须在 index.html 所在目录）：
 *   node testscript/t_kalyna.js
 *
 * 向量的两条来源，互不重叠：
 *  A) Crypto++ TestVectors/kalyna.txt 的 5 条 ECB（128/128、128/256、
 *     256/256、256/512、512/512 各 1 条）——公开标准向量。
 *  B) 200 条由【Kalyna 官方参考 C 实现】gcc -O2 编译出的二进制直接跑出
 *     （5 个参数集 × 40 条随机）。裁判是设计者本人发布的源码编译产物，
 *     不是另写一份实现自证，所以 B 是真·差分测试。
 *
 * 每条同时验：enc(pt) == ct，且 dec(ct) == pt（解密路径也覆盖）。
 * 另含 C) 往返  D) 边界：密钥长度不对必须抛错。
 * ============================================================ */
'use strict';
var fs = require('fs');
var path = require('path');

require(path.join(__dirname, '..', 'CryptoJS/crypto_kalyna.js'));
var K = globalThis.CRYPTO_KALYNA;
if (!K) throw new Error('crypto_kalyna.js 未导出 CRYPTO_KALYNA');

function h2b(s) { var b = new Uint8Array(s.length / 2); for (var i = 0; i < b.length; i++) b[i] = parseInt(s.substr(i * 2, 2), 16); return b; }
function b2h(b) { var s = ''; for (var i = 0; i < b.length; i++) s += ('0' + b[i].toString(16)).slice(-2); return s; }

var PASS = 0, FAIL = 0;
function ok(name, cond, why) { if (cond) { PASS++; } else { FAIL++; console.log('  FAIL ' + name + (why ? ' — ' + why : '')); } }

/* ---------- A) Crypto++ 公开 ECB 向量 ---------- */
var CRYPTOPP = [
  { id: 'kalyna128', nb: 2, nk: 2, nr: 10,
    key: '000102030405060708090A0B0C0D0E0F', pt: '101112131415161718191A1B1C1D1E1F', ct: '81BF1C7D779BAC20E1C9EA39B4D2AD06' },
  { id: 'kalyna128-256', nb: 2, nk: 4, nr: 14,
    key: '000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F', pt: '202122232425262728292A2B2C2D2E2F', ct: '58EC3E091000158A1148F7166F334F14' },
  { id: 'kalyna256', nb: 4, nk: 4, nr: 14,
    key: '000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F',
    pt: '202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F',
    ct: 'F66E3D570EC92135AEDAE323DCBD2A8CA03963EC206A0D5A88385C24617FD92C' },
  { id: 'kalyna256-512', nb: 4, nk: 8, nr: 18,
    key: '000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F',
    pt: '404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F',
    ct: '606990E9E6B7B67A4BD6D893D72268B78E02C83C3CD7E102FD2E74A8FDFE5DD9' },
  { id: 'kalyna512', nb: 8, nk: 8, nr: 18,
    key: '000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F',
    pt: '404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F',
    ct: '4A26E31B811C356AA61DD6CA0596231A67BA8354AA47F3A13E1DEEC320EB56B895D0F417175BAB662FD6F134BB15C86CCB906A26856EFEB7C5BC6472940DD9D9' }
];

console.log('A) Crypto++ 公开 ECB 向量');
CRYPTOPP.forEach(function (v) {
  var f = K.kalynaMake(v.nb, v.nk, v.nr, v.nk * 64)(h2b(v.key));
  var ct = b2h(f.enc(h2b(v.pt))).toUpperCase();
  ok(v.id + ' enc', ct === v.ct.toUpperCase(), 'got ' + ct);
  ok(v.id + ' dec', b2h(f.dec(h2b(v.ct))) === v.pt.toLowerCase());
});

/* ---------- B) 官方参考 C 二进制跑出的差分集 ---------- */
var VF = path.join(__dirname, '..', 'testvectors', 'kalyna_official_ref.json');
if (!fs.existsSync(VF)) throw new Error('找不到向量文件 ' + VF);
var data = JSON.parse(fs.readFileSync(VF, 'utf8'));
console.log('B) 官方参考 C 裁判差分集 ' + data.cases.length + ' 条');
var byParam = {};
data.cases.forEach(function (c) {
  var nb = c.bb / 64, nk = c.kb / 64, nr = K.KAL_NR[c.kb];
  var key = c.bb + '/' + c.kb;
  if (!byParam[key]) byParam[key] = { nb: nb, nk: nk, nr: nr, n: 0, bad: 0 };
  var f = K.kalynaMake(nb, nk, nr, c.kb)(h2b(c.key));
  var ct = b2h(f.enc(h2b(c.pt)));
  var back = b2h(f.dec(h2b(c.ct)));
  if (ct !== c.ct) byParam[key].bad++;
  if (back !== c.pt) byParam[key].bad++;
  byParam[key].n++;
  ok('diff ' + key, ct === c.ct && back === c.pt, 'enc ' + (ct === c.ct) + ' dec ' + (back === c.pt));
});
Object.keys(byParam).forEach(function (k) {
  console.log('   ' + k + ' 位：' + byParam[k].n + ' 条，不一致 ' + byParam[k].bad);
});

/* ---------- C) 往返 ---------- */
console.log('C) 往返');
[[2, 2, 128], [2, 4, 256], [4, 4, 256], [4, 8, 512], [8, 8, 512]].forEach(function (t) {
  var nb = t[0], nk = t[1], kb = t[2], nr = K.KAL_NR[kb];
  var key = new Uint8Array(kb / 8); for (var i = 0; i < key.length; i++) key[i] = (i * 37 + 11) & 255;
  var f = K.kalynaMake(nb, nk, nr, kb)(key);
  var pt = new Uint8Array(nb * 8); for (i = 0; i < pt.length; i++) pt[i] = (i * 91 + 5) & 255;
  ok('roundtrip ' + (nb * 64) + '/' + kb, b2h(f.dec(f.enc(pt))) === b2h(pt));
});

/* ---------- D) 边界 ---------- */
console.log('D) 边界：密钥长度不对必须抛错');
[[2, 2, 128], [8, 8, 512]].forEach(function (t) {
  var nb = t[0], nk = t[1], kb = t[2], nr = K.KAL_NR[kb];
  var mk = K.kalynaMake(nb, nk, nr, kb);
  var threw = false;
  try { mk(new Uint8Array(kb / 8 - 1)); } catch (e) { threw = true; }
  ok('shortkey ' + kb + ' 抛错', threw);
  var threw2 = false;
  try { mk(new Uint8Array(kb / 8 + 1)); } catch (e) { threw2 = true; }
  ok('longkey ' + kb + ' 抛错', threw2);
});

console.log('\nPASS ' + PASS + '  FAIL ' + FAIL);
process.exit(FAIL ? 1 : 0);
