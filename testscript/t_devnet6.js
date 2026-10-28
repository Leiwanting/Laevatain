/* devnet6 创始状态根 —— 走 verkle-root 界面入口验证
 *
 * 向量：rust-verkle 官方 verkle-spec/assets/devnet6_genesis.json（278 个账户）
 * 期望：verkle-spec/tests/devnet6.rs::genesis_state_root
 *       0x1fbf85345a3cbba9a6d44f991b721e55620a22397c2a93ee8d5011136ac300ee
 *
 * 本脚本刻意走 reg 注册的 enc 入口，而不是直接调内部函数，
 * 以便同时覆盖「文本解析 → 条目构造 → 建树 → 输出」整条界面链路。
 */
const fs = require('fs');
const vm = require('vm');

const DIST = '/data/workspace/dist';
globalThis.__REG = [];
globalThis.reg = function (o) { globalThis.__REG.push(o); };
for (const f of ['crypto_verkle_basis.js', 'crypto_verkle.js']) {
  vm.runInThisContext(fs.readFileSync(DIST + '/' + f, 'utf8'), { filename: f });
}

const EXPECT = '1fbf85345a3cbba9a6d44f991b721e55620a22397c2a93ee8d5011136ac300ee';
const raw = fs.readFileSync('/data/workspace/work/testvectors/devnet6_verkle.txt', 'utf8');
const lines = raw.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));

const algo = globalThis.__REG.find(a => a.id === 'verkle-root');
if (!algo) { console.error('未找到 verkle-root 条目'); process.exit(1); }

const t0 = Date.now();
const out = algo.enc(new TextEncoder().encode(lines.join('\n')), null, null);
const ms = Date.now() - t0;

const ok = out.text === EXPECT;
console.log('条目数 =', lines.length, ' 耗时 =', ms, 'ms');
console.log('state_root =', out.text);
console.log('期望       =', EXPECT);
console.log(ok ? 'PASS' : 'FAIL');
if (!ok) process.exit(1);

/* 附带确认：root_hash（map_to_scalar）确实与 state_root 不同，
   避免将来有人把两者混用 */
const mi = out.textInfo;
if (!/root_hash = map_to_scalar_field/.test(mi)) { console.error('textInfo 缺少 root_hash 说明'); process.exit(1); }
console.log('附加说明齐全 ✓');
