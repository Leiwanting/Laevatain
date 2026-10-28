/* FrodoKEM 官方 KAT 验收（向量来源：frodokem.org 官方包 FrodoKEM-20200930.zip）
   验证方式：解封装是确定性的（sk + ct -> ss，不含随机），可直接逐条对照官方 ss。
   参照实现：官方 frodokem.py（Douglas Stebila），已确认能复现同一批 KAT。        */
'use strict';
var fs = require('fs');
var path = require('path');
require(path.join(__dirname, 'crypto_frodo.js'));
var KAT = process.env.FRODO_KAT || '/data/inputs/FrodoKEM-20200930.zip KAT整合.txt';
if (!fs.existsSync(KAT)) { console.log('无 KAT 文件，跳过'); process.exit(0); }

function h2b(s) { var o = new Uint8Array(s.length / 2); for (var i = 0; i < o.length; i++) o[i] = parseInt(s.substr(i * 2, 2), 16); return o; }
function hex(b) { var s = ''; for (var i = 0; i < b.length; i++) s += ('0' + b[i].toString(16)).slice(-2); return s.toUpperCase(); }

var lines = fs.readFileSync(KAT, 'utf8').split('\n');
var blocks = [], cur = null;
for (var i = 0; i < lines.length; i++) {
  var m = lines[i].match(/^([a-z]+)\s*=\s*([0-9A-Fa-f]+)$/);
  if (m) { cur = cur || {}; cur[m[1]] = m[2]; continue; }
  if (/PQCkemKAT_\d+/.test(lines[i])) {
    if (cur && cur.ss) blocks[blocks.length - 1].v = (blocks[blocks.length - 1].v || []).concat([cur]);
    cur = null; blocks.push({ tag: (lines[i + 1] || '').replace('#', '').trim() }); continue;
  }
  if (cur && cur.ss) { blocks[blocks.length - 1].v = (blocks[blocks.length - 1].v || []).concat([cur]); cur = null; }
}

var MAP = { 640: 'frodo640shake', 976: 'frodo976shake', 1344: 'frodo1344shake' };
var pass = 0, fail = 0, skipped = 0;
for (var bi = 0; bi < blocks.length; bi++) {
  var b = blocks[bi];
  var mm = b.tag.match(/(\d+)/); if (!mm) continue;
  var id = MAP[mm[1]];
  var Api = globalThis['FrodoKEM_' + id];
  if (!Api) { console.log(b.tag + ': 无实现，跳过'); skipped++; continue; }
  var t0 = Date.now();
  for (var j = 0; j < b.v.length; j++) {
    var v = b.v[j];
    var sk = h2b(v.sk), ct = h2b(v.ct), exp = v.ss.toUpperCase();
    var got;
    try { got = hex(Api.decaps(ct, sk)).toUpperCase(); }
    catch (e) { console.log(b.tag + ' count=' + j + ' ERR ' + e.message); fail++; continue; }
    if (got === exp) { pass++; }
    else { fail++; console.log(b.tag + ' count=' + j + ' DIFF got=' + got + ' exp=' + exp); }
  }
  console.log(b.tag + ': ' + b.v.length + ' 组，' + ((Date.now() - t0) / b.v.length).toFixed(0) + ' ms/组');
}
console.log('FrodoKEM 官方 KAT 解封装: PASS ' + pass + ' / FAIL ' + fail + (skipped ? ' / SKIP ' + skipped : ''));
process.exit(fail ? 1 : 0);
