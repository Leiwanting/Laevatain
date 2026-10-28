/* ============================================================
 * NTRU-HPS / NTRU-HRSS 官方差分验收
 * 裁判：PQClean clean（commit 81a0bf97e201）编译出的二进制 oracle
 *      /data/workspace/ntruori/o_<paramset>  [ kg | en | de ]
 * 断言：
 *   A) 同一 seed 下 keygen 与官方完全一致（pk + sk 全长的逐字节比对）
 *   B) 同一 rm seed 下 encaps 与官方完全一致（ct + ss）
 *   C) 官方 (sk, ct) 喂给本实现 decaps，必须得官方 ss（解封装确定性）
 *   D) 本实现产出 ct' 交给官方 de，必须得本实现的 ss'（双向交叉）
 *   E) 长度护栏：错误长度必须抛错
 * ============================================================ */
var P = require('./_harness.js');
var fs = require('fs'), path = require('path'), cp = require('child_process');

var ROOT = path.resolve(__dirname, '..');
var ORI = '/data/workspace/ntruori';

/* --- 载入主工程（拿 ALGOS / __ntruKat / sha3_256） --- */
global.crypto = require('crypto').webcrypto;
global.btoa = function (s) { return Buffer.from(s, 'binary').toString('base64'); };
global.atob = function (s) { return Buffer.from(s, 'base64').toString('binary'); };
global.TextEncoder = require('util').TextEncoder;
var mk = function (id) {
  return {
    id: id, value: '', _h: {}, options: [],
    addEventListener: function (e, f) { (this._h[e] = this._h[e] || []).push(f); },
    dispatchEvent: function (e) { (this._h[e.type] || []).forEach(function (f) { f.call(this, e); }); },
    classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
    setAttribute: function () {}, appendChild: function () {}, style: {}, innerHTML: '', textContent: ''
  };
};
var store = {};
global.document = {
  getElementById: function (id) { return store[id] || (store[id] = mk(id)); },
  createElement: function (t) { return mk(t); },
  querySelector: function () { return mk('q'); }, querySelectorAll: function () { return []; },
  addEventListener: function () {}, readyState: 'complete', body: { appendChild: function () {} }
};
global.window = global; global.addEventListener = function () {};
global.Event = function (t) { this.type = t; };
var vm = require('vm');
var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
var files = (html.match(/<script src="([^"]+)"><\/script>/g) || []).map(function (s) { return s.match(/src="([^"]+)"/)[1]; });
files.forEach(function (f) { try { vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f }); } catch (e) {} });

var KATS = global.__ntruKat;
if (!KATS) { console.log('FATAL: __ntruKat 未导出'); process.exit(1); }

var SETS = [
  { id: 'ntruhps2048509', ori: 'o_ntruhps2048509' },
  { id: 'ntruhps2048677', ori: 'o_ntruhps2048677' },
  { id: 'ntruhps4096821', ori: 'o_ntruhps4096821' },
  { id: 'ntruhrss701', ori: 'o_ntruhrss701' }
];

