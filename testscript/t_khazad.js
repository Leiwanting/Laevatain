/* KHAZAD 验收：与设计者发布的官方 C 实现（red-coracle/khazad-c，khazad-tweak.c）
 * 编译出的二进制做差分。300 组随机 (key, pt)，同时比对密文与解密还原。
 * 运行：在 index.html 所在目录执行  node testscript/t_khazad.js   */
'use strict';
require('../CryptoJS/crypto_khazad.js');
var fs = require('fs');
var lines = fs.readFileSync('testvectors/khazad_official_c.txt', 'utf8').trim().split('\n');
var pass = 0, fail = 0;
for (var i = 0; i < lines.length; i++) {
  var a = lines[i].split(' ');
  var c = globalThis.__khazad.make(new Uint8Array(Buffer.from(a[0], 'hex')));
  var pt = new Uint8Array(Buffer.from(a[1], 'hex'));
  var ct = c.enc(pt), dt = c.dec(ct);
  var got = Buffer.from(ct).toString('hex'), gotd = Buffer.from(dt).toString('hex');
  if (got === a[2] && gotd === a[3]) pass++;
  else { if (fail < 3) console.log('FAIL#' + i, 'want', a[2], 'got', got, '| wantdt', a[3], 'gotdt', gotd); fail++; }
}
console.log('KHAZAD 官方C差分   PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
