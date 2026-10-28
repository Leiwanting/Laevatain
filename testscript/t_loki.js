/* LOKI89 / LOKI91 验收：与设计者发布的官方 C 实现（loki89.c / loki91.c）
 * 编译出的二进制做差分，各 250 组随机 (key, pt)。
 * ⚠ 编译裁判时必须 (a) 把 loki.h 的 `unsigned long Long` 改成 `unsigned int`
 *    （64 位 Linux 上原写法会越界读导致 stack smashing）；
 *    (b) 加 -DLITTLE_ENDIAN —— 官方 C 在小端机器上靠这个宏启用 bswap，
 *    得到 loki.h 注释规定的大端语义（b[0] 装 bits[63..56]）。
 *    不加这个宏得到的是字节反转的错误结果（自洽但与规范相反）。
 * 运行：在 index.html 所在目录执行  node testscript/t_loki.js   */
'use strict';
require('../CryptoJS/crypto_loki.js');
var fs = require('fs');
function run(file, mk, tag) {
  var lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  var pass = 0, fail = 0;
  for (var i = 0; i < lines.length; i++) {
    var a = lines[i].split(' ');
    var c = mk(new Uint8Array(Buffer.from(a[0], 'hex')));
    var pt = new Uint8Array(Buffer.from(a[1], 'hex'));
    var ct = c.enc(pt), dt = c.dec(ct);
    var got = Buffer.from(ct).toString('hex'), gotd = Buffer.from(dt).toString('hex');
    if (got === a[2] && gotd === a[3]) pass++;
    else { if (fail < 3) console.log(tag, 'FAIL#' + i, 'want', a[2], 'got', got, '| dt', gotd); fail++; }
  }
  console.log(tag + ' 官方C差分   PASS ' + pass + '  FAIL ' + fail);
  return fail;
}
var f = run('testvectors/loki89_official_c.txt', globalThis.__loki.loki89, 'LOKI89');
f += run('testvectors/loki91_official_c.txt', globalThis.__loki.loki91, 'LOKI91');
process.exit(f ? 1 : 0);
