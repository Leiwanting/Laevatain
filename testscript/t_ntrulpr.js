/* ============================================================
 * NTRU-LPRime（ntrulpr653 / 857 / 1277）官方差分验收
 *
 * 裁判：PQClean clean（commit 81a0bf97e201）编译出的二进制 oracle
 *      /data/workspace/ntruori/o_<paramset>  [ kg | en | de ]
 *
 * 断言：
 *   A) 同一 seed 下 keygen 与官方完全一致（pk + sk 全长的逐字节比对）
 *   B) 同一 rm seed 下 encaps 与官方完全一致（ct + ss）
 *   C) 官方 (sk, ct) 喂给本实现 decaps，必须得官方 ss（解封装确定性）
 *   D) 本实现产出 ct' 交给官方 de，必须得本实现的 ss'（双向交叉）
 *   E) 篡改密文：decaps 不崩，且返回 32 字节（隐式拒绝路径）
 *   F) 本实现自洽往返：keygen → encaps → decaps，ss 逐字节相等
 *      —— A~E 验「与官方一致」，F 验「自己产出的自己能解开」。
 *         ST 因 KEM 条目全部 dec=false 判为「单向」，覆盖不到 KEM 往返。
 *   G) 长度常量必须与官方 api.h 一致（PK/SK/CT/SS）
 *   H) 条目层长度护栏：错长度必须抛错（内核层不校验长度）
 *   I) base-m 编解码往返自洽（encM ∘ decM = identity）
 *
 * ⚠ 为什么要 I：
 *   crypto_encode_<p>x<m>.c 是自动生成的多层打包代码，编解码互为逆运算，
 *   所以「抄错了也能往返自洽」，只有与官方比对才暴露。
 *   I 段不替代 A/B（那才是真裁判），但能在官方二进制缺失时给出第一道拦截。
 * ============================================================ */
var P = require('./_harness.js');
var fs = require('fs'), path = require('path'), cp = require('child_process');

var ROOT = path.resolve(__dirname, '..');
var ORI = '/data/workspace/ntruori';

var KATS = global.__ntrulprKat;
if (!KATS) { console.log('FATAL: __ntrulprKat 未导出'); process.exit(1); }

/* 官方 api.h 的长度常量（PQClean commit 81a0bf97e201） */
var SETS = [
  { id: 'ntrulpr653', ori: 'o_ntrulpr653', pk: 897, sk: 1125, ct: 1025, ss: 32 },
  { id: 'ntrulpr857', ori: 'o_ntrulpr857', pk: 1184, sk: 1463, ct: 1312, ss: 32 },
  { id: 'ntrulpr1277', ori: 'o_ntrulpr1277', pk: 1847, sk: 2231, ct: 1975, ss: 32 }
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
function rndBytes(n) { return new Uint8Array(require('crypto').randomBytes(n)); }

var N_PASS = 0, N_FAIL = 0;
function ck(cond, msg) { if (cond) N_PASS++; else { N_FAIL++; console.log('  FAIL ' + msg); } }

var ROUNDS = parseInt(process.env.NTRULPR_ROUNDS || '10', 10);

SETS.forEach(function (S) {
  var K = KATS[S.id];
  if (!K) { N_FAIL++; console.log('  FAIL ' + S.id + ' 未导出'); return; }
  var t0 = Date.now();
  console.log('--- ' + S.id + ' (pk ' + K.PKBYTES + ' / sk ' + K.SKBYTES + ' / ct ' + K.CTBYTES + ') ---');

  /* G) 长度常量对齐官方 api.h */
  ck(K.PKBYTES === S.pk, S.id + ' 公钥长度应为 ' + S.pk + '，实得 ' + K.PKBYTES);
  ck(K.SKBYTES === S.sk, S.id + ' 私钥长度应为 ' + S.sk + '，实得 ' + K.SKBYTES);
  ck(K.CTBYTES === S.ct, S.id + ' 密文长度应为 ' + S.ct + '，实得 ' + K.CTBYTES);
  ck(K.SSBYTES === S.ss, S.id + ' 共享密钥长度应为 ' + S.ss + '，实得 ' + K.SSBYTES);

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
    var je2 = K.encaps(unhex(oPk), mkRng(rndBytes(K.RMBYTES)));
    var od = run(S.ori, ['de', oSk, hex(je2.ct)]);
    ck(od[0] === hex(je2.ss), '#' + t + ' 交叉解封装不一致');

    /* E) 篡改密文：不应崩溃，且返回 32 字节 */
    var ctBad = unhex(oe[0]);
    ctBad[0] ^= 0x01;
    var bad = K.decaps(ctBad, unhex(oSk));
    ck(bad && bad.length === 32, '#' + t + ' 篡改密文未返回 32 字节');

    /* F) 自洽往返 */
    var kp2 = K.keypair(mkRng(rndBytes(K.FGBYTES + 32)));
    var en2 = K.encaps(kp2.pk, mkRng(rndBytes(K.RMBYTES)));
    var ss2 = K.decaps(en2.ct, kp2.sk);
    ck(hex(ss2) === hex(en2.ss), '#' + t + ' 自洽往返 ss 不相等（KEM 不可解封装）');
  }

  /* I) base-m 编解码往返自洽（rounded 域） */
  var D = K._dbg;
  if (D && D.roundedEncode && D.roundedDecode) {
    /* 注意：rounded 域只承载 3 的倍数（3*round(a/3)），构造样本时必须满足，
       否则往返必然不等——那是样本错，不是实现错。 */
    var plen = K.PKBYTES - 32 === 865 ? 653 : (K.PKBYTES - 32 === 1152 ? 857 : 1277);
    var a = new Int16Array(plen);
    for (var i = 0; i < plen; i++) a[i] = 3 * (((i * 37) % 1541) - 770);
    var rnd = D.roundedEncode(a);
    ck(rnd.length === K.PKBYTES - 32, 'rounded 编码长度应为 ' + (K.PKBYTES - 32) + '，实得 ' + rnd.length);
    var back = D.roundedDecode(rnd);
    var same = true;
    for (i = 0; i < plen; i++) if (back[i] !== a[i]) { same = false; break; }
    ck(same, 'rounded 编解码往返不自洽（第 ' + i + ' 项：' + a[i] + ' → ' + back[i] + '）');
  }

  /* H) 条目层长度护栏 */
  var badLen = 0;
  var ent = ['-encaps', '-decaps'].map(function (sfx) {
    return (global.ALGOS || []).filter(function (a) { return a.id === S.id + sfx; })[0];
  });
  if (!ent[0] || !ent[1]) { N_FAIL++; console.log('  FAIL ' + S.id + ' 条目未注册'); return; }
  try { ent[0].enc('', '00'.repeat(K.PKBYTES - 1), '', 'hex'); } catch (e) { badLen++; }
  try { ent[1].enc('00'.repeat(K.CTBYTES - 1), '00'.repeat(K.SKBYTES - 1), '', 'hex'); } catch (e) { badLen++; }
  ck(badLen === 2, '条目层长度护栏未拒绝（' + badLen + '/2）');

  console.log('  条目层长度护栏抛错 ' + badLen + '/2  ·  ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
});

console.log('\nNTRU-LPRime 官方差分: PASS ' + N_PASS + '  FAIL ' + N_FAIL);
process.exit(N_FAIL ? 1 : 0);
