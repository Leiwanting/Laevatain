/* Adiantum / XChaCha12 / NH / NHPoly1305 官方向量校验
   向量来源：github.com/google/adiantum  test_vectors/ours/  */
const fs = require("fs"), vm = require("vm"), nc = require("crypto");
global.crypto = nc.webcrypto;
global.TextEncoder = require("util").TextEncoder;
global.btoa = s => Buffer.from(s, "binary").toString("base64");
global.atob = s => Buffer.from(s, "base64").toString("binary");
const mk = id => ({ id, value: "", _h: {}, options: [], addEventListener() { }, dispatchEvent() { }, classList: { add() { }, remove() { }, toggle() { }, contains() { return false; } }, setAttribute() { }, appendChild() { }, style: { }, innerHTML: "", textContent: "" });
const store = {};
global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t), querySelector() { return mk('q'); }, querySelectorAll() { return []; }, addEventListener() { }, readyState: "complete", body: { appendChild() { } } };
global.window = global; global.addEventListener = () => { }; global.Event = function (t) { this.type = t; };

const html = fs.readFileSync("index.html", "utf8");
const parsed = [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let ok = 0, fail = 0;
for (const f of parsed) {
  try { vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }); ok++; }
  catch (e) { fail++; console.log("✗ " + f + ": " + e.message); }
}
console.log("脚本加载 " + ok + "/" + parsed.length + " 失败 " + fail);

const A = global.ALGOS || [];
const byId = {};
for (const a of A) byId[a.id] = a;
console.log("算法总数 " + A.length + "  adiantum=" + !!byId.adiantum + " xchacha12=" + !!byId.xchacha12 + " nhpoly1305=" + !!byId.nhpoly1305);

const TV = "/data/workspace/adiantum-master/test_vectors/ours/";
function loadJson(p) {
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  // recursive_unhex: 把 *_hex 键还原成 bytes
  function un(o) {
    if (Array.isArray(o)) return o.map(un);
    if (o && typeof o === "object") {
      const r = {};
      for (const k of Object.keys(o)) {
        if (k.endsWith("_hex")) r[k.slice(0, -4)] = Buffer.from(o[k], "hex");
        else r[k] = un(o[k]);
      }
      return r;
    }
    return o;
  }
  return un(j);
}
const hex = b => Buffer.from(b).toString("hex");

/* ---------- 1. Adiantum XChaCha12/20/8 ---------- */
let pass = 0, tot = 0;
for (const variant of ["Adiantum_XChaCha12_32_AES256", "Adiantum_XChaCha20_32_AES256", "Adiantum_XChaCha8_32_AES256"]) {
  const tvs = loadJson(TV + "Adiantum/" + variant + ".json");
  const rounds = parseInt(variant.match(/XChaCha(\d+)/)[1], 10);
  const id = rounds === 12 ? "adiantum" : (rounds === 20 ? "adiantum20" : "adiantum8");
  let p = 0, t = 0;
  for (const tv of tvs) {
    t++;
    const key = Buffer.from(tv.input.key), tweak = Buffer.from(tv.input.tweak || "");
    const pt = Buffer.from(tv.plaintext), ct = Buffer.from(tv.ciphertext);
    try {
      const entry = byId[id];
      const encRaw = entry.enc(new Uint8Array(pt), new Uint8Array(key), tweak.toString("hex"), "hex");
      const enc = typeof encRaw === "string" ? Buffer.from(encRaw, "hex") : encRaw;
      const decRaw = entry.dec(new Uint8Array(ct), new Uint8Array(key), tweak.toString("hex"), "hex");
      const dec = typeof decRaw === "string" ? Buffer.from(decRaw, "hex") : decRaw;
      if (hex(enc) === hex(ct) && hex(dec) === hex(pt)) p++;
      else if (t <= 3) console.log("  ✗ " + variant + " " + tv.description + " enc=" + hex(enc).slice(0, 32) + " want=" + hex(ct).slice(0, 32));
    } catch (e) { if (t <= 3) console.log("  ✗ " + variant + " exc " + e.message); }
  }
  console.log(variant + " " + p + "/" + t);
  pass += p; tot += t;
}

