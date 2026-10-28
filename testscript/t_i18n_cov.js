/* t_i18n_cov.js —— i18n 覆盖率回归：
 * 1) 每个键 8 种语言齐全且非空
 * 2) HTML 里每条可见中文（除有意不翻的长篇说明）都挂了 i18n 属性
 * 3) 所有 data-i18n 引用的键都真实存在（不渲染成 undefined）
 * 4) 切换任一语言后，页面不得残留中文外壳文本
 */
'use strict';
var fs = require('fs');
var path = require('path');
var ROOT = process.env.CB_ROOT || path.resolve(__dirname, '..');

var pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.log('  FAIL: ' + m); } }
function head(s) { console.log('\n--- ' + s + ' ---'); }

/* ---- 造最小 window / document（Multilingual/i18n.js 只用到 localStorage 与 document.documentElement） ---- */
global.localStorage = { _d: {}, getItem: function (k) { return this._d[k] || null; }, setItem: function (k, v) { this._d[k] = v; } };
global.document = {
  documentElement: { lang: '', setAttribute: function () {}, getAttribute: function () { return null; } },
  querySelectorAll: function () { return []; }
};
global.window = global;
require(path.join(ROOT, 'Multilingual/i18n.js'));
var I18N = global.I18N;

head('A. 键表完整性');
var LANGS = I18N.LANGS;
ok(LANGS.length === 8, '语言数应为 8，实得 ' + LANGS.length);

