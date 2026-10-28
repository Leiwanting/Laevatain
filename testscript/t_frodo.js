/* FrodoKEM-640-SHAKE 验证：
   1) 确定性 RNG（splitmix64）复现 liboqs 参考运行的 round1 输出，与官方 C 逐字节比对
   2) encaps → decaps 往返一致                                                   */
'use strict';
var path = '/data/workspace/dist/CryptoJS/crypto_frodo.js';
require(path);
var F = globalThis.FrodoKEM;
if (!F) { console.log('FAIL: API 未导出'); process.exit(1); }

var M64 = 0xFFFFFFFFFFFFFFFFn;
function makeRng(seedStr) {
  var rs = BigInt(seedStr);
  return function (n) {
    var buf = new Uint8Array(n);
    for (var i = 0; i < n; i++) {
      rs = (rs + 0x9E3779B97F4A7C15n) & M64;
      var z = rs;
      z = ((z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n) & M64;
      z = ((z ^ (z >> 27n)) * 0x94D049BB133111EBn) & M64;
      z = z ^ (z >> 31n);
      buf[i] = Number((z >> 56n) & 0xFFn);
    }
    return buf;
  };
}

function hex(b) {
  var s = '';
  for (var i = 0; i < b.length; i++) s += ('0' + b[i].toString(16)).slice(-2);
  return s;
}

/* ---- 读向量 ---- */
var fs = require('fs');
var txt = fs.readFileSync('/data/workspace/work/testvectors/frodo640shake_c.txt', 'utf8');
var vec = {};
txt.split('\n').forEach(function (ln) {
  var m = ln.match(/^(\w+)\s+([0-9a-f]+)$/);
  if (m && ['pk', 'sk', 'ct', 'ss'].indexOf(m[1]) >= 0) vec[m[1]] = m[2];
});
console.log('向量: pk=' + (vec.pk ? vec.pk.length / 2 : '?') + 'B sk=' + (vec.sk ? vec.sk.length / 2 : '?') +
  'B ct=' + (vec.ct ? vec.ct.length / 2 : '?') + 'B ss=' + (vec.ss ? vec.ss.length / 2 : '?') + 'B');

/* ---- 阶段 A：先做最轻的自洽往返（不依赖向量） ---- */
var t0 = Date.now();
var rngA = makeRng('0xdeadbeefcafe1234');
var kpA = F.keypair(rngA);
var t1 = Date.now();
var enA = F.encaps(kpA.pk, rngA);
var t2 = Date.now();
var ssA = F.decaps(enA.ct, kpA.sk);
var t3 = Date.now();
console.log('A 往返: ' + (hex(ssA) === hex(enA.ss) ? 'PASS' : 'FAIL') +
  '  (keygen ' + (t1 - t0) + 'ms, encaps ' + (t2 - t1) + 'ms, decaps ' + (t3 - t2) + 'ms)');

/* ---- 阶段 B：复现参考运行的 round1，逐字节比对 ---- */
var rng = makeRng('0x123456789abcdef');
F.keypair(rng); F.encaps(new Uint8Array(F.PK_BYTES), rng);   // round 0（消耗随机数，丢弃）
var kp1 = F.keypair(rng);
var en1 = F.encaps(kp1.pk, rng);
var ss1 = F.decaps(en1.ct, kp1.sk);

var bad = 0;
[['pk', kp1.pk], ['sk', kp1.sk], ['ct', en1.ct], ['ss', en1.ss]].forEach(function (p) {
  var got = hex(p[1]);
  var ok = got === vec[p[0]];
  if (!ok) bad++;
  console.log('B ' + p[0] + ': ' + (ok ? 'PASS' : 'FAIL'));
  if (!ok && vec[p[0]]) {
    var i = 0;
    while (i < got.length && got[i] === vec[p[0]][i]) i++;
    console.log('   首个不同字节偏移 ' + (i / 2) + ' got=' + got.substr(i, 16) + ' exp=' + vec[p[0]].substr(i, 16));
  }
});
console.log('B decaps(ct) == ss: ' + (hex(ss1) === vec.ss ? 'PASS' : 'FAIL'));
console.log(bad === 0 ? 'ALL PASS' : 'FAILED ' + bad);
