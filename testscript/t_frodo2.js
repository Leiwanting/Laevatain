/* FrodoKEM 健壮性：多组随机密钥往返、篡改密文、跨密钥解封装 */
'use strict';
require('/data/workspace/dist/CryptoJS/crypto_frodo.js');
var F = globalThis.FrodoKEM;
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
function hex(b) { var s = ''; for (var i = 0; i < b.length; i++) s += ('0' + b[i].toString(16)).slice(-2); return s; }

var seeds = ['0x1111111111111111', '0x2222222222222222', '0x3333333333333333'];
var pass = 0, fail = 0;
for (var t = 0; t < seeds.length; t++) {
  var rng = makeRng(seeds[t]);
  var kp = F.keypair(rng);
  var en = F.encaps(kp.pk, rng);
  var ss = F.decaps(en.ct, kp.sk);
  var ok1 = hex(ss) === hex(en.ss);
  if (ok1) pass++; else fail++;
  console.log('第 ' + (t + 1) + ' 组 往返: ' + (ok1 ? 'PASS' : 'FAIL'));

  /* 篡改密文首字节：应得到不同密钥（FO 隐含拒绝） */
  var ct2 = new Uint8Array(en.ct); ct2[0] ^= 0x01;
  var ss2 = F.decaps(ct2, kp.sk);
  var ok2 = hex(ss2) !== hex(en.ss);
  if (ok2) pass++; else fail++;
  console.log('第 ' + (t + 1) + ' 组 篡改密文≠原密钥: ' + (ok2 ? 'PASS' : 'FAIL'));

  /* 长度校验 */
  var lens = [kp.pk.length === F.PK_BYTES, kp.sk.length === F.SK_BYTES,
    en.ct.length === F.CT_BYTES, en.ss.length === F.SS_BYTES];
  var ok3 = lens.every(function (x) { return x; });
  if (ok3) pass++; else fail++;
  console.log('第 ' + (t + 1) + ' 组 长度: ' + (ok3 ? 'PASS' : 'FAIL'));
}
console.log(fail === 0 ? ('ALL PASS (' + pass + ')') : ('FAILED ' + fail));
