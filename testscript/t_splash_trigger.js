/* t_splash_trigger.js —— 开屏"为什么没触发"的回归防线
 *
 * 背景：用户反馈"没触发开屏动画"。排查后有三类成因，本脚本逐条钉死：
 *   1) CSS 用了 inset 简写。老 WebView（Chrome<87 / Safari<14.1）会整条丢弃该
 *      声明，position:fixed 失去全部偏移后停在文档流静态位置——覆盖层是
 *      appendChild 到 body 末尾的，页面很长时用户只看得到顶部，表现就是"没触发"。
 *   2) 减少动态效果分支原本 600ms 且直接 return（不画雪花），一闪而过。
 *   3) 自动启动路径（readyState='loading' → DOMContentLoaded）此前没有任何断言，
 *      t_splash.js 只 mock 了 readyState='complete'，等于没守住真实路径。
 *
 * 运行：在 index.html 所在目录执行 node testscript/t_splash_trigger.js
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.log('  FAIL: ' + m); } }
function section(n) { console.log('[' + n + ']'); }

const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'ui_splash.js'), 'utf8');
const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
const sidebar = fs.readFileSync(path.join(ROOT, 'ui_sidebar.js'), 'utf8');

/* ---------- A. CSS 不得再用 inset 简写 ---------- */
section('A CSS 兼容性');
const splashBlock = (css.match(/\.splash\{[\s\S]*?\}/) || [''])[0];
ok(splashBlock.length > 0, '.splash 规则块未找到');
ok(!/inset\s*:/.test(splashBlock), '.splash 仍使用 inset 简写，老 WebView 会丢弃整条声明');
ok(/top:\s*0/.test(splashBlock) && /right:\s*0/.test(splashBlock) &&
   /bottom:\s*0/.test(splashBlock) && /left:\s*0/.test(splashBlock),
   '.splash 未显式写出 top/right/bottom/left 四边');
const snowBlock = (css.match(/\.splash-snow\{[\s\S]*?\}/) || [''])[0];
ok(!/inset\s*:/.test(snowBlock), '.splash-snow 仍使用 inset 简写');
const maskBlock = (css.match(/\.side-mask\s*\{[\s\S]*?\}/) || [''])[0];
ok(!/inset\s*:/.test(maskBlock), '.side-mask 仍使用 inset 简写（同类隐患）');

/* ---------- B. JS 内联关键定位（不依赖 CSS 成败） ---------- */
section('B 内联定位兜底');
ok(/rs\.position\s*=\s*'fixed'/.test(js), '未内联 position:fixed');
ok(/rs\.top\s*=\s*'0'/.test(js) && /rs\.left\s*=\s*'0'/.test(js), '未内联 top/left');
ok(/rs\.width\s*=\s*'100%'/.test(js) && /rs\.height\s*=\s*'100%'/.test(js), '未内联 width/height');
ok(/cs\.position\s*=\s*'absolute'/.test(js), '雪花 canvas 未内联定位');

/* ---------- C. 减少动态效果时也要看得见 ---------- */
section('C 减少动态效果');
const durRed = (js.match(/DURATION_REDUCED\s*=\s*(\d+)/) || [])[1];
ok(Number(durRed) >= 1000, 'DURATION_REDUCED 仍为 ' + durRed + 'ms，太短会看成"没触发"');
const iSnow = js.indexOf('snow = buildSnow(el.cv)');
const iReduce = js.indexOf('if (reduceMotion()) {', js.indexOf('function start'));
ok(iSnow > 0 && iReduce > 0 && iSnow < iReduce,
   'buildSnow 必须在 reduceMotion 分支之前——否则减少动态效果时没有雪花');

