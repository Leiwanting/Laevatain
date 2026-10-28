/* MTProto 1.0 + auth_key_id 交叉验证
 *
 * 参照物（完全独立于本工具箱）：
 *   1) IGE  —— telethon 1.45.0 的 AES.encrypt_ige/decrypt_ige（底层 pyaes，第三方）
 *   2) KDF  —— 公式取自 gotd/td crypto/kdf_v1.go 与 ferogram_crypto(Rust) lib.rs，
 *              两者互相独立且结论一致；msg_key 取位另有官方
 *              core.telegram.org/mtproto 佐证（"lower 128 bits of SHA-1 …
 *              excluding the padding bytes"）
 *   3) auth_key_id —— telethon crypto/authkey.py 的 AuthKey 类（第三方）
 *
 * 本脚本走 reg 注册的 enc/dec 入口，覆盖「参数解析 → 条目构造 → 输出」界面链路。
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

const E = ALGOS.find(a => a.id === 'mtproto1-enc');
const D = ALGOS.find(a => a.id === 'mtproto1-dec');
const K = ALGOS.find(a => a.id === 'mtproto1-kdf');
const A = ALGOS.find(a => a.id === 'mtproto-authkeyid');
if (!E || !D || !K || !A) { console.error('条目未注册', !!E, !!D, !!K, !!A); process.exit(1); }

const path = require('path');
function rd(rel, abs) {
  const p1 = path.resolve(__dirname, rel);
  if (fs.existsSync(p1)) return fs.readFileSync(p1, 'utf8');
  return fs.readFileSync(abs, 'utf8');
}
function hex(b) {
  if (typeof b === 'string') return b.replace(/[\s,:]/g, '').toLowerCase();
  let h = '';
  for (let i = 0; i < b.length; i++) { const c = b[i].toString(16); h += c.length < 2 ? '0' + c : c; }
  return h;
}
function seqno(h) { return Buffer.from(h, 'hex').readInt32LE(0); }

let pass = 0, fail = 0;
const bad = [];

/* ============ MTProto 1.0 ============ */
const vec = rd('testvectors/mtproto1_ref.txt', '/data/workspace/mt/mtproto1_ref.txt')
  .split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'))
  .map(l => l.trim().split('|'))
  .map((f, i) => ({ idx: i, auth_key: f[0], client: f[1] === '01', salt: f[2], session: f[3],
    msg_id: f[4], seq_no: f[5], data: f[6], padding: f[7],
    msg_key: f[8], aes_key: f[9], aes_iv: f[10], blob: f[11] }));

for (const v of vec) {
  const tag = 'v1#' + v.idx + (v.client ? '(c)' : '(s)') + ' L=' + (v.data.length / 2);
  try {
    /* 1) KDF 条目 */
    const kd = hex(K.enc(v.msg_key, v.auth_key, v.client ? 'c' : 's', 'hex'));
    if (kd !== (v.aes_key + v.aes_iv).toLowerCase()) {
      fail++; bad.push(tag + ' KDF: got ' + kd.slice(0, 32) + ' want ' + (v.aes_key + v.aes_iv).slice(0, 32)); continue;
    }
    /* 2) 加密条目（界面入口） */
    const p = [v.client ? 'c' : 's', 'hex', v.salt, v.session, v.msg_id,
      String(seqno(v.seq_no)), v.padding].join(',');
    const got = hex(E.enc(v.data, v.auth_key, p, 'hex'));
    if (got !== v.blob.toLowerCase()) {
      fail++; bad.push(tag + ' ENC: got ' + got.slice(0, 48) + '… want ' + v.blob.slice(0, 48) + '…'); continue;
    }
    /* 3) 解密条目（界面入口） */
    const txt = D.dec(v.blob, v.auth_key, v.client ? 'c' : 's', 'hex');
    if (txt.indexOf('✓ 通过') < 0) { fail++; bad.push(tag + ' DEC: msg_key 校验未通过'); continue; }
    if (txt.indexOf('data(hex)   : ' + v.data.toLowerCase()) < 0) { fail++; bad.push(tag + ' DEC: data 不一致'); continue; }
    if (txt.indexOf('aes_key     : ' + v.aes_key.toLowerCase()) < 0) { fail++; bad.push(tag + ' DEC: aes_key 不一致'); continue; }
    pass++;
  } catch (e) { fail++; bad.push(tag + ' 异常: ' + e.message); }
}

/* 判别测试：方向填反 / 篡改一个字节，都必须被 msg_key 校验挡住 */
{
  const v = vec.find(x => x.data.length > 0) || vec[0];
  let t = D.dec(v.blob, v.auth_key, v.client ? 's' : 'c', 'hex');
  if (t.indexOf('✗ 失败') < 0) { fail++; bad.push('v1 方向判别：c/s 填反仍通过'); } else pass++;
  const b = Buffer.from(v.blob, 'hex'); b[b.length - 1] ^= 0x01;
  t = D.dec(b.toString('hex'), v.auth_key, v.client ? 'c' : 's', 'hex');
  if (t.indexOf('✗ 失败') < 0) { fail++; bad.push('v1 篡改判别：改一字节仍通过'); } else pass++;
}
/* 判别测试 2：1.0 与 2.0 的 KDF 必须不同（防止把两套写混） */
{
  const K2 = ALGOS.find(a => a.id === 'mtproto-kdf');
  const v = vec[0];
  const a1 = hex(K.enc(v.msg_key, v.auth_key, 'c', 'hex'));
  const a2 = hex(K2.enc(v.msg_key, v.auth_key, 'c', 'hex'));
  if (a1 === a2) { fail++; bad.push('v1/v2 KDF 输出相同，说明两套写混了'); } else pass++;
  /* v2 解密条目去解 v1 报文必须失败 */
  const D2 = ALGOS.find(a => a.id === 'mtproto-dec');
  const t = D2.dec(v.blob, v.auth_key, 'c', 'hex');
  if (t.indexOf('✗ 失败') < 0) { fail++; bad.push('v2 解密条目竟然通过了 v1 报文'); } else pass++;
}

/* ============ auth_key_id ============ */
const kid = rd('testvectors/authkeyid_ref.txt', '/data/workspace/mt/authkeyid_ref.txt')
  .split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'))
  .map(l => l.trim().split('|'));
for (let i = 0; i < kid.length; i++) {
  const [ak, id, aux] = kid[i];
  const t = A.enc('', ak, '', 'hex');
  if (t.indexOf('auth_key_id : ' + id.toLowerCase()) < 0) { fail++; bad.push('kid#' + i + ' id 不一致'); continue; }
  if (t.indexOf('aux_hash    : ' + aux.toLowerCase()) < 0) { fail++; bad.push('kid#' + i + ' aux_hash 不一致'); continue; }
  pass++;
}
/* auth_key_id 非法长度必须抛错 */
try { A.enc('', '0011', '', 'hex'); fail++; bad.push('kid 长度校验：256 字节限制未生效'); }
catch (e) { pass++; }

console.log('MTProto 1.0 / auth_key_id 官方向量  PASS ' + pass + '  FAIL ' + fail);
bad.forEach(b => console.log(b));
process.exit(fail ? 1 : 0);
