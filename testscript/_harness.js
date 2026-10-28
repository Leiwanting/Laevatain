/* 通用加载 harness：mock 最小 DOM，加载 index.html 引用的全部脚本，
   然后把 ALGOS 与常用工具函数挂到 global，供各测试脚本复用。 */
const fs = require("fs"), vm = require("vm"), nc = require("crypto");
global.crypto = nc.webcrypto; global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
global.btoa = s => Buffer.from(s, "binary").toString("base64");
global.atob = s => Buffer.from(s, "base64").toString("binary");
const mk = id => ({ id, value: "", _h: {}, options: [], addEventListener() {}, dispatchEvent() {},
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  setAttribute() {}, appendChild() {}, style: {}, innerHTML: "", textContent: "" });
const store = {};
global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t),
  querySelector() { return mk('q'); }, querySelectorAll() { return []; },
  addEventListener() {}, readyState: "complete", body: { appendChild() {} } };
global.window = global; global.addEventListener = () => {}; global.Event = function (t) { this.type = t; };
const html = fs.readFileSync("index.html", "utf8");
const parsed = [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const f of parsed) vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f });
module.exports = { ALGOS: global.ALGOS, parsed };
