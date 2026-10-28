// 版本号规则回归测试（规则见 版本规则.md）
// 运行：在 index.html 同级执行  node testscript/t_version.js
// 覆盖：真源一致性 / 禁止硬编码 / 禁止代号 / 递增规则正确性
const fs = require("fs");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("  FAIL " + m); } };

const html = fs.readFileSync("index.html", "utf8");
const verSrc = fs.existsSync("VERSION") ? fs.readFileSync("VERSION", "utf8").trim().split(/\s+/) : [];
const jsSrc = fs.existsSync("version.js") ? fs.readFileSync("version.js", "utf8") : "";

console.log("=== 版本号规则回归 ===");

// 1. 真源 VERSION 存在且格式合法
ok(verSrc.length >= 2, "VERSION 至少两行（版本 + 批次）");
const core = verSrc[0] || "";
ok(/^\d+\.\d+\.\d+$/.test(core), "VERSION 首行须为 MAJOR.MINOR.PATCH，实为 " + core);
ok(/^b\d+$/.test(verSrc[1] || ""), "VERSION 次行须为 b<批次>，实为 " + verSrc[1]);

// 2. version.js 与 VERSION 一致（页面读的唯一来源）
const mj = jsSrc.match(/core:\s*"(\d+\.\d+\.\d+)"/);
ok(!!mj, "version.js 未包含 core 字段");
ok(mj && mj[1] === core, "version.js 的 core(" + (mj && mj[1]) + ") 与 VERSION(" + core + ") 不一致");
ok(/<script src="version\.js">/.test(html), "index.html 未引用 version.js");

// 3. 禁止硬编码版本号（除规则说明外不得出现 vX.Y.Z 字面量）
const hard = (html.match(/v\d+\.\d+\.\d+/g) || []);
ok(hard.length === 0, "index.html 出现硬编码版本号：" + hard.join(", "));

// 4. 版本区域禁止代号
const card = html.slice(html.indexOf('id="verCard"'), html.indexOf("ver-grid"));
["Aegis", "AGS", "埃癸斯", "ARGUS", "阿格斯"].forEach(w =>
  ok(card.indexOf(w) < 0, "版本卡片仍含代号：" + w));

// 5. 递增规则：MAJOR/MINOR/PATCH 语义（独立于 _ver.js 重算一遍）
const bmp = (s, k) => {
  let [a, b, c] = s.split(".").map(Number);
  if (k === "major") return (a + 1) + ".0.0";
  if (k === "minor") return a + "." + (b + 1) + ".0";
  if (k === "patch") return a + "." + b + "." + (c + 1);
  return s;
};
ok(bmp("2.0.0", "patch") === "2.0.1", "patch 递增错误");
ok(bmp("2.0.9", "patch") === "2.0.10", "patch 递增错误（进位）");
ok(bmp("2.3.7", "minor") === "2.4.0", "minor 须归零 patch");
ok(bmp("2.3.7", "major") === "3.0.0", "major 须归零 minor/patch");

// 6. 比较规则：数值比较，忽略 +b
const cmp = (x, y) => {
  const p = s => s.replace(/\+b\d+/, "").split(".").map(Number);
  const [A, B] = [p(x), p(y)];
  for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] > B[i] ? 1 : -1;
  return 0;
};
ok(cmp("2.0.0+b119", "2.0.0+b120") === 0, "构建元数据不参与比较");
ok(cmp("2.0.10", "2.0.9") === 1, "2.0.10 应大于 2.0.9（非字典序）");
ok(cmp("2.1.0", "2.0.99") === 1, "minor 优先于 patch");

// 8. APP_VERSION 不得被覆盖成非对象（第 122 批事故：主逻辑曾声明
//    var APP_VERSION = '1.0.0'，覆盖 version.js 的对象，徽章渲染成 "vundefined"）
{
  const vm = require("vm");
  const LOGIC = "Encryption_and_decryption_logic.js";
  const ls = fs.existsSync(LOGIC) ? fs.readFileSync(LOGIC, "utf8") : "";
  ok(!/^\s*var\s+APP_VERSION\s*=/m.test(ls),
    LOGIC + " 不得声明 var APP_VERSION（会覆盖 window.APP_VERSION）");
  ok(!/^\s*(window\.)?APP_VERSION\s*=\s*['"\d]/m.test(ls),
    LOGIC + " 不得给 APP_VERSION 赋标量值");

  // 真实加载顺序模拟：version.js 先，主逻辑后，最终必须是对象且 core 非 "?"
  if (fs.existsSync("version.js") && ls) {
    const ctx = vm.createContext({ console });
    ctx.window = ctx; ctx.globalThis = ctx;
    vm.runInContext(fs.readFileSync("version.js", "utf8"), ctx, { filename: "version.js" });
    // 只取常量声明区（截至 BUILD_INFO 那行），避免截断函数体导致语法错误
    const cut = ls.indexOf("var BUILD_INFO");
    const head = cut > 0 ? ls.slice(0, ls.indexOf("\n", cut)) : ls.split("\n").slice(0, 25).join("\n");
    vm.runInContext(head, ctx, { filename: LOGIC });
    const av = ctx.APP_VERSION;
    ok(av && typeof av === "object", "加载主逻辑后 APP_VERSION 必须是对象，实为 " + typeof av);
    ok(typeof av?.core === "string" && av.core !== "?",
      "APP_VERSION.core 应为有效版本串，实为 " + JSON.stringify(av?.core));
    ok(("v" + (av?.core)) !== "vundefined", "版本徽章不得渲染成 vundefined");
  }

  // index.html 内联脚本必须有对象类型护栏
  ok(/typeof\s+_av\s*===\s*"object"/.test(html) || /typeof\s+window\.APP_VERSION\s*===\s*"object"/.test(html),
    "index.html 内联脚本缺少 APP_VERSION 对象类型护栏");
}

// 7. 规则文档随包
ok(fs.existsSync("版本规则.md"), "版本规则.md 缺失（应随包发出）");

console.log("  当前版本 v" + core + "+" + (verSrc[1] || "?"));
console.log("PASS " + pass + "  FAIL " + fail);
process.exit(fail ? 1 : 0);
