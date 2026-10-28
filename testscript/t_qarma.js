// QARMA-64 验收：论文 check_box 官方向量 + C 参考实现编译出的差分向量
// 用法：cd 解压根目录 && node testscript/t_qarma.js
// 覆盖：官方 3 条（r=5/6/7）+ 随机差分 400 条，每条既验 enc 也验 dec；
//       外加边界（密钥不足 24 字节必须抛错）与条目层往返。
require('./_harness.js');
var fs = require('fs'), path = require('path');
function H2B(s) { var o = new Uint8Array(s.length / 2); for (var i = 0; i < s.length; i += 2) o[i / 2] = parseInt(s.substr(i, 2), 16); return o; }
function B2H(b) { var o = ''; for (var i = 0; i < b.length; i++) o += ('0' + (b[i] & 0xff).toString(16)).slice(-2); return o; }
var P = 0, F = 0;
function chk(ok, name, extra) { if (ok) P++; else { F++; if (F < 10) console.log('FAIL ' + name + (extra ? '  ' + extra : '')); } }
function find(id) { for (var j = 0; j < ALGOS.length; j++) if (ALGOS[j].id === id) return ALGOS[j]; return null; }

function run(file) {
  var fp = path.join(__dirname, '..', 'testvectors', file);
  if (!fs.existsSync(fp)) { console.log('缺失向量 ' + file); F++; return; }
  var txt = fs.readFileSync(fp, 'utf8').trim().split('\n');
  for (var i = 0; i < txt.length; i++) {
    var f = txt[i].split('|');
    var id = f[0], key = f[1], pt = f[2], ct = f[3];
    var it = find(id);
    if (!it) { console.log('未找到条目 ' + id); F++; continue; }
    var bf = it.makeBlockFn(H2B(key));
    var e = B2H(bf.enc(H2B(pt)));
    chk(e === ct.toLowerCase(), file + ' ' + id + ' enc#' + i, '期望' + ct + ' 实得' + e);
    var d = B2H(bf.dec(H2B(ct)));
    chk(d === pt.toLowerCase(), file + ' ' + id + ' dec#' + i, '期望' + pt + ' 实得' + d);
  }
}
run('qarma_official.vec');
run('qarma_diff.vec');

// 边界：密钥不足 24 字节必须抛错（w0‖k0‖tweak）
['qarma64-r5', 'qarma64-r6', 'qarma64-r7'].forEach(function (id) {
  var it = find(id);
  if (!it) { chk(false, '条目缺失 ' + id); return; }
  var threw = false;
  try { it.makeBlockFn(H2B('00112233445566778899aabbccddeeff')); }
  catch (e) { threw = true; }
  chk(threw, id + ' 密钥长度不足应抛错');
  // 条目层往返
  var bf = it.makeBlockFn(H2B('84be85ce9804e94bec2802d4e0a488e9477d469dec0b8762'));
  var c = bf.enc(H2B('fb623599da6e8127'));
  var p = bf.dec(c);
  chk(B2H(p) === 'fb623599da6e8127', id + ' 条目层往返', '实得' + B2H(p));
});

console.log('QARMA 测试: 通过 ' + P + ' 失败 ' + F);
process.exit(F ? 1 : 0);
