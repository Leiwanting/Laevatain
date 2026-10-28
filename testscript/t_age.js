/* age v1 —— 官方 testdata/example.age 对拍（可独立复算）
   参照物：FiloSottile/age v1.2.1 testdata/example.age + testdata/example_keys.txt
   官方 age_test.go 明确：用该私钥解密该文件应得到 "Black lives matter." */
const fs = require("fs"), vm = require("vm"), nc = require("crypto");
global.crypto = nc.webcrypto; global.TextEncoder = require("util").TextEncoder;
global.btoa = s => Buffer.from(s, "binary").toString("base64");
global.atob = s => Buffer.from(s, "base64").toString("binary");
const mk = id => ({ id, value: "", _h: {}, options: [], addEventListener() { }, dispatchEvent() { }, classList: { add() { }, remove() { }, toggle() { }, contains() { return false; } }, setAttribute() { }, appendChild() { }, style: { }, innerHTML: "", textContent: "" });
const store = { }; global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t), querySelector() { return mk('q'); }, querySelectorAll() { return []; }, addEventListener() { }, readyState: "complete", body: { appendChild() { } } };
global.window = global; global.addEventListener = () => { }; global.Event = function (t) { this.type = t; };
const html = fs.readFileSync("index.html", "utf8");
for (const f of [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m => m[1])) {
  vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f });
}
const IDENT = "AGE-SECRET-KEY-184JMZMVQH3E6U0PSL869004Y3U2NYV7R30EU99CSEDNPH02YUVFSZW44VU";
const EXP = "Black lives matter.";
let pass = 0, fail = 0;
(async function () {
  const buf = new Uint8Array(fs.readFileSync("testvectors/age_example.age"));
  try {
    const pt = await ageDecrypt(buf, IDENT);
    const s = new TextDecoder().decode(pt);
    if (s === EXP) { pass++; console.log("  PASS 官方 example.age 解密 =", JSON.stringify(s)); }
    else { fail++; console.log("  FAIL 明文不符，得到", JSON.stringify(s), "字节", Buffer.from(pt).toString("hex")); }
  } catch (e) { fail++; console.log("  FAIL 抛异常：", e.message); }
  console.log("\nage decrypt 官方对拍：PASS", pass, "FAIL", fail);
})();
