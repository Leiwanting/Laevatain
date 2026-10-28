/* age 双向交叉验证：JS ↔ Python 独立参照实现 */
const fs = require("fs"), vm = require("vm"), nc = require("crypto"), { execSync } = require("child_process");
global.crypto = nc.webcrypto; global.TextEncoder = require("util").TextEncoder; global.TextDecoder = require("util").TextDecoder;
global.btoa = s => Buffer.from(s, "binary").toString("base64");
global.atob = s => Buffer.from(s, "base64").toString("binary");
const mk = id => ({ id, value: "", _h: {}, options: [], addEventListener() { }, dispatchEvent() { }, classList: { add() { }, remove() { }, toggle() { }, contains() { return false; } }, setAttribute() { }, appendChild() { }, style: { }, innerHTML: "", textContent: "" });
const store = { }; global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t), querySelector() { return mk('q'); }, querySelectorAll() { return []; }, addEventListener() { }, readyState: "complete", body: { appendChild() { } } };
global.window = global; global.addEventListener = () => { }; global.Event = function (t) { this.type = t; };
const html = fs.readFileSync("index.html", "utf8");
for (const f of [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m => m[1])) vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f });

const IDENT = "AGE-SECRET-KEY-184JMZMVQH3E6U0PSL869004Y3U2NYV7R30EU99CSEDNPH02YUVFSZW44VU";
const RECIP = "age1cy0su9fwf3gf9mw868g5yut09p6nytfmmnktexz2ya5uqg9vl9sss4euqm";
const SIZES = [0, 1, 15, 16, 100, 65535, 65536, 65537, 131072, 131073];
let pass = 0, fail = 0;
const P = (t) => { pass++; console.log("  PASS " + t); };
const F = (t, e) => { fail++; console.log("  FAIL " + t + " " + (e || "")); };
const hex = b => Buffer.from(b).toString("hex");
(async function () {
  console.log("【1】官方 example.age 解密（age v1.2.1 testdata）");
  const of = new Uint8Array(fs.readFileSync("testvectors/age_example.age"));
  const pt0 = await ageDecrypt(of, IDENT);
  new TextDecoder().decode(pt0) === "Black lives matter." ? P("解密 = \"Black lives matter.\"") : F("官方文件", new TextDecoder().decode(pt0));

  console.log("\n【2】JS 加密 → Python 独立实现解密（10 组长度，含分块边界）");
  const cases = [];
  for (const n of SIZES) {
    const pt = new Uint8Array(n); for (let i = 0; i < n; i++) pt[i] = (i * 7 + 13) & 0xff;
    const file = await ageEncrypt(pt, RECIP, false);
    cases.push({ len: n, pt_hex: hex(pt), file_b64: Buffer.from(file).toString("base64") });
  }
  fs.writeFileSync("/tmp/js_age.json", JSON.stringify(cases));
  const out1 = execSync("python3 ../work/age_ref2.py check /tmp/js_age.json").toString();
  console.log(out1.trim().split("\n").filter(l => l.includes("FAIL")).join("\n") || "  （无 FAIL 行）");
  const m1 = out1.match(/PASS (\d+) FAIL (\d+)/); pass += +m1[1]; fail += +m1[2];
  console.log("  → PASS " + m1[1] + " FAIL " + m1[2]);

  console.log("\n【3】Python 独立实现加密 → JS 解密（10 组）");
  execSync("python3 ../work/age_ref2.py gen /tmp/py_age.json");
  const pc = JSON.parse(fs.readFileSync("/tmp/py_age.json", "utf8"));
  for (const c of pc) {
    try {
      const got = await ageDecrypt(new Uint8Array(Buffer.from(c.file_b64, "base64")), IDENT);
      hex(got) === c.pt_hex ? P("len=" + c.len) : F("len=" + c.len, "明文不符");
    } catch (e) { F("len=" + c.len, "抛异常 " + e.message); }
  }

  console.log("\n【4】装甲（armor）往返 + 篡改/错误私钥拒绝");
  const msg = new TextEncoder().encode("armor round trip 测试");
  const armored = new TextDecoder().decode(await ageEncrypt(msg, RECIP, true));
  /^-----BEGIN AGE ENCRYPTED FILE-----/.test(armored) ? P("装甲格式正确") : F("装甲格式");
  const back = await ageDecrypt(ageDearmor(armored), IDENT);
  new TextDecoder().decode(back) === "armor round trip 测试" ? P("装甲往返") : F("装甲往返");

  const good = await ageEncrypt(msg, RECIP, false);
  const bad = new Uint8Array(good); bad[bad.length - 1] ^= 1;
  try { await ageDecrypt(bad, IDENT); F("篡改未被拒绝"); } catch (e) { P("篡改被拒绝"); }
  const wrong = "AGE-SECRET-KEY-1" + "0".repeat(60);
  try { await ageDecrypt(good, wrong); F("错误私钥未被拒绝"); } catch (e) { P("错误私钥被拒绝"); }

  console.log("\n【5】界面入口（ALGOS 注册与加解密可用）");
  for (const id of ["age-enc", "age-dec", "age-keygen"]) { ALGOS.find(a => a.id === id) ? P("注册 " + id) : F("未注册 " + id); }
  const A = ALGOS.find(a => a.id === "age-enc"), D = ALGOS.find(a => a.id === "age-dec");
  const r = await A.enc(msg, RECIP, "", "base64");
  const rr = await D.dec(r.text, IDENT, "", "base64");
  String(rr).includes("armor round trip") || Buffer.from(rr).length ? (new TextDecoder().decode(new Uint8Array(Buffer.from(String(rr), "base64"))).includes("armor round trip") ? P("界面加密→界面解密往返") : F("界面往返", String(rr).slice(0, 40))) : F("界面往返空");
  const K = ALGOS.find(a => a.id === "age-keygen");
  const kt = await K.enc("", "", "", "text");
  /AGE-SECRET-KEY-1/.test(String(kt.text || kt)) && /age1/.test(String(kt.text || kt)) ? P("keygen 输出身份+收件人") : F("keygen 输出", String(kt).slice(0, 60));

  console.log("\nage 交叉验证：PASS " + pass + "  FAIL " + fail);
})();
