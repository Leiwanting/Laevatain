/**
 * t_html_wellformed.js —— 交付 HTML 结构完整性护栏
 *
 * 【为什么需要这个文件】
 * 第 146 批打包时，index.html 里 63 个 <option> 的结束符 ">" 被吃掉，
 * 变成：<option value="XTS" data-i18n="opt.mode.xts"XTS（磁盘加密）</option>
 *
 * 后果有两层，而且第二层极难归因：
 *   1. 属性串与文本粘连，data-i18n 全部失效（翻译不生效）；
 *   2. <option ... selected>GCM</option> 的那句同样被吃掉 ">"，
 *      "selected" 不再是合法属性 → GCM 不被选中 → 下拉框落回首项 CBC。
 *      于是界面默认停在 CBC，而代码里 DEFAULT 明明是 GCM —— 只看代码
 *      永远查不出原因，页面也不报错。
 *
 * dist 已修好，但打包脚本曾产出过坏包且没有任何告警，
 * 所以这里必须有断言把「HTML 结构完整」钉死，
 * 并对「安全默认值真的选中了」做二次确认。
 */
'use strict';
var fs = require('fs');
var path = require('path');
/* 本脚本只做静态文本校验，不需要加载任何算法脚本，
   因此不 require('_harness.js')（那会读取 cwd 下 index.html 并对 cwd 有要求）。 */
var pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.log('  FAIL: ' + m); } }
function t(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (e) { fail++; console.log('  ERR  ' + name + ': ' + e.message); }
}
function done() {
  console.log('\n' + (fail === 0 ? 'PASS' : 'FAIL') + ' ' + pass + ' / ' + fail);
  process.exit(fail === 0 ? 0 : 1);
}

var ROOT = path.join(__dirname, '..');
var HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* ---------- A. 标签完整性 ---------- */
t('A1 index.html 非空', function () {
  ok(HTML.length > 1000, 'HTML 长度 ' + HTML.length + ' 应大于 1000');
});

[['option', true], ['select', true], ['div', true], ['label', true], ['span', true]]
  .forEach(function (pair) {
    var tag = pair[0];
    t('A2 <' + tag + '> 开标签全部带结束符 >', function () {
      var open = HTML.match(new RegExp('<' + tag + '\\b', 'g')) || [];
      var good = HTML.match(new RegExp('<' + tag + '\\b[^<>]*>', 'g')) || [];
      var selfc = HTML.match(new RegExp('<' + tag + '\\b[^<>]*/>', 'g')) || [];
      ok(good.length + selfc.length === open.length,
        tag + ' 开标签 ' + open.length + '，完整 ' + good.length +
        '（自闭 ' + selfc.length + '），缺失 ' + (open.length - good.length - selfc.length));
    });
  });

t('A3 <option> 开闭标签数量一致', function () {
  var o = (HTML.match(/<option\b/g) || []).length;
  var c = (HTML.match(/<\/option>/g) || []).length;
  ok(o === c, '开 ' + o + ' / 闭 ' + c);
});

/* ---------- B. 属性不得与文本粘连 ---------- */
/* 这是本次事故的直接判据：属性引号后必须紧跟 > 或空格，绝不能紧跟可见字符。 */
t('B1 属性引号后不得直接跟非空白字符', function () {
  var bad = [];
  /* 闭合引号后允许：空白、>、/（自闭合）。除此以外一律视为粘连。 */
  var re = /<[a-zA-Z][^<>]*?="[^"]*"[^<>\s/]/g;
  var m;
  while ((m = re.exec(HTML)) !== null) {
    /* 排除自闭合结尾 "/>" 与正常 ">" —— 正则已排除 > 与空白 */
    bad.push(m[0].replace(/\s+/g, ' ').slice(0, 60));
  }
  ok(bad.length === 0, '粘连处 ' + bad.length + ' 处' + (bad.length ? '：' + bad.slice(0, 3).join(' | ') : ''));
});

t('B2 每个 data-i18n 值后都能正常闭合', function () {
  var hits = HTML.match(/data-i18n="[^"]*"[^<>]*>/g) || [];
  var total = (HTML.match(/data-i18n="/g) || []).length;
  ok(hits.length === total,
    'data-i18n 共 ' + total + ' 处，能正常闭合 ' + hits.length + ' 处');
});

/* ---------- C. 安全默认值真的被选中 ---------- */
/* 光看源码里的 DEFAULT_ALGO_ID / selected 不够，必须确认 select 的默认取值。 */
function defaultOf(id) {
  var re = new RegExp('<select\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)</select>');
  var m = HTML.match(re);
  if (!m) return null;
  var body = m[1];
  var sel = body.match(/<option\b[^<>]*\bselected\b[^<>]*>/);
  if (sel) {
    var v = sel[0].match(/value="([^"]*)"/);
    return v ? v[1] : null;
  }
  var first = body.match(/<option\b[^<>]*>/);
  if (first) {
    var v2 = first[0].match(/value="([^"]*)"/);
    return v2 ? v2[1] : null;
  }
  return null;
}

t('C1 加密模式默认必须是 AEAD（GCM），不能落回 CBC', function () {
  var v = defaultOf('mode');
  ok(v === 'GCM', 'mode 默认取值为 ' + v + '，应为 GCM');
});

t('C2 selected 属性本身必须合法（事故根因）', function () {
  /* selected 后必须能正常闭合，否则浏览器不认、静默落回首项 */
  var good = HTML.match(/<option\b[^<>]*\bselected\b[^<>]*>/g) || [];
  var all = HTML.match(/<option\b[^<>]*\bselected\b/g) || [];
  ok(good.length === all.length && all.length >= 1,
    'selected 出现 ' + all.length + ' 处，合法闭合 ' + good.length + ' 处');
});

t('C3 口令派生默认应为 Argon2id（抗 GPU/ASIC）', function () {
  var v = defaultOf('kdf');
  ok(v === 'argon2id', 'kdf 默认取值为 ' + v + '，应为 argon2id');
});

t('C4 认证标签长度默认 16 字节', function () {
  var v = defaultOf('tagLen');
  ok(v === '16', 'tagLen 默认取值为 ' + v + '，应为 16');
});

t('C5 nonce 复用防护默认开启', function () {
  var v = defaultOf('nonceGuard');
  ok(v && v !== 'off' && v !== 'none', 'nonceGuard 默认取值为 ' + v);
});

t('C6 填充校验默认严格（防 Padding Oracle）', function () {
  var v = defaultOf('padStrict');
  ok(v === 'strict' || v === '1' || v === 'on',
    'padStrict 默认取值为 ' + v + '，应为 strict');
});

/* ---------- D. 危险项不得作为默认 ---------- */
t('D1 默认算法不得是 ECB', function () {
  ok(!/DEFAULT_ALGO_ID\s*=\s*['"][^'"]*ecb/i.test(
    fs.readFileSync(path.join(ROOT, 'Encryption_and_decryption_logic.js'), 'utf8')),
    'DEFAULT_ALGO_ID 不得指向 ECB');
});

done();
