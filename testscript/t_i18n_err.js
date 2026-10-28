/* t_i18n_err.js —— 错误提示多语言功能验证
 *
 * 为什么单开一个脚本：t_i18n_cov.js 只查「键存在、占位符齐全」，
 * 证明不了「切到英文后用户真的看到英文、且 {mode} 被换成了 GCM」。
 * 这里从 Encryption_and_decryption_logic.js 里把 _t/_tf 的**真源码**抠出来跑，
 * 不是照抄一份实现——否则实现改了测试还绿。
 *
 * 运行：node testscript/t_i18n_err.js
 */
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var ROOT = process.env.CB_ROOT || path.resolve(__dirname, '..');

var pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.log('  FAIL: ' + m); } }
function head(s) { console.log('\n--- ' + s + ' ---'); }

/* ---- 最小 window ---- */
global.localStorage = { _d: {}, getItem: function (k) { return this._d[k] || null; }, setItem: function (k, v) { this._d[k] = v; } };
global.document = {
  documentElement: { lang: '', setAttribute: function () {}, getAttribute: function () { return null; } },
  querySelectorAll: function () { return []; }
};
global.window = global;
require(path.join(ROOT, 'Multilingual/i18n.js'));
var I18N = global.I18N;

head('A. 从逻辑层源码抠出 _t / _tf 真源码');
var logic = fs.readFileSync(path.join(ROOT, 'Encryption_and_decryption_logic.js'), 'utf8');

/* 抠 _t：从 "function _t(key, fb) {" 到配套的 "}"（花括号配平） */
function extract(fnName) {
  var start = logic.indexOf('function ' + fnName + '(');
  if (start < 0) throw new Error('找不到 function ' + fnName);
  var i = logic.indexOf('{', start), depth = 0, end = -1;
  for (var j = i; j < logic.length; j++) {
    if (logic[j] === '{') depth++;
    else if (logic[j] === '}') { depth--; if (depth === 0) { end = j + 1; break; } }
  }
  if (end < 0) throw new Error(fnName + ' 花括号未配平');
  return logic.slice(start, end);
}
var srcT = extract('_t'), srcTf = extract('_tf');
ok(srcT.indexOf('window.I18N') >= 0, '_t 源码异常：' + srcT.slice(0, 60));
ok(srcTf.indexOf('split(\'{\'') >= 0 || srcTf.indexOf("split('{") >= 0,
  '_tf 源码里没找到占位符替换逻辑');

/* 放进沙箱执行：沙箱里的 window 指向本进程的 global，I18N 就是真语言包 */
var box = vm.createContext({ window: global, I18N: I18N, String: String, Object: Object });
vm.runInContext(srcT + '\n' + srcTf + '\nthis._t=_t; this._tf=_tf;', box);
var _t = box._t, _tf = box._tf;
ok(typeof _t === 'function' && typeof _tf === 'function', '_t/_tf 未成功求值');

head('B. 占位符真的被替换（不是残留 {mode}）');
I18N.set('zh-CN');
var zh = _tf('err.nonce.len', { mode: 'GCM', n: 12, h: 24 }, 'GCM 的 nonce 必须为 12 字节（24 位 Hex）');
ok(zh.indexOf('{') < 0, '中文仍有未替换的占位符: ' + zh);
ok(zh.indexOf('GCM') >= 0 && zh.indexOf('12') >= 0, '中文替换结果异常: ' + zh);
console.log('  中文: ' + zh);

I18N.set('en');
var en = _tf('err.nonce.len', { mode: 'GCM', n: 12, h: 24 }, 'GCM 的 nonce 必须为 12 字节（24 位 Hex）');
ok(en.indexOf('{') < 0, '英文仍有未替换的占位符: ' + en);
ok(/[A-Za-z]/.test(en) && !/[一-鿿]/.test(en), '英文译文不对: ' + en);
console.log('  英文: ' + en);

head('C. 八种语言逐条替换，不得残留占位符 / 不得出现 undefined');
var CASES = [
  ['err.nonce.len', { mode: 'GCM', n: 12, h: 24 }],
  ['err.iv.len', { mode: 'CBC', n: 16, h: 32 }],
  ['err.iv.lenb', { mode: 'PCBC', n: 16 }],
  ['err.ct.short', { mode: 'GCM', t: 16 }],
  ['err.need.iv', { mode: 'CTS' }],
  ['err.need.tweak', { mode: 'XTS' }],
  ['err.need.ivn', { mode: 'IGE', n: 32 }],
  ['err.ct.min', { mode: 'CTS', n: 16 }],
  ['err.pt.min', { mode: 'LRW', n: 16 }],
  ['err.ct.blockmul', { mode: 'PCBC', n: 16 }],
  ['err.pt.blockmul', { n: 16 }],
  ['err.aesonly', { mode: 'GCM', algo: 'SM4' }],
  ['err.block128', { mode: 'XTS', algo: 'Camellia-256', n: 16 }],
  ['err.block128b', { mode: 'LRW' }],
  ['err.ige.iv', { mode: 'IGE', n: 32, h: 64, a: 16, b: 16 }],
  ['err.biige.iv', { mode: 'biIGE', n: 64, h: 128, a: 32, b: 32 }],
  ['err.hexonly', { what: 'IV' }],
  ['err.lenneed', { what: 'IV', n: 32, h: 64, cur: 16 }],
  ['err.badchar', { codec: 'Base32', c: '!' }],
  ['err.ccm.tag', { n: 5 }],
  ['err.gcmsiv.key', { n: 24 }],
  ['err.tweak16', { mode: 'XTS' }],
  ['err.enconly', { algo: 'NaCl-Seal' }],
  ['err.deconly', { algo: 'Fernet' }],
  ['err.kernel.miss', { algo: 'AES-256' }],
  ['err.badbin', { c: '2' }],
  ['err.badoct', { c: '9' }],
  ['err.noiv.append', null],
  ['err.noiv.head', null],
  ['err.ivcipher.short', null],
  ['err.ivcipher.noecb', null],
  ['err.json.noct', null],
  ['err.gcm.noncepre', null],
  ['err.nodec.hash', null],
  ['err.need.key', null],
  ['err.need.param', null],
  ['err.need.paramlabel', null],
  ['err.need.sigparam', null],
  ['err.need.content', null],
  ['err.need.keypair', null],
  ['err.key2', null],
  ['err.ct.keymismatch', null],
  ['err.rsa.short', null],
  ['err.shift.num', null],
  ['err.pem.armor', null],
  ['err.ccm.empty', null],
  ['err.siv.short', null]
];