/* ---------- D. 自动启动路径（readyState=loading → DOMContentLoaded） ---------- */
section('D 自动启动路径');
function mkNode(tag) {
  const n = {
    tagName: tag || 'div', _children: [], style: {}, className: '', id: '',
    _attrs: {}, textContent: '',
    classList: { add() {}, remove() {}, contains() { return false; } },
    setAttribute(k, v) { this._attrs[k] = v; },
    getAttribute(k) { return this._attrs[k]; },
    addEventListener() {}, appendChild(c) { this._children.push(c); c.parentNode = this; return c; },
    removeChild(c) { const i = this._children.indexOf(c); if (i >= 0) this._children.splice(i, 1); return c; },
    /* 让 buildSnow 能建起来，从而覆盖雪花路径 */
    getContext() {
      return { setTransform() {}, clearRect() {}, beginPath() {}, arc() {}, fill() {}, fillStyle: '' };
    },
    clientWidth: 360, clientHeight: 640
  };
  return n;
}
function makeSandbox(readyState, reduce) {
  const body = mkNode('body');
  const evs = {};
  const timers = [];
  const sb = {
    console, Math, JSON, Date,
    document: {
      readyState: readyState, body: body,
      createElement: (t) => mkNode(t), createElementNS: (ns, t) => mkNode(t),
      getElementById: () => null,
      addEventListener(ev, fn) { (evs[ev] = evs[ev] || []).push(fn); }
    },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
    clearTimeout: (id) => { if (id) timers[id - 1] = null; },
    matchMedia: () => ({ matches: !!reduce }),
    devicePixelRatio: 2, innerWidth: 360, innerHeight: 640,
    addEventListener() {}
  };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(js, sb);
  return { sb, body, evs, timers };
}

const A = makeSandbox('loading', false);
ok(A.body._children.length === 0,
   'readyState=loading 时不应立即建节点（应等 DOMContentLoaded），实为 ' + A.body._children.length);
ok((A.evs['DOMContentLoaded'] || []).length === 1, '未注册 DOMContentLoaded 监听');
(A.evs['DOMContentLoaded'] || []).forEach((f) => f());
const node = A.body._children.find((c) => c.className === 'splash');
ok(!!node, '触发 DOMContentLoaded 后仍未建出覆盖层——这正是用户遇到的现象');
if (node) {
  ok(node.style.position === 'fixed', '覆盖层内联 position 不是 fixed');
  ok(node.style.top === '0' && node.style.left === '0', '覆盖层内联 top/left 缺失');
  ok(node.style.width === '100%' && node.style.height === '100%', '覆盖层内联尺寸缺失');
  ok(node.style.zIndex === '9999', '覆盖层 z-index 缺失');
  ok(A.body.style.overflow === 'hidden', '开屏时未锁定滚动');
}

/* 减少动态效果下也要出现（只是不做动画） */
const B = makeSandbox('complete', true);
B.sb.Splash.start();
const nodeB = B.body._children.find((c) => c.className === 'splash');
ok(!!nodeB, 'reduceMotion 下未建出覆盖层');
ok(B.sb.Splash._state().prev === 1, 'reduceMotion 下进度应直达 100%');

/* ---------- E. 手动入口（可主动触发验证） ---------- */
section('E 手动播放入口');
ok(/side\.playSplash/.test(sidebar), '侧边栏未加入播放开屏的导航项');
ok(/item\.splash/.test(sidebar) && /window\.Splash\.start/.test(sidebar),
   '侧边栏点击未调用 Splash.start()');
const keyLine = (i18n.match(/'side\.playSplash':\s*\[([\s\S]*?)\]/) || [])[1];
ok(!!keyLine, 'i18n 缺少 side.playSplash 键');
if (keyLine) {
  const arr = keyLine.split(',').map((s) => s.trim().replace(/^'|'$/g, ''));
  ok(arr.length === 8, 'side.playSplash 应有 8 种语言，实为 ' + arr.length);
  ok(arr.every((s) => s.length > 0), 'side.playSplash 存在空译文');
}

console.log('\n开屏触发回归: 通过 ' + pass + '  失败 ' + fail);
process.exit(fail ? 1 : 0);
