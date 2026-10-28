/* 反向交叉验证：JS 生成密钥对并封装，交给官方 frodokem.py 解封装，
   共享密钥必须一致。用于验收 keygen / encaps 两条含随机的路径。 */
'use strict';
var fs = require('fs'), path = require('path'), os = require('os');
require(path.join(__dirname, 'crypto_frodo.js'));
var Api = globalThis.FrodoKEM_frodo640shake;
function mk(seed) {
  var st = BigInt(seed), M64 = 0xFFFFFFFFFFFFFFFFn;
  return function (n) {
    var b = new Uint8Array(n);
    for (var i = 0; i < n; i++) {
      st = (st + 0x9E3779B97F4A7C15n) & M64;
      var z = st;
      z = ((z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n) & M64;
      z = ((z ^ (z >> 27n)) * 0x94D049BB133111EBn) & M64;
      z = z ^ (z >> 31n);
      b[i] = Number((z >> 56n) & 0xFFn);
    }
    return b;
  };
}
function hex(b) { var s = ''; for (var i = 0; i < b.length; i++) s += ('0' + b[i].toString(16)).slice(-2); return s.toUpperCase(); }
var out = [];
for (var t = 0; t < 2; t++) {
  var kp = Api.keypair(mk(1000 + t));
  var e = Api.encaps(kp.pk, mk(2000 + t));
  var back = Api.decaps(e.ct, kp.sk);
  out.push({ pk: hex(kp.pk), sk: hex(kp.sk), ct: hex(e.ct), ss: hex(e.ss), back: hex(back) });
  console.log('第 ' + (t + 1) + ' 组 自洽 decaps == encaps ss : ' + (hex(back) === hex(e.ss)));
}
fs.writeFileSync(path.join(os.tmpdir(), 'frodo_xcheck.json'), JSON.stringify(out));
console.log('已导出 ' + out.length + ' 组给官方 Python 验证');
