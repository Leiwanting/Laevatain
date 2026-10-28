/* t_layout.js —— 目录结构回归（常驻）
 *
 * 背景：交付包曾把 100+ 个算法脚本、UI 脚本、多语言译文、JSON 数据全部平铺在
 * 根目录，找文件靠肉眼。现按用途分四个目录：
 *   CryptoJS/     算法实现（crypto_*.js / pqc_*.js），crypto_core|modes|tables 留根目录
 *   UI/           界面组件（ui_*.js + algo_picker.js）
 *   Multilingual/ 多语言（i18n*.js）
 *   Json/         数据类 JSON（不含 testvectors/ 里的测试向量）
 *
 * 这类"整理完又散回去"的问题不会报错、页面照常跑，只有目录越来越乱才被发现，
 * 所以必须钉成断言。
 */
'use strict';
var fs = require('fs');
var path = require('path');

var pass = 0, fail = 0;
function ok(c, msg) { if (c) { pass++; console.log('  PASS ' + msg); }
  else { fail++; console.log('  FAIL ' + msg); } }

var ROOT = path.join(__dirname, '..');

console.log('=== A. 四个分类目录 ===');
['CryptoJS', 'UI', 'Multilingual', 'Json'].forEach(function (d) {
  var p = path.join(ROOT, d);
  ok(fs.existsSync(p) && fs.statSync(p).isDirectory(), d + '/ 目录存在');
  ok(fs.existsSync(p) && fs.readdirSync(p).length > 0, d + '/ 非空（不应是空壳目录）');
});

console.log('=== B. 顶层不得残留已归类脚本 ===');
// node_modules 在部分环境是悬空符号链接，直接 statSync 会抛 ENOENT
var top = fs.readdirSync(ROOT).filter(function (f) {
  if (f === 'node_modules') return false;
  try { return fs.statSync(path.join(ROOT, f)).isFile(); } catch (e) { return false; }
});
var leakPqc = top.filter(function (f) { return /^pqc_/.test(f); });
var leakUi = top.filter(function (f) { return /^ui_/.test(f); });
var leakI18n = top.filter(function (f) { return /^i18n/.test(f); });
ok(leakPqc.length === 0, '顶层无 pqc_*.js（残留 ' + leakPqc.join(',') + '）');
ok(leakUi.length === 0, '顶层无 ui_*.js（残留 ' + leakUi.join(',') + '）');
ok(leakI18n.length === 0, '顶层无 i18n*.js（残留 ' + leakI18n.join(',') + '）');

// crypto_ 只有这三个是刻意留在根目录：它们是所有算法脚本的公共底座，
// 且与 index.html 同层便于最先加载。
var topCrypto = top.filter(function (f) { return /^crypto_.*\.js$/.test(f); }).sort();
ok(topCrypto.length === 3 &&
   topCrypto.join(',') === 'crypto_core.js,crypto_modes.js,crypto_tables.js',
   '顶层 crypto_*.js 仅 core/modes/tables（实得 ' + topCrypto.join(',') + '）');

console.log('=== C. 目录归属正确 ===');
var cj = fs.readdirSync(path.join(ROOT, 'CryptoJS'));
ok(cj.indexOf('crypto_core.js') < 0 && cj.indexOf('crypto_modes.js') < 0 &&
   cj.indexOf('crypto_tables.js') < 0, 'CryptoJS/ 不含 core/modes/tables');
// crypto_mode_ext.js 名字像底座，但它是扩展模式实现，应随算法一起进 CryptoJS/
ok(cj.indexOf('crypto_mode_ext.js') >= 0, 'crypto_mode_ext.js 归入 CryptoJS/（不是底座）');
ok(cj.filter(function (f) { return /^pqc_/.test(f); }).length === 3, 'pqc_*.js 全部在 CryptoJS/');

var ui = fs.readdirSync(path.join(ROOT, 'UI'));
ok(ui.filter(function (f) { return /^ui_/.test(f); }).length >= 5, 'UI/ 含全部 ui_*.js');
ok(ui.indexOf('algo_picker.js') >= 0, 'algo_picker.js 归入 UI/（界面交互组件）');

var ml = fs.readdirSync(path.join(ROOT, 'Multilingual'));
ok(ml.filter(function (f) { return /^i18n.*\.js$/.test(f); }).length >= 13, 'Multilingual/ 含全部 i18n*.js');

console.log('=== D. index.html 引用的脚本全部存在且路径带目录 ===');
var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
var srcs = (html.match(/<script src="([^"]+)">/g) || []).map(function (s) {
  return s.replace('<script src="', '').replace('">', '');
});
ok(srcs.length > 100, '解析到 ' + srcs.length + ' 个脚本引用');
var missing = srcs.filter(function (f) { return !fs.existsSync(path.join(ROOT, f)); });
ok(missing.length === 0, '引用脚本无缺失（缺失 ' + missing.join(',') + '）');
// 已归类的脚本引用必须带目录前缀，否则说明有人又往根目录塞了文件
var flat = srcs.filter(function (f) {
  return f.indexOf('/') < 0 && /^(pqc_|ui_|i18n)/.test(f);
});
ok(flat.length === 0, 'index.html 无裸的 pqc_/ui_/i18n 引用（' + flat.join(',') + '）');

console.log('=== E. 根目录保留清单 ===');
['CHANGELOG.md', 'README.md', 'THIRD_PARTY_NOTICES.md', 'crypto_core.js',
 'crypto_modes.js', 'crypto_tables.js', 'Encryption_and_decryption_logic.js',
 'LICENSE', 'VERSION', 'version.js', 'version.md', '版本规则.md',
 '算法清单.txt', 'style.css', 'index.html'].forEach(function (f) {
  ok(fs.existsSync(path.join(ROOT, f)), '根目录保留 ' + f);
});

console.log('=== F. Json/ 不含测试向量目录内容 ===');
var js = fs.readdirSync(path.join(ROOT, 'Json'));
ok(js.every(function (f) { return /\.json$/.test(f); }), 'Json/ 内均为 .json');
ok(!fs.existsSync(path.join(ROOT, 'Json', 'testvectors')), 'Json/ 未混入 testvectors');

console.log('\n--- 结果 ---');
console.log('PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
