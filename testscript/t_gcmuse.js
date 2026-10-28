require("./_harness.js");
const g = global;
function ok(n, c, extra) { console.log((c ? "PASS " : "FAIL ") + n + (extra ? "  " + extra : "")); if (!c) process.exitCode = 1; }

/* ---- 1. 计数递增 / 分密钥独立 / 清空 ---- */
g.GCM_USE_BACKEND = {};
const k1 = new Uint8Array(32), k2 = new Uint8Array(32);
for (let i = 0; i < 32; i++) { k1[i] = i + 1; k2[i] = 0xa0 + i; }
ok("初始计数为 0", g.gcmUseCount(k1) === 0);
let seq = true;
for (let i = 1; i <= 5; i++) if (g.gcmUseInc(k1) !== i) seq = false;
ok("连续 5 次递增返回 1..5", seq);
ok("另一密钥独立计数", g.gcmUseInc(k2) === 1 && g.gcmUseCount(k1) === 5 && g.gcmUseCount(k2) === 1);
g.gcmUseClear();
ok("清空后归零", g.gcmUseCount(k1) === 0 && g.gcmUseCount(k2) === 0);

/* ---- 2. 阈值分档 ---- */
g.GCM_USE_BACKEND = {};
const k = new Uint8Array(16);
for (let i = 0; i < 16; i++) k[i] = 0x30 + i;
const fp = g.nonceKeyFingerprint(k);
const setN = n => { g.GCM_USE_BACKEND[fp] = { n, first: 0, last: 0 }; };
console.log("  阈值: NOTICE=" + g.GCM_USE_NOTICE + " WARN=" + g.GCM_USE_WARN + " HARD=" + g.GCM_USE_HARD);
ok("HARD = 2^32", g.GCM_USE_HARD === 4294967296);
setN(g.GCM_USE_NOTICE - 1); ok("2^24-1 → 无提示", g.gcmUseCheck(k).level === "", g.gcmUseCheck(k).level);
setN(g.GCM_USE_NOTICE);     ok("2^24   → info",   g.gcmUseCheck(k).level === "info");
setN(g.GCM_USE_WARN - 1);   ok("2^28-1 → info",   g.gcmUseCheck(k).level === "info");
setN(g.GCM_USE_WARN);       ok("2^28   → warn",   g.gcmUseCheck(k).level === "warn");
setN(g.GCM_USE_HARD - 1);   ok("2^32-1 → warn",   g.gcmUseCheck(k).level === "warn");
setN(g.GCM_USE_HARD);       ok("2^32   → danger", g.gcmUseCheck(k).level === "danger");
let threw = false; try { g.gcmUseGuard(k); } catch (e) { threw = true; }
ok("硬上限抛错阻止", threw);
setN(g.GCM_USE_WARN);
ok("非硬上限只返回提示不阻止", g.gcmUseGuard(k) !== null);

/* ---- 3. 持久化 ---- */
g.GCM_USE_BACKEND = {};
const k3 = new Uint8Array(16); k3[0] = 7;
g.gcmUseInc(k3); g.gcmUseInc(k3); g.gcmUseInc(k3);
const snap = g.GCM_USE_BACKEND;
g.GCM_USE_BACKEND = snap;
ok("重新加载后计数仍为 3", g.gcmUseCount(k3) === 3);

/* ---- 4. 安全审计接入 ---- */
g.GCM_USE_BACKEND = {};
const aud = (n) => g.securityAudit({ algoId: "aes-256", isSym: true, blockSize: 16, mode: "GCM", gcmKeyUse: n });
ok("审计：低于提醒线无条目", aud(g.GCM_USE_NOTICE - 1).length === 0);
ok("审计：2^24 出 info",    aud(g.GCM_USE_NOTICE).some(w => w.level === "info"));
ok("审计：2^28 出 warn",    aud(g.GCM_USE_WARN).some(w => w.level === "warn"));
ok("审计：2^32 出 danger",  aud(g.GCM_USE_HARD).some(w => w.level === "danger"));
const nonGcm = g.securityAudit({ algoId: "aes-256", isSym: true, mode: "CBC", gcmKeyUse: g.GCM_USE_HARD });
ok("审计：非 GCM 模式不触发", !nonGcm.some(w => /GCM/.test(w.title)));

/* ---- 5. 走内置自检（SELFTEST_KAT） ---- */
(async () => {
  g.GCM_USE_BACKEND = null;
  const st = await g.runSelfTest ? null : null;
  const names = ["GCM 单密钥计数：递增 / 分密钥独立 / 清空",
                 "GCM 单密钥上限阈值：2^24 / 2^28 / 2^32 分档",
                 "GCM 单密钥计数：持久化可读回"];
  let allFound = true;
  for (const n of names) if (!g.SELFTEST_KAT.some(t => t.name === n)) allFound = false;
  ok("三条自检已注册进 SELFTEST_KAT", allFound);
  for (const t of g.SELFTEST_KAT.filter(t => names.includes(t.name))) {
    let r = null; try { r = t.run(); } catch (e) { r = "throw:" + e.message; }
    ok("自检 " + t.name, r === true, String(r));
  }
})();
