// 开屏动画回归：六芒星魔法阵 + 雪花飘落 + 进度条 + 正式名称
// 运行：在 index.html 同级执行  node testscript/t_splash.js
//
// 分三部分：
//   A 静态校验 —— index.html 引用与加载顺序、i18n 键、CSS 关键类与反向旋转、
//                 正式名称是否真的出现在界面上、有没有残留旧名。
//   B 纯函数实跑 —— 六芒星几何（六个顶点必须恰好每 60° 一个，这是"六芒"的定义）、
//                   进度语义（单调不减、未就绪封顶 90%、就绪才到 100%）。
//   C mock DOM 实跑 —— 自建带 rAF 的最小 DOM 真跑 start() → skip()，
//                     断言覆盖层被真正移除、滚动被解锁。
//
// 为什么 C 必须跑：开屏层是全屏 z-index:9999。若关闭时没有从 DOM 摘掉，
// 整个页面会「看得见但点不动」，而且不报任何错——只有上手才发现。
const fs = require("fs");
const vm = require("vm");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("  FAIL " + m); } };

const R = fs.readFileSync("index.html", "utf8");
const SRC = fs.readFileSync("UI/ui_splash.js", "utf8");
const CSS = fs.readFileSync("style.css", "utf8");
const I18N = fs.readFileSync("Multilingual/i18n.js", "utf8");
const FULL = "Laevatain_sky's Cryptography Toolbox";

console.log("=== A. 静态校验 ===");

// A1 脚本被引用、文件存在、排在 Multilingual/i18n.js 之后（要用 I18N.t 取文案）
ok(R.indexOf('<script src="UI/ui_splash.js">') >= 0, "index.html 未引用 UI/ui_splash.js");
ok(fs.existsSync("UI/ui_splash.js"), "UI/ui_splash.js 不存在");
{
  const p = f => R.indexOf('<script src="' + f + '">');
  ok(p("Multilingual/i18n.js") >= 0 && p("Multilingual/i18n.js") < p("UI/ui_splash.js"), "UI/ui_splash.js 必须晚于 Multilingual/i18n.js 加载");
}

// A2 五个新键：都存在、八语言齐全、无空串
["app.full", "splash.init", "splash.ready", "splash.skip", "ver.fullname"].forEach(k => {
  const re = new RegExp("'" + k.replace(".", "\\.") + "':\\s*\\[([^\\]]*)\\]");
  const m = I18N.match(re);
  ok(!!m, "i18n 缺少键 " + k);
  if (!m) return;
  /* 按引号而非逗号切分：俄语等译文内部本身就带逗号，按逗号切会多数一段 */
  const items = m[1].match(/"[^"]*"|'[^']*'/g) || [];
  ok(items.length === 8, k + " 语言数应为 8，实为 " + items.length);
  ok(items.every(s => s.length > 2), k + " 存在空译文");
});

// A3 产品全称是专有名词：八种语言必须字节级一致（翻译了就与作者署名对不上）
{
  const m = I18N.match(/'app\.full':\s*\[([^\]]*)\]/);
  if (m) {
    const items = m[1].match(/"[^"]*"|'[^']*'/g) || [];
    const uniq = [...new Set(items)];
    ok(uniq.length === 1, "app.full 八语言不一致，出现了 " + uniq.length + " 种写法");
    ok(items[0].indexOf("Laevatain_sky") >= 0, "app.full 不含正式名称");
  }
}

// A4 CSS 关键类与动画
[".splash", ".splash-snow", ".splash-hex", ".splash-star", ".splash-core",
 ".splash-outer", ".splash-rune", ".splash-ticks", ".splash-rose",
 ".splash-bar-fill", ".splash-name"]
  .forEach(c => ok(CSS.indexOf(c) >= 0, "style.css 缺少 " + c));
ok(CSS.indexOf("@keyframes splash-spin-cw") >= 0, "缺少顺时针旋转关键帧 splash-spin-cw");
ok(CSS.indexOf("@keyframes splash-in-star") >= 0, "缺少入场关键帧 splash-in-star");

