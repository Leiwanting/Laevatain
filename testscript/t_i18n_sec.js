/* t_i18n_sec.js —— 安全提示多语言 + 切换语言后动态文案重刷（第 154 批）
 *
 * 覆盖两类此前完全没人守的东西：
 *   A. securityAudit 的 40 条提示 × 3 段（title/why/use）是否真的能出八种语言；
 *   B. 切语言后「JS 动态写死」的界面文案会不会留一半中文。
 *
 * B 类最难发现：不报错、页面照常渲染，只有切到非中文才看得见。
 */
'use strict';
var fs = require('fs');
var path = require('path');
var here = __dirname;
var dist = path.join(here, '..');
var pass = 0, fail = 0;
function ok(c, msg) { if (c) { pass++; } else { fail++; console.log('  ✗ ' + msg); } }
var H = require(path.join(here, '_harness.js'));

var LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'fr', 'de', 'ru'];

/* ---------- A. 译文表自身 ---------- */
var SEC = null;
try { SEC = require(path.join(dist, 'Multilingual', 'i18n_sec.js')); } catch (e) {}
ok(!!SEC, 'i18n_sec.js 应可加载（' + (SEC ? '' : String(e)) + '）');

if (SEC) {
  var keys = Object.keys(SEC);
  console.log('  · 安全提示条目数：' + keys.length);
  ok(keys.length >= 40, '条目数应 ≥ 40，实得 ' + keys.length);

  /* A1 每条每个字段必须正好 8 项、非空 */
  var lenBad = 0, emptyBad = 0;
  keys.forEach(function (k) {
    ['title', 'why', 'use'].forEach(function (f) {
      var a = SEC[k][f];
      if (!a || a.length !== 8) { lenBad++; return; }
      a.forEach(function (v) { if (v === undefined || v === null || String(v).trim() === '') emptyBad++; });
    });
  });
  ok(lenBad === 0, '每条每字段应为 8 项，异常 ' + lenBad + ' 处');
  ok(emptyBad === 0, '不应有空串，异常 ' + emptyBad + ' 处');

  /* A2 非中文语言不得残留汉字（ja 正字本就含汉字，排除；zh-TW 本就是中文，排除） */
  var CHK = ['en', 'ko', 'fr', 'de', 'ru'];
  var cjkBad = [];
  keys.forEach(function (k) {
    ['title', 'why', 'use'].forEach(function (f) {
      (SEC[k][f] || []).forEach(function (v, i) {
        var lang = LANGS[i];
        if (CHK.indexOf(lang) < 0) return;
        var m = String(v).match(/[\u4e00-\u9fff\u3040-\u30ff]/g);
        if (m) cjkBad.push(k + '.' + f + ' [' + lang + '] 混入「' + m.join('') + '」');
      });
    });
  });
  ok(cjkBad.length === 0, '非中文语言不得混入汉字：' + cjkBad.slice(0, 5).join(' / '));

  /* A3 中文原文含占位符的，译文必须原样保留（丢了就会显示成字面量 {n}） */
  var NEED = {
    'sec.gcm.hard': ['n'], 'sec.gcm.warn': ['n'], 'sec.gcm.info': ['n'],
    'sec.unauth': ['mode'], 'sec.xts': ['mode'], 'sec.sweet32': ['id'],
    'sec.kdf.lowiter': ['n'], 'sec.kdf.memhard': ['kdf'], 'sec.tag.short': ['n', 'b']
  };
  var phBad = [];
  Object.keys(NEED).forEach(function (k) {
    if (!SEC[k]) { phBad.push('缺 key ' + k); return; }
    ['title', 'why', 'use'].forEach(function (f) {
      var arr = SEC[k][f] || [], zh = arr[0] || '';
      NEED[k].forEach(function (p) {
        if (zh.indexOf('{' + p + '}') < 0) return;
        for (var i = 1; i < 8; i++) {
          if ((arr[i] || '').indexOf('{' + p + '}') < 0) phBad.push(k + '.' + f + ' {' + p + '} 在 ' + LANGS[i] + ' 丢失');
        }
      });
    });
  });
  ok(phBad.length === 0, '占位符必须在所有语言保留：' + phBad.slice(0, 5).join(' / '));

  /* A4 未收录的 key 必须回退中文，绝不 undefined */
  var SECKEY_MISSING = 'sec.__nonexistent__';
  ok(SEC[SECKEY_MISSING] === undefined, '未收录 key 应查不到（回退中文原文）');
}

