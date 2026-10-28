/* ui_splash.js —— 开屏动画：六芒星魔法阵 + 雪花飘落 + 进度条
 *
 * 设计要点（改动前请先读）：
 * 1. 零依赖、纯 DOM + Canvas。容器由本文件自建，index.html 只需 <script> 引一行。
 *    放在 body 末尾加载即可——此时同步脚本已跑完，ALGOS 通常已就绪。
 * 2. 每次启动都播（约 2s），点击/按键可跳过，2s 后自动淡出移除。
 *    不写 localStorage：本批选择是「每次启动都播」。
 * 3. 进度条不是纯装饰：它反映「算法表是否就绪」这一真实状态。
 *    未就绪时最多推进到 90%，就绪后才允许到 100%，随后才关闭。
 *    这样即使某次初始化慢，也不会出现「进度条已满但页面还没准备好」。
 * 4. 几何与进度做成不依赖 DOM 的纯函数（Splash.geom / Splash.nextProgress），
 *    测试可直接调用断言，不需要浏览器。
 * 5. 尊重系统「减少动态效果」：开启时不跑 rAF、不旋转、进度直跳 100%，
 *    并缩短到 600ms 后关闭。
 * 6. 关闭后必须真正从 DOM 移除并解锁滚动——残留的覆盖层会让整页点不动，
 *    这类 bug 不报错、只有上手才发现。
 */
