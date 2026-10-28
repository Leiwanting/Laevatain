/* t_i18n_algo.js —— 算法说明（ALGOS[i].info）多语言回归
 *
 * 守四件事：
 * A. 每条译文 8 种语言齐全且非空
 * B. 译文表的 zh-CN 必须与运行期 ALGOS[i].info 逐字相同
 *    —— 算法说明一改而译文没跟上，这里立刻报「原文漂移」，不会静默显示旧译文
 * C. 未收录的条目必须原样返回中文原文（增量覆盖的关键：不覆盖 ≠ 空白）
 * D. 切到任一非中文语言，已收录条目不得残留 CJK 专有名词以外的整段中文
 *
 * 运行：cd 到 index.html 所在目录，node testscript/t_i18n_algo.js
 */
'use strict';
var fs = require('fs');
var path = require('path');
var ROOT = process.env.CB_ROOT || path.resolve(__dirname, '..');
process.chdir(ROOT);

var pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.log('  FAIL: ' + m); } }
function head(s) { console.log('\n--- ' + s + ' ---'); }

require(path.join(ROOT, 'testscript', '_harness.js'));
var A = global.ALGOS || [];

/* harness 加载 index.html 里的脚本，Multilingual/i18n.js / Multilingual/i18n_algo.js 都在其中 */
var I18N = global.I18N || global.window.I18N;

head('0. 前置');
ok(!!I18N, 'I18N 应存在');
ok(typeof I18N.algoInfo === 'function', 'I18N.algoInfo 应存在（Multilingual/i18n_algo.js 未接线？）');
ok(!!I18N.__ALGO_TABLES && I18N.__ALGO_TABLES.length >= 1, '至少加载了一片译文表');
ok(A.length > 0, 'ALGOS 应非空，实得 ' + A.length);
if (!I18N || typeof I18N.algoInfo !== 'function') {
  console.log('\nRESULT: PASS ' + pass + '  FAIL ' + fail); process.exit(1);
}

var LANGS = I18N.LANGS;
ok(LANGS.length === 8, '语言数应为 8，实得 ' + LANGS.length);

/* 汇总所有片 */
var TBL = {}, dup = [];
I18N.__ALGO_TABLES.forEach(function (T) {
  for (var k in T) { if (TBL[k]) dup.push(k); TBL[k] = T[k]; }
});
var ids = Object.keys(TBL);
console.log('  已收录条目: ' + ids.length + ' / 总条目: ' + A.length
  + '  覆盖率: ' + (ids.length / A.length * 100).toFixed(1) + '%');
ok(dup.length === 0, '不应有重复条目键: ' + dup.slice(0, 5).join(','));

head('A. 8 语言齐全且非空');
var badLen = [], badEmpty = [];
ids.forEach(function (id) {
  var row = TBL[id];
  if (!Array.isArray(row) || row.length !== 8) { badLen.push(id); return; }
  for (var i = 0; i < 8; i++) {
    var v = row[i];
    if (v === undefined || v === null || v === '') badEmpty.push(id + '[' + LANGS[i].code + ']');
  }
});
ok(badLen.length === 0, '译文数组长度应为 8: ' + badLen.slice(0, 5).join(','));
ok(badEmpty.length === 0, '不应有空译文（缺译留空会静默回退中文）: ' + badEmpty.slice(0, 8).join(','));

head('B. 译文原文 vs 运行期 info（漂移检测）');
var byId = {};
A.forEach(function (a) { byId[a.id] = a; });
var drift = [], orphan = [];
ids.forEach(function (id) {
  var a = byId[id];
  if (!a) { orphan.push(id); return; }
  var zh = TBL[id][0];
  /* 只比 CJK 部分：译文里算法名保持原样，但中文正文必须与 info 一致 */
  if (a.info && zh !== a.info) drift.push(id);
});
ok(orphan.length === 0, '译文表里的 id 必须在 ALGOS 中存在: ' + orphan.slice(0, 8).join(','));
ok(drift.length === 0, 'zh-CN 译文与运行期 info 不一致（说明改过、译文没跟上）: '
  + drift.slice(0, 8).join(','));
if (drift.length) {
  drift.slice(0, 3).forEach(function (id) {
    console.log('    [' + id + ']');
    console.log('      表: ' + String(TBL[id][0]).slice(0, 70));
    console.log('      实: ' + String(byId[id].info).slice(0, 70));
  });
}

head('C. 未收录条目回退原文');
var missed = [];
A.forEach(function (a) {
  if (!a.info) return;
  if (TBL[a.id]) return;
  I18N.set('en');
  var got = I18N.algoInfo(a.id, a.info);
  if (got !== a.info) missed.push(a.id);
});
ok(missed.length === 0, '未收录条目必须原样返回中文原文: ' + missed.slice(0, 5).join(','));
console.log('  未收录（回退中文）: ' + A.filter(function (a) { return a.info && !TBL[a.id]; }).length);

head('D. 非中文语言不得整段残留中文');
/* 判据分两套，别合并：
 * - ja：日语正字本来就含大量汉字，CJK 计数对它完全无效（第一版在这里误报 8 条）。
 *       改用「译文是否等于 zh-CN 原文」——漏翻才会完全相同。
 * - 其余非中文（ko/fr/de/ru）：现代韩语与欧洲语言不含汉字，CJK 计数有效。
 *   阈值取 6，短专有名词（如算法名里的中文）不会到 6 个。 */
var CJK = /[\u4e00-\u9fa5]/g;
var residue = [];
LANGS.forEach(function (L) {
  if (L.code === 'zh-CN' || L.code === 'zh-TW') return;
  I18N.set(L.code);
  var isJa = (L.code === 'ja');
  ids.forEach(function (id) {
    var v = I18N.algoInfo(id, '');
    if (isJa) {
      /* 原文若几乎没有可译内容（纯技术标识符，如 'encodeURIComponent'），
         日语译文与中文相同是合理的，不算漏翻。原文 CJK ≥ 4 才算有可译内容。 */
      var zhN = (String(TBL[id][0]).match(CJK) || []).length;
      if (zhN >= 4 && String(v) === TBL[id][0]) residue.push('ja/' + id + '(与中文原文相同)');
    } else {
      var n = (String(v).match(CJK) || []).length;
      if (n > 6) residue.push(L.code + '/' + id + '(' + n + ')');
    }
  });
});
ok(residue.length === 0, '非中文语言仍残留成段中文: ' + residue.slice(0, 8).join(', '));

head('E. 动态切换实时生效');
I18N.set('zh-CN');
var sample = ids[0];
var zhV = I18N.algoInfo(sample, '');
I18N.set('en');
var enV = I18N.algoInfo(sample, '');
ok(zhV !== enV || /^[\x00-\x7F]*$/.test(String(zhV)), 'zh-CN 与 en 应取到不同值（除非原文本就是纯 ASCII）');
I18N.set('ru');
var ruV = I18N.algoInfo(sample, '');
ok(typeof ruV === 'string' && ruV.length > 0, 'ru 应取到非空译文');
I18N.set('zh-CN');
ok(I18N.algoInfo(sample, '') === zhV, '切回 zh-CN 应恢复原值');

head('F. 缺语言时回退 zh-CN 而非空白');
var tmp = TBL[sample][3]; TBL[sample][3] = '';      /* 临时挖空 ja */
I18N.set('ja');
ok(I18N.algoInfo(sample, '') === TBL[sample][0], 'ja 缺译应回退 zh-CN');
TBL[sample][3] = tmp;

console.log('\nRESULT: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
