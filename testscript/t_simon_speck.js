/* ============================================================
 * t_simon_speck.js —— Simon / SPECK 全参数集官方向量验收
 *   来源：Crypto++（weidai11/cryptopp @ master）TestVectors/simon.txt、speck.txt
 *   只取 ECB（裸分组）；每个参数集 8 条，共 80 条。
 *
 * 运行（必须在 index.html 所在目录）：node testscript/t_simon_speck.js
 * ============================================================ */
'use strict';
var fs = require('fs'), path = require('path');
function parse(file) {
  var src = fs.readFileSync(path.join(__dirname, '..', 'testvectors', file), 'latin1');
  var out = [], mode = null, cur = {};
  src.split(/\r?\n/).forEach(function (ln) {
    var t = ln.trim(); if (!t) return;
    var i = t.indexOf(':'); if (i < 0) return;
    var k = t.slice(0, i).trim(), v = t.slice(i + 1).trim();
    if (k === 'Name') { mode = v; cur = { mode: v }; }
    else if (k === 'Key') cur.key = Buffer.from(v.replace(/\s+/g, ''), 'hex');
    else if (k === 'Plaintext') cur.pt = Buffer.from(v.replace(/\s+/g, ''), 'hex');
    else if (k === 'Ciphertext') cur.ct = Buffer.from(v.replace(/\s+/g, ''), 'hex');
    else if (k === 'Test') { if (mode && /\/ECB/.test(mode) && cur.key && cur.pt && cur.ct) out.push(cur); cur = { mode: mode }; }
  });
  return out;
}
var PASS = 0, FAIL = 0, fails = [];
function run(name, file, pick) {
  var vecs = parse(file), n = 0, bad = 0;
  vecs.forEach(function (v, i) {
    var mk = pick(v); if (!mk) return;
    n++;
    var bs = mk.bs;
    try {
      var f = mk.fn(v.key);
      var out = Buffer.alloc(0), back = Buffer.alloc(0);
      for (var o = 0; o < v.pt.length; o += bs) out = Buffer.concat([out, Buffer.from(f.enc(v.pt.slice(o, o + bs)))]);
      for (var o2 = 0; o2 < v.ct.length; o2 += bs) back = Buffer.concat([back, Buffer.from(f.dec(v.ct.slice(o2, o2 + bs)))]);
      if (!out.equals(v.ct)) throw new Error('密文 got ' + out.toString('hex').slice(0, 16) + ' want ' + v.ct.toString('hex').slice(0, 16));
      if (!back.equals(v.pt)) throw new Error('解密回不去');
      PASS++;
    } catch (e) { bad++; FAIL++; if (fails.length < 6) fails.push(name + ' #' + i + ': ' + e.message); }
  });
  console.log('  ' + name.padEnd(14) + ' 用例 ' + String(n).padStart(2) + '   通过 ' + String(n - bad).padStart(2));
}
globalThis.regSym = function () {};
require('../CryptoJS/crypto_simon.js'); require('../CryptoJS/crypto_speck.js');
var S = globalThis.SIMON, P = globalThis.SPECK;
/* 必须按 mode + 密钥长度双重过滤：SIMON-64/128 与 SIMON-128/128 的密钥都是 16 字节，
   只按长度筛会把对方那 8 条也吃进来，造成 16 条里必然错 8 条的假失败。 */
function mk(fn, bs, mode, bits) {
  return function (v) { return (v.mode === mode && v.key.length * 8 === bits) ? { fn: fn, bs: bs } : null; };
}
console.log('=== Simon / SPECK 官方向量（Crypto++ TestVectors，ECB）===');
['simon64-96', 'simon64-128', 'simon128', 'simon128-192', 'simon128-256'].forEach(function (id) {
  var bs = /64-/.test(id) ? 8 : 16, bits = { 'simon64-96': 96, 'simon64-128': 128, 'simon128': 128, 'simon128-192': 192, 'simon128-256': 256 }[id];
  run(id, 'cryptopp_simon.txt', mk(S.make(id), bs, /64-/.test(id) ? 'SIMON-64/ECB' : 'SIMON-128/ECB', bits));
});
['speck64-96', 'speck64-128', 'speck128', 'speck128-192', 'speck128-256'].forEach(function (id) {
  var bs = /64-/.test(id) ? 8 : 16, bits = { 'speck64-96': 96, 'speck64-128': 128, 'speck128': 128, 'speck128-192': 192, 'speck128-256': 256 }[id];
  run(id, 'cryptopp_speck.txt', mk(P.make(id), bs, /64-/.test(id) ? 'SPECK-64/ECB' : 'SPECK-128/ECB', bits));
});
console.log('----------------------------------------');
console.log('PASS ' + PASS + '   FAIL ' + FAIL);
fails.forEach(function (f) { console.log('  ' + f); });
process.exit(FAIL ? 1 : 0);
