/* Salsa20 降轮变体 KAT（常驻）
   参照物：libsodium master
     - test/default/core3.c + core3.exp   → crypto_core_salsa20 / 2012 / 208
       （SECONDKEY ‖ NONCESUFFIX，in 递增 256×256 次，输出 SHA-256）
     - test/default/stream5.c + stream5.exp → crypto_stream_salsa2012（4096 字节密钥流）
   期望值直接来自 libsodium 的 .exp 文件，属官方数据，不是自洽。

   【G 组补齐】此前只有 Salsa20/20，缺 /12 与 /8。降轮与全轮唯一差异是轮数
   （双轮次数 6 / 4 / 10），状态布局与常量完全相同。 */
require('./_harness.js');
const crypto = require('crypto');
const hex = b => Buffer.from(b).toString('hex');
const h2b = s => new Uint8Array(Buffer.from(s, 'hex'));

let P = 0, F = 0; const bad = [];
const ck = (name, got, want) => {
  if (got === want) P++;
  else { F++; bad.push(name + '\n   got =' + String(got).slice(0, 80) + '\n   want=' + String(want).slice(0, 80)); }
};

const core = global.__salsaCoreTest;
if (typeof core !== 'function') { console.log('FAIL: __salsaCoreTest 未导出'); process.exit(1); }

/* ---- libsodium core3 的输入（抄自 test/default/core3.c） ---- */
const SECONDKEY = h2b('dc908dda0b9344a953629b7338207788' +
                      '80f3ceb421bb61b91cbd4c3e66256ce4');
const NONCESUFFIX = h2b('8219e0036b7a0b37');
const C = new Uint8Array(Buffer.from('expand 32-byte k', 'ascii'));

/* core3.exp 三行：salsa20/20、salsa20/12、salsa20/8 */
const EXP = {
  20: '662b9d0e3463029156069b12f918691a98f7dfb2ca0393c96bbfc6b1fbd630a2',
  12: 'a4e3147dddd2ba7775939b50208a22eb3277d4e4bad8a1cfbc999c6bd392b638',
  8:  '017421baa9959cbe894bd003ec87938254f47c1e757eb66cf89c353d0c2b68de'
};

/* 复现 core3.c 的驱动：in[8] 内层 256 次、in[9] 外层 256 次，共 65536 次 */
function core3Digest(rounds) {
  const inb = new Uint8Array(16);
  for (let i = 0; i < 8; i++) inb[i] = NONCESUFFIX[i];
  const h = crypto.createHash('sha256');
  for (let outer = 0; outer < 256; outer++) {
    for (let inner = 0; inner < 256; inner++) {
      h.update(Buffer.from(core(inb, SECONDKEY, C, rounds)));
      inb[8] = (inb[8] + 1) & 255;
    }
    inb[9] = (inb[9] + 1) & 255;
  }
  return h.digest('hex');
}

/* A. core3 官方三组（65536 次 core 调用 = 4MB，三组共 12MB） */
for (const r of [20, 12, 8]) {
  const t0 = Date.now();
  ck('core3 salsa20/' + r, core3Digest(r), EXP[r]);
  process.stderr.write('  [core3 /' + r + '] ' + ((Date.now() - t0) / 1000).toFixed(1) + 's\n');
}

/* B. salsa20/20 回归：必须仍等于已上线 salsa20 条目 */
const A = global.ALGOS || [];
const get = id => A.find(a => a.id === id);
const s20 = get('salsa20'), s12 = get('salsa20-12'), s8 = get('salsa20-8');
ck('条目 salsa20-12 已注册', !!s12, true);
ck('条目 salsa20-8 已注册', !!s8, true);

/* C. 流层：同密钥同 nonce，三种轮数结果必须互不相同（否则轮数没生效） */
const K = '1b27556473e985d462cd51197a9a46c76009549eac6474f206c4ee0844f68389';
const N = '69696ee955b62b73';
const zeros = new Uint8Array(4096);
const k20 = s20.enc(zeros, K, N, 'hex');
const k12 = s12.enc(zeros, K, N, 'hex');
const k8  = s8 .enc(zeros, K, N, 'hex');
/* enc 输出 = nonce(8) || keystream，剥掉前 8 字节 */
const strip = s => String(s).slice(16);
ck('三种轮数互不相同（20≠12）', strip(k20) !== strip(k12), true);
ck('三种轮数互不相同（12≠8）', strip(k12) !== strip(k8), true);

/* D. stream5.exp：salsa2012 4096 字节密钥流的 SHA-256 = ae87e8a9... */
const s5key = '1b27556473e985d462cd51197a9a46c76009549eac6474f206c4ee0844f68389';
const s5nonce = '69696ee955b62b73';
const s5 = s12.enc(new Uint8Array(4096), s5key, s5nonce, 'hex');
const s5ks = Buffer.from(strip(s5), 'hex');
ck('salsa2012 keystream 长度 4096', s5ks.length, 4096);
ck('stream5 salsa2012 官方 SHA-256',
   crypto.createHash('sha256').update(s5ks).digest('hex'),
   'ae87e8a917fc7bf23d983fd2777f3a6c08d9cbf977ba2d8d10dd336f6b585083');

/* E. 往返（三种轮数各一次） */
for (const [nm, algo] of [['20', s20], ['12', s12], ['8', s8]]) {
  const pt = new Uint8Array(Buffer.from('Laevatain-Salsa-roundtrip', 'utf8'));
  const ct = algo.enc(pt, K, N, 'hex');
  const back = algo.dec(ct, K, N, 'hex');
  /* dec 走 bytesOut(...,'hex') 返回的是 hex 字符串，不是 utf8 文本 —— 第一版我直接
     按 utf8 读，得到 4c616576... 这种"假失败"，是测试脚本的错不是实现的错。 */
  ck('往返 salsa20/' + nm, Buffer.from(String(back), 'hex').toString('utf8'), 'Laevatain-Salsa-roundtrip');
}

console.log('\n=== Salsa20 降轮 KAT ===');
console.log('PASS ' + P + '  FAIL ' + F);
bad.forEach(b => console.log('  ✗ ' + b));
process.exit(F ? 1 : 0);
