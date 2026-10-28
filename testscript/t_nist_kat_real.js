/* 真 NIST Falcon KAT 对拍（用户提供的 falcon512/1024-KAT.rsp 前 11 组） */
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
const h2b = s => { const o = new Uint8Array(s.length / 2); for (let i = 0; i < o.length; i++) o[i] = parseInt(s.substr(i * 2, 2), 16); return o; };
const b2h = b => [...b].map(x => (x < 16 ? "0" : "") + x.toString(16)).join("");

const vf = ALGOS.find(a => a.id === "falcon-verify");
let pass = 0, fail = 0;

(async function () {
  for (const v of kat) {
    const is512 = v.pk.length / 2 === 897;
    const logn = is512 ? 9 : 10;
    const sm = h2b(v.sm), msg = h2b(v.msg);
    // 结构: BE16(s2len) | nonce(40) | msg | s2
    const s2len = (sm[0] << 8) | sm[1];
    const nonce = sm.slice(2, 42);
    const msgInSm = sm.slice(42, 42 + msg.length);
    const s2 = sm.slice(42 + msg.length);
    const structOK = b2h(msgInSm).toLowerCase() === v.msg.toLowerCase() && s2.length === s2len;
    // 组装标准 Falcon 签名: 0x30+logn | nonce | s2
    const sig = new Uint8Array(1 + nonce.length + s2.length);
    sig[0] = 0x30 + logn; sig.set(nonce, 1); sig.set(s2, 1 + nonce.length);

    let r;
    try { r = await vf.enc(msg, v.pk, b2h(sig)); } catch (e) { r = { text: "EX: " + e.message }; }
    const ok = /VALID/.test(r.text);
    if (ok && structOK) { pass++; } else { fail++; }
    console.log((ok ? "✓" : "✗") + " " + (is512 ? "512" : "1024") + " count=" + v.count +
      " s2len=" + s2len + " 结构=" + structOK + " 验签=" + (/VALID/.test(r.text) ? "VALID" : r.text.replace(/\n/g, " | ").slice(0, 110)));
  }
  console.log("\nNIST KAT 验签: PASS " + pass + "  FAIL " + fail);
})();