(function () {
  'use strict';

  var DURATION = 2000;      /* 正常时长 */
  /* 减少动态效果时也别一闪而过：原来 600ms 太短，用户还没意识到就消失了，
     反馈是"开屏没触发"。延长到 1.1s 且照样画雪花，只是不做动画。 */
  var DURATION_REDUCED = 1100;
  var FADE = 320;           /* 淡出时长 */
  /* 雪花密度：SNOW_DENSITY 是"每片雪花摊到多少 px²"，越小越密。
     原来取 11000，手机上 400×800 只算出 29 片，稀得看不出在下雪。 */
  var SNOW_MAX = 340;       /* 雪花上限 */
  var SNOW_DENSITY = 2600;

  var el = null;            /* 覆盖层根元素 */
  var raf = 0;
  var timer = 0;
  var closed = false;
  var prev = 0;             /* 上一帧进度，保证单调不减 */
  var t0 = 0;
  var snow = null;          /* canvas 上下文与粒子 */
  var lastErr = '';         /* 上一次失败原因，供 _diag() 与界面提示 */

  function reduceMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

  function t(k, fb) {
    try { if (window.I18N && window.I18N.t) return window.I18N.t(k); } catch (e) {}
    return fb || k;
  }

  function appFull() {
    /* 产品全称是专有名词，八种语言同一串，不做翻译 */
    try { if (window.I18N && window.I18N.t) return window.I18N.t('app.full'); } catch (e) {}
    return "Laevatain_sky's Cryptography Toolbox";
  }

  /* ---------- 纯函数：六芒星几何 ---------- */

  /* 六芒星不是「两个三角形」，而是 12 个顶点连成的一整个星形轮廓：
       外顶点 6 个，半径 R，角度 -90 + 60i（尖角，正上方起）
       内顶点 6 个，半径 R/√3，角度 -90 + 30 + 60i（两三角的交点）
     内顶点半径取 R/√3 是正六芒星的准确值（Wolfram MathWorld: Hexagram，
     「穿过三角形交点的圆的半径」= R/√3 ≈ 0.577R）。取 R/2 会画成
     一个偏瘦的星，看着就"不对劲"。
     返回 12 个 [x,y]，外内交替。 */
  function geom(cx, cy, R) {
    if (cx === undefined) cx = 100;
    if (cy === undefined) cy = 100;
    if (R === undefined) R = 62;
    var rIn = R / SQRT3;
    var out = [];
    for (var i = 0; i < 12; i++) {
      var deg = -90 + i * 30;
      var a = deg * Math.PI / 180;
      var r = (i % 2 === 0) ? R : rIn;
      out.push([round(cx + r * Math.cos(a)), round(cy + r * Math.sin(a))]);
    }
    return out;
  }

  var SQRT3 = Math.sqrt(3);

  function round(x) { return Math.round(x * 100) / 100; }

  /* 12 点轮廓 → 单条闭合 path。一整条，不是两个三角各自成 path。 */
  function starPath(cx, cy, R) {
    var p = geom(cx, cy, R), d = '';
    for (var i = 0; i < p.length; i++) {
      d += (i === 0 ? 'M' : 'L') + p[i][0] + ' ' + p[i][1];
    }
    return d + 'Z';
  }

  /* 内接正六边形：六个内顶点连起来。魔法阵里它常作为内层边界。 */
  function hexPath(cx, cy, R) {
    var rIn = R / SQRT3, d = '';
    for (var i = 0; i < 6; i++) {
      var a = (-90 + 30 + i * 60) * Math.PI / 180;
      var x = round(cx + rIn * Math.cos(a)), y = round(cy + rIn * Math.sin(a));
      d += (i === 0 ? 'M' : 'L') + x + ' ' + y;
    }
    return d + 'Z';
  }

  /* 兼容旧测试：返回「向上三角 / 向下三角」两组顶点。
     仅供断言使用，绘制一律走 starPath —— 界面上不再出现两个独立三角。 */
  function triPoints(cx, cy, R) {
    function pt(deg) {
      var a = deg * Math.PI / 180;
      return [round(cx + R * Math.cos(a)), round(cy + R * Math.sin(a))];
    }
    return [[pt(-90), pt(30), pt(150)], [pt(90), pt(210), pt(330)]];
  }

  function triPath(pts) {
    return 'M' + pts[0][0] + ' ' + pts[0][1] +
           'L' + pts[1][0] + ' ' + pts[1][1] +
           'L' + pts[2][0] + ' ' + pts[2][1] + 'Z';
  }

  /* ---------- 纯函数：进度 ---------- */

  /* 单调不减；未就绪封顶 90%；时间到即为 1。 */
  function nextProgress(prevP, elapsed, total, ready) {
    var p = total > 0 ? elapsed / total : 1;
    if (p > 1) p = 1;
    if (p < 0) p = 0;
    if (!ready && p > 0.9) p = 0.9;
    if (p < prevP) p = prevP;
    return p;
  }

  function ready() {
    try { return typeof ALGOS !== 'undefined' && ALGOS && ALGOS.length > 0; } catch (e) { return false; }
  }

  /* ---------- 雪花：真实的六角分支晶体 ---------- */

  /* 原来是 g.arc() 画的圆点，那不是雪花，是"白点雨"。
     真实雪花是六重对称的枝晶：一条主枝 + 两侧对称分出的侧枝，
     侧枝与主枝固定成 60°（这就是雪花为什么都是六角形的物理原因）。
     这里按这个结构画：主枝 + 3 组侧枝 + 末端分叉。

     性能：每片直接描线要 ~18 条线段，90 片 × 60fps 太重。
     改为一次性预渲染 4 种形态到离屏 canvas，运行时只 drawImage + 旋转。 */
  var FLAKE_PX = 72;                 /* 离屏雪花画布边长 */
  var FLAKE_VARIANTS = 4;

  /* spark=true 时画"远景版"：六条粗主线 + 每枝中部一对粗短侧枝 + 中心亮点。
     为什么需要两套：精细枝晶的线宽约 1.6px（基于 72px 画布），缩到 5~6px
     显示时线宽只剩约 0.1px，远景的雪会整体"淡到消失"，密度提上去也白提。
     远景改用粗线六角星，缩到极小仍然成形，且一眼仍是六角雪晶。 */
  function renderFlake(variant, spark) {
    var cv;
    try { cv = document.createElement('canvas'); } catch (e) { return null; }
    if (!cv || typeof cv.getContext !== 'function') return null;
    cv.width = FLAKE_PX; cv.height = FLAKE_PX;
    var g = cv.getContext('2d');
    if (!g) return null;

    var c = FLAKE_PX / 2;
    var arm = c * 0.92;              /* 主枝长度 */
    /* 侧枝位置（占主枝比例）随形态变化，制造出不同雪花 */
    var joints = [0.30, 0.52, 0.74];
    var sideLen = [0.20, 0.16, 0.11][variant % 3];
    var tipFork = (variant % 2) === 0;

    g.clearRect(0, 0, FLAKE_PX, FLAKE_PX);
    g.strokeStyle = '#ffffff';
    g.lineWidth = Math.max(1, FLAKE_PX / 46);
    g.lineCap = 'round';

    if (spark) {
      g.lineWidth = Math.max(1.6, FLAKE_PX / 15);
      for (var k2 = 0; k2 < 6; k2++) {
        var a2 = (k2 * 60) * Math.PI / 180;
        var dx2 = Math.cos(a2), dy2 = Math.sin(a2);
        g.beginPath();
        g.moveTo(c, c);
        g.lineTo(c + dx2 * arm * 0.95, c + dy2 * arm * 0.95);
        g.stroke();
        var bx2 = c + dx2 * arm * 0.5, by2 = c + dy2 * arm * 0.5;
        var L2 = arm * 0.26;
        for (var s3 = -1; s3 <= 1; s3 += 2) {
          var ba2 = a2 + s3 * (60 * Math.PI / 180);
          g.beginPath();
          g.moveTo(bx2, by2);
          g.lineTo(bx2 + Math.cos(ba2) * L2, by2 + Math.sin(ba2) * L2);
          g.stroke();
        }
      }
      g.beginPath();
      g.arc(c, c, arm * 0.16, 0, Math.PI * 2);
      g.fillStyle = '#ffffff';
      g.fill();
      return cv;
    }

    for (var k = 0; k < 6; k++) {
      var a = (k * 60) * Math.PI / 180;
      var dx = Math.cos(a), dy = Math.sin(a);
      var ex = c + dx * arm, ey = c + dy * arm;
      g.beginPath();
      g.moveTo(c, c);
      g.lineTo(ex, ey);
      g.stroke();

      /* 侧枝：与主枝成 ±60° */
      for (var j = 0; j < joints.length; j++) {
        var f = joints[j];
        if (variant === 3 && j === 2) continue;   /* 形态 4 少一组，更像针状雪晶 */
        var bx = c + dx * arm * f, by = c + dy * arm * f;
        var L = arm * sideLen * (1 - f * 0.45);
        for (var s = -1; s <= 1; s += 2) {
          var ba = a + s * (60 * Math.PI / 180);
          g.beginPath();
          g.moveTo(bx, by);
          g.lineTo(bx + Math.cos(ba) * L, by + Math.sin(ba) * L);
          g.stroke();
        }
      }

      /* 末端 V 形分叉。夹角同样取 60°：真实雪晶的每次分枝都保持 60°，
         这由冰晶六方晶格的对称性决定，写成 55° 看着就"不像雪花"。 */
      if (tipFork) {
        for (var s2 = -1; s2 <= 1; s2 += 2) {
          var ta = a + s2 * (60 * Math.PI / 180);
          var tl = arm * 0.13;
          g.beginPath();
          g.moveTo(ex, ey);
          g.lineTo(ex + Math.cos(ta) * tl, ey + Math.sin(ta) * tl);
          g.stroke();
        }
      }
    }
    /* 中心小六边形，模拟雪晶核 */
    g.beginPath();
    for (var h = 0; h < 6; h++) {
      var ha = (h * 60) * Math.PI / 180;
      var hr = arm * 0.09;
      var hx = c + Math.cos(ha) * hr, hy = c + Math.sin(ha) * hr;
      if (h === 0) g.moveTo(hx, hy); else g.lineTo(hx, hy);
    }
    g.closePath();
    g.stroke();
    return cv;
  }

  /* 雪花数量：按面积给密度，再受 SNOW_MAX 封顶。抽成纯函数便于测试断言
     ——"不够密"这类观感问题，只有能算出具体片数才不会反复靠肉眼调。 */
  function snowCount(w, h) {
    return Math.max(70, Math.min(SNOW_MAX, Math.round(w * h / SNOW_DENSITY)));
  }

  /* 单个雪花的参数：按 q∈[0,1) 分成远/中/近三档。
     远景小、淡、慢且数量占多数（密度靠它们撑起来），近景大、亮、快（制造纵深）。
     三档混用同一套参数会糊成一片白。 */
  function flakeSpec(q) {
    var size, v, a, far;
    if (q < 0.70) {                       /* 远景 70% */
      far = 1; size = 5 + Math.random() * 7;   v = 7 + Math.random() * 14;
      a = 0.20 + Math.random() * 0.26;
    } else if (q < 0.93) {                /* 中景 23% */
      far = 0; size = 11 + Math.random() * 9;  v = 18 + Math.random() * 20;
      a = 0.42 + Math.random() * 0.26;
    } else {                              /* 近景 7% */
      far = 0; size = 21 + Math.random() * 15; v = 34 + Math.random() * 28;
      a = 0.68 + Math.random() * 0.27;
    }
    return { size: size, v: v, a: a, far: far };
  }

  function buildSnow(cv) {
    var dpr = 1;
    try { dpr = Math.min(window.devicePixelRatio || 1, 2); } catch (e) { dpr = 1; }
    var w = cv.clientWidth || window.innerWidth || 360;
    var h = cv.clientHeight || window.innerHeight || 640;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    if (typeof cv.getContext !== 'function') return null;
    var g = cv.getContext('2d');
    if (!g) return null;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* 预渲染 4 种雪花形态，近景一套精细枝晶 + 远景一套粗线六角星 */
    var tiles = [];
    var tilesFar = [];
    for (var v = 0; v < FLAKE_VARIANTS; v++) {
      var t = renderFlake(v, false);
      if (t) tiles.push(t);
      var tf = renderFlake(v, true);
      if (tf) tilesFar.push(tf);
    }
    /* 一张都渲染不出来（极端老 WebView / 隐私模式）时退回圆点，
       保证"有雪"而不是"一片空白"。 */
    if (!tiles.length) tiles = null;
    if (!tilesFar.length) tilesFar = null;

    var n = snowCount(w, h);
    var ps = [];
    for (var i = 0; i < n; i++) {
      var sp = flakeSpec(Math.random());
      var size = sp.size, v = sp.v, a = sp.a, far = sp.far;
      ps.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: size,                          /* 显示边长 px */
        v: v,                                /* 下落 px/s */
        drift: 3 + size * 0.28,              /* 横向漂移幅度 px */
        ph: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,    /* 初始朝向 */
        spin: (Math.random() - 0.5) * 0.5,   /* 自旋 rad/s，真实雪花翻滚很慢 */
        a: a,
        far: far,
        tile: Math.floor(Math.random() * FLAKE_VARIANTS)
      });
    }
    return { g: g, w: w, h: h, ps: ps, last: 0, tiles: tiles, tilesFar: tilesFar };
  }

  function drawSnow(s, dt, time) {
    var g = s.g, i, p;
    g.clearRect(0, 0, s.w, s.h);
    var tiles = s.tiles;
    for (i = 0; i < s.ps.length; i++) {
      p = s.ps[i];
      p.y += p.v * dt;
      if (p.y - p.size > s.h) { p.y = -p.size; p.x = Math.random() * s.w; }
      var x = p.x + Math.sin(time * 0.7 + p.ph) * p.drift;

      var pool = (p.far && s.tilesFar) ? s.tilesFar : tiles;
      if (!pool) {
        /* 兜底：圆点 */
        g.beginPath();
        g.arc(x, p.y, Math.max(0.8, p.size * 0.12), 0, Math.PI * 2);
        g.fillStyle = 'rgba(226,240,255,' + p.a.toFixed(3) + ')';
        g.fill();
        continue;
      }

      var img = pool[p.tile % pool.length];
      var sz = p.size;
      g.save();
      g.globalAlpha = p.a;
      g.translate(x, p.y);
      g.rotate(p.rot + time * p.spin);
      g.drawImage(img, -sz / 2, -sz / 2, sz, sz);
      g.restore();
    }
  }

  /* ---------- 构建 DOM ---------- */

  function build() {
    if (el) return el;
    lastErr = '';
    /* 状态复位：closed / prev / t0 是模块级的，上一次开屏关闭后不会自动清零。
       不复位的话，第二次调用 build+start 时 finish() 会在入口直接 return，
       覆盖层建出来却永远关不掉——页面看得见点不动，且不报任何错。 */
    closed = false; prev = 0; t0 = 0;

    var root = document.createElement('div');
    root.className = 'splash';
    root.id = 'splash';
    /* 关键定位写成内联样式，不依赖 style.css。
       原因：开屏层是 appendChild 到 body 末尾的，一旦 CSS 没生效（文件未加载、
       或老 WebView 不认 inset 简写而丢弃整条声明），它就只剩 position:fixed
       而无任何偏移，停在文档流最末尾——页面很长时用户只看得到顶部，
       表现正是"开屏没触发"。内联样式保证无论 CSS 成败都铺满视口。 */
    try {
      var rs = root.style;
      rs.position = 'fixed';
      rs.top = '0';
      rs.left = '0';
      rs.width = '100%';
      rs.height = '100%';
      rs.zIndex = '9999';
      rs.display = 'flex';
      rs.alignItems = 'center';
      rs.justifyContent = 'center';
      rs.overflow = 'hidden';
      rs.background = '#05070d';
    } catch (e) {}
    root.setAttribute('role', 'progressbar');
    root.setAttribute('aria-label', 'loading');
    root.setAttribute('aria-valuemin', '0');
    root.setAttribute('aria-valuemax', '100');
    root.setAttribute('aria-valuenow', '0');

    var cv = document.createElement('canvas');
    cv.className = 'splash-snow';
    cv.id = 'splashSnow';
    cv.setAttribute('aria-hidden', 'true');
    /* 同上：canvas 的定位也内联，避免 CSS 未生效时尺寸塌成 0 而看不到雪花 */
    try {
      var cs = cv.style;
      cs.position = 'absolute';
      cs.top = '0';
      cs.left = '0';
      cs.width = '100%';
      cs.height = '100%';
      cs.display = 'block';
    } catch (e) {}
    root.appendChild(cv);

    var stage = document.createElement('div');
    stage.className = 'splash-stage';

    /* 魔法阵：外环（刻度 + 符文小星）/ 内圈 / 中心六芒星 / 内接六边形 / 核心 */
    var svgns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgns, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    /* 关键坑：SVG 元素的 className 是只读的 SVGAnimatedString，
       `svg.className = 'x'` 在 Chrome / Safari / Firefox 上都会抛 TypeError。
       必须走 setAttribute('class', ...)。
       这条曾被 try/catch 静默吞掉，导致开屏层根本没建成、界面上完全无感。 */
    svg.setAttribute('class', 'splash-hex');
    svg.setAttribute('aria-hidden', 'true');

    /* 魔法阵是装饰：任何一步失败都不能拖垮开屏本体（名字 + 进度条）。 */
    try {
      function el2(tag, attrs, cls) {
        var n = document.createElementNS(svgns, tag);
        for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, String(attrs[k]));
        if (cls) n.setAttribute('class', cls);
        return n;
      }

      /* --- 外环：双圈 + 刻度 + 六个符文小星（缓慢反向，制造层次） --- */
      var outer = el2('g', {}, 'splash-outer');
      [95, 89].forEach(function (r, i) {
        outer.appendChild(el2('circle', { cx: 100, cy: 100, r: r }, 'splash-ring' + (i ? ' splash-ring-dash' : '')));
      });
      /* 两圈之间的刻度：36 条短线 */
      var ticks = el2('g', {}, 'splash-ticks');
      /* 循环变量不能叫 t：模块级已有 i18n 翻译函数 t()，var 提升会把整个
         build() 里的 t 遮蔽成数字，随后 t('splash.init') 直接抛
         "t is not a function"，整个开屏被降级成最小层。 */
      for (var ti = 0; ti < 36; ti++) {
        var ta = (ti * 10) * Math.PI / 180;
        var r0 = 89.5, r1 = 95;
        ticks.appendChild(el2('line', {
          x1: round(100 + Math.cos(ta) * r0), y1: round(100 + Math.sin(ta) * r0),
          x2: round(100 + Math.cos(ta) * r1), y2: round(100 + Math.sin(ta) * r1)
        }));
      }
      outer.appendChild(ticks);

      /* 六个符文小六芒星，坐在外环与内圈之间（所罗门魔法圆的常见布法） */
      var runes = el2('g', {}, 'splash-runes');
      for (var q = 0; q < 6; q++) {
        var qa = (-90 + q * 60) * Math.PI / 180;
        var rx = round(100 + Math.cos(qa) * 80), ry = round(100 + Math.sin(qa) * 80);
        var rg = el2('g', { transform: 'translate(' + rx + ' ' + ry + ')' }, 'splash-rune');
        rg.appendChild(el2('path', { d: starPath(0, 0, 8.5) }));
        runes.appendChild(rg);
      }
      outer.appendChild(runes);
      svg.appendChild(outer);

      /* --- 主体：顺时针旋转的六芒星 + 内圈 + 内接六边形 + 核心 --- */
      var core = el2('g', {}, 'splash-core');
      core.appendChild(el2('circle', { cx: 100, cy: 100, r: 70 }, 'splash-ring splash-ring-in'));
      core.appendChild(el2('path', { d: starPath(100, 100, 62) }, 'splash-star'));
      core.appendChild(el2('path', { d: hexPath(100, 100, 62) }, 'splash-inner-hex'));
      core.appendChild(el2('circle', { cx: 100, cy: 100, r: 13 }, 'splash-rose'));
      core.appendChild(el2('circle', { cx: 100, cy: 100, r: 5.5 }, 'splash-rose-dot'));
      svg.appendChild(core);

      stage.appendChild(svg);
    } catch (e) { lastErr = 'svg: ' + (e && e.message || e); }

    var name = document.createElement('div');
    name.className = 'splash-name';
    name.id = 'splashName';
    name.textContent = appFull();
    stage.appendChild(name);

    var bar = document.createElement('div');
    bar.className = 'splash-bar';
    var fill = document.createElement('i');
    fill.className = 'splash-bar-fill';
    fill.id = 'splashBar';
    bar.appendChild(fill);
    stage.appendChild(bar);

    var stat = document.createElement('div');
    stat.className = 'splash-stat';
    var stxt = document.createElement('span');
    stxt.className = 'splash-stat-t';
    stxt.id = 'splashStat';
    stxt.textContent = t('splash.init', '正在初始化算法表…');
    var spct = document.createElement('b');
    spct.className = 'splash-pct';
    spct.id = 'splashPct';
    spct.textContent = '0%';
    stat.appendChild(stxt);
    stat.appendChild(spct);
    stage.appendChild(stat);

    var hint = document.createElement('div');
    hint.className = 'splash-hint';
    hint.id = 'splashHint';
    hint.textContent = t('splash.skip', '点击跳过');
    stage.appendChild(hint);

    root.appendChild(stage);
    document.body.appendChild(root);

    el = {
      root: root, cv: cv, fill: fill, pct: spct, stat: stxt, hint: hint,
      dur: reduceMotion() ? DURATION_REDUCED : DURATION
    };
    return el;
  }

  /* ---------- 生命周期 ---------- */

  function setProgress(p) {
    prev = p;
    var v = Math.round(p * 100);
    if (el.fill) el.fill.style.width = (v.toFixed(1)) + '%';
    if (el.pct) el.pct.textContent = v + '%';
    if (el.root) el.root.setAttribute('aria-valuenow', String(v));
  }

  function frame(now) {
    if (closed || !el) return;
    if (!t0) t0 = now;
    var elapsed = now - t0;

    if (snow) {
      var dt = snow.last ? Math.min((now - snow.last) / 1000, 0.05) : 0.016;
      snow.last = now;
      drawSnow(snow, dt, elapsed / 1000);
    }

    var p = nextProgress(prev, elapsed, el.dur, ready());
    setProgress(p);

    if (p >= 1) { finish(); return; }
    raf = tick(frame);
  }

  function finish() {
    if (closed) return;
    closed = true;
    if (raf) { untick(raf); raf = 0; }
    if (timer) { clearTimeout(timer); timer = 0; }
    if (prev < 1) setProgress(1);
    var root = el && el.root;
    if (!root) return;

    try {
      if (el.stat) el.stat.textContent = t('splash.ready', '就绪');
    } catch (e) {}

    var kill = function () {
      if (root && root.parentNode) root.parentNode.removeChild(root);
      try { document.body.style.overflow = ''; } catch (e) {}
      snow = null;
      el = null;
    };
    if (reduceMotion()) { kill(); return; }
    root.classList.add('splash-out');
    setTimeout(kill, FADE);
  }

  function onSkip() { if (!closed) finish(); }

  /* 能力检测：只保留真正必需的能力。
     判据刻意选 createElementNS —— 测试用的 mock DOM 没有它，因此不会在套件里
     留下定时器拖慢回归；而真实浏览器/微信 WebView 一定有。
     注：原来这里还硬性要求 requestAnimationFrame。缺 rAF 就该完全不开屏的判断
     过于武断——个别老 WebView 未必暴露它，结果用户完全看不到开屏。
     现在改为缺 rAF 时用 setTimeout 驱动（见 tick()），宁可慢一点也不缺席。 */
  function capable() {
    try {
      if (typeof document === 'undefined' || !document.body) return false;
      if (typeof document.body.appendChild !== 'function') return false;
      if (typeof document.createElement !== 'function') return false;
      if (typeof document.createElementNS !== 'function') return false;
      if (window.__SPLASH_NO_AUTOSTART) return false;
      return true;
    } catch (e) { return false; }
  }

  /* rAF 缺失时的兜底驱动：用定时器模拟 ~16ms 一帧 */
  function tick(fn) {
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(fn);
    return setTimeout(function () { fn(Date.now()); }, 32);
  }
  function untick(id) {
    if (!id) return;
    if (typeof cancelAnimationFrame === 'function') { try { cancelAnimationFrame(id); } catch (e) {} }
    clearTimeout(id);
  }

  /* 最小核心层：只含名字与进度条，不碰 canvas 与 SVG。
     当 build() 因任何原因失败时兜底——开屏是"有没有"的问题，
     不是"好不好看"的问题，宁可朴素也必须出现。 */
  function buildMinimal() {
    var root = document.createElement('div');
    root.id = 'splash';
    root.className = 'splash splash-minimal';
    var rs = root.style;
    rs.position = 'fixed'; rs.top = '0'; rs.left = '0';
    rs.width = '100%'; rs.height = '100%';
    rs.zIndex = '9999'; rs.display = 'flex';
    rs.alignItems = 'center'; rs.justifyContent = 'center';
    rs.background = '#05070d'; rs.color = '#e2f0ff';
    var box = document.createElement('div');
    box.style.textAlign = 'center';
    var nm = document.createElement('div');
    nm.id = 'splashName';
    nm.textContent = appFull();
    nm.style.fontSize = '18px';
    var st = document.createElement('div');
    st.id = 'splashStat';
    st.textContent = t('splash.init', '正在初始化算法表…');
    st.style.marginTop = '10px'; st.style.opacity = '0.75';
    box.appendChild(nm); box.appendChild(st);
    root.appendChild(box);
    root.addEventListener('click', function () { if (root.parentNode) root.parentNode.removeChild(root); }, false);
    document.body.appendChild(root);
    el = { root: root, cv: null, fill: null, pct: null, stat: st, hint: null, dur: DURATION };
    return el;
  }

  function start() {
    if (!capable()) return;
    try {
      build();
    } catch (e) {
      /* 不再静默吞掉：记录原因，再退到最小核心层保证开屏一定出现 */
      lastErr = 'build: ' + (e && e.message || e);
      try { console.error('[splash] build 失败，已降级：', lastErr); } catch (e2) {}
      try { buildMinimal(); } catch (e3) { lastErr += ' | minimal: ' + (e3 && e3.message || e3); return; }
    }
    try { document.body.style.overflow = 'hidden'; } catch (e) {}

    /* 语言切换后重刷文案（开屏只在启动时可见，但保持一致性） */
    try {
      if (window.I18N && window.I18N.onChange) {
        window.I18N.onChange(function () {
          if (!el) return;
          if (el.root && el.root.id) {
            var n = document.getElementById('splashName');
            if (n) n.textContent = appFull();
          }
          var h = document.getElementById('splashHint');
          if (h) h.textContent = t('splash.skip', '点击跳过');
          var s = document.getElementById('splashStat');
          if (s && !closed) s.textContent = t('splash.init', '正在初始化算法表…');
        });
      }
    } catch (e) {}

    /* 雪花与跳过绑定对所有模式都生效 —— 原来减少动态效果时直接 return，
       既没有雪花、又只有 600ms，用户反馈就是"根本没看到开屏"。 */
    /* 雪花同样是装饰：canvas 上下文拿不到（隐私模式、老 WebView）时不能连累本体 */
    try {
      snow = (el && el.cv) ? buildSnow(el.cv) : null;
      if (snow) drawSnow(snow, 0.016, 0);
    } catch (e) { snow = null; lastErr = lastErr || ('snow: ' + (e && e.message || e)); }

    el.root.addEventListener('click', onSkip, false);
    try {
      window.addEventListener('keydown', onSkip, false);
    } catch (e) {}

    if (reduceMotion()) {
      /* 不跑动画循环、三角不旋转，但仍要看得见：进度直达 100%，
         按缩短后的时长关闭（1.1s），避免出现"完全没看到"的错觉。 */
      setProgress(1);
      timer = setTimeout(finish, DURATION_REDUCED);
      return;
    }

    /* 兜底：即使 rAF 不跑（后台标签页）也必须关掉，否则整页被盖住 */
    timer = setTimeout(finish, el.dur + 1200);

    raf = tick(frame);
  }

  /* 对外只暴露被保护过的入口：任何异常都不允许冒泡到页面，
     更不允许留下一个盖住整页却关不掉的覆盖层。 */
  function safeStart() {
    try { start(); } catch (e) {
      try { if (el && el.root && el.root.parentNode) el.root.parentNode.removeChild(el.root); } catch (e2) {}
      try { document.body.style.overflow = ''; } catch (e3) {}
      el = null; closed = true;
    }
  }

  var API = {
    start: safeStart,
    skip: onSkip,
    geom: geom,
    starPath: starPath,
    hexPath: hexPath,
    triPoints: triPoints,
    triPath: triPath,
    renderFlake: renderFlake,
    nextProgress: nextProgress,
    /* 测试用：不经过 DOM 直接验几何与进度语义 */
    _state: function () { return { closed: closed, prev: prev }; },
    /* 诊断：上一次失败原因与当前是否已挂载，界面可据此给出可见提示 */
    /* 测试用：雪花密度与分层参数，纯函数 */
    snowCount: snowCount,
    flakeSpec: flakeSpec,
    /* 诊断：上一次失败原因与当前是否已挂载，界面可据此给出可见提示 */
    _diag: function () {
      return {
        ok: !!(el && el.root && el.root.parentNode),
        err: lastErr || '',
        capable: (typeof capable === 'function') ? capable() : false,
        minimal: !!(el && el.root && /splash-minimal/.test(el.root.className || ''))
      };
    }
  };

  if (typeof window !== 'undefined') window.Splash = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;

  try {
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', safeStart, false);
      } else {
        safeStart();
      }
    }
  } catch (e) {}
})();