var bad = [];
I18N.LANGS.forEach(function (L) {
  I18N.set(L.code);
  CASES.forEach(function (c) {
    var v = _tf(c[0], c[1], '__FB__');
    if (typeof v !== 'string' || !v) { bad.push(L.code + '/' + c[0] + '=空'); return; }
    if (v.indexOf('{') >= 0) bad.push(L.code + '/' + c[0] + '=残留占位符');
    if (v.indexOf('undefined') >= 0) bad.push(L.code + '/' + c[0] + '=undefined');
    if (v === '__FB__') bad.push(L.code + '/' + c[0] + '=键未收录(用了兜底)');
  });
});
ok(bad.length === 0, '替换异常: ' + bad.slice(0, 8).join(' | '));
console.log('  用例 ' + CASES.length + ' 条 × 语言 ' + I18N.LANGS.length + ' 种 = ' + (CASES.length * I18N.LANGS.length) + ' 组');

head('D. 非汉字语言不得残留汉字（日韩本就用汉字，只查 en/fr/de/ru）');
/* 检查对象是「译文模板」而不是替换后的结果：
   {algo} 是算法名（有意不翻，翻了就跟官方文档对不上），{what}/{codec} 由调用方传入，
   拿替换结果查会把这些正常运行时的值误判成「没翻译」。
   模板本身必须干净——模板干净 + 参数由调用方负责，这才是正确的责任划分。 */
var CN = /[一-鿿]/;
var leak = [];
['en', 'fr', 'de', 'ru'].forEach(function (code) {
  I18N.set(code);
  CASES.forEach(function (c) {
    var tpl = I18N.t(c[0]);
    if (CN.test(tpl)) leak.push(code + '/' + c[0] + '=' + tpl.slice(0, 40));
  });
});
ok(leak.length === 0, '这些错误提示的译文模板没翻译: ' + leak.slice(0, 5).join(' | '));

head('D2. what 类参数也必须可翻译（否则英文下冒出中文字段名）');
/* _ivHex 的第三参必须传 i18n 键名，由 _ivHex 内部 _t 翻译后再拼进模板。
   若调用方直接传中文，英文界面会出现「ChaCha20 的 Nonce needs 12 bytes…」。 */
ok(/function _ivHex\(v, nBytes, what\) \{\s*\/\*[\s\S]{0,200}?what = _t\(what, what\);/.test(logic) ||
   /what = _t\(what, what\);/.test(logic),
  '_ivHex 未对 what 做 _t 翻译');
var whatCalls = logic.match(/_ivHex\([^)]*\)/g) || [];
var cnWhat = whatCalls.filter(function (s) { return CN.test(s); });
ok(cnWhat.length === 0, '这些 _ivHex 调用传了中文（应传 i18n 键名）: ' + cnWhat.join(' | '));
I18N.set('en');
var whatEn = _t('desc.chacha20.nonce', 'ChaCha20 的 Nonce');
ok(!CN.test(whatEn), 'desc.chacha20.nonce 英文译文仍含中文: ' + whatEn);
console.log('  _ivHex 调用 ' + whatCalls.length + ' 处；ChaCha20 Nonce 英文 = ' + whatEn);

head('E. I18N 缺失时必须回退中文兜底，绝不返回 undefined');
var box2 = vm.createContext({ String: String, Object: Object });   /* 无 window */
vm.runInContext(srcT + '\n' + srcTf + '\nthis._tf=_tf;', box2);
var fbOut = box2._tf('err.nonce.len', { mode: 'GCM', n: 12, h: 24 }, 'GCM 的 nonce 必须为 12 字节（24 位 Hex）');
ok(fbOut === 'GCM 的 nonce 必须为 12 字节（24 位 Hex）', '无 I18N 时未回退兜底: ' + fbOut);
ok(fbOut.indexOf('undefined') < 0, '兜底文案含 undefined');

head('F. 占位符替换对兜底文案同样生效');
var fb2 = box2._tf('err.ct.short', { mode: 'CCM', t: 8 }, 'CCM 密文长度不足（需 nonce + 密文 + 8 字节标签）');
ok(typeof fb2 === 'string' && fb2.length > 0, '兜底替换结果异常');
console.log('  兜底: ' + fb2);

I18N.set('zh-CN');
console.log('\n--- 结果 ---');
console.log((fail === 0 ? 'PASS ' : 'FAIL ') + pass + '  失败 ' + fail);
process.exit(fail === 0 ? 0 : 1);
