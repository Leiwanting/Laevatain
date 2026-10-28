/* t_splash_real.js —— 用真实 DOM（jsdom）加载 index.html，断言开屏真的出现
 *
 * 为什么必须补这个脚本：
 * 第 136 批之前，开屏只有 mock DOM 测试（t_splash.js），而 mock 的 SVG 元素
 * className 是可写的普通属性；真实浏览器里 SVGElement.className 是只读的
 * SVGAnimatedString，赋值必抛 TypeError。于是真实环境开屏根本没建成，
 * mock 测试却全绿——典型的"测试环境比真实环境宽容"导致的假绿。
 *
 * 本脚本在真实 DOM 实现上加载页面，覆盖那条必经路径。
 *
 * 运行：在 index.html 所在目录执行  node testscript/t_splash_real.js
 * 依赖：jsdom（npm i jsdom）。未安装时明确 SKIP，不假装通过。
 */
'use strict';
var H = require('./_harness.js');
var fs = require('fs');
var path = require('path');

var P = 0, F = 0;
function ok(name, cond, extra) {
  if (cond) { P++; console.log('  PASS ' + name); }
  else { F++; console.log('  FAIL ' + name + (extra ? '  → ' + extra : '')); }
}

var jsdom = null;
try { jsdom = require('jsdom'); } catch (e) { jsdom = null; }

var ROOT = process.cwd();
var INDEX = path.join(ROOT, 'index.html');

console.log('=== 开屏真实 DOM 验收（jsdom） ===');

