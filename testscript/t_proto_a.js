/* t_proto_a.js —— 协议级条目官方向量对拍
 * 参照物：PyNaCl 1.6.2(libsodium) / Python cryptography 50.0.1 / pyseto 1.10.0
 * 向量由 work/gen_proto_a.py 生成（vec_proto_a.json）
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
let loaded = 0;
for (const m of html.matchAll(/<script\s+src="([^"]+)"\s*>/g)) {
  const f = m[1];
  try { vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f }); loaded++; }
  catch (e) { console.log('LOADFAIL', f, e.message.slice(0, 120)); }
}
console.log('loaded', loaded, 'ALGOS', global.ALGOS.length);

const A = globalThis.__protoA;
if (!A) { console.log('FAIL: __protoA 未导出'); process.exit(1); }
const V = JSON.parse(fs.readFileSync('/data/workspace/work/vec_proto_a.json', 'utf8'));
let pass = 0, fail = 0;
function chk(name, got, exp, tag) {
  const g = String(got).toLowerCase(), e = String(exp).toLowerCase();
  if (g === e) { pass++; }
  else {
    fail++;
    console.log('  FAIL', name, tag || '');
    console.log('    got', g.slice(0, 120));
    console.log('    exp', e.slice(0, 120));
  }
}
const hx = b => { let s = ''; for (let i = 0; i < b.length; i++) s += ('0' + b[i].toString(16)).slice(-2); return s; };
const hb = h => { const s = h.replace(/[^0-9a-f]/gi, ''); const o = new Uint8Array(s.length / 2); for (let i = 0; i < o.length; i++) o[i] = parseInt(s.substr(i * 2, 2), 16); return o; };
const U = s => { const o = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) o[i] = s.charCodeAt(i) & 0xff; return o; };

/* 1. XSalsa20 */
for (let i = 0; i < V.xsalsa20.length; i++) {
  const t = V.xsalsa20[i];
  const ct = A.xsalsa20Crypt(hb(t.pt), hb(t.key), hb(t.nonec || t.nonce));
  chk('xsalsa20#' + i, hx(ct), t.ct, 'len=' + t.pt.length / 2);
  const ks = A.xsalsa20Stream(hb(t.key), hb(t.nonce), t.ks.length / 2);
  chk('xsalsa20-ks#' + i, hx(ks), t.ks);
}

/* 2. secretbox */
for (let i = 0; i < V.secretbox.length; i++) {
  const t = V.secretbox[i];
  const r = A.secretboxSeal(hb(t.pt), hb(t.key), hb(t.nonce));
  chk('secretbox#' + i, hx(r.box), t.box, 'len=' + t.pt.length / 2);
  const m = A.secretboxOpen(hb(t.box), hb(t.key), hb(t.nonce));
  chk('secretbox-open#' + i, hx(m), t.pt);
}

/* 3. box */
for (let i = 0; i < V.box.length; i++) {
  const t = V.box[i];
  const ks = A.boxBeforenm(hb(t.ask), hb(t.bpk));
  const r = A.secretboxSeal(hb(t.pt), ks, hb(t.nonce));
  chk('box#' + i, hx(r.box), t.box, 'len=' + t.pt.length / 2);
}

/* 4. sealedbox */
for (let i = 0; i < V.sealedbox.length; i++) {
  const t = V.sealedbox[i];
  const epk = hb(t.sealed).subarray(0, 32);
  const ks = A.boxBeforenm(hb(t.rsk), epk);
  const n = global.blake2bDigest(global.concatBytes(epk, hb(t.rpk)), 24);
  const r = A.secretboxSeal(hb(t.pt), ks, n);
  chk('sealedbox#' + i, hx(global.concatBytes(epk, r.box)), t.sealed, 'len=' + t.pt.length / 2);
  /* 反向：解封 */
  const m = A.secretboxOpen(hb(t.sealed).subarray(32), ks, n);
  chk('sealedbox-open#' + i, hx(m), t.pt);
}

