/* SHACAL-1 官方向量验收
 * 向量来源：Crypto3 (hawkynt/Cipher) SHACAL-1 官方测试向量，
 *   三条均由「已公布的 SHA-1 摘要 减去 IV」导出，本脚本再独立复算一遍该关系，
 *   确保期望值本身可信（不是抄来的孤证）。
 *   注意：SHACAL-1 输出 = SHA-1 压缩函数终值，**不做** feed-forward 加法，
 *         所以 SHACAL1(IV, pad(m)) === SHA1(m) - IV (逐字 mod 2^32)。
 */
var S = require('../CryptoJS/crypto_shacal1.js');
var nc = require('crypto');
var P = 0, F = 0, n = 0;
function ck(c, msg) { n++; if (c) { P++; } else { F++; console.log('  FAIL#' + n + ' ' + msg); } }

function hx(b) { return Buffer.from(b).toString('hex'); }
function h2b(s) { return Uint8Array.from(Buffer.from(s, 'hex')); }
var IV = '67452301efcdab8998badcfe10325476c3d2e1f0';
var IVW = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

/* 用 Node 生成标准的 SHA-1 单块填充，避免手工抄 hex 出错 */
function sha1pad(m) {
  var b = Buffer.from(m, 'utf8');
  if (b.length > 55) throw new Error('本工具只支持单块（<=55 字节）的消息');
  var blk = Buffer.alloc(64);
  b.copy(blk, 0);
  blk[b.length] = 0x80;
  blk.writeUInt32BE(0, 56);
  blk.writeUInt32BE(b.length * 8, 60);
  return blk.toString('hex');
}

/* 官方给出的三条期望值（Crypto3） */
var EXP = {
  '': '72f480ed6e9d9f84999ae2f1852dc41aec052519',
  'abc': '42541b355738d5e121834873681e6df6d8fdf6ad',
  'message digest': '59dd2fcdeabe3d10b4a4c32bfa14cea65943c8f3'
};

console.log('A) 官方向量（明文 = SHA-1 IV，密钥 = pad(消息)）');
Object.keys(EXP).forEach(function (m) {
  var key = sha1pad(m);
  var got = hx(S.shacal1Enc(h2b(IV), h2b(key)));
  ck(got === EXP[m], 'SHACAL1(IV,pad("' + m + '")) got=' + got + ' exp=' + EXP[m]);
  var back = hx(S.shacal1Dec(h2b(got), h2b(key)));
  ck(back === IV, '解密还原 IV 失败: ' + back);
});

console.log('B) 独立交叉验算：SHACAL1(IV,pad(m)) 应等于 SHA1(m) - IV');
Object.keys(EXP).forEach(function (m) {
  var dg = nc.createHash('sha1').update(m, 'utf8').digest();
  var calc = Buffer.alloc(20);
  for (var i = 0; i < 5; i++) calc.writeUInt32BE(((dg.readUInt32BE(i * 4) - IVW[i]) >>> 0), i * 4);
  ck(calc.toString('hex') === EXP[m], '交叉验算 "' + m + '" 不一致');
});

console.log('C) 短密钥补零：128 位密钥应与「补零到 512 位」等价');
var k16 = '000102030405060708090a0b0c0d0e0f';
var k64 = k16 + new Array(64 - 16 + 1).join('00') + '';
k64 = k16 + '0'.repeat(96);
var c1 = hx(S.shacal1Enc(h2b(IV), h2b(k64)));
var c2 = hx(S.shacal1Enc(h2b(IV), Uint8Array.from(Buffer.from(k16, 'hex'))));
ck(c1 === c2, '补零不等价: 显式=' + c1 + ' 自动=' + c2);

console.log('D) 往返与长度校验');
(function () {
  var key = h2b(k64), ok = 0, bad = 0;
  for (var t = 0; t < 200; t++) {
    var pt = new Uint8Array(20);
    for (var i = 0; i < 20; i++) pt[i] = (Math.random() * 256) | 0;
    var back = S.shacal1Dec(S.shacal1Enc(pt, key), key);
    if (hx(back) === hx(pt)) ok++; else bad++;
  }
  ck(bad === 0, '往返失败 ' + bad + '/' + 200);
  var threw = false;
  try { S.shacal1Enc(new Uint8Array(19), key); } catch (e) { threw = true; }
  ck(threw, '明文长度非 20 字节未报错');
})();

console.log('E) 幂等性（工厂每次调用结果必须一致）');
(function () {
  var key = h2b(k64), pt = h2b('00112233445566778899aabbccddeeff00112233');
  var a = hx(S.shacal1Enc(pt, key)), b = hx(S.shacal1Enc(pt, key)), c = hx(S.shacal1Enc(pt, key));
  ck(a === b && b === c, '三次调用结果不一致: ' + a + ' / ' + b + ' / ' + c);
})();

console.log('\nSHACAL-1 测试: 通过 ' + P + '  失败 ' + F);
if (F) process.exit(1);
