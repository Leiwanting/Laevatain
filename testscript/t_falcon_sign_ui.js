/* 界面入口测试：Falcon 签名（走 reg 注册的 enc，覆盖 UI 整条链路） */
const fs = require("fs"), vm = require("vm"), nc = require("crypto");
global.crypto = nc.webcrypto; global.TextEncoder = require("util").TextEncoder;
global.btoa = s => Buffer.from(s, "binary").toString("base64"); global.atob = s => Buffer.from(s, "base64").toString("binary");
const mk = id => ({ id, value: "", _h: {}, options: [], addEventListener() { }, dispatchEvent() { }, classList: { add() { }, remove() { }, toggle() { }, contains() { return false; } }, setAttribute() { }, appendChild() { }, style: { }, innerHTML: "", textContent: "" });
const store = {}; global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t), querySelector() { return mk('q'); }, querySelectorAll() { return []; }, addEventListener() { }, readyState: "complete", body: { appendChild() { } } };
global.window = global; global.addEventListener = () => { }; global.Event = function (t) { this.type = t; };
const html = fs.readFileSync("index.html", "utf8");
const parsed = [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const f of parsed) { vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }); }
const get = id => ALGOS.find(a => a.id === id);
let pass = 0, fail = 0;
function ck(name, cond, extra) { if (cond) { pass++; console.log("✓ " + name); } else { fail++; console.log("✗ " + name + (extra ? " :: " + extra : "")); } }

function parseKat(f) { const o = {}; fs.readFileSync(f, "utf8").split("\n").forEach(l => { const m = l.match(/^([a-zA-Z0-9]+) = (.*)$/); if (m) o[m[1]] = m[2]; }); return o; }

console.log("=== A. 条目注册 ===");
const sg = get("falcon-sign"), vf = get("falcon-verify");
ck("falcon-sign 已注册", !!sg);
ck("falcon-verify 已注册", !!vf);
ck("keyLabel 说明私钥长度", /1281/.test(sg.keyLabel || ""));

(async function () {
  for (const [logn, file, nm] of [[9, "/data/workspace/work/falcon/kat512_dbg.txt", "Falcon-512"], [10, "/data/workspace/work/falcon/kat1024_dbg.txt", "Falcon-1024"]]) {
    const o = parseKat(file);
    const msg = "abc";
    console.log("\n=== B. " + nm + " 签名 → 官方公钥验签 ===");
    const r1 = await sg.enc(msg, o.sk, "");
    const m = r1.text.match(/签名（Hex）=\s*([0-9a-f]+)/);
    ck("输出含签名 Hex", !!m, r1.text.slice(0, 120));
    const sig = m[1];
    const L=sig.length/2; ck("签名长度在合法区间", L>=(logn===9?560:1120) && L<=(logn===9?666:1280), "len="+L);
    const r2 = await vf.enc(msg, o.pk, sig);
    ck("官方公钥验签 VALID", /VALID/.test(r2.text), r2.text.replace(/\n/g, " | "));
    /* 改消息应判 INVALID */
    const r3 = await vf.enc("abd", o.pk, sig);
    ck("改消息 → INVALID", /INVALID/.test(r3.text));
  }

  console.log("\n=== C. 健壮性 ===");
  let e1 = ""; try { await sg.enc("x", "1234", ""); } catch (e) { e1 = e.message; }
  ck("非法私钥头报错", /0x59/.test(e1), e1);
  let e2 = ""; try { await sg.enc("x", "", ""); } catch (e) { e2 = e.message; }
  ck("空私钥报错", /私钥/.test(e2), e2);

  console.log("\nPASS " + pass + "  FAIL " + fail);
  process.exit(fail ? 1 : 0);
})();
