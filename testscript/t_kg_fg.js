var GAUSS = require('/data/workspace/work/gauss1024.json');
if (typeof GAUSS === 'string') GAUSS = GAUSS.split(',');
GAUSS = GAUSS.map(function (s) { return BigInt(s.trim()); });
require('/data/workspace/dist/CryptoJS/crypto_falcon.js');
var shake = globalThis.falconShake256;
if (!shake) { console.log('NO SHAKE'); process.exit(1); }

var seed = new Uint8Array(48);
for (var i = 0; i < 48; i++) seed[i] = i + 1;
var stream = shake(seed, 400000);
var pos = 0;
function u64() {
  var v = 0n;
  for (var i = 0; i < 8; i++) v |= BigInt(stream[pos++]) << BigInt(8 * i);
  return v;
}
function mkgauss(logn) {
  var g = 1 << (10 - logn), val = 0;
  for (var u = 0; u < g; u++) {
    var r = u64();
    var neg = Number(r >> 63n);
    r = r & ~(1n << 63n);
    var f = (r < GAUSS[0]) ? 1 : 0;
    var v = 0;
    r = u64() & ~(1n << 63n);
    for (var k = 1; k < GAUSS.length; k++) {
      var t = ((r >= GAUSS[k]) ? 1 : 0) ^ 1;
      v |= k & -(t & (f ^ 1));
      f |= t;
    }
    v = neg ? -v : v;
    val += v;
  }
  return val;
}
function poly_small_mkgauss(logn) {
  var n = 1 << logn, f = new Int8Array(n), mod2 = 0;
  for (var u = 0; u < n; u++) {
    var s;
    for (;;) {
      s = mkgauss(logn);
      if (s < -127 || s > 127) continue;
      if (u === n - 1) {
        if ((mod2 ^ (s & 1)) === 0) continue;
      } else { mod2 ^= (s & 1); }
      break;
    }
    f[u] = s;
  }
  return f;
}
var f = poly_small_mkgauss(9);
var g = poly_small_mkgauss(9);
var fs = require('fs');
fs.writeFileSync('/data/workspace/work/js_f.txt', Array.from(f).join(' '));
fs.writeFileSync('/data/workspace/work/js_g.txt', Array.from(g).join(' '));
console.log('f[0..15] =', Array.from(f.slice(0, 16)).join(' '));
console.log('g[0..15] =', Array.from(g.slice(0, 16)).join(' '));
console.log('stream used =', pos);
