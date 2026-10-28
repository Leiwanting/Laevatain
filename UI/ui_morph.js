/* ui_morph.js —— SVG 图标形变（morph）引擎，零依赖
 *
 * 思路来自 morphicons（https://www.morphicons.com/）：
 *   图标当「数据」消费（一个 d 属性字符串），而不是当组件；
 *   状态切换时不做硬替换，而是用弹簧物理插值到目标形状。
 * morphicons 只提供 React / Vue / Svelte / Astro 版本，本工具箱是原生
 * script 标签工程，装不上，因此按同样的原理自研这一份。
 *
 * 硬性约束（也是最容易踩的坑）：
 *   参与形变的两条 path 必须「命令序列完全一致」——命令字母相同、每条命令的
 *   数值个数相同。例如 'M4 7 L20 7' 与 'M6 6 L18 18' 可形变，
 *   但 'M4 7 L20 7' 与 'M4 7 L20 7 L20 12' 不行。
 *   不满足时本引擎退化成「直接切换」，绝不崩、绝不画出半个图形。
 *   所有 ICONS 里的配对都由 t_morph.js 断言其结构性兼容。
 *
 * 尊重系统「减少动态效果」：开启时直接跳到终态，不播放动画。
 */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';

  function reduceMotion() {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }

  /* ---------- path 解析 / 插值 ---------- */

  var CMD_RE = /([MmLlHhVvCcSsQqTtAaZz])\s*([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  var NUM_RE = /-?\d*\.?\d+(?:[eE][-+]?\d+)?/g;

  function parsePath(d) {
    var out = [], m;
    CMD_RE.lastIndex = 0;
    var s = String(d === undefined || d === null ? '' : d);
    while ((m = CMD_RE.exec(s)) !== null) {
      var nums = (m[2] || '').trim();
      var v = [], p;
      if (nums) {
        NUM_RE.lastIndex = 0;
        while ((p = NUM_RE.exec(nums)) !== null) v.push(parseFloat(p[0]));
      }
      out.push({ c: m[1], v: v });
    }
    return out;
  }

  function compatible(a, b) {
    var A = parsePath(a), B = parsePath(b), i, j;
    if (A.length !== B.length) return false;
    for (i = 0; i < A.length; i++) {
      if (A[i].c !== B[i].c) return false;
      if (A[i].v.length !== B[i].v.length) return false;
      for (j = 0; j < A[i].v.length; j++) {
        if (!isFinite(A[i].v[j]) || !isFinite(B[i].v[j])) return false;
      }
    }
    return true;
  }

  /* 只裁剪小数点后的尾零：100 -> "100"，绝不能把 "100" 裁成 "1" */
  function num(x) {
    var s = x.toFixed(3);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  }

  function lerpPath(a, b, t) {
    if (!compatible(a, b)) return t < 0.5 ? a : b;      /* 结构不符：退化成硬切 */
    var A = parsePath(a), B = parsePath(b), out = '', i, j;
    for (i = 0; i < A.length; i++) {
      out += A[i].c;
      for (j = 0; j < A[i].v.length; j++) {
        out += (j ? ' ' : '') + num(A[i].v[j] + (B[i].v[j] - A[i].v[j]) * t);
      }
      if (i < A.length - 1) out += ' ';
    }
    return out;
  }

  /* ---------- 弹簧（解析解，非数值积分，无累积漂移） ---------- */

  var ZETA = 0.62;    /* 阻尼比 <1 => 有轻微回弹，这才是「弹簧」而不是普通缓动 */
  var OMEGA = 12;     /* 固有频率 */

  function spring(u, zeta, omega) {
    if (!(u > 0)) return 0;
    if (u >= 1) return 1;
    var z = (zeta === undefined) ? ZETA : zeta;
    var w = (omega === undefined) ? OMEGA : omega;
    if (z >= 1) return u;                                /* 过阻尼/临界：退化成线性 */
    var wd = w * Math.sqrt(1 - z * z);
    var e = Math.exp(-z * w * u);
    return 1 - e * (Math.cos(wd * u) + (z * w / wd) * Math.sin(wd * u));
  }

  /* ---------- 图标库 ---------- */

  var ICONS = {
    /* 汉堡 <-> 叉：三条线。中间那条在 X 态收成一个点并把不透明度降到 0 */
    menu: {
      vb: '0 0 24 24',
      p: [
        { d: 'M4 7 L20 7', o: 1 },
        { d: 'M4 12 L20 12', o: 1 },
        { d: 'M4 17 L20 17', o: 1 }
      ]
    },
    close: {
      vb: '0 0 24 24',
      p: [
        { d: 'M6 6 L18 18', o: 1 },
        { d: 'M12 12 L12 12', o: 0 },
        { d: 'M6 18 L18 6', o: 1 }
      ]
    },
    /* 折叠箭头：右 <-> 下。同一条三折线，纯旋转即可映射 */
    chevR: { vb: '0 0 24 24', p: [{ d: 'M9 6 L15 12 L9 18', o: 1 }] },
    chevD: { vb: '0 0 24 24', p: [{ d: 'M6 9 L12 15 L18 9', o: 1 }] }
  };

  /* 形变配对表：声明哪些图标之间允许互相形变 */
  var PAIRS = [['menu', 'close'], ['chevR', 'chevD']];

  /* ---------- DOM ---------- */

  function mount(host, name) {
    if (typeof document === 'undefined') return null;
    /* 测试 harness 的 mock DOM 没有 createElementNS：这里返回 null，
       由调用方退回原方案（而不是抛错把整批测试带崩） */
    if (typeof document.createElementNS !== 'function') return null;
    var ic = ICONS[name];
    if (!ic) return null;
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', ic.vb);
    svg.setAttribute('class', 'morph-ico');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('data-morph', name);
    svg.__paths = [];
    for (var i = 0; i < ic.p.length; i++) {
      var p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', ic.p[i].d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', 'currentColor');
      p.setAttribute('stroke-width', '2');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      if (ic.p[i].o !== 1 && p.style) p.style.opacity = String(ic.p[i].o);
      svg.appendChild(p);
      svg.__paths.push(p);
    }
    if (host && host.appendChild) host.appendChild(svg);
    return svg;
  }

  function curOp(el) {
    var s = (el.style && el.style.opacity) ? el.style.opacity : '';
    var v = parseFloat(s);
    return isNaN(v) ? 1 : v;
  }

  function animate(el, fromD, toD, fromO, toO, opts) {
    opts = opts || {};
    var dur = (typeof opts.duration === 'number') ? opts.duration : 420;
    if (dur <= 0 || reduceMotion()) {
      el.setAttribute('d', toD);
      if (el.style && toO !== undefined) el.style.opacity = String(toO);
      return null;
    }
    if (el.__morph && el.__morph.cancel) el.__morph.cancel();

    var t0 = null, raf = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var u = Math.min(1, (ts - t0) / dur);
      var pr = spring(u, opts.zeta, opts.omega);
      el.setAttribute('d', lerpPath(fromD, toD, pr));
      if (el.style && toO !== undefined) {
        el.style.opacity = String(fromO + (toO - fromO) * Math.min(1, u));
      }
      if (u >= 1) {
        el.setAttribute('d', toD);
        if (el.style && toO !== undefined) el.style.opacity = String(toO);
        el.__morph = null;
        return;
      }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    var h = {
      cancel: function () {
        if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
        el.__morph = null;
      }
    };
    el.__morph = h;
    return h;
  }

  /* 立即置为某图标（不播动画） */
  function set(svg, name) {
    if (!svg) return;
    var ic = ICONS[name];
    if (!ic || !svg.__paths || svg.__paths.length !== ic.p.length) return;
    for (var i = 0; i < svg.__paths.length; i++) {
      svg.__paths[i].setAttribute('d', ic.p[i].d);
      if (svg.__paths[i].style) svg.__paths[i].style.opacity = String(ic.p[i].o);
    }
    svg.setAttribute('data-morph', name);
  }

  /* 形变到某图标 */
  function to(svg, name, opts) {
    if (!svg) return;
    var ic = ICONS[name];
    if (!ic) return;
    var cur = svg.__paths || [];
    if (cur.length !== ic.p.length) { set(svg, name); return; }
    for (var i = 0; i < cur.length; i++) {
      animate(cur[i], cur[i].getAttribute('d'), ic.p[i].d, curOp(cur[i]), ic.p[i].o, opts);
    }
    svg.setAttribute('data-morph', name);
  }

  /* ---------- 给 <details> 的 summary 装上折叠箭头 ---------- */

  function decorateDetails(d) {
    if (!d || d.__morphChev) return;
    var s = (d.querySelector) ? d.querySelector('summary') : null;
    if (!s) return;
    var svg = mount(s, d.open ? 'chevD' : 'chevR');
    if (!svg) return;
    svg.setAttribute('class', 'morph-ico morph-chev');
    d.__morphChev = svg;
    d.addEventListener('toggle', function () {
      to(svg, d.open ? 'chevD' : 'chevR');
    });
  }

  function decorateAll() {
    if (typeof document === 'undefined' || !document.querySelectorAll) return;
    var ds = document.querySelectorAll('details'), i;
    for (i = 0; i < ds.length; i++) {
      /* 语言切换可能重写 summary 文本而抹掉 svg，这里检查并补回 */
      var ex = ds[i].__morphChev;
      if (ex && ex.parentNode) continue;
      ds[i].__morphChev = null;
      decorateDetails(ds[i]);
    }
  }

  function boot() {
    decorateAll();
    /* 语言切换后 summary 可能被重写，重新装饰一次 */
    if (window.I18N && window.I18N.onChange) {
      window.I18N.onChange(function () { decorateAll(); });
    }
  }

  var API = {
    parse: parsePath,
    compatible: compatible,
    lerp: lerpPath,
    spring: spring,
    num: num,
    mount: mount,
    set: set,
    to: to,
    decorateAll: decorateAll,
    reduceMotion: reduceMotion,
    ICONS: ICONS,
    PAIRS: PAIRS,
    ZETA: ZETA,
    OMEGA: OMEGA
  };

  if (typeof window !== 'undefined') {
    window.Morph = API;
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
      } else {
        boot();
      }
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
