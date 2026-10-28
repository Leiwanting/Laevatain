require("./_harness.js");
const g = global;
function ok(n, c, extra) { console.log((c ? "PASS " : "FAIL ") + n + (extra ? "  " + extra : "")); if (!c) process.exitCode = 1; }
(async () => {
  g.GCM_USE_BACKEND = {};
  const aes = g.ALGOS.filter(a => a.isSym && a.id === "aes256")[0];
  const data = g.strToBytes("hello gcm key-use counter");
  const before = g.gcmUseCount(new Uint8Array(32));
  const r = await g.symEncrypt(aes, data, "pw-counter", "GCM", "", "", false, "", null, 16);
  ok("GCM 加密成功", !!(r && r.ciphertext));
  /* 用同一口令派生密钥，查计数 */
  const kb = await g.deriveKeyBytes("pw-counter", aes.keyLen, null, null);
  const n1 = g.gcmUseCount(kb);
  ok("加密后该密钥计数 = 1", n1 === 1, "实际 " + n1);
  const r2 = await g.symEncrypt(aes, data, "pw-counter", "GCM", "", "", false, "", null, 16);
  const n2 = g.gcmUseCount(kb);
  ok("再加密一次计数 = 2", n2 === 2, "实际 " + n2);
  /* 解密不计数 */
  await g.symDecrypt(aes, r.ciphertext, "pw-counter", "GCM", "", g.bytesToHex(r.iv), "", null, 16);
  ok("解密不计数", g.gcmUseCount(kb) === 2, "实际 " + g.gcmUseCount(kb));
  /* 换口令 = 换密钥，独立计数 */
  await g.symEncrypt(aes, data, "other-pw", "GCM", "", "", false, "", null, 16);
  const kb2 = await g.deriveKeyBytes("other-pw", aes.keyLen, null, null);
  ok("换口令后独立计数", g.gcmUseCount(kb2) === 1 && g.gcmUseCount(kb) === 2);
  /* 硬上限真的会拦住加密 */
  g.GCM_USE_BACKEND[g.nonceKeyFingerprint(kb)] = { n: g.GCM_USE_HARD, first: 0, last: 0 };
  let err = "";
  try { await g.symEncrypt(aes, data, "pw-counter", "GCM", "", "", false, "", null, 16); }
  catch (e) { err = e && e.message ? e.message : String(e); }
  ok("达到 2^32 后加密被阻止", /2\^32|单密钥上限/.test(err), err.slice(0, 60));
})();
