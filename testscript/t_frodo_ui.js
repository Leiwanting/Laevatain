/* FrodoKEM 界面入口端到端测试：走注册条目的 enc/dec（不是底层函数） */
const fs = require("fs"), vm = require("vm"), nc = require("crypto");
global.crypto = nc.webcrypto; global.TextEncoder = require("util").TextEncoder;
global.btoa = s => Buffer.from(s, "binary").toString("base64");
global.atob = s => Buffer.from(s, "base64").toString("binary");
const mk = id => ({ id, value: "", _h: {}, options: [], addEventListener() {}, dispatchEvent() {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, setAttribute() {}, appendChild() {}, style: {}, innerHTML: "", textContent: "" });
const store = {};
global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t), querySelector() { return mk('q'); }, querySelectorAll() { return []; }, addEventListener() {}, readyState: "complete", body: { appendChild() {} } };
global.window = global; global.addEventListener = () => {}; global.Event = function (t) { this.type = t; };
const html = fs.readFileSync("index.html", "utf8");
const parsed = [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const f of parsed) vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f });

const get = id => ALGOS.find(a => a.id === id);
const txt = fs.readFileSync('/data/workspace/work/testvectors/frodo640shake_c.txt', 'utf8');
const vec = {};
txt.split('\n').forEach(ln => { const m = ln.match(/^(\w+)\s+([0-9a-f]+)$/); if (m && ['pk', 'sk', 'ct', 'ss'].includes(m[1])) vec[m[1]] = m[2]; });

let pass = 0, fail = 0;
const chk = (name, ok) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + name); };

/* 1) decaps 条目：官方 sk + 官方 ct → 官方 ss */
const d = get('frodo640shake-decaps');
chk('条目存在 frodo640shake-decaps', !!d);
if (d) {
  const out = d.enc(vec.ct, vec.sk, '', 'hex').trim();
  chk('官方向量解封装 == 官方 ss (' + out + ')', out === vec.ss);
}

/* 2) encaps 条目：官方 pk → ct+ss，再用 decaps 条目还原 */
const e = get('frodo640shake-encaps');
chk('条目存在 frodo640shake-encaps', !!e);
if (e && d) {
  const out = e.enc('', vec.pk, '', 'hex');
  const parts = out.split('::K::');
  chk('封装输出 ct 长度 9752B', parts[0].trim().length / 2 === 9752);
  const ss2 = d.enc(parts[0].trim(), vec.sk, '', 'hex').trim();
  chk('封装→解封装 往返一致', ss2 === parts[1].trim());
}

/* 3) keygen 条目：长度正确 + sk 只输出模式 */
const g = get('frodo640shake-keygen');
chk('条目存在 frodo640shake-keygen', !!g);
if (g) {
  const out = g.enc('', '', 'sk', 'hex').trim();
  chk('keygen 只输出私钥 19888B', out.length / 2 === 19888);
  const full = g.enc('', '', '', 'hex');
  const p = full.split('::K::');
  chk('keygen 完整输出 pk+sk', p[0].trim().length / 2 === 9616 && p[1].trim().length / 2 === 19888);
}

/* 4) 错误输入友好报错 */
if (d) {
  let threw = false;
  try { d.enc(vec.ct, 'aabb', '', 'hex'); } catch (err) { threw = /19888|私钥长度/.test(err.message); }
  chk('私钥长度错误时友好报错', threw);
}
console.log(fail === 0 ? ('ALL PASS (' + pass + ')') : ('FAILED ' + fail));
