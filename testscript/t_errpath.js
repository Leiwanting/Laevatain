require("./_harness.js");
(async () => {
  // 注入：让 symEncrypt 抛错，验证 err 能否被捕获
  const orig = global.symEncrypt;
  global.symEncrypt = async () => { throw new Error("注入的假故障：boom"); };
  let r = await runSelfTest();
  console.log("[抛错场景] 失败 " + r.failed + "，首条原因: " + r.rt[0].err);
  // 注入：长度不符
  global.symEncrypt = orig;
  const od = global.symDecrypt;
  global.symDecrypt = async () => new Uint8Array(10);
  r = await runSelfTest();
  console.log("[长度不符] 失败 " + r.failed + "，首条原因: " + r.rt[0].err);
  global.symDecrypt = od;
})().catch(e => console.log("ERR " + e.stack));
