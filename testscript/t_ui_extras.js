// 界面层组件回归：Toast / 左侧边栏 / 八国语言 / Tooltip
// 运行：在 index.html 同级执行  node testscript/t_ui_extras.js
//
// 分两部分：
//   A 静态校验 —— 直接读 index.html：脚本引用齐全、i18n 键名都能在语言包里找到、
//                 侧边栏导航的锚点 id 真实存在、没有重复 id。
//   B 逻辑实跑 —— 用最小 mock DOM 把四个脚本真跑一遍：切语言、弹 Toast、开合侧边栏、
//                 显示/隐藏 Tooltip，断言行为而不只是"没抛异常"。
//
// 这里刻意不用任何浏览器：本包要求零外部依赖，测试也该能离线跑。
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("  FAIL " + m); } };

const R = fs.readFileSync("index.html", "utf8");
console.log("=== A. 静态校验 ===");

// A1 四个新脚本都被 index.html 引用，且文件真实存在
["Multilingual/i18n.js", "UI/ui_toast.js", "UI/ui_sidebar.js", "UI/ui_tooltip.js"].forEach(f => {
  ok(R.indexOf('<script src="' + f + '">') >= 0, "index.html 未引用 " + f);
  ok(fs.existsSync(f), f + " 文件不存在");
});

// A2 加载顺序：i18n 必须排在最前（sidebar 依赖 I18N.LANGS）
const pos = f => R.indexOf('<script src="' + f + '">');
ok(pos("Multilingual/i18n.js") < pos("UI/ui_sidebar.js"), "Multilingual/i18n.js 必须早于 UI/ui_sidebar.js 加载");

// A2b 侧边栏打开按钮的占位容器：必须预埋在顶栏里，且排在矢量图标之前。
// 缺了它 UI/ui_sidebar.js 会静默退回「左侧悬浮竖条」，用户要的顶栏三杠就白做了。
ok(R.indexOf('id="sideFabHost"') >= 0, "index.html 缺少 #sideFabHost 占位容器");
{
  const iHost = R.indexOf('id="sideFabHost"');
  const iTop = R.indexOf('<header class="topbar">');
  const iIcon = R.indexOf('class="app-icon"');
  ok(iTop >= 0 && iHost > iTop && iHost < iIcon,
    "#sideFabHost 必须位于 .topbar 内且排在 .app-icon 之前");
}
{
  const css = fs.existsSync("style.css") ? fs.readFileSync("style.css", "utf8") : "";
  ok(css.indexOf(".side-fab--inbar") >= 0, "style.css 缺少 .side-fab--inbar 样式");
  ok(css.indexOf(".side-fab-host") >= 0, "style.css 缺少 .side-fab-host 样式");
}
ok(fs.readFileSync("UI/ui_sidebar.js", "utf8").indexOf("getElementById('sideFabHost')") >= 0,
  "UI/ui_sidebar.js 未查找 #sideFabHost（会退回 body 悬浮）");

// A3 把语言包真正求值出来（而不是正则猜），后续断言都以它为据
const i18nSrc = fs.readFileSync("Multilingual/i18n.js", "utf8");
function loadPack() {
  const start = i18nSrc.indexOf("var T = {");
  if (start < 0) throw new Error("Multilingual/i18n.js 里找不到 var T = {");
  const end = i18nSrc.indexOf("\n  };", start);
  const body = i18nSrc.slice(start + "var T = ".length, end + 4);
  return vm.runInNewContext("(" + body + ")");
}
const PACK = loadPack();
const PACK_KEYS = Object.keys(PACK);
ok(PACK_KEYS.length >= 40, "语言包条目过少（" + PACK_KEYS.length + "），疑似解析失败");

const keysUsed = new Set();
for (const m of R.matchAll(/data-i18n(?:-tip|-ph|-title)?="([^"]+)"/g)) keysUsed.add(m[1]);
ok(keysUsed.size > 0, "index.html 里没有任何 i18n 标记");
const missing = [...keysUsed].filter(k => !(k in PACK));
ok(missing.length === 0, "语言包缺少这些键：" + missing.join(", "));

// A4 每个键都必须是长度 8 的数组，且每一项都是非空字符串
const langCount = 8;
let badLen = [], badItem = [];
for (const k of PACK_KEYS) {
  const row = PACK[k];
  if (!Array.isArray(row) || row.length !== langCount) badLen.push(k + "(" + (row && row.length) + ")");
  else row.forEach((v, i) => { if (typeof v !== "string" || !v) badItem.push(k + "[" + i + "]"); });
}
ok(badLen.length === 0, "这些键的译文数量不等于 " + langCount + "：" + badLen.join(", "));
ok(badItem.length === 0, "这些译文为空：" + badItem.join(", "));

