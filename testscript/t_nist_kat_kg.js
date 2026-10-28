/* 真 NIST KAT 密钥生成对拍：官方 seed → 我的 pk */
const fs = require("fs"), vm = require("vm"), nc = require("crypto");
global.crypto = nc.webcrypto; global.TextEncoder = require("util").TextEncoder;
global.btoa = s => Buffer.from(s, "binary").toString("base64"); global.atob = s => Buffer.from(s, "base64").toString("binary");
const mk = id => ({ id, value: "", _h: {}, options: [], addEventListener() { }, dispatchEvent() { }, classList: { add() { }, remove() { }, toggle() { }, contains() { return false; } }, setAttribute() { }, appendChild() { }, style: { }, innerHTML: "", textContent: "" });
const store = {}; global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t), querySelector() { return mk('q'); }, querySelectorAll() { return []; }, addEventListener() { }, readyState: "complete", body: { appendChild() { } } };
global.window = global; global.addEventListener = () => { }; global.Event = function (t) { this.type = t; };
const html = fs.readFileSync("index.html", "utf8");
const parsed = [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const f of parsed) { vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }); }

const kat = JSON.parse(fs.readFileSync("/data/workspace/kat512_real.json", "utf8"));
const kg = ALGOS.find(a => a.id === "falcon-keygen");
let pass = 0, fail = 0, mismatch = 0;
(async function () {
  for (const v of kat) {
    const is512 = v.pk.length / 2 === 897;
    const want = v.pk.toLowerCase();
    let r;
    try { r = await kg.enc("", v.seed.toLowerCase(), is512 ? "512" : "1024"); }
    catch (e) { console.log("✗ " + (is512 ? 512 : 1024) + " c=" + v.count + " EX " + e.message); fail++; continue; }
    const m = r.text.match(/公钥[^\n]*=\s*([0-9a-f]+)/i) || r.text.match(/pk[^0-9a-f]*([0-9a-f]+)/i);
    const got = m ? m[1].toLowerCase() : "";
    const ok = got === want;
    ok ? pass++ : (fail++, mismatch++);
    console.log((ok ? "✓" : "✗") + " " + (is512 ? "512" : "1024") + " count=" + v.count +
      "  公钥" + (ok ? "逐字节一致" : "不一致 got=" + got.slice(0, 24) + "… want=" + want.slice(0, 24) + "…"));
  }
  console.log("\nNIST KAT 密钥生成: 一致 " + pass + "  不一致 " + mismatch + "  异常 " + (fail - mismatch));
})();