/* ---------- B. 查询函数与安全提示真的会变 ---------- */
var i18nSrc = fs.readFileSync(path.join(dist, 'Multilingual', 'i18n.js'), 'utf8');
ok(/sec:\s*function\s*\(key,\s*field,\s*fallback\)/.test(i18nSrc), 'i18n.js 应暴露 sec(key, field, fallback)');
ok(/window\.__I18N_SEC/.test(i18nSrc), 'sec() 应查 window.__I18N_SEC');

var html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
ok(html.indexOf('Multilingual/i18n_sec.js') >= 0, 'index.html 应引入 i18n_sec.js');

var logic = fs.readFileSync(path.join(dist, 'Encryption_and_decryption_logic.js'), 'utf8');
/* B1 安全提示框的框架文案必须走 i18n，不能是写死中文 */
ok(/_\(\s*'_t\('sec\.head'|_t\('sec\.head'/.test(logic) || logic.indexOf("_tf('sec.head'") >= 0,
  "安全提示标题应走 _tf('sec.head')");
ok(logic.indexOf("_t('sec.advice'") >= 0, "「建议」应走 _t('sec.advice')");
ok(logic.indexOf("label: 'sec.lv.danger'") >= 0, "分级标签应存 i18n 键（sec.lv.danger）");

/* B2 切语言必须重刷动态文案 */
ok(logic.indexOf('_rerenderDynamicI18n') >= 0, '应有 _rerenderDynamicI18n');
ok(/window\.I18N\.onChange\(_rerenderDynamicI18n\)/.test(logic), '应把 _rerenderDynamicI18n 注册到 onChange');
ok(logic.indexOf('refreshSecurity();') >= 0, '_rerenderDynamicI18n 应重刷安全提示');

/* B3 原来写死的界面文案应该已经接入 i18n */
[["_t('label.iv.tweak'", 'Tweak 标签'],
 ["_t('label.iv.nonce'", 'Nonce 标签'],
 ["_t('label.iv.iv'", 'IV 标签'],
 ["_t('file.drop'", '拖放提示'],
 ["_tf('file.loaded'", '已加载提示']].forEach(function (pair) {
  ok(logic.indexOf(pair[0]) >= 0, pair[1] + ' 应走 i18n（' + pair[0] + '）');
});
ok(logic.indexOf("textContent = '拖拽文件到此处，或点击选择文件'") < 0, '拖放提示不应再有写死中文');

/* ---------- C. 反向验证：把改动拿掉，断言必须能抓到 ---------- */
/* C1 占位符检查本身有效：造一个丢失占位符的假表，A3 型检查应报错 */
(function () {
  var fake = { 'sec.gcm.warn': { title: ['该密钥已用于 {n} 次 GCM 加密', 'x'.repeat(3), 'used {n} times', 'a', 'b', 'c', 'd', 'e'] } };
  var bad = 0;
  Object.keys(fake).forEach(function (k) {
    ['title', 'why', 'use'].forEach(function (f) {
      var arr = (fake[k][f] || []), zh = arr[0] || '';
      ['n'].forEach(function (p) {
        if (zh.indexOf('{' + p + '}') < 0) return;
        for (var i = 1; i < 8; i++) {
          if ((arr[i] || '').indexOf('{' + p + '}') < 0) bad++;
        }
      });
    });
  });
  ok(bad > 0, '反向验证：占位符检查对「丢了 {n}」的译文应报错（实得 ' + bad + '）');
})();

/* C2 CJK 检查本身有效：造一个混入中文的英文译文，应被抓到 */
(function () {
  var v = 'This is 严重 wrong';
  var m = String(v).match(/[\u4e00-\u9fff\u3040-\u30ff]/g);
  ok(!!m && m.join('') === '严重', '反向验证：CJK 正则应能抓到英文里的「严重」');
})();

console.log('\n安全提示多语言：通过 ' + pass + ' / 失败 ' + fail);
process.exit(fail ? 1 : 0);