/* ---------- 2. XChaCha12 / XChaCha8 ---------- */
for (const [fname, rounds] of [["XChaCha12_32.json", 12], ["XChaCha8_32.json", 8]]) {
  const tvs = loadJson(TV + "XChaCha/" + fname);
  let p = 0, t = 0;
  for (const tv of tvs) {
    for (const s of tv.tests) {
      t++;
      const key = Buffer.from(tv.input.key), nonce = Buffer.from(tv.input.nonce);
      const want = Buffer.from(s.result);
      const len = want.length;
      const out = global.__xchachaTest(new Uint8Array(key), new Uint8Array(nonce), rounds, len, s.input.offset);
      const ks = Buffer.from(out);
      if (ks.toString("hex") === want.toString("hex")) p++;
      else if (t <= 3) console.log("  ✗ xchacha" + rounds + " " + tv.description + " off=" + s.input.offset + "\n    got " + ks.toString("hex").slice(0, 32) + "\n    want " + want.toString("hex").slice(0, 32));
    }
  }
  console.log("XChaCha" + rounds + " " + p + "/" + t);
  pass += p; tot += t;
}
/* 2b. XChaCha8 走注册入口的往返（含 nonce 前缀） */
{
  const e = byId.xchacha8;
  let p = 0, t = 0;
  if (e) {
    for (const L of [0, 1, 15, 16, 63, 64, 65, 200, 1024]) {
      t++;
      const pt = new Uint8Array(L); for (let i = 0; i < L; i++) pt[i] = (i * 37 + 11) & 255;
      const key = new Uint8Array(32); for (let i = 0; i < 32; i++) key[i] = i * 5 + 3;
      const nonce = new Uint8Array(24); for (let i = 0; i < 24; i++) nonce[i] = i * 7 + 1;
      const ct = e.enc(pt, key, Buffer.from(nonce).toString("hex"), "hex");
      const rtRaw = e.dec(ct, key, "", "hex");
      const rt = typeof rtRaw === "string" ? Buffer.from(rtRaw, "hex") : rtRaw;
      if (Buffer.from(rt).toString("hex") === Buffer.from(pt).toString("hex")) p++;
      else if (t <= 3) console.log("  ✗ xchacha8 UI L=" + L);
    }
    console.log("XChaCha8 入口往返 " + p + "/" + t);
    pass += p; tot += t;
  }
}

/* ---------- 3. NH ---------- */
{
  const tvs = loadJson(TV + "NH/NH.json");
  let p = 0, t = 0;
  for (const tv of tvs) {
    t++;
    const key = Buffer.from(tv.input.key), msg = Buffer.from(tv.input.message);
    const want = Buffer.from(tv.hash);
    const got = global.__nhTest ? global.__nhTest(key, msg) : null;
    if (got && Buffer.from(got).toString("hex") === want.toString("hex")) p++;
    else if (t <= 2) console.log("  ✗ NH " + tv.description + " (需要 __nhTest 导出)");
  }
  console.log("NH " + p + "/" + t + (global.__nhTest ? "" : "  __nhTest 未导出，跳过"));
}

/* ---------- 4. NHPoly1305 ---------- */
{
  const tvs = loadJson(TV + "NHPoly1305/NHPoly1305.json");
  let p = 0, t = 0;
  for (const tv of tvs) {
    t++;
    const key = Buffer.from(tv.input.key), msg = Buffer.from(tv.input.message);
    const want = Buffer.from(tv.hash);
    if (!global.__nhpTest) continue;
    const hv = global.__nhpTest(new Uint8Array(key), new Uint8Array(msg));
      const got = Buffer.from(global.__fromBigAdi ? global.__fromBigAdi(hv,16) : (()=>{const o=Buffer.alloc(16);let v=hv;for(let i=0;i<16;i++){o[i]=Number(v&0xffn);v>>=8n;}return o;})());
    if (got.toString("hex") === want.toString("hex")) p++;
    else if (t <= 2) console.log("  ✗ NHPoly1305 " + tv.description);
  }
  console.log("NHPoly1305 " + p + "/" + t + (global.__nhpTest ? "" : "  __nhpTest 未导出，跳过"));
}

console.log("\n总计 " + pass + "/" + tot + (pass === tot ? " ✓ 全部通过" : " ✗ 有失败"));
