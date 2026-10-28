global.window = global;
var REG = global.__REG = [];
global.reg = function (o) { REG.push(o); };
require('/data/workspace/dist/CryptoJS/crypto_falcon.js');          // falconShake256 + verify
require('/data/workspace/dist/CryptoJS/crypto_falcon_kg.js');       // const + core + reg
var fs = require('fs');

function parse(t) { var o = {}; t.split('\n').forEach(function (l) { var m = l.match(/^([a-zA-Z0-9]+) = (.*)$/); if (m) o[m[1]] = m[2]; }); return o; }
function h2b(h) { var a = new Uint8Array(h.length / 2); for (var i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; }
function b2h(b) { var s = ''; for (var i = 0; i < b.length; i++) s += ('0' + b[i].toString(16)).slice(-2); return s; }

var PASS = 0, FAIL = 0;
[9, 10].forEach(function (logn) {
  var o = parse(fs.readFileSync('/data/workspace/work/falcon/kat' + (logn === 9 ? '512' : '1024') + '_dbg.txt', 'utf8'));
  var sk = h2b(o.sk), pk = h2b(o.pk), nonce = h2b(o.nonce), sd = h2b(o.prngseed);
  var msg = 'abc';
  var sig = globalThis.falconSignBytes(b2h(sk), msg, b2h(nonce), b2h(sd));
  var exp = o.sig2;
  /* drv.c 的 sig2 = 头字节 ‖ comp_encode(s2)，未写入 nonce（驱动脚本本身如此）；
     因此比对时跳过我方签名中的 40 字节 nonce */
  var ok = (sig[0] === parseInt(exp.substr(0, 2), 16)) &&
    (b2h(sig.subarray(41)) === exp.slice(2));
  var vf = globalThis.falconVerify(sig, new TextEncoder().encode(msg), pk);
  console.log('logn=' + logn, 'sig 逐字节', ok ? 'MATCH ✓' : 'DIFF ✗',
    '| len', sig.length, 'exp', exp.length / 2, '| 验签', vf ? 'VALID ✓' : 'INVALID ✗');
  if (!ok) { console.log('  got', b2h(sig).slice(0, 80)); console.log('  exp', exp.slice(0, 80)); }
  if (ok && vf) PASS++; else FAIL++;

  /* 随机 nonce / seed 路径：签名后自验 */
  var s2 = globalThis.falconSignBytes(b2h(sk), 'random-seed message', null, null);
  var v2 = globalThis.falconVerify(s2, new TextEncoder().encode('random-seed message'), pk);
  console.log('   随机路径 自验', v2 ? 'VALID ✓' : 'INVALID ✗', 'len', s2.length);
  if (v2) PASS++; else FAIL++;
});
console.log('PASS ' + PASS + '  FAIL ' + FAIL);
