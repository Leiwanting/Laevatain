require("./_harness.js");
(async () => {
  const r = await runSelfTest();
  console.log("汇总: 通过 " + r.passed + " · 失败 " + r.failed + " · 跳过 " + r.skipped);
  const badK = r.kat.filter(x => x.ok !== true);
  if (badK.length) { console.log("\n[KAT 未通过]"); badK.forEach(x => console.log("  " + (x.ok === 'skip' ? 'skip ' : 'FAIL ') + x.name)); }
  const badR = r.rt.filter(x => !x.ok);
  console.log("\n[往返 总数 " + r.rt.length + " 失败 " + badR.length + "]");
  badR.forEach(x => console.log("  FAIL " + x.name));
})().catch(e => console.log("ERR " + e.stack));
