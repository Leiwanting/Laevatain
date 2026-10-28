/* ============================================================
 * t_block_d.js —— D 组分组密码官方向量验收
 *   来源：Crypto++（weidai11/cryptopp @ master）TestVectors/
 *   lea.txt / hight.txt / simeck.txt / cham.txt
 *
 * 运行（必须在 index.html 所在目录）：
 *   node t_block_d.js
 *
 * 说明：Crypto++ 的 TestVectors 是 "Key/Plaintext/Ciphertext/Test" 文本格式，
 *   同一个文件里混有 ECB/CBC/CTR，这里只取 ECB（裸分组，不含模式）。
 *   明文可能超过一个块，逐块调用 makeBlockFn 后拼接再比对。
 * ============================================================ */
'use strict';
var fs = require('fs');
var path = require('path');

require('../CryptoJS/crypto_block_d.js');
var D = globalThis.CRYPTO_BLOCK_D;

var VEC = path.join(__dirname, '..', 'testvectors');
function vecFile(n) { return path.join(VEC, n); }

/* ---- Crypto++ TestVectors 解析器：只取 ECB ---- */
function parseCryptopp(file) {
  var src;
  for (var p of [file, path.join('/tmp/cp/cryptopp-master/TestVectors', path.basename(file))]) {
    if (fs.existsSync(p)) { src = fs.readFileSync(p, 'latin1'); break; }
  }
  if (src === undefined) throw new Error('找不到向量文件 ' + file);
  var out = [], cur = {}, mode = null;
  src.split(/\r?\n/).forEach(function (ln) {
    var t = ln.trim(); if (!t) return;
    var i = t.indexOf(':'); if (i < 0) return;
    var k = t.slice(0, i).trim(), v = t.slice(i + 1).trim();
    if (k === 'Name') { mode = v; cur = { mode: v }; }
    else if (k === 'Key') cur.key = Buffer.from(v.replace(/\s+/g, ''), 'hex');
    else if (k === 'Plaintext') cur.pt = Buffer.from(v.replace(/\s+/g, ''), 'hex');
    else if (k === 'Ciphertext') cur.ct = Buffer.from(v.replace(/\s+/g, ''), 'hex');
    else if (k === 'Test') {
      if (mode && /\/ECB/.test(mode) && cur.key && cur.pt && cur.ct) out.push(cur);
      cur = { mode: mode };
    }
  });
  return out;
}

function hex(b) { return Buffer.from(b).toString('hex'); }

/* ---- 逐块跑 ECB，返回 {enc, dec} 是否都匹配 ---- */
function runCase(makeBlockFn, vec, blockSize) {
  var f;
  try { f = makeBlockFn(vec.key); } catch (e) { return { ok: false, why: '密钥: ' + e.message }; }
  var out = Buffer.alloc(0), back = Buffer.alloc(0);
  try {
    for (var o = 0; o < vec.pt.length; o += blockSize) {
      out = Buffer.concat([out, Buffer.from(f.enc(vec.pt.slice(o, o + blockSize)))]);
    }
    for (var o2 = 0; o2 < vec.ct.length; o2 += blockSize) {
      back = Buffer.concat([back, Buffer.from(f.dec(vec.ct.slice(o2, o2 + blockSize)))]);
    }
  } catch (e) { return { ok: false, why: '运算: ' + e.message }; }
  if (!out.equals(vec.ct)) return { ok: false, why: '密文: got ' + hex(out.slice(0, 16)) + ' want ' + hex(vec.ct.slice(0, 16)) };
  if (!back.equals(vec.pt)) return { ok: false, why: '解密回不去' };
  return { ok: true };
}

var PASS = 0, FAIL = 0, SKIP = 0, fails = [];

