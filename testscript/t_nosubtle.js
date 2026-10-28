const nc = require("crypto");
// 模拟 file:// 打开：只有 getRandomValues，没有 subtle
global.crypto = { getRandomValues: a => { const b = nc.randomBytes(a.length); a.set(b); return a; } };
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
global.btoa = s => Buffer.from(s, "binary").toString("base64");
global.atob = s => Buffer.from(s, "base64").toString("binary");
const mk = id => ({ id, value: "", _h: {}, options: [], addEventListener() {}, dispatchEvent() {},
  classList: { add(){}, remove(){}, toggle(){}, contains(){return false;} },
  setAttribute(){}, appendChild(){}, style:{}, innerHTML:"", textContent:"" });
const store = {};
global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t),
  querySelector(){return mk('q');}, querySelectorAll(){return [];},
  addEventListener(){}, readyState:"complete", body:{appendChild(){}} };
global.window = global; global.addEventListener = () => {}; global.Event = function(t){this.type=t;};
const fs = require("fs"), vm = require("vm");
const html = fs.readFileSync("index.html", "utf8");
for (const m of html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g))
  vm.runInThisContext(fs.readFileSync(m[1], "utf8"), { filename: m[1] });
(async () => {
  const r = await runSelfTest();
  console.log("无 subtle 环境 -> 通过 " + r.passed + " · 失败 " + r.failed + " · 跳过 " + r.skipped);
  console.log("往返总数 " + r.rt.length + "，失败 " + r.rt.filter(x=>!x.ok).length);
})().catch(e => console.log("ERR " + e.stack));