// A5 侧边栏导航的锚点 id 必须在页面里真实存在
const anchors = ["verCard", "docFormat", "docUsage", "docDisclaimer", "algo"];
anchors.forEach(id => ok(R.indexOf('id="' + id + '"') >= 0, "侧边栏锚点 " + id + " 在页面里不存在"));
ok(R.indexOf('id="docFormat"') >= 0 && R.indexOf('id="docUsage"') >= 0, "两个 <details> 说明块缺少导航 id");

// A6 没有重复 id（重复会让 getElementById 只拿到第一个）
const ids = [...R.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
ok(dup.length === 0, "存在重复 id：" + [...new Set(dup)].join(", "));

// A7 动态管理的标签：默认文案可翻译，但改写时必须「上锁」
//    第 125 批之前是「一律不许挂 data-i18n」，代价是默认态永远中文。
//    现在允许挂，但必须由 _setDynLabel 改写并置 data-i18n-off，
//    否则切语言会把「密钥（任意字符串，SHA-256 派生 32 字节）」冲成泛泛的「密钥」。
const dyn = ["keyLabel", "paramLabel", "kdfIterLabel", "key2Label"];
const logicSrc = fs.readFileSync("Encryption_and_decryption_logic.js", "utf8");
dyn.forEach(id => {
  ok(new RegExp("_setDynLabel\\(els\\." + id + "\\b").test(logicSrc),
     id + " 必须由 _setDynLabel 改写（否则算法专属文案会被通用翻译冲掉）");
});
// 上锁要真的生效：apply 必须跳过 data-i18n-off

ok(/data-i18n-off/.test(i18nSrc) && /getAttribute\(.data-i18n-off.\)/.test(i18nSrc),
   "i18n.apply 必须跳过带 data-i18n-off 的元素，否则上锁形同虚设");

// A8 style.css 里包含三个组件的样式类
const css = fs.existsSync("style.css") ? fs.readFileSync("style.css", "utf8") : "";
[".toast-box", ".sidebar", ".tooltip", ".side-fab", ".lang-grid"].forEach(c =>
  ok(css.indexOf(c) >= 0, "style.css 缺少样式 " + c));

console.log("=== B. Mock DOM 实跑 ===");

/* ---------- 最小 DOM ---------- */
function mkEl(tag) {
  const el = {
    tagName: (tag || "div").toUpperCase(),
    _attrs: {}, children: [], parentNode: null,
    _text: "", _cls: new Set(), style: {},
    offsetWidth: 60, offsetHeight: 20,
    addEventListener(t, fn) { (this._ev = this._ev || {})[t] = fn; },
    appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parentNode = null; return c; },
    setAttribute(k, v) { this._attrs[k] = String(v); if (k === "id") doc._byId[String(v)] = this; },
    getAttribute(k) { return k in this._attrs ? this._attrs[k] : null; },
    removeAttribute(k) { delete this._attrs[k]; },
    getBoundingClientRect() { return { left: 10, top: 100, width: 80, height: 20, right: 90, bottom: 120 }; },
    get firstChild() { return this.children[0] || null; },
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); this.children = []; },
    set innerHTML(v) { if (v === "") this.children = []; },
    get innerHTML() { return ""; },
    scrollIntoView() { this._scrolled = true; },
    querySelectorAll(sel) { return doc.querySelectorAll(sel, this); }
  };
  el.classList = {
    add: (...c) => c.forEach(x => el._cls.add(x)),
    remove: (...c) => c.forEach(x => el._cls.delete(x)),
    contains: c => el._cls.has(c),
    toggle: c => el._cls.has(c) ? el._cls.delete(c) : el._cls.add(c)
  };
  Object.defineProperty(el, "className", {
    get() { return [...el._cls].join(" "); },
    set(v) { el._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  });
  // 组件用 el.id = 'xxx' 而非 setAttribute，这里必须同步进 _byId，
  // 否则 getElementById 永远拿不到自建节点（本脚本第一版就栽在这）。
  Object.defineProperty(el, "id", {
    get() { return el._attrs.id || ""; },
    set(v) { el._attrs.id = String(v); doc._byId[String(v)] = el; }
  });
  return el;
}

const all = [];
const doc = {
  readyState: "complete",
  documentElement: mkEl("html"),
  _byId: {},
  createElement(tag) { const e = mkEl(tag); all.push(e); return e; },
  getElementById(id) { return this._byId[id] || null; },
  addEventListener(t, fn) { (this._ev = this._ev || {})[t] = fn; },
  querySelectorAll(sel, scope) {
    const pool = scope ? collect(scope) : all;
    // 注意 [\w-] 必须含数字：data-i18n 里有 1 和 8。
    // 第一版写成 [a-zA-Z-]+，正则恒不匹配，所有走 querySelectorAll 的断言
    // 都变成"没找到"而假通过——本脚本自己踩的坑，勿改回。
    const m = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(sel);
    if (!m) return [];
    return pool.filter(e => e._attrs[m[1]] !== undefined && (m[2] === undefined || e._attrs[m[1]] === m[2]));
  }
};
function collect(node, out = []) { for (const c of node.children) { out.push(c); collect(c, out); } return out; }
doc.body = mkEl("body");
all.push(doc.body, doc.documentElement);