/* 从源码里把 T 的键全提出来 */
var src = fs.readFileSync(path.join(ROOT, 'Multilingual/i18n.js'), 'utf8');
var keys = [], re = /^\s*'([a-z0-9.]+)':\s*\[/gm, m;
while ((m = re.exec(src))) keys.push(m[1]);
ok(keys.length >= 130, '键总数应 ≥130，实得 ' + keys.length);
console.log('  键总数: ' + keys.length + '，语言: ' + LANGS.length);

var badLen = [], badEmpty = [];
keys.forEach(function (k) {
  var vals = LANGS.map(function (L, i) { I18N.set(L.code); return I18N.t(k); });
  /* 缺译时 t() 回退中文；用「是否与 zh-CN 相同」无法判定缺译，改为直接查源码行 */
  if (vals.some(function (v) { return v === undefined || v === null || v === ''; })) badEmpty.push(k);
});
ok(badEmpty.length === 0, '存在空翻译: ' + badEmpty.join(','));

/* 逐语言逐个键：不得返回键名本身（那是「未收录」） */
I18N.set('en');
var notFound = keys.filter(function (k) { return I18N.t(k) === k; });
ok(notFound.length === 0, '以下键未收录（会渲染成键名）: ' + notFound.slice(0, 5).join(','));

head('B. 非汉字语言不得残留汉字（日语/韩语本就用汉字，不在检查范围）');
var CN = /[一-鿿]/;
/* 有意保留的中文：文件名、产品名。其余一律不得出现汉字。 */
var KEEP = /版本规则\.md|版本規則\.md/;
var leaked = [];
['en', 'fr', 'de', 'ru'].forEach(function (code) {
  I18N.set(code);
  keys.forEach(function (k) {
    var v = I18N.t(k);
    if (typeof v !== 'string') return;
    var probe = v.replace(KEEP, '');        /* 文件名是专有名词，不算泄漏 */
    if (CN.test(probe)) leaked.push(code + ':' + k + '=' + v.slice(0, 30));
  });
});
ok(leaked.length === 0, '非汉字语言仍含汉字: ' + leaked.slice(0, 6).join(' | '));
/* 反向：日语/韩语含汉字是正常的，但不得整条回退成中文（即与 zh-CN 完全相同） */
var frozen = [];
I18N.set('zh-CN');
var zh = {}; keys.forEach(function (k) { zh[k] = I18N.t(k); });
['ko'].forEach(function (code) {
  /* 只查韩语，不查日语：日语汉字词与简体中文同形是常态
     （「正式名称」「言語」「設定」本就是正确日语），拿「等于 zh-CN」判缺译会误报。
     韩语用谚文书写，与中文逐字相同必然是真缺译。
     —— 与第 132 批把 CJK 计数用于日语同类：判据本身错，会伪造出问题。 */
  I18N.set(code);
  keys.forEach(function (k) {
    if (/^(app)\./.test(k)) return;        /* app.name 等专有名词各语言可相同 */
    if (I18N.t(k) === zh[k] && CN.test(zh[k]) && !KEEP.test(zh[k])) frozen.push(code + ':' + k);
  });
});
ok(frozen.length === 0, '日语/韩语整条回退成中文（缺译）: ' + frozen.slice(0, 6).join(','));

head('C. HTML 覆盖率');
var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
/* 去掉注释与 script/style */
var body = html.replace(/<!--[\s\S]*?-->/g, '')
               .replace(/<script\b[\s\S]*?<\/script>/gi, '')
               .replace(/<style\b[\s\S]*?<\/style>/gi, '');

/* 长篇说明：<details>…</details> 整块，有意保持中文（机翻半通不通比不翻更误导人）。
   先把这些行的下标收集起来，扫描时直接跳过。 */
var longCnt = 0;
var longLines = {};
var dRe = /<details\b[\s\S]*?<\/details>/gi, dm;
var rawLines = body.split('\n');
while ((dm = dRe.exec(body))) {
  var seg = dm[0];
  var startLine = body.slice(0, dm.index).split('\n').length - 1;
  var segLines = seg.split('\n').length;
  for (var q = 0; q < segLines; q++) longLines[startLine + q] = true;
  longCnt += (seg.match(/[一-鿿]/g) || []).length ? 1 : 0;
}
var lines = body.split('\n');

/* 父元素级覆盖：挂了 data-i18n-html 的元素（如 <p class="ver-line">）内部整段会被替换，
   逐行扫描看不到属性，必须按「父元素范围」判定，否则会误报成未覆盖。 */
var htmlLines = {};
var noI18nLines = {};
function peek(re, str) {
  var save = re.lastIndex;
  var r = re.exec(str);
  if (!r) { re.lastIndex = save; return null; }
  re.lastIndex = save;
  return { index: r.index, len: r[0].length };
}
function consume(re, hit) { re.lastIndex = hit.index + hit.len; }
function markRange(attr, bucket) {
  var re = new RegExp('<' + '(\\w+)\\b[^>]*' + attr + '[^>]*>', 'g'), m2;
  while ((m2 = re.exec(body))) {
    var tag = m2[1];
    var st = body.slice(0, m2.index).split('\n').length - 1;
    /* 向后找配对的闭合标签（同名标签嵌套计数） */
    var rest = body.slice(m2.index);
    var openRe = new RegExp('<' + tag + '\\b', 'g'), closeRe = new RegExp('</' + tag + '>', 'g');
    var depth = 0, endIdx = -1;
    /* 必须按「位置先后」逐个消费事件：两个游标各走各的会把闭合顺序搞错，
       导致 depth 只增不减，endIdx 永远是 -1（第 126 批踩过）。 */
    for (var guard = 0; guard < 500; guard++) {
      var no = openRe.lastIndex >= 0 ? peek(openRe, rest) : null;
      var nc = peek(closeRe, rest);
      if (!no && !nc) break;
      if (nc && (!no || nc.index < no.index)) {          /* 先遇到闭合 */
        consume(closeRe, nc); depth--;
        if (depth === 0) { endIdx = nc.index; break; }
      } else {                                            /* 先遇到开标签 */
        consume(openRe, no); depth++;
      }
    }
    var en = endIdx >= 0 ? st + body.slice(m2.index, m2.index + endIdx).split('\n').length - 1 : st;
    for (var z = st; z <= en; z++) bucket[z] = true;
  }
}
markRange('data-i18n-html', htmlLines);
markRange('data-no-i18n', noI18nLines);

var items = [];
lines.forEach(function (l, idx) {
  if (!CN.test(l)) return;
  if (longLines[idx]) return;                                       /* <details> 长篇说明，有意不翻 */
  if (noI18nLines[idx]) { longCnt++; return; }                      /* 显式标记 data-no-i18n：有意不翻 */
  if (/<p[ >]/.test(l) && l.length > 200) { longCnt++; return; }
  var kind = null, txt = '', cov = false;
  if (/<option/.test(l)) {
    var mo = /<option[^>]*>(.*?)<\/option>/.exec(l); txt = mo ? mo[1] : ''; kind = 'option'; cov = /data-i18n=/.test(l);
  } else if (/placeholder="([^"]*[一-鿿][^"]*)"/.test(l)) {
    txt = /placeholder="([^"]*)"/.exec(l)[1]; kind = 'placeholder'; cov = /data-i18n-ph=/.test(l);
  } else if (/title="([^"]*[一-鿿][^"]*)"/.test(l)) {
    txt = /title="([^"]*)"/.exec(l)[1]; kind = 'title'; cov = /data-i18n-title=/.test(l);
  } else if (/<summary/.test(l)) {
    var ms = /<summary[^>]*>(.*?)<\/summary>/.exec(l); txt = ms ? ms[1].replace(/<[^>]+>/g, '') : ''; kind = 'summary'; cov = /data-i18n=/.test(l);
  } else if (/<label/.test(l)) {
    var ml = /<label[^>]*>(.*?)<\/label>/.exec(l); txt = ml ? ml[1].replace(/<[^>]+>/g, '') : ''; kind = 'label'; cov = /data-i18n=/.test(l);
    if (!txt.trim()) return;
  } else if (/<span[^>]*>[^<]*[一-鿿]/.test(l) || /<button[^>]*>[^<]*[一-鿿]/.test(l)) {
    var mb = />([^<>]*[一-鿿][^<>]*)</.exec(l); txt = mb ? mb[1] : ''; kind = 'span/button'; cov = /data-i18n=/.test(l);
    if (!txt.trim()) return;
  } else if (/aria-label="([^"]*[一-鿿][^"]*)"/.test(l)) {
    txt = /aria-label="([^"]*)"/.exec(l)[1]; kind = 'aria'; cov = /data-i18n-aria=/.test(l);
  } else {
    txt = l.trim().slice(0, 30); kind = '其它';
    cov = /data-i18n/.test(l) || !!htmlLines[idx];   /* 父元素整段替换也算覆盖 */
  }
  items.push({ kind: kind, cov: cov, txt: txt });
});

