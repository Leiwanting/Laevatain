/* MTProto 2.0 交叉验证
 *
 * 参照物（完全独立于本工具箱）：
 *   1) Python 参考实现 mt/ref_mtproto.py
 *      —— SHA-256 用 hashlib，AES 用 cryptography 库的 ECB，IGE 按 telethon
 *         telethon/crypto/aes.py 的语义手写
 *   2) 规范：core.telegram.org/mtproto + telethon mtprotostate.py::_calc_key
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

const enc = ALGOS.find(a => a.id === 'mtproto-enc');
const dec = ALGOS.find(a => a.id === 'mtproto-dec');
const kdf = ALGOS.find(a => a.id === 'mtproto-kdf');
if (!enc || !dec || !kdf) { console.error('条目未注册', !!enc, !!dec, !!kdf); process.exit(1); }

function seq(v) {
  /* seq_no 是小端 int32 */
  const b = Buffer.from(v.seq_no, 'hex');
  return b.readInt32LE(0);
}

/* 优先从解压目录的 testvectors/ 读取（独立复算），找不到再退回工作区 */
const path = require('path');
function rd(rel, abs) {
  const p1 = path.resolve(__dirname, rel);
  if (fs.existsSync(p1)) return fs.readFileSync(p1, 'utf8');
  return fs.readFileSync(abs, 'utf8');
}
function parseVec(text) {
  return text.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => l.trim().split('|'))
    .map(f => ({ auth_key: f[0], client: f[1] === '1', salt: f[2], session_id: f[3],
      msg_id: f[4], seq_no: f[5], data: f[6], padding: f[7],
      msg_key: f[8], aes_key: f[9], aes_iv: f[10], blob: f[11] }));
}
const vec = parseVec(rd('testvectors/mtproto_ref.txt', '/data/workspace/mt/mtproto_ref.txt'));
let pass = 0, fail = 0, skip = 0;
const bad = [];

function hex(b) {
  if (typeof b === 'string') return b.replace(/[\s,:]/g, '').toLowerCase();
  let h = '';
  for (let i = 0; i < b.length; i++) { const c = b[i].toString(16); h += c.length < 2 ? '0' + c : c; }
  return h;
}

for (const v of vec) {
  const tag = '#' + v.idx + (v.client ? '(c)' : '(s)');
  try {
    /* ---- 1) KDF 条目：msg_key → aes_key‖aes_iv ---- */
    const kd = kdf.enc(v.msg_key, v.auth_key, v.client ? 'c' : 's', 'hex');
    const kdHex = hex(kd);
    const wantK = (v.aes_key + v.aes_iv).toLowerCase();
    if (kdHex !== wantK) { fail++; bad.push(tag + ' KDF: got ' + kdHex.slice(0, 32) + ' want ' + wantK.slice(0, 32)); continue; }

    /* ---- 2) 加密条目：走界面入口，输出完整报文 Hex ---- */
    const p = [v.client ? 'c' : 's', 'hex', v.salt, v.session_id, v.msg_id,
      String(seq(v)), v.padding].join(',');
    const blob = enc.enc(v.data, v.auth_key, p, 'hex');
    const blobHex = hex(blob);
    if (blobHex !== v.blob.toLowerCase()) {
      fail++; bad.push(tag + ' ENC: got ' + blobHex.slice(0, 48) + '… want ' + v.blob.slice(0, 48) + '…');
      continue;
    }

    /* ---- 3) 解密条目：走界面入口，检查 msg_key 校验 + data 还原 ---- */
    const txt = dec.dec(v.blob, v.auth_key, v.client ? 'c' : 's', 'hex');
    if (txt.indexOf('✓ 通过') < 0) { fail++; bad.push(tag + ' DEC: msg_key 校验未通过\n' + txt); continue; }
    if (txt.indexOf('data(hex)   : ' + v.data.toLowerCase()) < 0) {
      fail++; bad.push(tag + ' DEC: data 不一致'); continue;
    }
    if (txt.indexOf('aes_key     : ' + v.aes_key.toLowerCase()) < 0) {
      fail++; bad.push(tag + ' DEC: aes_key 不一致'); continue;
    }
    pass++;
  } catch (e) {
    fail++; bad.push(tag + ' 异常: ' + e.message);
  }
}

function seq(v) {
  /* seq_no 是小端 int32 */
  const b = Buffer.from(v.seq_no, 'hex');
  return b.readInt32LE(0);
}

/* ---- 24 组随机向量：由 telethon 本体（pyaes）生成 ---- */
const tf = path.resolve(__dirname, 'testvectors/mtproto_telethon.txt');
if (fs.existsSync(tf)) {
  const tl = fs.readFileSync(tf, 'utf8').split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
  for (const line of tl) {
    const f = line.trim().split('|');
    const [ak, cl, salt, sess, mid, sq, data, pad, mk, akey, aiv, blob] = f;
    const tag = 'telethon#' + tl.indexOf(line);
    try {
      const kd = hex(kdf.enc(mk, ak, cl === '1' ? 'c' : 's', 'hex'));
      if (kd !== (akey + aiv).toLowerCase()) { fail++; bad.push(tag + ' KDF 不一致'); continue; }
      const seqno = (() => { const b = Buffer.from(sq, 'hex'); return b.readInt32LE(0); })();
      const p = [cl === '1' ? 'c' : 's', 'hex', salt, sess, mid, String(seqno), pad].join(',');
      const got = hex(enc.enc(data, ak, p, 'hex'));
      if (got !== blob.toLowerCase()) { fail++; bad.push(tag + ' ENC: got ' + got.slice(0, 40) + '… want ' + blob.slice(0, 40) + '…'); continue; }
      const txt = dec.dec(blob, ak, cl === '1' ? 'c' : 's', 'hex');
      if (txt.indexOf('✓ 通过') < 0) { fail++; bad.push(tag + ' DEC: msg_key 校验失败'); continue; }
      if (txt.indexOf('data(hex)   : ' + data.toLowerCase()) < 0) { fail++; bad.push(tag + ' DEC: data 不一致'); continue; }
      pass++;
    } catch (e) { fail++; bad.push(tag + ' 异常: ' + e.message); }
  }
}

/* ---- 反向判别：方向填反必须被 msg_key 校验挡住 ---- */
{
  const v = vec[0];
  const txt = dec.dec(v.blob, v.auth_key, v.client ? 's' : 'c', 'hex');
  if (txt.indexOf('✗ 失败') < 0) { fail++; bad.push('方向判别：c/s 填反后仍报通过（应失败）'); }
  else pass++;
}
/* ---- 篡改判别：改一个字节必须被 msg_key 校验挡住 ---- */
{
  const v = vec[0];
  const b = Buffer.from(v.blob, 'hex');
  b[b.length - 1] ^= 0x01;
  const txt = dec.dec(b.toString('hex'), v.auth_key, v.client ? 'c' : 's', 'hex');
  if (txt.indexOf('✗ 失败') < 0) { fail++; bad.push('篡改判别：改一个字节后仍报通过（应失败）'); }
  else pass++;
}

console.log('MTProto 2.0 官方向量  PASS ' + pass + '  FAIL ' + fail + '  SKIP ' + skip);
bad.forEach(b => console.log(b));
process.exit(fail ? 1 : 0);
