/* GOST 官方向量验收（Botan KAT）
   - GOST 28147-89 分组：testvectors/gost28147_botan_kat.txt（R3411_94_TestParam）
   - GOST R 34.11-94 哈希：testvectors/gost3411_botan_kat.txt
   说明：dec 返回原始字节，统一用 toHex 归一后再比对。 */
const fs = require("fs"), vm = require("vm"), nc = require("crypto");
global.crypto = nc.webcrypto;
global.btoa = s => Buffer.from(s, "binary").toString("base64");
global.atob = s => Buffer.from(s, "base64").toString("binary");
global.TextEncoder = require("util").TextEncoder;
const mk = id => ({ id, value: "", _h: {}, options: [], addEventListener(e, f) { (this._h[e] = this._h[e] || []).push(f); }, dispatchEvent(e) { (this._h[e.type] || []).forEach(f => f.call(this, e)); }, classList: { add() { }, remove() { }, toggle() { }, contains() { return false; } }, setAttribute() { }, appendChild() { }, style: { }, innerHTML: "", textContent: "" });
const store = {}; global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t), querySelector() { return mk('q'); }, querySelectorAll() { return []; }, addEventListener() { return {}; }, readyState: "complete", body: { appendChild() { } } };
global.window = global; global.addEventListener = () => ({ }); global.Event = function (t) { this.type = t; };
[...fs.readFileSync("index.html", "utf8").matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .forEach(f => vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }));

const A = ALGOS;
const get = id => { const a = A.find(x => x.id === id); if (!a) throw new Error("missing " + id); return a; };
const toHex = v => (v instanceof Uint8Array || Array.isArray(v)) ? Buffer.from(v).toString("hex") : String(v);
let P = 0, F = 0;
function ck(c, l, got, exp) {
  if (c) { P++; } else { F++; console.log("  ✗ " + l + "\n    got " + got + "\n    exp " + exp); }
}

/* ---------- 解析 Botan KAT（Key/In/Out 三元组，值可跨行续写） ---------- */
function parseKat(txt) {
  const out = []; let cur = null, lastKey = null;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("[")) { if (cur) out.push(cur); cur = {}; lastKey = null; continue; }
    const m = line.match(/^(\w+)\s*=\s*(.*)$/);
    if (!m) { if (cur && lastKey) cur[lastKey] += line.replace(/\s+/g, ""); continue; }
    if (cur && cur[m[1]] !== undefined) { out.push(cur); cur = {}; }
    lastKey = m[1]; cur[lastKey] = (m[2] || "").replace(/\s+/g, "");
  }
  if (cur && Object.keys(cur).length) out.push(cur);
  return out.filter(o => o.In !== undefined && o.Out !== undefined);
}

/* ---------- 1) GOST 28147-89 分组（两套参数集） ---------- */
function parseSections(txt) {
  const secs = []; let cur = null, lastKey = null;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    if (line.startsWith("[")) { if (cur) secs.push(cur); cur = { _name: line, _tv: [] }; lastKey = null; continue; }
    const m = line.match(/^(\w+)\s*=\s*(.*)$/);
    if (!m) { if (cur && lastKey) { const t = cur._tv[cur._tv.length - 1]; if (t) t[lastKey] += line.replace(/\s+/g, ""); } continue; }
    const t = cur._tv[cur._tv.length - 1];
    if (t && t[m[1]] !== undefined) { cur._tv.push({}); }
    cur._tv.push(cur._tv.pop() || {});
    const tt = cur._tv[cur._tv.length - 1];
    lastKey = m[1]; tt[m[1]] = (m[2] || "").replace(/\s+/g, "");
    if (!cur._tv.includes(tt)) cur._tv.push(tt);
  }
  if (cur) secs.push(cur);
  return secs.filter(s => s._tv.length);
}
const secs = parseSections(fs.readFileSync("testvectors/gost28147_botan_kat.txt", "utf8"));
for (const sec of secs) {
  const cryptpro = /CryptoPro/i.test(sec._name);
  const tvs = sec._tv.filter(t => t.In !== undefined && t.Out !== undefined && t.Key !== undefined);
  console.log("=== GOST 28147-89 分组 " + sec._name + "（" + tvs.length + " 组）===");
  for (const t of tvs) {
    const key = Uint8Array.from(Buffer.from(t.Key.toLowerCase(), "hex"));
    const pt = Uint8Array.from(Buffer.from((t.In || "").toLowerCase(), "hex"));
    const exp = (t.Out || "").toLowerCase();
    const ct = toHex(GOST3411.block(key, pt, 1, cryptpro)).toLowerCase();
    ck(ct === exp, "enc " + (t.In || "").slice(0, 8), ct, exp);
    const back = toHex(GOST3411.block(key, Uint8Array.from(Buffer.from(ct, "hex")), 0, cryptpro)).toLowerCase();
    ck(back === (t.In || "").toLowerCase(), "dec " + (t.In || "").slice(0, 8), back, (t.In || "").toLowerCase());
  }
}

/* ---------- 2) GOST R 34.11-94 哈希 ---------- */
const h = get("gost3411");
const tv3411 = parseKat(fs.readFileSync("testvectors/gost3411_botan_kat.txt", "utf8"));
console.log("=== GOST R 34.11-94 哈希（Botan KAT，" + tv3411.length + " 组）===");
for (const t of tv3411) {
  const inp = (t.In || "").toLowerCase(), exp = t.Out.toLowerCase();
  const got = toHex(h.enc(Uint8Array.from(Buffer.from(inp, "hex")), "", "", "hex")).toLowerCase();
  ck(got === exp, "hash len=" + inp.length / 2, got, exp);
}

console.log("");
console.log("GOST 官方向量：通过 " + P + " / 失败 " + F);
if (F) process.exitCode = 1;
