/* MTProto 报文结构解析（mtproto-parse）验收
 *
 * 核心是交叉验证：用 mtproto-enc 真实加密出一段报文，交给 mtproto-parse 解析，
 * 逐段比对 auth_key_id / msg_key / 密文长度是否与加密端的返回值一致。
 * 这样能验出「分段偏移算错」这类 bug，而不仅是「输出不为空」。
 */
const fs = require('fs'), vm = require('vm'), nc = require('crypto');
global.crypto = nc.webcrypto;
global.btoa = s => Buffer.from(s, 'binary').toString('base64');
global.atob = s => Buffer.from(s, 'base64').toString('binary');
const mk = (id) => ({ id, value: '', textContent: '', _h: {}, addEventListener(e, f) { (this._h[e] = this._h[e] || []).push(f); }, dispatchEvent(e) { (this._h[e.type] || []).forEach(f => f.call(this, e)); }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, setAttribute() {}, appendChild() {}, style: {}, options: [], innerHTML: '' });
const store = {};
global.document = { getElementById(id) { return store[id] || (store[id] = mk(id)); }, createElement(t) { return mk(t); }, addEventListener() {}, readyState: 'complete', body: { appendChild() {} } };
global.window = global; global.addEventListener = () => {}; global.Event = class { constructor(t) { this.type = t; } };

const DIST = '/data/workspace/dist';
for (const f of ['Encryption_and_decryption_logic.js', 'crypto_tables.js', 'crypto_core.js',
  'crypto_otp.js', 'crypto_mtproto.js']) {
  const path = f === 'Encryption_and_decryption_logic.js' ? '/data/workspace/' + f : DIST + '/' + f;
  vm.runInThisContext(fs.readFileSync(path, 'utf8'), { filename: f });
}

const enc = ALGOS.find(a => a.id === 'mtproto-enc');
const parse = ALGOS.find(a => a.id === 'mtproto-parse');
if (!enc || !parse) { console.error('条目未注册', !!enc, !!parse); process.exit(1); }

let P = 0, F = 0;
function ok(name, cond, extra) {
  if (cond) { P++; console.log('  ✓ ' + name); }
  else { F++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

/* ---- 1. 真实加密一段报文，交给 parse 解析 ---- */
const AK = nc.randomBytes(256).toString('hex');
const blobHex = enc.enc('hello telegram', AK, 'c,text', 'hex');
const blobB = Buffer.from(blobHex, 'hex');
/* 加密端内部量：auth_key_id = SHA1(auth_key)[12:20] */
const kidReal = nc.createHash('sha1').update(Buffer.from(AK, 'hex')).digest().subarray(12, 20).toString('hex');
const mkReal = blobB.subarray(8, 24).toString('hex');
const ctLenReal = blobB.length - 24;

console.log('[1] 完整报文（offset=0）交叉验证');
let t = parse.enc(blobHex);
ok('auth_key_id 与 SHA1(auth_key)[12:20] 一致', t.includes(kidReal), t.split('\n').slice(0, 8).join(' | '));
ok('msg_key 与报文第 8..24 字节一致', t.includes(mkReal));
ok('密文长度正确（' + ctLenReal + ' 字节）', t.includes(ctLenReal + ' 字节 = '));
ok('密文是 16 的倍数', ctLenReal % 16 === 0 && t.includes('✓'));
ok('判定为无传输层前缀', t.includes('传输层前缀 : 无'));
ok('提示结构完整', t.includes('结构完整 ✓'));
ok('提示 salt/session_id 不用找', t.includes('salt / session_id / msg_id / seq_no 不用找'));
ok('给出 auth_key_id 反查方法', t.includes('SHA1(auth_key)[12:20]'));

console.log('[2] 前面加 4 字节传输层前缀');
const pre4 = Buffer.concat([Buffer.from('efbeadde', 'hex'), blobB]).toString('hex');
t = parse.enc(pre4);
ok('识别出 4 字节前缀', t.includes('传输层前缀 : 4 字节'), t.split('\n')[1]);
ok('跳过前缀后 msg_key 仍正确', t.includes(mkReal));

console.log('[3] 前面加 8 字节传输层前缀');
const pre8 = Buffer.concat([Buffer.from('0102030405060708', 'hex'), blobB]).toString('hex');
t = parse.enc(pre8);
ok('识别出 8 字节前缀', t.includes('传输层前缀 : 8 字节'), t.split('\n')[1]);
ok('跳过前缀后 msg_key 仍正确', t.includes(mkReal));

console.log('[4] Base64 输入');
t = parse.enc(blobB.toString('base64'));
ok('Base64 也能解析且 msg_key 一致', t.includes(mkReal));

console.log('[5] 异常输入');
t = parse.enc('00112233');
ok('过短报文被识别', t.includes('太短'), t.split('\n')[1]);
const cut = blobB.subarray(0, blobB.length - 3).toString('hex');  /* 砍掉 3 字节 → 非 16 倍数 */
t = parse.enc(cut);
ok('非 16 倍数被识别为截取不完整', t.includes('不是 16 的倍数') || t.includes('截取不完整'), t.split('\n').slice(-4).join(' | '));

console.log('[6] 条目属性');
ok('key=false（不显示密钥框）', parse.key === false);
ok('param=false（不显示参数框）', parse.param === false);
ok('group 为对称加密', parse.group === '对称加密');

console.log('\nMTProto 报文结构解析  PASS ' + P + '  FAIL ' + F);
process.exit(F ? 1 : 0);