function group(name, file, pick, makeFn, blockSize) {
  var vecs = parseCryptopp(file);
  var n = 0;
  vecs.forEach(function (v, i) {
    var mk = pick(v);
    if (!mk) { SKIP++; return; }
    n++;
    var r = runCase(mk, v, blockSize);
    if (r.ok) PASS++;
    else { FAIL++; if (fails.length < 6) fails.push(name + ' #' + i + ' (' + v.key.length * 8 + 'bit) ' + r.why); }
  });
  console.log('  ' + name.padEnd(14) + ' 用例 ' + String(n).padStart(3) + '   通过 ' + String(n - failsIn(name)).padStart(3));
}
function failsIn() { return 0; }

console.log('=== D 组分组密码 · Crypto++ 官方向量 ===');

/* --- LEA --- */
(function () {
  var vecs = parseCryptopp(vecFile('cryptopp_lea.txt'));
  var n = 0, bad = 0;
  vecs.forEach(function (v, i) {
    var bits = v.key.length * 8;
    var mk = (bits === 128) ? D.leaMake(16, 24, 4)
           : (bits === 192) ? D.leaMake(24, 28, 6)
           : D.leaMake(32, 32, 8);
    n++;
    var r = runCase(mk, v, 16);
    if (r.ok) PASS++; else { bad++; FAIL++; if (fails.length < 6) fails.push('LEA-' + bits + ' #' + i + ' ' + r.why); }
  });
  console.log('  LEA 128/192/256用例 ' + String(n).padStart(3) + '   通过 ' + String(n - bad).padStart(3));
})();

/* --- HIGHT --- */
(function () {
  var vecs = parseCryptopp(vecFile('cryptopp_hight.txt'));
  var n = 0, bad = 0;
  vecs.forEach(function (v, i) {
    n++;
    var r = runCase(D.hightMake, v, 8);
    if (r.ok) PASS++; else { bad++; FAIL++; if (fails.length < 6) fails.push('HIGHT #' + i + ' ' + r.why); }
  });
  console.log('  HIGHT          用例 ' + String(n).padStart(3) + '   通过 ' + String(n - bad).padStart(3));
})();

/* --- SIMECK --- */
(function () {
  var vecs = parseCryptopp(vecFile('cryptopp_simeck.txt'));
  var n = 0, bad = 0;
  vecs.forEach(function (v, i) {
    var mk = /SIMECK-32/.test(v.mode) ? D.simeckMake(16, 32, 0, 0x9A42BB1F, 0xFFFC)
                                      : D.simeckMake(32, 44, 0x938, 0xBCA3083F, 0xFFFFFFFC);
    var bs = /SIMECK-32/.test(v.mode) ? 4 : 8;
    n++;
    var r = runCase(mk, v, bs);
    if (r.ok) PASS++; else { bad++; FAIL++; if (fails.length < 6) fails.push('SIMECK ' + v.mode + ' #' + i + ' ' + r.why); }
  });
  console.log('  SIMECK         用例 ' + String(n).padStart(3) + '   通过 ' + String(n - bad).padStart(3));
})();

/* --- CHAM --- */
(function () {
  var vecs = parseCryptopp(vecFile('cryptopp_cham.txt'));
  var n = 0, bad = 0;
  vecs.forEach(function (v, i) {
    var mk, bs;
    if (/CHAM-64/.test(v.mode)) { mk = D.chamMake(2, 80); bs = 8; }
    else { bs = 16; mk = (v.key.length === 16) ? D.chamMake(4, 80) : D.chamMake(4, 96); }
    n++;
    var r = runCase(mk, v, bs);
    if (r.ok) PASS++; else { bad++; FAIL++; if (fails.length < 6) fails.push('CHAM ' + v.mode + ' ' + v.key.length * 8 + 'bit #' + i + ' ' + r.why); }
  });
  console.log('  CHAM           用例 ' + String(n).padStart(3) + '   通过 ' + String(n - bad).padStart(3));
})();

console.log('----------------------------------------');
console.log('PASS ' + PASS + '   FAIL ' + FAIL + '   SKIP ' + SKIP);
if (fails.length) { console.log('失败明细：'); fails.forEach(function (f) { console.log('  - ' + f); }); }
process.exit(FAIL ? 1 : 0);