// A5 六芒星必须是「顺时针」：splash-spin-cw 的 to 必须是 +360deg。
//    SVG 的 y 轴向下，正角度才是顺时针；写成 -360 就变成逆时针，肉眼能看出方向不对。
{
  const i = CSS.indexOf("@keyframes splash-spin-cw");
  const seg = i >= 0 ? CSS.slice(i, i + 120) : "";
  ok(/rotate\(360deg\)/.test(seg) && !/rotate\(-360deg\)/.test(seg),
     "splash-spin-cw 不是顺时针（应为 rotate(360deg)）");
}
// A5b 主体六芒星 Core 必须挂顺时针动画，且界面上不再有两个独立三角
{
  const i = CSS.indexOf(".splash-core");
  const seg = i >= 0 ? CSS.slice(i, i + 260) : "";
  ok(/splash-spin-cw/.test(seg), "六芒星主体未使用顺时针旋转");
}
ok(CSS.indexOf(".splash-tri") < 0, "CSS 仍残留 splash-tri（六芒星不该是两个三角）");

// A6 减少动态效果时必须停掉持续旋转与过渡
ok(/prefers-reduced-motion[\s\S]{0,300}\.splash-outer,\s*\.splash-core[^{]*\{animation:splash-in-star/.test(CSS),
   "reduced-motion 下未关闭魔法阵持续旋转");

// A7 正式名称真的出现在界面上（顶栏副标题 + 版本卡片 + 免责声明）
ok(R.indexOf('id="appSub"') >= 0, "顶栏缺少 #appSub");
ok(R.indexOf(FULL) >= 0, "index.html 未出现正式名称");
ok(R.indexOf('id="verFullName"') >= 0, "版本卡片缺少 #verFullName");
ok(R.indexOf('data-i18n="ver.fullname"') >= 0, "版本卡片缺少 ver.fullname 标签");
{
  // 免责声明里也得用新名，否则法律文本与产品署名不一致
  const d = R.indexOf("免责声明");
  const seg = d >= 0 ? R.slice(d, d + 900) : "";
  ok(seg.indexOf(FULL) >= 0, "免责声明仍在使用旧名");
}

// A8 界面层不再展示旧产品名（CHANGELOG 与代码注释里的历史陈述不算）
ok(R.indexOf("Aegis") < 0, "index.html 仍残留 Aegis");

// A9 帧驱动兜底：原断言要求"缺 requestAnimationFrame 就完全不开屏"，
//    但那会让个别老 WebView 用户彻底看不到开屏。现在改为缺 rAF 时用定时器驱动，
//    既保证不缺席，又因 mock DOM 缺 createElementNS 而不会被套件拖慢。
ok(/function tick\(/.test(SRC) && /typeof requestAnimationFrame === ['"]function['"]/.test(SRC), "缺少 rAF 缺失时的定时器兜底");
ok(/function untick\(/.test(SRC), "缺少帧取消 untick");
ok(/createElementNS\s*!==\s*['"]function['"]/.test(SRC), "缺少 createElementNS 能力检测");
ok(/function safeStart/.test(SRC), "缺少 safeStart 异常保护");

// A10 关闭路径必须真的摘节点 + 解锁滚动
ok(/removeChild\(root\)/.test(SRC), "finish 未从 DOM 摘除覆盖层");
ok(/style\.overflow\s*=\s*['"]{2}/.test(SRC), "finish 未恢复 body 滚动");

console.log("=== B. 纯函数实跑 ===");
const S = require(require("path").resolve("UI/ui_splash.js"));

// B1 六芒星几何：12 个顶点连成一整个星形轮廓（不是两个三角）。
//    外顶点 6 个半径 R 每 60° 一个；内顶点 6 个半径 R/√3 插在中间。
{
  const R = 62, G = S.geom(100, 100, R);
  ok(Array.isArray(G) && G.length === 12, "geom 应返回 12 个顶点，实得 " + (G && G.length));
  // 外顶点（偶数下标）：半径 R，角度每 60°
  const outer = [], inner = [];
  G.forEach((p, i) => (i % 2 === 0 ? outer : inner).push(p));
  ok(outer.length === 6 && inner.length === 6, "外/内顶点数应为 6/6");
  const angs = outer.map(p => (Math.atan2(p[1] - 100, p[0] - 100) * 180 / Math.PI + 360) % 360)
                    .sort((a, b) => a - b);
  let bad = 0;
  for (let i = 1; i < angs.length; i++) if (Math.abs((angs[i] - angs[i - 1]) - 60) > 0.02) bad++;
  ok(bad === 0, "外顶点间隔不是 60°（不构成六芒星），偏差段数 " + bad);
  const ro = outer.map(p => Math.hypot(p[0] - 100, p[1] - 100));
  ok(ro.every(r => Math.abs(r - R) < 0.05), "外顶点半径不一致");
  // 内顶点半径必须是 R/√3。取 R/2 会画成一个偏瘦的星 —— 这是最容易随手写错的一处。
  const rIn = R / Math.sqrt(3);
  const ri = inner.map(p => Math.hypot(p[0] - 100, p[1] - 100));
  ok(ri.every(r => Math.abs(r - rIn) < 0.05),
     "内顶点半径应为 R/\u221a3=" + rIn.toFixed(2) + "，实得 " + ri[0].toFixed(2));
  // 正上方必须是外顶点（尖角朝上），否则整个星歪 30°
  ok(Math.abs(G[0][0] - 100) < 0.02 && G[0][1] < 100, "六芒星尖角未朝上");
}

// B2 starPath：单条闭合 path，12 个坐标点，不是两个三角
{
  const d = S.starPath(100, 100, 62);
  ok(/^M/.test(d) && /Z$/.test(d), "starPath 不是闭合 path");
  const n = (d.match(/[ML]/g) || []).length;
  ok(n === 12, "starPath 应有 12 个顶点，实得 " + n);
  // 必须只有一条 M —— 出现第二条就说明又拆成了两个三角
  ok((d.match(/M/g) || []).length === 1, "starPath 含多条子路径（退化成两个三角）");
}
// B2b 内接六边形：6 个顶点，半径同为 R/√3
{
  const d = S.hexPath(100, 100, 62);
  ok(/^M/.test(d) && /Z$/.test(d), "hexPath 不是闭合 path");
  ok((d.match(/[ML]/g) || []).length === 6, "hexPath 应有 6 个顶点");
}
// B2c 兼容旧断言：两个三角顶点仍在（仅供历史断言，绘制不走它）
{
  const T = S.triPoints(100, 100, 62);
  ok(T.length === 2 && T[0].length === 3, "triPoints 应返回两个三角");
  ok(/^M[\d.\-]+ [\d.\-]+L[\d.\-]+ [\d.\-]+L[\d.\-]+ [\d.\-]+Z$/.test(S.triPath(T[0])), "三角 path 格式非法");
  ok(S.triPath(T[0]) !== S.triPath(T[1]), "两个三角 path 不应相同");
}

/* B2d 雪花必须是「真实的六角枝晶」，不能是圆点。
   原来用 g.arc() 画白点，那不是雪花。这里用 mock 2d context 记录每一段描线，
   断言结构：6 条主枝每 60° 一条 + 侧枝与主枝成 ±60°（这正是雪花六角对称的来由）。
   不依赖真实 canvas —— jsdom 没装 node-canvas 时也能验。 */
{
  const segs = [];
  let cur = null;
  const mockCtx = {
    strokeStyle: "", lineWidth: 0, lineCap: "",
    clearRect() {}, beginPath() {}, closePath() {}, stroke() {},
    moveTo(x, y) { cur = [x, y]; },
    lineTo(x, y) { if (cur) segs.push([cur[0], cur[1], x, y]); cur = [x, y]; }
  };
  const mockCanvas = { width: 0, height: 0, getContext() { return mockCtx; } };
  const savedDoc = global.document;
  global.document = { createElement(tag) { return tag === "canvas" ? Object.assign({}, mockCanvas, { getContext: () => mockCtx }) : null; } };
  let cv = null;
  try { cv = S.renderFlake(0); } finally { global.document = savedDoc; }

  ok(!!cv, "renderFlake 未产出离屏画布");
  ok(segs.length >= 6, "雪花主枝不足 6 条，实得 " + segs.length);

  /* 从中心出发的线段才是主枝 */
  const C = 36, EPS = 1e-6;
  const main = segs.filter(s => Math.hypot(s[0] - C, s[1] - C) < 0.01);
  ok(main.length === 6, "主枝应为 6 条，实得 " + main.length);
  const angs = main.map(s => (Math.atan2(s[3] - C, s[2] - C) * 180 / Math.PI + 360) % 360).sort((a, b) => a - b);
  let bad = 0;
  for (let i = 1; i < angs.length; i++) if (Math.abs((angs[i] - angs[i - 1]) - 60) > 0.02) bad++;
  ok(bad === 0, "主枝不是每 60° 一条（六重对称不成立），偏差段数 " + bad);

  /* 侧枝：起点落在主枝上（排除中心晶核那几段，它们的方向本来就不是 60°），
     且方向相对该主枝偏 ±60° —— 冰晶六方晶格决定了每次分枝都是 60°。 */
  const ARM = 36 * 0.92;
  const side = segs.filter(s => {
    const r0 = Math.hypot(s[0] - C, s[1] - C);
    return r0 >= 0.2 * ARM && r0 <= ARM + 0.01;
  });
  ok(side.length >= 24, "侧枝太少，实得 " + side.length + "（少于 24 就不是枝晶）");
  let sideBad = 0;
  for (const sg of side) {
    const armAng = (Math.atan2(sg[1] - C, sg[0] - C) * 180 / Math.PI + 360) % 360;
    const dirAng = (Math.atan2(sg[3] - sg[1], sg[2] - sg[0]) * 180 / Math.PI + 360) % 360;
    let d = Math.abs(dirAng - armAng) % 360;
    if (d > 180) d = 360 - d;
    if (Math.abs(d - 60) > 0.5) sideBad++;
  }
  ok(sideBad === 0, "侧枝与主枝夹角应为 60°，偏差 " + sideBad + " / " + side.length + " 条");
}
/* B2e 四种形态都要能渲染，且彼此不同（否则"不同雪花"是假的） */
{
  const savedDoc = global.document;
  const counts = [];
  for (let v = 0; v < 4; v++) {
    const segs = []; let cur = null;
    const ctx = {
      clearRect() {}, beginPath() {}, closePath() {}, stroke() {},
      moveTo(x, y) { cur = [x, y]; }, lineTo(x, y) { if (cur) segs.push(1); cur = [x, y]; }
    };
    global.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
    try { S.renderFlake(v); } finally { global.document = savedDoc; }
    counts.push(segs.length);
  }
  ok(counts.every(c => c >= 6), "某种雪花形态渲染为空：" + counts.join(","));
  ok(new Set(counts).size >= 2, "四种形态描线数完全相同（形态差异是假的）：" + counts.join(","));
}

// B3 进度语义
{
  ok(S.nextProgress(0, 0, 2000, false) === 0, "起始进度应为 0");
  ok(Math.abs(S.nextProgress(0, 1000, 2000, true) - 0.5) < 1e-9, "半程应为 0.5");
  // 未就绪封顶 90%：不能出现"进度满了但算法表还没好"
  ok(S.nextProgress(0, 2000, 2000, false) === 0.9, "未就绪时不应到 100%");
  ok(S.nextProgress(0, 9999, 2000, false) === 0.9, "未就绪超时也应停在 90%");
  ok(S.nextProgress(0, 2000, 2000, true) === 1, "就绪后应到 100%");
  // 单调不减
  ok(S.nextProgress(0.8, 100, 2000, true) === 0.8, "进度回退了（非单调）");
  ok(S.nextProgress(-1, -500, 2000, true) === 0, "负进度未归零");
  // total=0 视为已完成，避免除零
  ok(S.nextProgress(0, 0, 0, true) === 1, "total=0 应直接完成");
}

// B4 雪花密度与远近分层。
//    用户反馈"不够密"：原公式 w*h/11000 在 400×800 手机视口只算出 29 片，
//    看不出在下雪。这条断言把"密度"钉成可度量的数，不再靠肉眼反复调。
{
  const nPhone = S.snowCount(400, 800);
  ok(nPhone >= 100, "400×800 视口雪花数应 ≥100，实得 " + nPhone);
  const nDesk = S.snowCount(1440, 900);
  ok(nDesk >= 300, "1440×900 视口雪花数应 ≥300，实得 " + nDesk);
  ok(S.snowCount(4000, 3000) <= 340, "超大视口应受 SNOW_MAX 封顶");
  // 三档分层：远景占多数且必须比近景小、比近景慢
  const far = S.flakeSpec(0.10), mid = S.flakeSpec(0.80), near = S.flakeSpec(0.99);
  ok(far.far === 1 && mid.far === 0 && near.far === 0, "远/中/近的 far 标记不对");
  ok(far.size < mid.size && mid.size < near.size, "三档尺寸应递增");
  ok(far.v < near.v, "远景应比近景下落慢");
  ok(far.a < near.a, "远景应比近景淡");
  // 远景必须够小才撑得起密度；近景必须够大才有纵深
  ok(far.size < 13, "远景雪花应 <13px，实得 " + far.size.toFixed(1));
  ok(near.size > 20, "近景雪花应 >20px，实得 " + near.size.toFixed(1));
}

console.log("=== C. mock DOM 实跑 ===");
{
  const nodes = [];
  const mkNode = (tag) => {
    const n = {
      tagName: tag, _children: [], style: {}, className: "", id: "",
      _attrs: {}, textContent: "",
      classList: { _s: {}, add(c) { this._s[c] = 1; }, remove(c) { delete this._s[c]; }, contains(c) { return !!this._s[c]; } },
      setAttribute(k, v) { this._attrs[k] = v; },
      getAttribute(k) { return this._attrs[k]; },
      addEventListener() {},
      appendChild(c) { this._children.push(c); c.parentNode = this; return c; },
      removeChild(c) { const i = this._children.indexOf(c); if (i >= 0) this._children.splice(i, 1); c.parentNode = null; return c; }
    };
    return n;
  };
  const body = mkNode("body");
  const timers = [];
  const flush = () => { const q = timers.splice(0); q.forEach(fn => { if (fn) fn(); }); };
  const sandbox = {
    console,
    document: {
      readyState: "complete",
      body: body,
      createElement: mkNode,
      createElementNS: (ns, t) => mkNode(t),
      getElementById: () => null,
      addEventListener() {}
    },
    requestAnimationFrame: () => 1,      /* 不真正驱动帧，手动 skip 即可 */
    cancelAnimationFrame: () => {},
    /* 定时器入队而不自动执行：让测试自己决定何时推进。
       若这里立即回调，start() 里的兜底定时器会在开屏创建的同一瞬间就把关掉，
       后面的断言全部失去意义。 */
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
    clearTimeout: (id) => { if (id) timers[id - 1] = null; },
    matchMedia: () => ({ matches: false }),
    Math, JSON, Date, window: null
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync("UI/ui_splash.js", "utf8"), sandbox);

  ok(typeof sandbox.Splash === "object", "mock 环境下 Splash 未挂到 window");
  sandbox.Splash.start();
  const splash = body._children.find(c => c.className === "splash");
  ok(!!splash, "start() 未创建覆盖层");
  ok(body.style.overflow === "hidden", "开屏时未锁定滚动");

  // 覆盖层内部结构：雪花 canvas + 整颗六芒星 + 魔法阵外环 + 进度条
  const flat = [];
  (function walk(n) { flat.push(n); (n._children || []).forEach(walk); })(splash);
  ok(flat.some(n => n.tagName === "canvas"), "缺少雪花 canvas 层");
  /* SVG 节点用的是 setAttribute('class', ...)，不落在 className 上 —— 两边都要认 */
  const cls = n => n.className || n._attrs.class || "";
  const stars = flat.filter(n => cls(n) === "splash-star");
  ok(stars.length === 1, "六芒星应只有一条星形 path，实为 " + stars.length);
  ok(stars.length === 1 && (stars[0]._attrs.d || "").match(/[ML]/g).length === 12,
     "六芒星 path 不是 12 顶点轮廓（又退化成两个三角了）");
  ok(flat.some(n => cls(n) === "splash-core"), "缺少魔法阵主体组 splash-core");
  ok(flat.some(n => cls(n) === "splash-outer"), "缺少魔法阵外环 splash-outer");
  const runes = flat.filter(n => cls(n) === "splash-rune");
  ok(runes.length === 6, "符文小星应为 6 颗，实为 " + runes.length);
  const ticks = flat.filter(n => n.tagName === "line");
  ok(ticks.length === 36, "外环刻度应为 36 条，实为 " + ticks.length);
  ok(flat.some(n => cls(n) === "splash-inner-hex"), "缺少内接六边形");
  ok(flat.some(n => cls(n) === "splash-rose"), "缺少中心核心圆");
  ok(flat.some(n => n.id === "splashBar"), "缺少进度条");
  ok(flat.some(n => n.id === "splashName"), "缺少正式名称文本");

  // 跳过：必须真正摘掉节点并解锁滚动（淡出是异步的，手动推进定时器）
  sandbox.Splash.skip();
  ok(sandbox.Splash._state().closed === true, "skip 后未标记关闭");
  flush();   // 触发淡出结束后的清理
  ok(body._children.indexOf(splash) < 0, "skip 后覆盖层仍留在 DOM 里（页面会点不动）");
  ok(body.style.overflow === "", "skip 后未解锁滚动");

  // 复位验证：再次 start 必须能重新开屏并再次关闭。
  // closed 是模块级状态，build() 不复位的第二次开屏会永远关不掉。
  sandbox.Splash.start();
  const splash2 = body._children.find(c => c.className === "splash");
  ok(!!splash2, "第二次 start() 未创建覆盖层（closed 未复位）");
  if (splash2) {
    sandbox.Splash.skip();
    flush();
    ok(body._children.indexOf(splash2) < 0, "第二次开屏关闭后仍留在 DOM 里");
  }
}

console.log("\n" + (fail ? "✗" : "✓") + " PASS " + pass + "  FAIL " + fail);
process.exit(fail ? 1 : 0);
