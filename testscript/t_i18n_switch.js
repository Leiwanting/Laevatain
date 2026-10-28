/* t_i18n_switch.js —— 语言切换的「半切换」与「口令派生提示串台」回归
 *
 * 背景（第 155 批，两个真 bug）：
 *
 * ① 切语言只切一半。
 *    Encryption_and_decryption_logic.js 在 index.html 里排第 324 行，
 *    Multilingual/i18n.js 排在第 440 行 —— 顶层那段
 *        if (window.I18N && ...) window.I18N.onChange(...)
 *    执行时 window.I18N 还不存在，注册被**静默跳过**。结果切语言时
 *    安全提示 / IV 标签 / 密钥模式标签 / 文件提示永远不刷新，只有等用户
 *    再动某个下拉触发 refreshSecurity 才会「补」上，看着就像只切了一半。
 *    修法：能注册就注册，否则挂 DOMContentLoaded 之后再注册。
 *
 * ② 口令派生提示串台。
 *    refreshSecurity() 无条件读 els.kdf.value。先选 AES + Argon2id，
 *    再切到后量子 / 门限算法，模式栏隐藏了但 kdf 下拉的值还留着 argon2id，
 *    于是 argon 的提示会一直跟着显示。修法：_kdfActive() 门控。
 *    顺带把 argon2id / argon2i / argon2d 从共用一条提示拆成三条
 *    （此前三者文案一字不差，等于没说）。
 *
 * 运行：在 index.html 所在目录执行  node testscript/t_i18n_switch.js
 * 依赖：jsdom（未安装时跳过行为段，静态段照常跑，不假装通过）。
 */
'use strict';
var fs = require('fs');
var path = require('path');

var P = 0, F = 0;
function ok(name, cond, extra) {
  if (cond) { P++; console.log('  PASS ' + name); }
  else { F++; console.log('  FAIL ' + name + (extra ? '  → ' + extra : '')); }
}

var ROOT = process.cwd();
var LOGIC = path.join(ROOT, 'Encryption_and_decryption_logic.js');
var MODES = path.join(ROOT, 'crypto_modes.js');
var I18NSEC = path.join(ROOT, 'Multilingual/i18n_sec.js');
var INDEX = path.join(ROOT, 'index.html');

console.log('=== 语言切换 / 口令派生提示 回归 ===');

/* ---------- A. 静态：修法本身在位 ---------- */
var logic = fs.existsSync(LOGIC) ? fs.readFileSync(LOGIC, 'utf8') : '';
ok('A1 logic.js 存在', !!logic);
var logicCode = logic.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
ok('A2 有 _hookI18nListeners 兜底注册函数', /_hookI18nListeners/.test(logic));
ok('A3 未就绪时挂 DOMContentLoaded 再注册',
  /_hookI18nListeners\(\)[\s\S]{0,200}DOMContentLoaded/.test(logicCode));