/* A. 静态：SVG 元素不得用 .className 赋值（无 jsdom 也能抓） */
var srcFile = path.join(ROOT, 'UI/ui_splash.js');
ok('A1 UI/ui_splash.js 存在', fs.existsSync(srcFile));
if (fs.existsSync(srcFile)) {
  var src = fs.readFileSync(srcFile, 'utf8');
  /* 必须先剥离注释：修复说明里正写着 `svg.className = 'x'` 这个反例，
     不剥离会把注释当成违规代码而误报（本批实际踩到）。 */
  var code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  var nsVars = [];
  var reNs = /var\s+(\w+)\s*=\s*document\.createElementNS\s*\(/g, m;
  while ((m = reNs.exec(code))) nsVars.push(m[1]);
  var bad = [];
  nsVars.forEach(function (v) {
    var re = new RegExp('\\b' + v + '\\s*\\.\\s*className\\s*=', 'g');
    if (re.test(code)) bad.push(v + '.className=');
  });
  ok('A2 SVG 元素无 .className 赋值（只读属性）', bad.length === 0, bad.join(','));
  ok('A3 六芒星用 setAttribute 设 class', /svg\.setAttribute\(\s*'class'/.test(code));
  ok('A4 build 失败有降级而非静默 return', /buildMinimal/.test(src));
  ok('A5 暴露 _diag 供界面提示', /_diag\s*:/.test(src));
}

if (!jsdom) {
  console.log('  SKIP jsdom 未安装（npm i jsdom），跳过真实 DOM 段');
  console.log('  PASS ' + P + '   FAIL ' + F);
  process.exit(F ? 1 : 0);
}

ok('B0 index.html 存在', fs.existsSync(INDEX));

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* 页面脚本很多，resources:'usable' 下加载耗时不定。原来固定 sleep(500) 会偶发
   判成"开屏没出现"，而真实原因只是还没加载完。改成轮询等待条件成立。 */
async function waitFor(fn, ms) {
  var end = Date.now() + (ms || 6000);
  while (Date.now() < end) {
    var v = false;
    try { v = fn(); } catch (e) { v = false; }
    if (v) return true;
    await sleep(60);
  }
  return false;
}

(async function () {
  var logs = [];
  var vc = new jsdom.VirtualConsole();
  vc.on('jsdomError', function (e) { logs.push(String(e.message)); });
  var dom = await jsdom.JSDOM.fromFile(INDEX, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc
  });
  var w = dom.window;

  await waitFor(function () { return !!w.document.getElementById('splash'); }, 8000);

  /* B. 页面加载后开屏必须真实挂在 DOM 上 */
  var sp = w.document.getElementById('splash');
  ok('B1 开屏层已插入 DOM', !!sp);
  if (sp) {
    ok('B2 position 为 fixed', sp.style.position === 'fixed', sp.style.position);
    /* 注意：CSSStyleDeclaration 会把 '0' 规范化成 '0px'，两种都要接受 */
    var num0 = function (v) { return v === '0' || v === '0px' || v === '0%'; };
    ok('B3 铺满视口（top/left 为 0）', num0(sp.style.top) && num0(sp.style.left), sp.style.top + '/' + sp.style.left);
    ok('B4 z-index 9999', String(sp.style.zIndex) === '9999', sp.style.zIndex);
    ok('B5 挂载点是 body', sp.parentNode === w.document.body);
    var nm = w.document.getElementById('splashName');
    ok('B6 显示正式名称', !!nm && /Laevatain_sky/.test(nm.textContent || ''), nm && nm.textContent);
    var bar = w.document.getElementById('splashBar');
    ok('B7 进度条在内', !!bar);
    var star = w.document.querySelectorAll('.splash-star');
    ok('B8 六芒星为单条星形 path', star.length === 1, '实际 ' + star.length);
    if (star.length === 1) {
      var dd = star[0].getAttribute('d') || '';
      ok('B8b 星形是 12 顶点轮廓（不是两个三角）',
         (dd.match(/[ML]/g) || []).length === 12 && (dd.match(/M/g) || []).length === 1,
         '顶点数 ' + (dd.match(/[ML]/g) || []).length);
    }
    ok('B8c 魔法阵外环存在', w.document.querySelectorAll('.splash-outer').length === 1);
    ok('B8d 符文小星 6 颗', w.document.querySelectorAll('.splash-rune').length === 6,
       '实际 ' + w.document.querySelectorAll('.splash-rune').length);
    ok('B8e 外环刻度 36 条', w.document.querySelectorAll('.splash-ticks line').length === 36,
       '实际 ' + w.document.querySelectorAll('.splash-ticks line').length);
    ok('B8f 界面上不再有两个独立三角', w.document.querySelectorAll('.splash-tri').length === 0);
    var d = w.Splash && w.Splash._diag && w.Splash._diag();
    ok('B9 _diag 报告已挂载', !!(d && d.ok), d && JSON.stringify(d));
    ok('B10 未降级到最小层', !(d && d.minimal), d && d.err);
  }

  /* C. 自动关闭：2s 后必须真的移除并解锁滚动（含 1.2s 兜底定时器，轮询等待） */
  await waitFor(function () { return !w.document.getElementById('splash'); }, 9000);
  ok('C1 自动关闭后已移除', !w.document.getElementById('splash'));
  ok('C2 滚动已解锁', w.document.body.style.overflow !== 'hidden', w.document.body.style.overflow);

  /* D. 第二次手动播放必须还能出现（closed 状态复位的回归） */
  w.Splash.start();
  await waitFor(function () { return !!w.document.getElementById('splash'); }, 4000);
  var sp2 = w.document.getElementById('splash');
  ok('D1 第二次 start 能再出现', !!sp2);
  if (sp2) {
    var st2 = w.document.querySelectorAll('.splash-star');
    ok('D2 第二次仍有六芒星', st2.length === 1, '实际 ' + st2.length);
    w.Splash.skip();
    await waitFor(function () { return !w.document.getElementById('splash'); }, 4000);
    ok('D3 第二次能再关掉', !w.document.getElementById('splash'));
  }

  var hardErr = logs.filter(function (l) { return /not implemented/i.test(l) === false; });
  ok('E1 无非 canvas 类 JS 错误', hardErr.length === 0, hardErr.slice(0, 2).join(' | '));

  console.log('  PASS ' + P + '   FAIL ' + F);
  try { dom.window.close(); } catch (e) {}
  process.exit(F ? 1 : 0);
})().catch(function (e) {
  console.log('  FAIL 运行异常 → ' + (e && e.message || e));
  console.log('  PASS ' + P + '   FAIL ' + (F + 1));
  process.exit(1);
});
