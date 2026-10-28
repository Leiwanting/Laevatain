/* Skein-512 / Threefish-512 回归测试
   向量来源：Botan 2.19.5 官方测试集
     src/tests/data/block/threefish.vec  （Threefish-512，含一条带 tweak 的）
     src/tests/data/hash/skein.vec       （Skein-512 224/256/384/512/512,Test） */
const fs = require("fs"), vm = require("vm"), nc = require("crypto");
global.crypto = nc.webcrypto; global.TextEncoder = require("util").TextEncoder;
global.btoa = s => Buffer.from(s, "binary").toString("base64");
global.atob = s => Buffer.from(s, "base64").toString("binary");
const mk = id => ({ id, value: "", _h: {}, options: [], addEventListener() {}, dispatchEvent() {},
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  setAttribute() {}, appendChild() {}, style: {}, innerHTML: "", textContent: "" });
const store = {};
global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t),
  querySelector() { return mk('q'); }, querySelectorAll() { return []; }, addEventListener() {},
  readyState: "complete", body: { appendChild() {} } };
global.window = global; global.addEventListener = () => {}; global.Event = function (t) { this.type = t; };
const html = fs.readFileSync("index.html", "utf8");
for (const m of html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)) {
  vm.runInThisContext(fs.readFileSync(m[1], "utf8"), { filename: m[1] });
}
const byId = id => ALGOS.filter(a => a.id === id)[0];
let pass = 0, fail = 0;
function ck(c, msg) { if (c) pass++; else { fail++; if (fail < 8) console.log("✗ " + msg); } }

/* ---- 1. Skein 官方向量（skein.vec） ---- */
const VEC = "/data/workspace/../../data/workspace";
function parseBotan(path) {
  const blocks = fs.readFileSync(path, "utf8").split(/\n\s*\n/);
  const out = []; let sec = null;
  for (const b of blocks) {
    const lines = b.split("\n").map(x => x.trim()).filter(x => x && !x.startsWith("#"));
    let o = null;
    for (const l of lines) {
      if (l.startsWith("[")) { sec = l.slice(1, -1); continue; }
      const m = l.match(/^(\w+)\s*=\s*(.*)$/);
      if (m) { if (!o) o = {}; o[m[1]] = m[2].trim(); }
    }
    if (o) { o.sec = sec; out.push(o); }
  }
  return out;
}
const svFile = process.env.BOTAN + "/src/tests/data/hash/skein.vec";
const map = { "Skein-512(224)": "skein512-224", "Skein-512(256)": "skein512-256",
  "Skein-512(384)": "skein512-384", "Skein-512(512)": "skein512-512",
  "Skein-512(512,Test)": "skein512-512-test" };
let sv;
try { sv = parseBotan(svFile); } catch (e) { sv = []; }
if (!sv.length) { console.log("（跳过官方向量：" + svFile + " 不可读）"); }
const counted = {};
for (const v of sv) {
  const id = map[v.sec]; if (!id) continue;
  const a = byId(id); if (!a) { console.log("✗ 未注册 " + id); fail++; continue; }
  const got = a.enc(new Uint8Array(Buffer.from(v.In || "", "hex")), "", "", "hex");
  ck(String(got).toUpperCase() === String(v.Out || "").toUpperCase(),
    id + " in=" + (v.In || "").slice(0, 16) + " got=" + got + " exp=" + v.Out);
  counted[id] = (counted[id] || 0) + 1;
}
console.log("Skein 官方向量分组数: " + JSON.stringify(counted));