/* 5. Fernet */
for (let i = 0; i < V.fernet.length; i++) {
  const t = V.fernet[i];
  const tok = A.fernetEncrypt(hb(t.pt), hb(t.keyhex), t.ts, hb(t.iv));
  chk('fernet#' + i, tok, t.token, 'len=' + t.pt.length / 2);
  const r = A.fernetDecrypt(t.token, hb(t.keyhex));
  chk('fernet-dec#' + i, hx(r.payload), t.pt);
}

/* 6. PASETO v4.local */
for (let i = 0; i < V.paseto_v4_local.length; i++) {
  const t = V.paseto_v4_local[i];
  const tok = A.pasetoV4LocalEncrypt(hb(t.pt), hb(t.key), hb(t.nonce), new Uint8Array(0), new Uint8Array(0));
  chk('v4.local#' + i, tok, t.token, 'len=' + t.pt.length / 2);
  const m = A.pasetoV4LocalDecrypt(t.token, hb(t.key), new Uint8Array(0), new Uint8Array(0));
  chk('v4.local-dec#' + i, hx(m), t.pt);
}
for (let i = 0; i < V.paseto_v4_local_footer.length; i++) {
  const t = V.paseto_v4_local_footer[i];
  const tok = A.pasetoV4LocalEncrypt(hb(t.pt), hb(t.key), hb(t.nonce), U(t.footer), new Uint8Array(0));
  chk('v4.local-footer#' + i, tok, t.token);
  const m = A.pasetoV4LocalDecrypt(t.token, hb(t.key), U(t.footer), new Uint8Array(0));
  chk('v4.local-footer-dec#' + i, hx(m), t.pt);
}

/* 7. PASETO v2.local
   注意：pyseto 的 v2 会把传入 nonce 当作 BLAKE2b 的密钥再派生一次
   （n = BLAKE2b(key=nonce, msg=payload, 24)），所以 token 里的真实 nonce
   不等于我们传入的值。加密比对必须用 token 里实际携带的 nonce。 */
function v2RealNonce(token) {
  const body = token.split('.')[2];
  const b = global.b64urlDecode(body);
  return b.subarray(0, 24);
}
for (let i = 0; i < V.paseto_v2_local.length; i++) {
  const t = V.paseto_v2_local[i];
  const n = v2RealNonce(t.token);
  const tok = A.pasetoV2LocalEncrypt(hb(t.pt), hb(t.key), n, new Uint8Array(0));
  chk('v2.local#' + i, tok, t.token, 'len=' + t.pt.length / 2);
  const m = A.pasetoV2LocalDecrypt(t.token, hb(t.key), new Uint8Array(0));
  chk('v2.local-dec#' + i, hx(m), t.pt);
}

/* 8. PASETO v4.public / v2.public */
for (let i = 0; i < V.paseto_v4_public.length; i++) {
  const t = V.paseto_v4_public[i];
  const tok = A.pasetoV4PublicSign(hb(t.pt), hb(t.sk), new Uint8Array(0), new Uint8Array(0));
  chk('v4.public#' + i, tok, t.token);
  const m = A.pasetoV4PublicVerify(t.token, hb(t.pk), new Uint8Array(0), new Uint8Array(0));
  chk('v4.public-verify#' + i, hx(m), t.pt);
}
for (let i = 0; i < V.paseto_v2_public.length; i++) {
  const t = V.paseto_v2_public[i];
  const tok = A.pasetoV2PublicSign(hb(t.pt), hb(t.sk), new Uint8Array(0));
  chk('v2.public#' + i, tok, t.token);
  const m = A.pasetoV2PublicVerify(t.token, hb(t.pk), new Uint8Array(0));
  chk('v2.public-verify#' + i, hx(m), t.pt);
}

console.log('PASS', pass, 'FAIL', fail);
process.exit(fail ? 1 : 0);