const store = {};
const win = {
  document: doc,
  innerWidth: 390, innerHeight: 800,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); }
  },
  matchMedia: () => ({ matches: false }),
  addEventListener() {}, removeEventListener() {},
  navigator: { maxTouchPoints: 0 },
  MutationObserver: function (fn) { this.observe = () => {}; this.disconnect = () => {}; },
  setTimeout: (f, ms) => setTimeout(f, 0), clearTimeout: clearTimeout,
  console
};
win.window = win;

// B0 先自检 mock 本身：属性选择器必须真能命中，否则后面全是假通过
{
  const probe = doc.createElement("span");
  probe.setAttribute("data-i18n", "app.name");
  doc.body.appendChild(probe);
  const hit = doc.body.querySelectorAll("[data-i18n]");
  ok(hit.length > 0, "mock DOM 的属性选择器失效（后续断言会假通过）：命中 " + hit.length);
}

const ctx = vm.createContext(win);

// 预埋顶栏占位容器，模拟真实 index.html：验证按钮真的被塞进顶栏而不是退回 body 悬浮
const fabHost = doc.createElement("button");
fabHost.setAttribute("id", "sideFabHost");
doc.body.appendChild(fabHost);

["Multilingual/i18n.js", "UI/ui_toast.js", "UI/ui_sidebar.js", "UI/ui_tooltip.js"].forEach(f => {
  vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
});

const I18N = win.I18N, Toast = win.Toast, Sidebar = win.Sidebar, Tooltip = win.Tooltip;
ok(!!I18N && !!Toast && !!Sidebar && !!Tooltip, "四个组件未全部挂到 window 上");

// B1 语言列表：八种，代码互不相同
ok(I18N.LANGS.length === 8, "语言数量应为 8，实为 " + I18N.LANGS.length);
ok(new Set(I18N.LANGS.map(l => l.code)).size === 8, "语言代码有重复");

// B2 每种语言的每个键都能取到非空、且不等于键名（未命中会原样返回键名）
let emptyKeys = [];
for (const L of I18N.LANGS) {
  I18N.set(L.code);
  for (const k of keysUsed) {
    const v = I18N.t(k);
    if (!v || v === k) emptyKeys.push(L.code + ":" + k);
  }
}
ok(emptyKeys.length === 0, "这些语言/键取不到译文：" + emptyKeys.slice(0, 8).join(", "));

// B3 切换语言真的改文案：中文 -> 英文，按钮文字必须变
I18N.set("zh-CN");
const zhEnc = I18N.t("btn.enc");
I18N.set("en");
const enEnc = I18N.t("btn.enc");
ok(zhEnc === "加密", "中文 btn.enc 应为「加密」，实为 " + zhEnc);
ok(enEnc === "Encrypt", "英文 btn.enc 应为「Encrypt」，实为 " + enEnc);
ok(zhEnc !== enEnc, "切语言后文案没有变化");

// B4 八种语言的「加密」各不相同（防止复制粘贴时忘了改）
const encs = I18N.LANGS.map(L => { I18N.set(L.code); return I18N.t("btn.enc"); });
// 简体/繁体的「加密」本就同形，属正常；其余 6 种必须互不相同
const nonCjk = encs.slice(2);
ok(new Set(nonCjk).size === 6, "六种非中文语言的「加密」译文有重复：" + nonCjk.join("/"));
// 顺带确认：确实翻译了（不是把中文原样贴 8 遍）
ok(encs.filter(x => x === "加密").length === 2, "「加密」应只在简繁中文出现，实为 " + encs.join("/"));

// B5 未收录的键必须回退成键名本身，绝不能是 undefined
I18N.set("zh-CN");
ok(I18N.t("not.exist.key") === "not.exist.key", "未知键应原样返回，避免渲染 undefined");

// B6 非法语言代码不生效
I18N.set("en");
ok(I18N.set("xx-YY") === false, "非法语言代码应被拒绝");
ok(I18N.get() === "en", "非法语言代码不应改变当前语言");

// B7 语言选择要持久化（localStorage）
I18N.set("ja");
ok(store.CRYPTO_TOOLBOX_LANG === "ja", "语言未写入 localStorage");
ok(I18N.t("btn.dec") === "復号", "日文 btn.dec 应为「復号」，实为 " + I18N.t("btn.dec"));

