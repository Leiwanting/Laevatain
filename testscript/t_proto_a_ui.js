/* t_proto_a_ui.js —— 走 reg 注册的【界面入口】验证（不直调内部函数）
 * 目的：本项目已多次出现「内部函数对、界面路径错」的问题（CAST-256 接口名、
 * bcrypt-pbkdf 字节/字符串、BIP-39 崩溃），因此每条新增算法都必须走入口复验。
 */
const fs = require('fs'), vm = require('vm'), nc = require('crypto');
global.crypto = nc.webcrypto;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
global.btoa = s => Buffer.from(s, 'binary').toString('base64');
global.atob = s => Buffer.from(s, 'base64').toString('binary');
const mk = id => ({ id, value: '', _h: {}, options: [], addEventListener() {}, dispatchEvent() {},
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  setAttribute() {}, appendChild() {}, style: {}, innerHTML: '', textContent: '' });
const store = {};
global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t),
  querySelector() { return mk('q'); }, querySelectorAll() { return []; },
  addEventListener() {}, readyState: 'complete', body: { appendChild() {} } };
global.window = global; global.addEventListener = () => {}; global.Event = function (t) { this.type = t; };
const html = fs.readFileSync('index.html', 'utf8');
for (const m of html.matchAll(/<script\s+src="([^"]+)"\s*>/g)) {
  try { vm.runInThisContext(fs.readFileSync(m[1], 'utf8'), { filename: m[1] }); } catch (e) {}
}
const V = JSON.parse(fs.readFileSync('/data/workspace/work/vec_proto_a.json', 'utf8'));
const hb = h => { const s = h.replace(/[^0-9a-f]/gi, ''); const o = new Uint8Array(s.length / 2); for (let i = 0; i < o.length; i++) o[i] = parseInt(s.substr(i * 2, 2), 16); return o; };
const hx = b => { let s = ''; for (let i = 0; i < b.length; i++) s += ('0' + b[i].toString(16)).slice(-2); return s; };
const U = s => { const o = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) o[i] = s.charCodeAt(i) & 0xff; return o; };
const S = b => Buffer.from(b).toString('utf8');
const M = {};
for (const a of global.ALGOS) M[a.id] = a;
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; } else { fail++; console.log('  FAIL', name, extra || ''); }
}