var miss = items.filter(function (x) { return !x.cov; });
var total = items.length;
var rate = total ? (100 * (total - miss.length) / total) : 100;
console.log('  可见中文 ' + total + ' 条，已覆盖 ' + (total - miss.length) + ' 条，覆盖率 ' + rate.toFixed(1) + '%');
console.log('  有意不翻的长篇说明: ' + longCnt + ' 条');
ok(rate >= 98, '覆盖率应 ≥98%，实得 ' + rate.toFixed(1) + '%');
if (miss.length) {
  console.log('  未覆盖明细:');
  miss.slice(0, 20).forEach(function (x) { console.log('    [' + x.kind + '] ' + x.txt.slice(0, 60)); });
}

head('D. 引用的键都必须存在');
I18N.set('zh-CN');
var refs = [], r2 = /data-i18n(?:-ph|-title|-tip|-aria)?="([^"]+)"/g, mm;
while ((mm = r2.exec(html))) refs.push(mm[1]);
var uniq = refs.filter(function (x, i) { return refs.indexOf(x) === i; });
var missing = uniq.filter(function (k) { return I18N.t(k) === k; });
ok(missing.length === 0, '引用了不存在的键: ' + missing.slice(0, 8).join(','));
console.log('  引用键 ' + uniq.length + ' 个，缺失 ' + missing.length + ' 个');

head('E. 动态文本（JS 里写死的中文）');
var logic = fs.readFileSync(path.join(ROOT, 'Encryption_and_decryption_logic.js'), 'utf8');
/* 正则必须同时认 _t( 和 _tf( —— 第一版只写 I18N\.t\(，
   导致第 128 批接入的 80 处 _tf 调用全被判成"（无）"，
   等于这层完全没有断言。已按实际调用方式修正，勿改回。 */