// B8 Toast：能弹出、装进容器、内容为纯文本
I18N.set("zh-CN");
const h1 = Toast.show("测试提示", "ok");
ok(!!h1, "Toast.show 未返回句柄");
const box = doc.getElementById("toastBox");
ok(!!box, "Toast 容器未创建");
ok(box.children.length === 1, "Toast 应弹 1 条，实为 " + box.children.length);
ok(box.children[0].children.some(c => c.textContent === "测试提示"), "Toast 文本未写入");

// B9 Toast 堆叠上限 3 条
Toast.show("a", "info"); Toast.show("b", "info"); Toast.show("c", "info");
ok(box.children.length === 3, "Toast 堆叠应封顶 3 条，实为 " + box.children.length);

// B10 空消息不弹
const before = box.children.length;
ok(Toast.show("", "info") === null, "空消息不应弹 Toast");
ok(box.children.length === before, "空消息不应改变堆叠数");

// B11 侧边栏：DOM 建出来了，含语言按钮与导航项
const bar = doc.getElementById("sidebar");
ok(!!bar, "侧边栏节点未创建");
const grid = doc.getElementById("langGrid");
ok(!!grid && grid.children.length === 8, "语言网格应为 8 个按钮，实为 " + (grid && grid.children.length));
const nav = doc.getElementById("sideNav");
ok(!!nav && nav.children.length >= 5, "导航项应 ≥5 个，实为 " + (nav && nav.children.length));

// B12 开合：open 加 sidebar--on，close 去掉
Sidebar.open();
ok(bar.classList.contains("sidebar--on"), "open() 后侧边栏未展开");
Sidebar.close();
ok(!bar.classList.contains("sidebar--on"), "close() 后侧边栏未收起");

// B12b 打开按钮必须落在顶栏占位容器里，并带顶栏专用样式类
const fabEl = doc.getElementById("sideFab");
ok(!!fabEl, "未创建 #sideFab 打开按钮");
ok(fabEl && fabEl.parentNode === fabHost,
  "侧边栏按钮没有塞进 #sideFabHost（会退回 body 左侧悬浮竖条）");
ok(fabEl && fabEl.classList.contains("side-fab--inbar"),
  "顶栏内的按钮缺少 side-fab--inbar 类（会套用悬浮竖条样式）");

// B13 语言按钮点击后：切语言 + 自动收起
Sidebar.open();
const koBtn = grid.children.find(b => b.getAttribute("data-lang") === "ko");
ok(!!koBtn, "找不到韩语按钮");
koBtn._ev.click();
ok(I18N.get() === "ko", "点击语言按钮后未切换语言");
ok(!bar.classList.contains("sidebar--on"), "选完语言后侧边栏未自动收起");
ok(I18N.t("btn.enc") === "암호화", "韩语 btn.enc 应为「암호화」，实为 " + I18N.t("btn.enc"));

// B14 当前语言要高亮
ok(grid.children.some(b => b.getAttribute("data-lang") === "ko" && b.classList.contains("lang-btn--on")),
   "当前语言按钮未高亮");

// B15 Tooltip：显示后带上 tooltip--on，内容正确，隐藏后移除
const target = mkEl("label");
target.setAttribute("data-tip", "气泡内容");
doc.body.appendChild(target);
Tooltip.show(target);
const tipEl = doc.getElementById("tooltip");
ok(!!tipEl, "Tooltip 节点未创建");
ok(tipEl.textContent === "气泡内容", "Tooltip 内容不对：" + tipEl.textContent);
ok(tipEl.classList.contains("tooltip--on"), "Tooltip 未标记为显示");
Tooltip.hide();
ok(!tipEl.classList.contains("tooltip--on"), "Tooltip 未隐藏");

// B16 Tooltip 定位不溢出视口
Tooltip.show(target);
const left = parseFloat(tipEl.style.left);
ok(left >= 0 && left + tipEl.offsetWidth <= win.innerWidth, "Tooltip 横向溢出视口：left=" + left);
Tooltip.hide();

// B17 I18N.apply 会把 data-i18n 元素的文本换成当前语言
I18N.set("en");
const lbl = mkEl("label");
lbl.setAttribute("data-i18n", "label.algo");
lbl.textContent = "算法";
doc.body.appendChild(lbl);
I18N.apply(doc.body);
ok(lbl.textContent === "Algorithm", "apply() 后 label.algo 应为 Algorithm，实为 " + lbl.textContent);

// B18 html lang 属性跟着切换
I18N.set("fr");
ok(doc.documentElement.lang === "fr", "html lang 未跟随切换，实为 " + doc.documentElement.lang);
I18N.set("zh-CN");

console.log("\nUI 组件测试: 通过 " + pass + "  失败 " + fail);
process.exit(fail ? 1 : 0);