(async function () {
  /* 1. xsalsa20 */
  const t0 = V.xsalsa20[5];
  let a = M['xsalsa20'];
  let out = await a.enc(hb(t0.pt), t0.key, t0.nonce, 'hex');
  ok('xsalsa20-enc', String(out).toLowerCase() === (t0.nonce + t0.ct).toLowerCase(), String(out).slice(0, 48));
  let back = await a.dec(hb(t0.nonce + t0.ct), t0.key, '', 'hex');
  ok('xsalsa20-dec', String(back).toLowerCase() === t0.pt.toLowerCase(), String(back).slice(0, 48));

  /* 2. secretbox */
  const t1 = V.secretbox[2];
  out = await M['nacl-secretbox-enc'].enc(hb(t1.pt), t1.key, t1.nonce, 'hex');
  ok('secretbox-enc', String(out).toLowerCase() === (t1.nonce + t1.box).toLowerCase(), String(out).slice(0, 48));
  back = await M['nacl-secretbox-dec'].dec(hb(t1.nonce + t1.box), t1.key, '', 'hex');
  ok('secretbox-dec', String(back).toLowerCase() === t1.pt.toLowerCase(), String(back).slice(0, 48));
  /* 篡改必报错 */
  let threw = false;
  const bad = hb(t1.nonce + t1.box); bad[bad.length - 1] ^= 1;
  try { await M['nacl-secretbox-dec'].dec(bad, t1.key, '', 'hex'); } catch (e) { threw = true; }
  ok('secretbox-篡改拒绝', threw);

  /* 3. box */
  const t2 = V.box[2];
  out = await M['nacl-box-enc'].enc(hb(t2.pt), t2.ask, t2.bpk + ',' + t2.nonce, 'hex');
  ok('box-enc', String(out).toLowerCase() === (t2.nonce + t2.box).toLowerCase(), String(out).slice(0, 48));
  back = await M['nacl-box-dec'].dec(hb(t2.nonce + t2.box), t2.bsk, t2.apk, 'hex');
  ok('box-dec', String(back).toLowerCase() === t2.pt.toLowerCase(), String(back).slice(0, 48));

  /* 4. sealedbox */
  const t3 = V.sealedbox[2];
  out = await M['nacl-sealedbox-enc'].enc(hb(t3.pt), t3.rpk, '', 'hex');
  ok('sealedbox-enc-len', String(out).length / 2 === 32 + 16 + hb(t3.pt).length, String(out).length);
  back = await M['nacl-sealedbox-dec'].dec(hb(String(out)), t3.rsk, '', 'hex');
  ok('sealedbox-dec', String(back).toLowerCase() === t3.pt.toLowerCase(), String(back).slice(0, 48));

  /* 5. Fernet */
  const t4 = V.fernet[3];
  let tok = await M['fernet-enc'].enc(hb(t4.pt), t4.key, String(t4.ts) + ',' + t4.iv, 'hex');
  ok('fernet-enc', String(tok) === t4.token, String(tok).slice(0, 40));
  back = await M['fernet-dec'].dec(U(t4.token), t4.key, '', 'hex');
  ok('fernet-dec', String(back).toLowerCase() === t4.pt.toLowerCase(), String(back).slice(0, 48));
  /* 密钥错误必报错 */
  threw = false;
  try { await M['fernet-dec'].dec(U(t4.token), '00'.repeat(32), '', 'hex'); } catch (e) { threw = true; }
  ok('fernet-错误密钥拒绝', threw);

  /* 6. PASETO v4.local */
  const t5 = V.paseto_v4_local[2];
  tok = await M['paseto-v4-local-enc'].enc(hb(t5.pt), t5.key, t5.nonce, 'hex');
  ok('v4.local-enc', String(tok) === t5.token, String(tok).slice(0, 40));
  back = await M['paseto-v4-local-dec'].dec(U(t5.token), t5.key, '', 'hex');
  ok('v4.local-dec', String(back).toLowerCase() === t5.pt.toLowerCase(), String(back).slice(0, 48));
  /* footer */
  const t5f = V.paseto_v4_local_footer[0];
  tok = await M['paseto-v4-local-enc'].enc(hb(t5f.pt), t5f.key, t5f.nonce + ',' + t5f.footer, 'hex');
  ok('v4.local-footer-enc', String(tok) === t5f.token);
  back = await M['paseto-v4-local-dec'].dec(U(t5f.token), t5f.key, t5f.footer, 'hex');
  ok('v4.local-footer-dec', String(back).toLowerCase() === t5f.pt.toLowerCase());

  /* 7. PASETO v2.local：nonce 用 token 里实际携带的 */
  const t6 = V.paseto_v2_local[2];
  const body = t6.token.split('.')[2];
  const realN = hx(global.b64urlDecode(body).subarray(0, 24));
  tok = await M['paseto-v2-local-enc'].enc(hb(t6.pt), t6.key, realN, 'hex');
  ok('v2.local-enc', String(tok) === t6.token, String(tok).slice(0, 40));
  back = await M['paseto-v2-local-dec'].dec(U(t6.token), t6.key, '', 'hex');
  ok('v2.local-dec', String(back).toLowerCase() === t6.pt.toLowerCase(), String(back).slice(0, 48));

  /* 8. PASETO v4.public / v2.public */
  const t7 = V.paseto_v4_public[1];
  tok = await M['paseto-v4-public-sign'].enc(hb(t7.pt), t7.sk, '', 'hex');
  ok('v4.public-sign', String(tok) === t7.token, String(tok).slice(0, 40));
  back = await M['paseto-v4-public-verify'].dec(U(t7.token), t7.pk, '', 'hex');
  ok('v4.public-verify', String(back).toLowerCase() === t7.pt.toLowerCase(), String(back).slice(0, 48));
  const t8 = V.paseto_v2_public[1];
  tok = await M['paseto-v2-public-sign'].enc(hb(t8.pt), t8.sk, '', 'hex');
  ok('v2.public-sign', String(tok) === t8.token);
  back = await M['paseto-v2-public-verify'].dec(U(t8.token), t8.pk, '', 'hex');
  ok('v2.public-verify', String(back).toLowerCase() === t8.pt.toLowerCase(), String(back).slice(0, 48));
  /* 篡改必报错 */
  threw = false;
  const badTok = t8.token.slice(0, -4) + 'AAAA';
  try { await M['paseto-v2-public-verify'].dec(U(badTok), t8.pk, '', 'hex'); } catch (e) { threw = true; }
  ok('v2.public-篡改拒绝', threw);

  console.log('UI PASS', pass, 'FAIL', fail);
  process.exit(fail ? 1 : 0);
})();
