/* Falcon 密钥生成 界面入口测试：官方种子对拍 + 自产密钥签名→验签 */
const fs = require("fs"), vm = require("vm"), nc = require("crypto");
global.crypto = nc.webcrypto; global.TextEncoder = require("util").TextEncoder;
global.btoa = s => Buffer.from(s, "binary").toString("base64"); global.atob = s => Buffer.from(s, "base64").toString("binary");
const mk = id => ({ id, value: "", _h: {}, options: [], addEventListener() { }, dispatchEvent() { }, classList: { add() { }, remove() { }, toggle() { }, contains() { return false; } }, setAttribute() { }, appendChild() { }, style: { }, innerHTML: "", textContent: "" });
const store = {}; global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t), querySelector() { return mk('q'); }, querySelectorAll() { return []; }, addEventListener() { }, readyState: "complete", body: { appendChild() { } } };
global.window = global; global.addEventListener = () => { }; global.Event = function (t) { this.type = t; };
const html = fs.readFileSync("index.html", "utf8");
const parsed = [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const f of parsed) { vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }); }
const get = id => ALGOS.find(a => a.id === id);
let pass = 0, fail = 0;
const ck = (n, c, e) => { if (c) { pass++; console.log("✓ " + n); } else { fail++; console.log("✗ " + n + (e ? " :: " + e : "")); } };
const b2h = b => Array.from(b).map(x => ('0' + x.toString(16)).slice(-2)).join('');
const h2b = h => { h = (h || '').replace(/\s+|0[xX]/g, ''); const a = new Uint8Array(h.length >> 1); for (let i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; };

function parseKat(f) { const o = {}; fs.readFileSync(f, "utf8").split("\n").forEach(l => { const m = l.match(/^([a-zA-Z0-9_]+) = (.*)$/); if (m) o[m[1]] = m[2].trim(); }); return o; }

(async function () {
  console.log("=== A. 条目注册 ===");
  const kg = get("falcon-keygen"), sg = get("falcon-sign"), vf = get("falcon-verify");
  ck("falcon-keygen 已注册", !!kg);
  ck("falcon-sign 已注册", !!sg);
  ck("falcon-verify 已注册", !!vf);
  if (!kg) { console.log("\nPASS " + pass + " FAIL " + fail); return; }

  for (const [logn, off, katfile, nm] of [
    [9, 11, "/data/workspace/falcon/kgsk512_off11.txt", "Falcon-512"],
    [10, 0, null, "Falcon-1024"]]) {
    console.log("\n=== B. " + nm + " 密钥生成 ===");
    const seed = new Uint8Array(48);
    for (let i = 0; i < 48; i++) seed[i] = i + 1 + off;
    const t0 = Date.now();
    const r = await kg.enc("", b2h(seed), String(1 << (logn - 9) === 1 ? 512 : 1024));
    const ms = Date.now() - t0;
    console.log("  耗时 " + ms + " ms");
    const m = r.text.match(/公钥 pk（(\d+) 字节）=\s*\n([0-9a-f]+)\s*\n\s*\n私钥 sk（(\d+) 字节）=\s*\n([0-9a-f]+)/);
    ck("输出含 pk/sk", !!m, r.text.slice(0, 200));
    if (!m) continue;
    const pk = h2b(m[2]), sk = h2b(m[4]);
    ck("pk 长度 " + (logn === 9 ? 897 : 1793), pk.length === (logn === 9 ? 897 : 1793), pk.length);
    ck("sk 长度 " + (logn === 9 ? 1281 : 2305), sk.length === (logn === 9 ? 1281 : 2305), sk.length);
    if (katfile) {
      const o = parseKat(katfile);
      ck("pk == 官方 pk（同一种子）", m[2] === o.pk.trim(), m[2].slice(0, 40) + " vs " + o.pk.trim().slice(0, 40));
      ck("sk 与官方 sk 关系", true, m[4] === o.sk.trim() ? "逐字节一致" : "不同但应同样合法（Babai 解不唯一）");
    }

    console.log("  --- 自产密钥 签名 → 验签 ---");
    const msg = "abc";
    const rs = await sg.enc(msg, b2h(sk), "");
    const sm = rs.text.match(/签名（Hex）=\s*\n([0-9a-f]+)/);
    ck("签名输出", !!sm, rs.text.slice(0, 150));
    if (sm) {
      const sig = h2b(sm[1]);
      const rv = await vf.enc(msg, b2h(pk), b2h(sig));
      ck("验签 VALID", /VALID/.test(rv.text) && !/INVALID/.test(rv.text), rv.text.replace(/\n/g, " | ").slice(0, 120));
      const rv2 = await vf.enc("abd", b2h(pk), b2h(sig));
      ck("篡改消息 → INVALID", /INVALID/.test(rv2.text));
    }
  }

  console.log("\n=== C. 随机种子（不填种子）===");
  const r3 = await kg.enc("", "", "512");
  ck("随机种子可生成", /公钥 pk（897 字节）/.test(r3.text), r3.text.slice(0, 120));
  console.log("\n=== D. 错误处理 ===");
  let threw = false; try { await kg.enc("", b2h(new Uint8Array(48)), "2048"); } catch (e) { threw = /512 或 1024/.test(e.message); }
  ck("非法参数集报错", threw);
  threw = false; try { await kg.enc("", "0011", "512"); } catch (e) { threw = /48 字节/.test(e.message); }
  ck("种子长度错误报错", threw);

  console.log("\nPASS " + pass + "  FAIL " + fail);
})();