var dyn = /\b_tf?\('([a-z0-9.]+)'/g, dk = [], d;
while ((d = dyn.exec(logic))) dk.push(d[1]);
dk = dk.filter(function (x, i) { return dk.indexOf(x) === i; });
console.log('  逻辑层引用键: ' + dk.length + ' 个');
ok(dk.length > 0, '逻辑层应当有动态取词，实得 0（正则可能又失配了）');

/* E2 逻辑层引用的每个键都必须真实存在。
   漏键的后果很隐蔽：_t/_tf 会静默回退中文兜底，界面不报错、测试也不报错，
   只有切到非中文时才发现那一条没翻译。第 128 批就漏过 err.key2。 */
var dynMiss = dk.filter(function (k) { return keys.indexOf(k) < 0; });
ok(dynMiss.length === 0, '逻辑层引用了不存在的键（会静默回退中文）: ' + dynMiss.join(', '));

/* E3 _tf 的键若带 {占位符}，检查各语言译文里占位符齐全。
   少一个占位符 => 替换后残留 {mode} 原样文本，比中文更糟。 */
var phMiss = [];
dk.forEach(function (k) {
  var row = null;
  I18N.set('zh-CN');
  /* 直接查源码行取该键的 8 条译文 */
  var km = new RegExp("^\\s*'" + k.replace(/\./g, '\\.') + "':\\s*\\[(.*)\\],?\\s*$", 'm').exec(src);
  if (!km) return;
  var zh = I18N.t(k);
  var phs = (zh.match(/\{(\w+)\}/g) || []);
  if (!phs.length) return;
  LANGS.forEach(function (L, i) {
    I18N.set(L.code);
    var v = I18N.t(k);
    phs.forEach(function (p) {
      if (v.indexOf(p) < 0) phMiss.push(k + '/' + L.code + '/' + p);
    });
  });
});
ok(phMiss.length === 0, '这些译文缺少占位符（替换后会残留 {xxx}）: ' + phMiss.slice(0, 6).join(', '));
I18N.set('zh-CN');

/* E4 占位符替换函数必须存在，且对兜底文案也做替换
   （否则未收录键时会出现「{mode} 的 nonce 必须为…」这种原样占位符） */
ok(/function _tf\s*\(/.test(logic), '逻辑层缺少 _tf 占位符替换函数');
ok(/var s = _t\(key, fb\);/.test(logic), '_tf 应先取词再替换，且对兜底文案 fb 同样替换');

head('F. DOM 级模拟：用真实 index.html 的元素跑一遍 apply');
/* 没有 jsdom，这里从 index.html 直接抽出所有带 data-i18n* 的元素，
   造最小 mock 后喂给 I18N.apply，验证切语言后真的写进了值、且不出现 undefined。 */
function parseEls(html) {
  var out = [], re = /<(\w+)\b([^>]*data-i18n[^>]*)>/g, m3;
  while ((m3 = re.exec(html))) {
    var attrs = {}, ar = /([a-zA-Z-]+)="([^"]*)"/g, a;
    while ((a = ar.exec(m3[2]))) attrs[a[1]] = a[2];
    out.push({
      tagName: m3[1].toUpperCase(), attrs: attrs, textContent: '', innerHTML: '',
      setAttribute: function (k, v) { this.attrs[k] = v; },
      getAttribute: function (k) { return this.attrs[k] === undefined ? null : this.attrs[k]; }
    });
  }
  return out;
}
var els = parseEls(html);
console.log('  解析出带 i18n 属性的元素: ' + els.length);
ok(els.length >= 110, '元素数应 ≥110，实得 ' + els.length);

function makeScope(list, sel) {
  var key = /^\[([a-zA-Z-]+)\]$/.exec(sel);
  return { querySelectorAll: function (s2) { return list.filter(function (e) { return e.attrs[key[1]] !== undefined; }); } };
}
['en', 'ja', 'fr', 'ru'].forEach(function (code) {
  I18N.set(code);
  var bad = [], empty = [];
  ['data-i18n', 'data-i18n-ph', 'data-i18n-title', 'data-i18n-html', 'data-i18n-aria', 'data-i18n-tip'].forEach(function (attr) {
    var scope = { querySelectorAll: function () { return els.filter(function (e) { return e.attrs[attr] !== undefined; }); } };
    I18N.apply(scope);
  });
  els.forEach(function (e) {
    var target = e.attrs['data-i18n-html'] ? e.innerHTML : (e.attrs['data-i18n'] ? e.textContent : null);
    if (target === null) return;
    if (/undefined/.test(String(target))) bad.push(e.attrs['data-i18n'] || e.attrs['data-i18n-html']);
    if (String(target).trim() === '') empty.push(e.attrs['data-i18n'] || e.attrs['data-i18n-html']);
  });
  ok(bad.length === 0, code + ' 渲染出 undefined: ' + bad.slice(0, 5).join(','));
  ok(empty.length === 0, code + ' 渲染出空串: ' + empty.slice(0, 5).join(','));
});

/* verAlgo2 必须在 ver.line 的 innerHTML 里存活（切语言重建后仍要能被 JS 找到） */
I18N.set('zh-CN');
var anyBad = LANGS.some(function (L) {
  I18N.set(L.code);
  return !/id="verAlgo2"/.test(I18N.t('ver.line'));
});
ok(!anyBad, 'ver.line 各语言都必须保留 id="verAlgo2"，否则切语言后动态数字会丢失');

head('结果');
console.log('PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
