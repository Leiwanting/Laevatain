/* GOST R 34.11-94 哈希性能基准（常驻）
 *
 * 用法（必须在 index.html 所在目录执行）：
 *   node testscript/t_gost_perf.js
 *
 * 与 testscript/t_gost_kat.js 的分工：那个验正确性（Botan 官方 66 条），这个测吞吐。
 *
 * ⚠ 第 109 批的两条实测结论（别再踩）：
 *   1) 删除 U12 死代码（赋值后从未读取、且误引用 S[] 而非 s[]）：约 +3%，已保留。
 *   2) 把 330 处 U32(x) 内联成 (x) >>> 0：实测【变慢约 9%】（7.17ms → 7.85ms），已回退。
 *      V8 自己就能内联这个小函数，手写展开反而让代码膨胀、优化变差。
 *   3) enc() 内 32 元素轮密钥序号数组提为模块级 GOST_K：无显著变化，但消除了
 *      最内层热函数每次调用的分配，予以保留。
 *   结论：这个 VM 上"手写内联/展开"基本都是负收益，改之前先跑本脚本。
 */
require("./_harness.js");
const A = global.ALGOS.find(a => a.id === 'gost3411');
const T = global.ALGOS.find(a => a.id === 'gost3411tp');
if (!A) { console.log('未找到 gost3411'); process.exit(1); }

/* 输出指纹：跨改动比对，确保优化没有悄悄改变结果 */
const fp = [];
for (let n = 0; n <= 120; n++) fp.push(A.enc(new TextEncoder().encode('x'.repeat(n)), null, null, 'hex'));
const digest = require('crypto').createHash('sha256').update(fp.join('')).digest('hex').slice(0, 16);
console.log('输出指纹(前121长度): ' + digest + '   （第 109 批基准：改动前后必须一致）');
if (T) {
  const fp2 = [];
  for (let n = 0; n <= 40; n++) fp2.push(T.enc(new TextEncoder().encode('y'.repeat(n)), null, null, 'hex'));
  console.log('CryptoPro 参数集指纹: ' + require('crypto').createHash('sha256').update(fp2.join('')).digest('hex').slice(0, 16));
}

const msg = new Uint8Array(1024).fill(0x5a);
for (let i = 0; i < 400; i++) A.enc(msg, null, null, 'hex');
let best = 1e9;
for (let r = 0; r < 9; r++) {
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < 200; i++) A.enc(msg, null, null, 'hex');
  const dt = Number(process.hrtime.bigint() - t0) / 1e6;
  if (dt < best) best = dt;
}
console.log('性能 200KB: ' + best.toFixed(2) + ' ms  (' + (200 / best).toFixed(2) + ' KB/ms)');
console.log('  参考：第 109 批基线 7.38 ms；删 U12 + GOST_K 后 7.17~7.25 ms；U32 内联版 7.85 ms（已回退）');