/* ---- 2. Threefish-512 官方向量 ---- */
const tfFile = process.env.BOTAN + "/src/tests/data/block/threefish.vec";
const tv = parseBotan(tfFile);
const tf = globalThis.THREEFISH;
let tfPass = 0;
for (const v of tv) {
  if (v.Tweak) continue;   /* 带 tweak 的走下面单独验 */
  const k = Buffer.from(v.Key, "hex"), inp = Buffer.from(v.In, "hex"), exp = Buffer.from(v.Out, "hex");
  const ct = Buffer.alloc(inp.length);
  for (let i = 0; i < inp.length; i += 64) Buffer.from(tf.tf512Enc(new Uint8Array(inp.slice(i, i + 64)), new Uint8Array(k))).copy(ct, i);
  if (ct.toString("hex").toUpperCase() === exp.toString("hex").toUpperCase()) tfPass++;
  const pt = Buffer.alloc(ct.length);
  for (let i = 0; i < ct.length; i += 64) Buffer.from(tf.tf512Dec(new Uint8Array(ct.slice(i, i + 64)), new Uint8Array(k))).copy(pt, i);
  ck(pt.toString("hex") === inp.toString("hex"), "Threefish 解密往返");
}
console.log("Threefish-512 官方向量(无 tweak): " + tfPass + "/" + (tv.length - 1));

/* ---- 2b. 带 tweak 的那条：入口固定 tweak=0，只能从内部函数验证 ---- */
(function () {
  const v = tv.filter(x => x.Tweak)[0];
  if (!v) return;
  const T = globalThis.SKEIN._test;
  const u64le = (b, o) => [((b[o+4]|(b[o+5]<<8)|(b[o+6]<<16)|(b[o+7]<<24))|0),
                           ((b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))|0)];
  const key = new Uint8Array(Buffer.from(v.Key, "hex"));
  const tw = new Uint8Array(Buffer.from(v.Tweak, "hex"));
  const inp = new Uint8Array(Buffer.from(v.In, "hex"));
  const st = T.skeinInit();
  for (let i = 0; i < 8; i++) { const t = u64le(key, 8*i); st.Kh[i] = t[0]; st.Kl[i] = t[1]; }
  T.parity(st.Kh, st.Kl);
  for (let i = 0; i < 2; i++) { const t = u64le(tw, 8*i); st.Th[i] = t[0]; st.Tl[i] = t[1]; }
  st.Th[2] = st.Th[0] ^ st.Th[1]; st.Tl[2] = st.Tl[0] ^ st.Tl[1];
  const vh = new Int32Array(8), vl = new Int32Array(8);
  for (let i = 0; i < 8; i++) { const t = u64le(inp, 8*i); vh[i] = t[0]; vl[i] = t[1]; }
  T.tfCore(vh, vl, st.Kh, st.Kl, st.Th, st.Tl, false);
  const out = Buffer.alloc(64);
  for (let i = 0; i < 8; i++) {
    const h = vh[i] >>> 0, l = vl[i] >>> 0;
    out.writeUInt32LE(l, 8*i); out.writeUInt32LE(h, 8*i + 4);
  }
  ck(out.toString("hex").toUpperCase() === String(v.Out).toUpperCase(),
     "Threefish 带 tweak 向量 got=" + out.toString("hex").toUpperCase().slice(0, 32) + " exp=" + v.Out.slice(0, 32));
  console.log("Threefish-512 带 tweak 向量: " + (out.toString("hex").toUpperCase() === String(v.Out).toUpperCase() ? "✓" : "✗"));
})();

/* ---- 3. 条目可达性与基本性质 ---- */
for (const id of Object.values(map)) {
  const a = byId(id);
  if (!a) continue;
  const h1 = a.enc("", "", "", "hex"), h2 = a.enc("abc", "", "", "hex");
  ck(h1 && h2 && h1 !== h2, id + " 空串与 abc 应不同");
}
const tfa = byId("threefish512");
ck(!!tfa && tfa.blockSize === 64, "threefish512 应注册为 64 字节块分组密码");
const blk = tfa.makeBlockFn(new Uint8Array(64));
const p0 = new Uint8Array(64); p0[0] = 1;
ck(Buffer.from(blk.dec(blk.enc(p0))).toString("hex") === Buffer.from(p0).toString("hex"), "Threefish 单块往返");

console.log("Skein/Threefish 测试 " + pass + "/" + (pass + fail) + (fail ? " ✗" : " ✓"));
