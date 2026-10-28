/* ============================================================
 * Ascon-XOF128 / CXOF128 验收脚本
 *   运行：node testscript/t_ascon_xof.js    （必须在 index.html 那层）
 *
 * 参照物：官方 ascon-c（v1.3.0）自带的 LWC KAT
 *   testvectors/ascon_xof128_kat.txt   （crypto_hash/asconxof128）
 *   testvectors/ascon_cxof128_kat.txt  （crypto_cxof/asconcxof128）
 * 两条都是 1025 组，输出 64 字节。
 *
 * ⚠ 记录一次失败教训（2026-10-25）：
 *   本轮先尝试用官方 ascon-c 的 crypto_aead/asconaead128 目录「改三个宏」
 *   （128A_IV→128_IV、128A_RATE→128_RATE、128A_PB_ROUNDS→128_PB_ROUNDS）
 *   编译出 Ascon-128 裁判。编译成功、空输入也对，但明文长度达到 rate 倍数
 *   （8/9/16/17 字节）时解密一律返回失败。
 *   原因：那份 ref/aead.c 是**为 rate=16 写的**——循环体里硬编码
 *   `LOADBYTES(m, 8)` 与 `LOADBYTES(m + 8, 8)` 两个 64 位字（16 字节），
 *   而 mlen 却按 ASCON_128_RATE(=8) 递减。把 rate 宏改成 8 只会让它
 *   越界读 + 长度不同步。
 *   → 结论：**不能靠改变体宏从 128a 推出 128**。官方仓库这一版也没有
 *     Ascon-128 的独立目录与 KAT，所以 Ascon-128 AEAD 本轮撤下不上线，
 *     只保留有官方 KAT 的 XOF / CXOF。
 * ============================================================ */
'use strict';
var fs = require('fs'), path = require('path');
var ROOT = path.resolve(__dirname, '..');
var H = require(path.join(__dirname, '_harness.js'));
var ALGOS = H.ALGOS;

var pass = 0, fail = 0;
function ck(c, m) { if (c) pass++; else { fail++; if (fail <= 5) console.log('FAIL: ' + m); } }
function hex(b) { return Buffer.from(b).toString('hex'); }
/* enc 在 fmt='hex' 时返回的是**已 hex 化的字符串**，再套 hex() 会变成 ASCII 编码 —— 这里统一归一化 */
function norm(r) { return (r instanceof Uint8Array || Buffer.isBuffer(r)) ? Buffer.from(r).toString('hex') : String(r); }

function parseKat(file, hasZ) {
  var txt = fs.readFileSync(path.join(ROOT, 'testvectors', file), 'utf8');
  var out = [], cur = null;
  txt.split(/\r?\n/).forEach(function (line) {
    var m = /^(Count|Msg|Z|MD)\s*=\s*(.*)$/.exec(line.trim());
    if (!m) return;
    var k = m[1], v = m[2].trim();
    if (k === 'Count') { cur = { Msg: '', Z: '', MD: '' }; out.push(cur); }
    else if (cur) cur[k] = v;
  });
  return out.filter(function (o) { return o.MD && o.MD.length; });
}

function hx(s) { return s ? Buffer.from(s, 'hex') : Buffer.alloc(0); }

/* ---------- XOF128 ---------- */
var xof = ALGOS.filter(function (a) { return a.id === 'ascon-xof128'; })[0];
ck(!!xof, 'ascon-xof128 条目未注册');
if (xof) {
  var vx = parseKat('ascon_xof128_kat.txt', false);
  var okx = 0;
  vx.forEach(function (v) {
    var got = norm(xof.enc(hx(v.Msg), '', String(64), 'hex'));
    if (got === v.MD.toLowerCase()) okx++;
    else if (okx < 3 && fail < 3) console.log('  XOF 不符 count 期望=' + v.MD.toLowerCase() + ' 实得=' + got);
  });
  ck(okx === vx.length, 'XOF128 只过 ' + okx + '/' + vx.length);
  console.log('Ascon-XOF128 官方 KAT: 通过 ' + okx + ' / ' + vx.length);

  /* 输出长度边界 */
  var lens = [1, 7, 8, 9, 63, 64, 65, 4096];
  var lb = 0;
  lens.forEach(function (n) {
    var r = norm(xof.enc(Buffer.from('abc'), '', String(n), 'hex'));
    if (r.length !== n * 2) { lb++; console.log('  输出长度 ' + n + ' 实得 ' + hex(r).length / 2); }
  });
  ck(lb === 0, '输出长度边界有 ' + lb + ' 项不符');
  /* 前缀性质：XOF 长输出必须包含短输出作为前缀 */
  var s8 = norm(xof.enc(Buffer.from('abc'), '', '8', 'hex'));
  var s64 = norm(xof.enc(Buffer.from('abc'), '', '64', 'hex'));
  ck(s64.indexOf(s8) === 0, 'XOF 不满足前缀性质（长输出不以短输出开头）');
  /* 非法长度应回落到默认 32，不抛错 */
  var d1 = norm(xof.enc(Buffer.from('abc'), '', '', 'hex'));
  ck(d1.length === 64, '不填长度时未回落到 32 字节，实得 ' + d1.length / 2);
}

/* ---------- CXOF128 ---------- */
var cxof = ALGOS.filter(function (a) { return a.id === 'ascon-cxof128'; })[0];
ck(!!cxof, 'ascon-cxof128 条目未注册');
if (cxof) {
  var vc = parseKat('ascon_cxof128_kat.txt', true);
  var okc = 0;
  vc.forEach(function (v) {
    var got = norm(cxof.enc(hx(v.Msg), '', v.Z + ',64', 'hex'));
    if (got === v.MD.toLowerCase()) okc++;
    else if (okc < 2 && fail < 5) console.log('  CXOF 不符 Z=' + v.Z + ' 期望=' + v.MD.toLowerCase() + ' 实得=' + got);
  });
  ck(okc === vc.length, 'CXOF128 只过 ' + okc + '/' + vc.length);
  console.log('Ascon-CXOF128 官方 KAT: 通过 ' + okc + ' / ' + vc.length);

  /* 定制串确实起作用：同消息不同 Z 必须输出不同 */
  var a1 = norm(cxof.enc(Buffer.from('abc'), '', ',32', 'hex'));
  var a2 = norm(cxof.enc(Buffer.from('abc'), '', '01,32', 'hex'));
  ck(a1 !== a2, '定制串未生效（空串与 01 输出相同）');
  /* 与 XOF 的关系：Z 为空时 CXOF 也不应等于 XOF（IV 不同） */
  var x1 = norm(xof.enc(Buffer.from('abc'), '', '32', 'hex'));
  ck(a1 !== x1, 'CXOF(空Z) 与 XOF 输出相同，IV 可能写错');
}

/* ---------- Hash256 回归（本批新增代码不应影响它）---------- */
var h256 = ALGOS.filter(function (a) { return a.id === 'ascon-hash256'; })[0];
if (h256) {
  var vh = parseKat('ascon_hash256_kat.txt', false);
  var okh = 0;
  vh.slice(0, 200).forEach(function (v) {
    if (norm(h256.enc(hx(v.Msg), '', '', 'hex')).indexOf(v.MD.toLowerCase()) === 0) okh++;
  });
  ck(okh === Math.min(200, vh.length), 'Hash256 回归只过 ' + okh);
  console.log('Ascon-Hash256 回归（前 200 组）: 通过 ' + okh + ' / ' + Math.min(200, vh.length));
}

console.log('\nAscon XOF/CXOF 测试: 通过 ' + pass + '  失败 ' + fail);
if (fail) process.exit(1);
