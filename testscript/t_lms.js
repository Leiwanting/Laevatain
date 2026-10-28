/* LMS / HSS —— RFC 8554 验证脚本
 * 官方向量：RFC 8554 Appendix F Test Case 2 顶层密钥（H10 / W4）
 */
const { ALGOS } = require("./_harness.js");
const LMS = global.LMS;
const fs = require("fs");

let P = 0, F = 0;
const ok = (c, m) => { c ? (P++, console.log("PASS " + m)) : (F++, console.log("FAIL " + m)); };
const hex = b => Buffer.from(b).toString("hex");

function main() {
  if (!LMS) { console.log("FAIL LMS 未加载"); process.exit(1); }

  /* ---- 1. 参数表 vs RFC 8554 Table 1（n=32） ---- */
  const tbl = [[1, 265, 7], [2, 133, 6], [4, 67, 4], [8, 34, 0]];
  for (const [w, p, ls] of tbl) {
    const r = LMS.params(32, w);
    ok(r.p === p && r.ls === ls, `params n=32 w=${w} → p=${r.p}(期望${p}) ls=${r.ls}(期望${ls})`);
  }
  const t24 = LMS.params(24, 8);
  ok(t24.p === 26 && t24.ls === 0, `params n=24 w=8 → p=${t24.p}(期望26) ls=${t24.ls}`);

  /* ---- 2. 官方向量：TC2 顶层公钥（H10 / W4）---- */
  const I = Buffer.from("d08fabd4a2091ff0a8cb4ed834e74534", "hex");
  const SEED = Buffer.from("558b8966c48ae9cb898b423c83443aae014a72f1b1ab5cc85cf1d892903b5439", "hex");
  const KEXP = "32a58885cd9ba0431235466bff9651c6c92124404d45fa53cf161c28f1ad5a8e";
  const t0 = Date.now();
  const kg = LMS.keygen(I, SEED, 6, 3);
  console.log(`  （H10/W4 建树耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s，1024 叶 × 67 链）`);
  ok(hex(kg.K) === KEXP, "官方向量 TC2 顶层公钥 K 逐字节一致");
  ok(hex(kg.pk) === "0000000600000003" + hex(I) + KEXP, "完整公钥序列化（type‖otstype‖I‖K）");

  /* ---- 2b. 官方向量：RFC 8554 TC1 sig[0] 验签（H5 / W8）---- */
  const tc1 = {};
  fs.readFileSync(require("fs").existsSync("../lms/rfc8554_tc1.txt") ? "../lms/rfc8554_tc1.txt" : "testvectors/lms_rfc8554_tc1.txt", "utf8").split("\n").forEach(l => {
    if (l.indexOf("|") > 0) { const i = l.indexOf("|"); tc1[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
  });
  const I1 = Buffer.from(tc1["I"], "hex"), K1 = Buffer.from(tc1["K"], "hex");
  const C1 = Buffer.from(tc1["C"], "hex"), q1 = parseInt(tc1["q"], 16);
  let y1 = []; for (let i = 0; i < 34; i++) y1.push(Buffer.from(tc1["y[" + i + "]"], "hex"));
  let p1 = []; for (let i = 0; i < 5; i++) p1.push(Buffer.from(tc1["path[" + i + "]"], "hex"));
  const I2b = Buffer.from("d2f14ff6346af964569f7d6cb880a1b6", "hex");
  const K2b = Buffer.from("6c5004917da6eafe4d9ef6c6407b3db0e5485b122d9ebe15cda93cfec582d7ab", "hex");
  const signed = Buffer.concat([Buffer.from("00000005", "hex"), Buffer.from("00000004", "hex"), I2b, K2b]);
  const pk1 = Buffer.concat([Buffer.from("00000005", "hex"), Buffer.from("00000004", "hex"), I1, K1]);
  const sig1 = Buffer.concat([Buffer.from("00000005", "hex"), Buffer.from("00000004", "hex"), C1,
    Buffer.concat(y1), Buffer.from("00000005", "hex"), Buffer.concat(p1)]);
  const v1 = LMS.verify(pk1, signed, sig1);
  ok(v1.ok, "官方向量 TC1 sig[0] 验签通过（H5/W8，签的是第二级公钥）");
  ok(!LMS.verify(pk1, Buffer.from("tampered"), sig1).ok, "TC1：换消息 → 验签拒绝");
  const sig1b = Buffer.from(sig1); sig1b[60] ^= 1;
  ok(!LMS.verify(pk1, signed, sig1b).ok, "TC1：改签名 → 验签拒绝");

  /* ---- 3. 往返 + 篡改（用较快的 H5/W2）---- */
  const I2 = Buffer.from("215f83b7ccb9acbcd08db97b0d04dc2b", "hex");
  const S2 = Buffer.from("a1c4696e2608035a886100d05cd99945eb3370731884a8235e2fb3d4d71f2547", "hex");
  const msg = Buffer.from("hello LMS", "utf8");
  const C = Buffer.from("3d46bee8660f8f215d3f96408a7a64cf1c4da02b63a55f62c666ef5707a914ce", "hex").subarray(0, 32);
  const pk = LMS.keygen(I2, S2, 5, 2);
  const sg = LMS.sign(I2, S2, 3, C, msg, 5, 2);
  ok(LMS.verify(pk.pk, msg, sg.sig).ok, "H5/W2 签名→验签往返通过（q=3）");
  ok(!LMS.verify(pk.pk, Buffer.from("hello LMT", "utf8"), sg.sig).ok, "篡改消息 → 验签拒绝");
  const bad = Buffer.from(sg.sig);
  bad[20] ^= 1;
  ok(!LMS.verify(pk.pk, msg, bad).ok, "篡改签名 → 验签拒绝");
  const pk2 = Buffer.from(pk.pk); pk2[40] ^= 1;
  ok(!LMS.verify(pk2, msg, sg.sig).ok, "篡改公钥 → 验签拒绝");

  /* ---- 4. 不同叶子索引：路径必须不同 ---- */
  const s0 = LMS.sign(I2, S2, 0, C, msg, 5, 2);
  const s1 = LMS.sign(I2, S2, 1, C, msg, 5, 2);
  ok(hex(s0.sig) !== hex(s1.sig), "不同叶子的签名不同");
  ok(LMS.verify(pk.pk, msg, s0.sig).ok && LMS.verify(pk.pk, msg, s1.sig).ok, "不同叶子的签名都能验过");

  /* ---- 5. 界面入口 ---- */
  const find = id => (ALGOS || []).find(a => a.id === id);
  const eKg = find("lms-keygen"), eSg = find("lms-sign"), eVf = find("lms-verify");
  ok(!!eKg && !!eSg && !!eVf, "三个界面条目已注册");
  if (eSg && eVf) {
    const pkH = hex(pk.pk);
    const sigH = (async () => null);
    eSg.enc(msg, hex(S2), hex(I2) + ",3," + hex(C) + ",5,2").then(r => {
      ok(/签名/.test(r.text), "界面签名入口产出签名");
      const m = r.text.match(/[0-9a-f]{200,}/);
      const sig = m ? m[0] : null;
      ok(!!sig, "签名入口输出含可解析的 Hex 签名");
      return eVf.enc(msg, pkH, sig).then(r2 => {
        ok(/有效/.test(r2.text), "界面验签入口判定有效");
        return eVf.enc(Buffer.from("x", "utf8"), pkH, sig).then(r3 => {
          ok(/无效/.test(r3.text), "界面验签入口对错误消息判无效");
          done();
        });
      });
    }).catch(e => { console.log("FAIL 界面入口异常 " + e.message); console.log((e.stack||"").split("\n").slice(0,6).join("\n")); done(); });
  } else done();
}

function done() {
  console.log(`\n==== LMS: PASS ${P}  FAIL ${F} ====`);
  process.exit(F ? 1 : 0);
}
main();