ok('A4 不再有「window.I18N 不存在就跳过」的裸 if 注册',
  !/if\s*\(typeof window !== 'undefined' && window\.I18N[\s\S]{0,80}onChange/.test(logicCode));
ok('A5 有 _kdfActive 门控', /function _kdfActive/.test(logic));
ok('A6 kdfMode 经 _kdfActive 取值', /kdfMode:\s*_kdfActive\(cur\)/.test(logicCode));

var modes = fs.existsSync(MODES) ? fs.readFileSync(MODES, 'utf8') : '';
ok('A7 argon2id 有独立提示', /cfg\.kdfMode === 'argon2id'/.test(modes));
ok('A8 argon2i 有独立提示', /cfg\.kdfMode === 'argon2i'/.test(modes));
ok('A9 argon2d 有独立提示', /cfg\.kdfMode === 'argon2d'/.test(modes));
ok('A10 不再用 /^argon2/ 一把抓', !/\/\^argon2\/\.test\(cfg\.kdfMode/.test(modes));

var secSrc = fs.existsSync(I18NSEC) ? fs.readFileSync(I18NSEC, 'utf8') : '';
['sec.kdf.argon2id', 'sec.kdf.argon2i', 'sec.kdf.argon2d'].forEach(function (k, i) {
  ok('A1' + (1 + i) + ' 译文表含 ' + k, secSrc.indexOf("'" + k + "'") >= 0);
});

/* ---------- B. 真实 DOM 行为 ---------- */
var jsdom = null;
try { jsdom = require('jsdom'); } catch (e) { jsdom = null; }

if (!jsdom) {
  console.log('  SKIP jsdom 未安装，跳过真实 DOM 段');
  console.log('  PASS ' + P + '   FAIL ' + F);
  process.exit(F ? 1 : 0);
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
async function waitFor(fn, ms) {
  var end = Date.now() + (ms || 8000);
  while (Date.now() < end) {
    var v = false;
    try { v = fn(); } catch (e) { v = false; }
    if (v) return true;
    await sleep(60);
  }
  return false;
}

(async function () {
  var dom = await jsdom.JSDOM.fromFile(INDEX, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true
  });
  var w = dom.window;

  await waitFor(function () { return !!w.I18N && !!w.document.getElementById('secWarn'); }, 9000);
  ok('B1 页面加载后 window.I18N 可用', !!w.I18N);
  ok('B2 I18N.onChange 可用', !!(w.I18N && typeof w.I18N.onChange === 'function'));

  var sec = w.document.getElementById('secWarn');
  var algoSel = w.document.getElementById('algo');
  var kdfSel = w.document.getElementById('kdf');
  ok('B3 算法下拉存在', !!algoSel);
  ok('B4 KDF 下拉存在', !!kdfSel);

  /* 默认 AES + argon2id：安全提示里应出现 Argon2id 相关文案 */
  await waitFor(function () { return /Argon2/.test(sec.textContent || ''); }, 6000);
  var zhText = sec.textContent || '';
  ok('B5 中文下出现 Argon2id 提示', /Argon2id/.test(zhText), zhText.slice(0, 60));

  /* —— ① 切到日语：提示必须跟着变 —— */
  if (w.I18N && typeof w.I18N.set === 'function') {
    w.I18N.set('ja');
    await sleep(150);
    var jaText = w.document.getElementById('secWarn').textContent || '';
    ok('B6 切日语后提示不再是中文原文', jaText !== zhText, jaText.slice(0, 60));
    ok('B7 切日语后出现日语译文', /トレードオフ|パラメータ/.test(jaText), jaText.slice(0, 80));

    w.I18N.set('zh-CN');
    await sleep(150);
    var backText = w.document.getElementById('secWarn').textContent || '';
    ok('B8 切回中文能还原', /参数取舍|Argon2id/.test(backText), backText.slice(0, 60));
  } else {
    ok('B6 I18N.set 可用', false);
  }

  /* —— ② 三种 Argon2 变体必须给出不同文案 —— */
  var texts = {};
  ['argon2id', 'argon2i', 'argon2d'].forEach(function (m) { texts[m] = ''; });
  if (kdfSel) {
    ['argon2id', 'argon2i', 'argon2d'].forEach(function (m) {
      kdfSel.value = m;
      kdfSel.dispatchEvent(new w.Event('change'));
      texts[m] = (w.document.getElementById('secWarn').textContent || '');
    });
    ok('B9 argon2id 与 argon2i 文案不同', texts.argon2id !== texts.argon2i);
    ok('B10 argon2id 与 argon2d 文案不同', texts.argon2id !== texts.argon2d);
    ok('B11 argon2i 提示含「首选」级措辞', /首选|第一選択|not the first choice|첫 번째/.test(texts.argon2i),
      texts.argon2i.slice(0, 60));
    ok('B12 argon2d 提示含侧信道措辞', /侧信道|サイドチャネル|side-channel|사이드채널/.test(texts.argon2d),
      texts.argon2d.slice(0, 60));
  }

  /* —— ③ 切到后量子/非对称算法，argon 提示必须消失 —— */
  if (algoSel) {
    var pqId = null;
    for (var i = 0; i < algoSel.options.length; i++) {
      var v = algoSel.options[i].value;
      if (/^mceliece|^ml-kem|^kyber|^sphincs|^falcon|^ntru|^sntrup/.test(v)) { pqId = v; break; }
    }
    ok('B13 找到后量子条目用于验证', !!pqId, pqId || '未找到');
    if (pqId) {
      algoSel.value = pqId;
      algoSel.dispatchEvent(new w.Event('change'));
      await sleep(200);
      var pqText = w.document.getElementById('secWarn').textContent || '';
      ok('B14 切到后量子后不再出现 Argon2 提示', !/Argon2/.test(pqText), pqText.slice(0, 80));
    }
  }

  console.log('  PASS ' + P + '   FAIL ' + F);
  process.exit(F ? 1 : 0);
})().catch(function (e) {
  console.log('  FAIL 未捕获异常：' + (e && e.message));
  console.log('  PASS ' + P + '   FAIL ' + (F + 1));
  process.exit(1);
});
