/* Falcon keygen 性能剖析 */
const fs = require("fs"), vm = require("vm"), nc = require("crypto");
global.crypto = nc.webcrypto; global.TextEncoder = require("util").TextEncoder;
global.btoa = s => Buffer.from(s, "binary").toString("base64"); global.atob = s => Buffer.from(s, "base64").toString("binary");
const mk = id => ({ id, value: "", _h: {}, options: [], addEventListener() { }, dispatchEvent() { }, classList: { add() { }, remove() { }, toggle() { }, contains() { return false; } }, setAttribute() { }, appendChild() { }, style: { }, innerHTML: "", textContent: "" });
const store = {}; global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t), querySelector() { return mk('q'); }, querySelectorAll() { return []; }, addEventListener() { }, readyState: "complete", body: { appendChild() { } } };
global.window = global; global.addEventListener = () => { }; global.Event = function (t) { this.type = t; };
const html = fs.readFileSync("index.html", "utf8");
const parsed = [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const f of parsed) {
  if (f === "crypto_falcon_kg2.js") { vm.runInThisContext(fs.readFileSync("../work/prof_kg.js", "utf8"), { filename: "prof_kg.js" }); continue; }
  vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f });
}
const get = id => ALGOS.find(a => a.id === id);
const b2h = b => Array.from(b).map(x => ('0' + x.toString(16)).slice(-2)).join('');

(async function () {
  for (const [logn, nm] of [[9, "512"], [10, "1024"]]) {
    const seed = new Uint8Array(48);
    for (let i = 0; i < 48; i++) seed[i] = i + 1 + (logn === 9 ? 11 : 0);
    globalThis._MN = 0; globalThis._MNT = 0; globalThis._FF = 0; globalThis._FFT = 0;
    globalThis._IF = 0; globalThis._IFT = 0; globalThis._BB = 0; globalThis._BBT = 0; globalThis._TW = 0; globalThis._TWT = 0;
    const t0 = Date.now();
    const r = await get("falcon-keygen").enc("", b2h(seed), nm);
    const ms = Date.now() - t0;
    console.log("\n### Falcon-" + nm + "  总耗时 " + ms + " ms");
    console.log("  buildTower  " + globalThis._TW + " 次  " + globalThis._TWT + " ms");
    console.log("  babai       " + globalThis._BB + " 次  " + globalThis._BBT + " ms");
    console.log("  mulNeg      " + globalThis._MN + " 次  " + globalThis._MNT + " ms");
    console.log("  _fft        " + globalThis._FF + " 次  " + globalThis._FFT + " ms");
    console.log("  invf        " + globalThis._IF + " 次  " + globalThis._IFT + " ms");
  }
})();
