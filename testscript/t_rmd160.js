/* RIPEMD-160 验收 + 性能基准（常驻）
 *
 * 用法（必须在 index.html 所在目录执行）：
 *   node testscript/t_rmd160.js
 *
 * 向量来源：ISO/IEC 10118-3 标准 RIPEMD-160 测试向量（7 条 + 100 万次 'a'）。
 *
 * ⚠ 第 109 批的教训（别再踩）：
 *   曾把 80 轮按 16 轮分 5 段展开（f 表达式与 K 常量段内固定化 + 索引表提局部引用），
 *   期望消除 160 次 rmdF() 调用。实测【变慢】：200KB 从 5.83ms 变 6.82ms（0.86x），
 *   交换测量顺序复核仍是 0.87x。原因是函数体积膨胀后 V8 反而优化得更差，
 *   而单循环 + rmdF 的 if 链 V8 本来就处理得很好。已回退，结论写在 crypto_core.js。
 *   改热循环前务必先跑本脚本确认收益，不要凭直觉"展开一定更快"。
 */
require("./_harness.js");
const A = global.ALGOS.find(a => a.id === 'ripemd160');
if (!A) { console.log('未找到 ripemd160'); process.exit(1); }
const enc = s => A.enc(new TextEncoder().encode(s), null, null, 'hex');

const VEC = [
  ['', '9c1185a5c5e9fc54612808977ee8f548b2258d31'],
  ['a', '0bdc9d2d256b3ee9daae347be6f4dc835a467ffe'],
  ['abc', '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc'],
  ['message digest', '5d0689ef49d2fae572b881b123a85ffa21595f36'],
  ['abcdefghijklmnopqrstuvwxyz', 'f71c27109c692c1b56bbdceb5b9d2865b3708dbc'],
  ['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    'b0e20b6e3116640286ed3a87a5713079b21f5189'],
  ['1234567890'.repeat(8), '9b752e45573d4b39f4dbd3323cab82bf63326bfb'],
  ['a'.repeat(1000000), '52783243c1697bdbe16d37f97f68f08325dc1528'],
];

let P = 0, F = 0;
for (const [inp, exp] of VEC) {
  const got = enc(inp);
  if (got === exp) P++;
  else { F++; console.log('  FAIL len=' + inp.length + ' got ' + got + ' exp ' + exp); }
}
console.log('RIPEMD-160 标准向量  PASS ' + P + '  FAIL ' + F);

/* 性能基准：预热后取 9 轮最快值，避免 JIT 冷启动污染 */
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
console.log('  参考：第 109 批基线 5.83~6.05 ms；分段展开版 6.82 ms（负优化，已回退）');
process.exit(F ? 1 : 0);