function run(ori, args) {
  var r = cp.spawnSync(path.join(ORI, ori), args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(ori + ' ' + args[0] + ' 失败: ' + (r.stdout || '') + (r.stderr || ''));
  return r.stdout.trim().split('\n');
}
function hex(b) { return Buffer.from(b).toString('hex').toUpperCase(); }
function unhex(h) { return new Uint8Array(Buffer.from(h, 'hex')); }
function mkRng(buf) {
  var p = 0;
  return function (n) {
    var r = new Uint8Array(buf.subarray(p, p + n));
    p += n;
    return r;
  };
}
function rndHex(n) { return require('crypto').randomBytes(n).toString('hex').toUpperCase(); }

var N_PASS = 0, N_FAIL = 0;
function ck(cond, msg) { if (cond) N_PASS++; else { N_FAIL++; console.log('  FAIL ' + msg); } }

var ROUNDS = parseInt(process.env.NTRU_ROUNDS || '25', 10);

SETS.forEach(function (S) {
  var K = KATS[S.id];
  var t0 = Date.now();
  console.log('--- ' + S.id + ' (pk ' + K.PKBYTES + ' / sk ' + K.SKBYTES + ' / ct ' + K.CTBYTES + ') ---');

  /* 先跑一次官方自洽，确认裁判本身没问题 */
  var seed0 = rndHex(K.FGBYTES + 32);
  var kg0 = run(S.ori, ['kg', seed0]);
  var selfEn = run(S.ori, ['en', kg0[0], rndHex(K.RMBYTES)]);
  var selfDe = run(S.ori, ['de', kg0[1], selfEn[0]]);
  ck(selfEn[1] === selfDe[0], '裁判自洽（enc ss == dec ss）');

  for (var t = 0; t < ROUNDS; t++) {
    /* A) keygen 全等 */
    var seed = rndHex(K.FGBYTES + 32);
    var o = run(S.ori, ['kg', seed]);
    var oPk = o[0], oSk = o[1];
    var jp = K.keypair(mkRng(unhex(seed)));
    ck(hex(jp.pk) === oPk, '#' + t + ' keygen pk 不一致');
    ck(hex(jp.sk) === oSk, '#' + t + ' keygen sk 不一致');

    /* B) encaps 全等（同 rm seed） */
    var rm = rndHex(K.RMBYTES);
    var oe = run(S.ori, ['en', oPk, rm]);
    var je = K.encaps(unhex(oPk), mkRng(unhex(rm)));
    ck(hex(je.ct) === oe[0], '#' + t + ' encaps ct 不一致');
    ck(hex(je.ss) === oe[1], '#' + t + ' encaps ss 不一致');

    /* C) 官方 ct + 官方 sk → 本实现 decaps 必须等于官方 ss */
    var jd = K.decaps(unhex(oe[0]), unhex(oSk));
    ck(hex(jd) === oe[1], '#' + t + ' decaps 未复现官方 ss');

    /* D) 本实现 ct' 交官方 de → 必须等于本实现 ss' */
    var je2 = K.encaps(unhex(oPk), mkRng(rndHexBytes(K.RMBYTES)));
    var od = run(S.ori, ['de', oSk, hex(je2.ct)]);
    ck(od[0] === hex(je2.ss), '#' + t + ' 交叉解封装不一致');

    /* E) 篡改密文：不应崩溃，且（大概率）不等于原 ss */
    var ctBad = unhex(oe[0]);
    ctBad[0] ^= 0x01;
    var bad = K.decaps(ctBad, unhex(oSk));
    ck(bad && bad.length === 32, '#' + t + ' 篡改密文未返回 32 字节');

    /* F) 本实现自洽往返：keygen → encaps → decaps，ss 必须逐字节相等
     *    （A~E 验的是「与官方一致」，F 验的是「自己产出的自己能解开」，
     *      两者互补；ST 因 KEM 条目全部 dec=false 判为「单向」，覆盖不到这里） */
    var kp2 = K.keypair(mkRng(rndHexBytes(K.FGBYTES + 32)));
    var en2 = K.encaps(kp2.pk, mkRng(rndHexBytes(K.RMBYTES)));
    var ss2 = K.decaps(en2.ct, kp2.sk);
    ck(hex(ss2) === hex(en2.ss), '#' + t + ' 自洽往返 ss 不相等（KEM 不可解封装）');
  }

  /* E) 长度护栏：走条目层（内核层不校验长度，条目层才拒绝） */
  var badLen = 0;
  var ent = ['-encaps', '-decaps'].map(function (sfx) {
    return (global.ALGOS || []).filter(function (a) { return a.id === S.id + sfx; })[0];
  });
  try { ent[0].enc('', '00'.repeat(K.PKBYTES - 1), '', 'hex'); } catch (e) { badLen++; }
  try { ent[1].enc('00'.repeat(K.CTBYTES - 1), '00'.repeat(K.SKBYTES - 1), '', 'hex'); } catch (e) { badLen++; }
  ck(badLen === 2, '条目层长度护栏未拒绝（' + badLen + '/2）');
  console.log('  条目层长度护栏抛错 ' + badLen + '/2  ·  ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
});

function rndHexBytes(n) { return require('crypto').randomBytes(n); }

console.log('\n========================================');
console.log('NTRU 官方差分： PASS ' + N_PASS + '   FAIL ' + N_FAIL);
console.log('（每组 ' + ROUNDS + ' 轮 × 4 参数集，裁判 = PQClean 官方二进制）');
process.exit(N_FAIL ? 1 : 0);
