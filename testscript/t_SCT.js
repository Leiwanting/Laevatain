/* SCT 侧信道时序测试
   A. 静态：扫描标签/认证比对是否为「提前退出」型（非常数时间）
   B. 动态：同一算法，篡改标签第 0 字节 vs 最后字节，各测 N 次取中位数；
      同时测「同一位置测两遍」作为噪声基线，只有信号 > 噪声才算真泄漏。 */
require('./_harness.js');
const A = global.ALGOS || [];
const encB = new TextEncoder();
const hex = b => Buffer.from(b).toString('hex');
const unhex = s => Buffer.from(s, 'hex');

/* ---------- A. 静态扫描 ---------- */
const fs = require('fs');
const SRC = fs.readdirSync('.').filter(f => /^crypto_.*\.js$/.test(f) || f === 'Encryption_and_decryption_logic.js');
const CT_BAD = [
  [/for\s*\(\s*i\s*=\s*0[^)]*i\s*<\s*tagB[^)]*\)\s*if\s*\(\s*tag\[i\]\s*!==/, '字节循环提前 throw（tagB）'],
  [/for\s*\(\s*i\s*=\s*0[^)]*i\s*<\s*16[^)]*\)\s*if\s*\(\s*\w+\[i\]\s*!==\s*\w+\[i\]\s*\)\s*throw/, '16 字节循环提前 throw'],
  [/bytesToHex\([^)]*\)\s*!==\s*bytesToHex\(/, 'hex 字符串比较（提前退出）'],
  [/toHex\([^)]*\)\s*!==\s*toHex\(/, 'hex 字符串比较（提前退出）'],
];
const CT_GOOD = [/if\s*\(\s*diff\s*!==\s*0\s*\)/, /if\s*\(\s*dif\s*!==\s*0\s*\)/, /if\s*\(\s*!ok\s*\)/, /if\s*\(\s*!same\s*\)/];
console.log('=== SCT-A 静态：认证比对是否常数时间 ===');
let badN = 0;
for (const f of SRC) {
  const s = fs.readFileSync(f, 'utf8');
  s.split('\n').forEach((ln, i) => {
    for (const [re, why] of CT_BAD) if (re.test(ln)) { console.log('  ✗ 非常数时间 ' + f + ':' + (i + 1) + '  ' + why); badN++; }
  });
}
let goodN = 0;
for (const f of SRC) {
  const s = fs.readFileSync(f, 'utf8');
  s.split('\n').forEach(ln => { for (const re of CT_GOOD) if (re.test(ln)) goodN++; });
}
console.log('  常数时间写法(diff/dif/!ok 累加) 命中行数: ' + goodN);
console.log('  非常数时间命中: ' + badN);

/* ---------- B. 动态时序 ---------- */
const N = 300;
function med(arr) { const a = arr.slice().sort((x, y) => x - y); return a[a.length >> 1]; }
function timeIt(fn, n) {
  const t = [];
  for (let i = 0; i < n; i++) { const s = process.hrtime.bigint(); try { fn(); } catch (e) { } const e = process.hrtime.bigint(); t.push(Number(e - s) / 1e3); }
  return med(t); // 微秒
}
function flip(hexStr, byteIdx) {
  const b = unhex(hexStr);
  if (byteIdx < 0 || byteIdx >= b.length) return null;
  b[byteIdx] ^= 0x01; return b.toString('hex');
}
const TARGETS = ['aegis128l', 'ascon128a', 'eax-aes128', 'aes-gcm-siv'];
console.log('\n=== SCT-B 动态：标签不同位置篡改的时序差 ===');
console.log('  (噪声基线 = 同一位置测两遍的差；信号 = 第0字节 vs 最后字节的差)');
for (const id of TARGETS) {
  const a = A.find(x => x.id === id);
  if (!a) { console.log('  ' + id + ' 不存在，跳过'); continue; }
  let ct = null, k = null, p = null, fmt = 'hex';
  const KEYS = ['ab'.repeat(16), 'ab'.repeat(24), 'ab'.repeat(32)];
  const PARS = ['ab'.repeat(8), 'ab'.repeat(12), 'ab'.repeat(16)];
  outer: for (const kk of KEYS) for (const pp of PARS) {
    try {
      var r = a.enc(encB.encode('hello 123 中文'), kk, pp, fmt);
      /* async 的 enc：抛错会变成 rejected promise，try/catch 抓不到，
         必须挂 .catch 否则 Node 报未处理拒绝、退出码变 1。这里直接跳过异步条目。 */
      if (r && typeof r.then === 'function') { r.catch(function () { }); continue; }
      ct = r;
      if (ct) { k = kk; p = pp; break outer; }
    } catch (e) { }
  }
  if (!ct) { console.log('  ' + id + ' 无法加密，跳过'); continue; }
  if (typeof ct === 'object' && !(typeof ct === 'string')) { console.log('  ' + id + ' 输出非字符串，跳过'); continue; }
  const len = unhex(String(ct)).length;
  if (len < 17) { console.log('  ' + id + ' 输出过短(' + len + ')，跳过'); continue; }
  const c0 = flip(String(ct), len - 16);   // 标签第 0 字节
  const cL = flip(String(ct), len - 1);    // 标签最后字节
  if (!c0 || !cL) { console.log('  ' + id + ' 构造失败'); continue; }
  const f0 = () => a.dec(c0, k, p, fmt), fL = () => a.dec(cL, k, p, fmt);
  try { f0(); } catch (e) { } try { fL(); } catch (e) { } // 预热
  const t0a = timeIt(f0, N), tLa = timeIt(fL, N);
  const t0b = timeIt(f0, N), tLb = timeIt(fL, N);
  const noise = Math.abs(t0a - t0b);                 // 同位置两遍之差 = 噪声
  const signal = Math.abs(((t0a + t0b) / 2) - ((tLa + tLb) / 2));
  const verdict = signal > noise * 3 + 0.5 ? '★ 疑似泄漏' : '在噪声内';
  console.log('  ' + id.padEnd(14) + ' t[0]=' + ((t0a + t0b) / 2).toFixed(2) + 'us  t[last]=' + ((tLa + tLb) / 2).toFixed(2) +
    'us  信号=' + signal.toFixed(2) + '  噪声=' + noise.toFixed(2) + '  → ' + verdict);
}
console.log('\nSCT 完成');
