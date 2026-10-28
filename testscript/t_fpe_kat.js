/* t_fpe_kat.js —— FPE（FF1 / FF3 / FF3-1）官方向量验收
 *
 * 向量来源（两个独立仓库，均经 codeload 实取）：
 *   FF1   : capitalone/fpe   ff1/ff1_test.go   （取自 NIST FF1samples.pdf）9 条
 *   FF3   : mysto/python-fpe ff3/ff3_test.py   （取自 NIST FF3samples.pdf）15 条
 *   FF3-1 : mysto/python-fpe ff3/ff3_test.py testVectors_ACVP_AES_FF3_1（ACVP，56-bit tweak）18 条
 *
 * FF3-1 与 FF3 的唯一差别在 tweak 长度：56 位而非 64 位。
 *   56→64 转换：b0,b1,b2 直抄；t64[3]=b3 & 0xF0；t64[4..6]=b4..b6；t64[7]=(b3 & 0x0F)<<4
 *   Feistel 主流程与 P 构造两者完全一致。
 */
const fs = require('fs'), vm = require('vm'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const ctx = { console, setTimeout, TextEncoder, TextDecoder, Uint8Array, Int32Array, BigInt, Math, Date, JSON, crypto: require('crypto').webcrypto };
ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
ctx.addEventListener = function () {};
ctx.document = { addEventListener: function () {}, getElementById: function () { return null }, querySelectorAll: function () { return [] }, createElement: function () { return { style: {}, setAttribute: function () {}, appendChild: function () {} } } };
vm.createContext(ctx);
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
[...html.matchAll(/src=['"]([^'"]+\.js)['"]/g)].map(m => m[1]).forEach(f => vm.runInContext(fs.readFileSync(path.join(DIST, f), 'utf8'), ctx, { filename: f }));

let PASS = 0, FAIL = 0;
const fails = [];
function chk(name, got, want) {
  if (got === want) { PASS++; }
  else { FAIL++; if (fails.length < 12) fails.push(name + '  got=' + got + '  want=' + want); }
}

const A10 = '0123456789';
const A26 = 'abcdefghijklmnopqrstuvwxyz';
const A36 = '0123456789abcdefghijklmnopqrstuvwxyz';
const A64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/';
/* NIST FF3samples.pdf 的 radix 26 用的是 BASE62 前 26 字符（0-9 然后 a-p），
   不是 a-z。参考实现 ff3.py：BASE62 = digits + lowercase + uppercase，
   alphabet = BASE62[0:radix]。我第一版按 a-z 写，radix 26 那 3 条全错——
   是测试脚本的字符集假设错，不是实现错。ACVP 的 FF3-1 向量则明确给 "a-z"。 */
const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const A26n = BASE62.slice(0, 26);
function alphaFor(radix) { return radix === 10 ? A10 : radix === 26 ? A26n : radix === 36 ? A36 : radix === 64 ? A64 : null; }
function toDigits(s, alpha) { return s.split('').map(c => alpha.indexOf(c)); }
function fromDigits(d, alpha) { return d.map(i => alpha[i]).join(''); }
function h2b(h) { return new Uint8Array(Buffer.from(h, 'hex')); }

/* ---------- FF1 官方 9 条 ---------- */
const FF1 = [
  [10, '2B7E151628AED2A6ABF7158809CF4F3C', '', '0123456789', '2433477484'],
  [10, '2B7E151628AED2A6ABF7158809CF4F3C', '39383736353433323130', '0123456789', '6124200773'],
  [36, '2B7E151628AED2A6ABF7158809CF4F3C', '3737373770717273373737', '0123456789abcdefghi', 'a9tv40mll9kdu509eum'],
  [10, '2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F', '', '0123456789', '2830668132'],
  [10, '2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F', '39383736353433323130', '0123456789', '2496655549'],
  [36, '2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F', '3737373770717273373737', '0123456789abcdefghi', 'xbj3kv35jrawxv32ysr'],
  [10, '2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F7F036D6F04FC6A94', '', '0123456789', '6657667009'],
  [10, '2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F7F036D6F04FC6A94', '39383736353433323130', '0123456789', '1001623463'],
  [36, '2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F7F036D6F04FC6A94', '3737373770717273373737', '0123456789abcdefghi', 'xs8a0azh2avyalyzuwd'],
];
FF1.forEach(function (v, i) {
  const radix = v[0], alpha = alphaFor(radix);
  const K = h2b(v[1]), T = h2b(v[2]);
  try {
    const d = toDigits(v[3], alpha);
    const e = ctx.ff1Core(K, T, d, radix, true);
    chk('FF1 enc #' + (i + 1), fromDigits(e, alpha), v[4]);
    const b = ctx.ff1Core(K, T, toDigits(v[4], alpha), radix, false);
    chk('FF1 dec #' + (i + 1), fromDigits(b, alpha), v[3]);
  } catch (err) { FAIL += 2; if (fails.length < 12) fails.push('FF1 #' + (i + 1) + ' EXC ' + err.message); }
});

/* ---------- FF3 官方 15 条（64-bit tweak） ---------- */
const K128 = 'EF4359D8D580AA4F7F036D6F04FC6A94';
const K192 = 'EF4359D8D580AA4F7F036D6F04FC6A942B7E151628AED2A6';
const K256 = 'EF4359D8D580AA4F7F036D6F04FC6A942B7E151628AED2A6ABF7158809CF4F3C';
const FF3 = [
  [10, K128, 'D8E7920AFA330A73', '890121234567890000', '750918814058654607'],
  [10, K128, '9A768A92F60E12D8', '890121234567890000', '018989839189395384'],
  [10, K128, 'D8E7920AFA330A73', '89012123456789000000789000000', '48598367162252569629397416226'],
  [10, K128, '0000000000000000', '89012123456789000000789000000', '34695224821734535122613701434'],
  [26, K128, '9A768A92F60E12D8', '0123456789abcdefghi', 'g2pk40i992fn20cjakb'],
  [10, K192, 'D8E7920AFA330A73', '890121234567890000', '646965393875028755'],
  [10, K192, '9A768A92F60E12D8', '890121234567890000', '961610514491424446'],
  [10, K192, 'D8E7920AFA330A73', '89012123456789000000789000000', '53048884065350204541786380807'],
  [10, K192, '0000000000000000', '89012123456789000000789000000', '98083802678820389295041483512'],
  [26, K192, '9A768A92F60E12D8', '0123456789abcdefghi', 'i0ihe2jfj7a9opf9p88'],
  [10, K256, 'D8E7920AFA330A73', '890121234567890000', '922011205562777495'],
  [10, K256, '9A768A92F60E12D8', '890121234567890000', '504149865578056140'],
  [10, K256, 'D8E7920AFA330A73', '89012123456789000000789000000', '04344343235792599165734622699'],
  [10, K256, '0000000000000000', '89012123456789000000789000000', '30859239999374053872365555822'],
  [26, K256, '9A768A92F60E12D8', '0123456789abcdefghi', 'p0b2godfja9bhb7bk38'],
];
FF3.forEach(function (v, i) {
  const radix = v[0], alpha = alphaFor(radix);
  try {
    const e = ctx.ff3Core(h2b(v[1]), h2b(v[2]), toDigits(v[3], alpha), radix, true);
    chk('FF3 enc #' + (i + 1), fromDigits(e, alpha), v[4]);
    const b = ctx.ff3Core(h2b(v[1]), h2b(v[2]), toDigits(v[4], alpha), radix, false);
    chk('FF3 dec #' + (i + 1), fromDigits(b, alpha), v[3]);
  } catch (err) { FAIL += 2; if (fails.length < 12) fails.push('FF3 #' + (i + 1) + ' EXC ' + err.message); }
});

/* ---------- FF3-1 ACVP 18 条（56-bit tweak） ---------- */
function tweak56to64(t) {
  const o = new Uint8Array(8);
  o[0] = t[0]; o[1] = t[1]; o[2] = t[2];
  o[3] = t[3] & 0xF0;
  o[4] = t[4]; o[5] = t[5]; o[6] = t[6];
  o[7] = (t[3] & 0x0F) << 4;
  return o;
}
const FF31 = [
  [10, '2DE79D232DF5585D68CE47882AE256D6', 'CBD09280979564', '3992520240', '8901801106'],
  [10, '01C63017111438F7FC8E24EB16C71AB5', 'C4E822DCD09F27', '60761757463116869318437658042297305934914824457484538562', '35637144092473838892796702739628394376915177448290847293'],
  [26, '718385E6542534604419E83CE387A437', 'B6F35084FA90E1', 'wfmwlrorcd', 'ywowehycyd'],
  [26, 'DB602DFF22ED7E84C8D8C865A941A238', 'EBEFD63BCC2083', 'kkuomenbzqvggfbteqdyanwpmhzdmoicekiihkrm', 'belcfahcwwytwrckieymthabgjjfkxtxauipmjja'],
  [64, 'AEE87D0D485B3AFD12BD1E0B9D03D50D', '5F9140601D224B', 'ixvuuIHr0e', 'GR90R1q838'],
  [64, '7B6C88324732F7F4AD435DA9AD77F917', '3F42102C0BAB39', '21q1kbbIVSrAFtdFWzdMeIDpRqpo', 'cvQ/4aGUV4wRnyO3CHmgEKW5hk8H'],
  [10, 'F62EDB777A671075D47563F3A1E9AC797AA706A2D8E02FC8', '493B8451BF6716', '4406616808', '1807744762'],
  [10, '0951B475D1A327C52756F2624AF224C80E9BE85F09B2D44F', 'D679E2EA3054E1', '99980459818278359406199791971849884432821321826358606310', '84359031857952748660483617398396641079558152339419110919'],
  [26, '49CCB8F62D941E5684599ECA0300937B5C766D053E109777', '0BFCF75CDC2FC1', 'jaxlrchjjx', 'kjdbfqyahd'],
  [26, '03D253674A9309FF07ED0E71B24CBFE769025E09FCE544D7', 'B33176B1DA0F6C', 'tafzrybuvhiqvcyztuxfnwfprmqlwpayphxbawpl', 'loaemzbgqkywkdhmncrijzildzleoqibtthdiliv'],
  [64, '1C24B74B7C1B9969314CB53E92F98EFD620D5520017FB076', '0380341C425A6F', '6np8r2t8zo', 'HgpCXoA1Rt'],
  [64, 'C0ABADFC071379824A070E8C3FD40DD9BFD7A3C99A0D5FE3', '6C2926C705DDAF', 'GKB6sa9g56BSJ09iJ4dsaxRdsMvo', 'gC0tTSdDPxM79QOWi+z+SNL9C4V+'],
  [10, '1FAA03EFF55A06F8FAB3F1DC57127D493E2F8F5C365540467A3A055BDBE6481D', '4D67130C030445', '3679409436', '1735794859'],
  [10, '9CE16E125BD422A011408EB083355E7089E70A4CD2F59E141D0B94A74BCC5967', '4684635BD2C821', '85783290820098255530464619643265070052870796363685134012', '75104723514036464144839960480545848044718729603261409917'],
  [26, '6187F8BDE99F7DAF9E3EE8A8654308E7E51D31FA88AFFAEB5592041C033B736B', '5820812B3D5DD1', 'mkblaoiyfd', 'ifpyiihvvq'],
  [26, 'F6807FB9688937E4D4956006C8F0CB2394148A5F4B14666CF353F4941428FFD7', '30C87B99890096', 'wrammvhudopmaazlsxevzwzwpezzmghwfnmkitnk', 'nzftnfkliuctlmtdfrxfhwgevrbcbgljurnytxkj'],
  [64, '9C2B69F7DDF181C54398E345BE04C2F6B00B9DD1679200E1E04C4FF961AE0F09', '103C238B4B1E44', 'H2/c6FblSA', 'EOg4H1bE+8'],
  [64, 'C58BCBD08B90006CEC7E82B2D987D79F6A21111DEF0CEBB273CBAEB2D6CD4044', '7036604882667B', 'bz5TcS1krnD8IOLdrQeKzXkLAa6h', 'Z6x3/9LPW8SZunRezRM8J68Q4J03'],
];
FF31.forEach(function (v, i) {
  const radix = v[0], alpha = (radix === 26 ? A26 : alphaFor(radix));
  try {
    const T = tweak56to64(h2b(v[2]));
    const e = ctx.ff3Core(h2b(v[1]), T, toDigits(v[3], alpha), radix, true);
    chk('FF3-1 enc #' + (i + 1), fromDigits(e, alpha), v[4]);
    const b = ctx.ff3Core(h2b(v[1]), T, toDigits(v[4], alpha), radix, false);
    chk('FF3-1 dec #' + (i + 1), fromDigits(b, alpha), v[3]);
  } catch (err) { FAIL += 2; if (fails.length < 12) fails.push('FF3-1 #' + (i + 1) + ' EXC ' + err.message); }
});

/* ---------- 入口层：真的走 reg 出来的界面条目 ---------- */
function ent(id) { return ctx.ALGOS.filter(function (a) { return a.id === id; })[0]; }
const e31 = ent('ff3-1');
if (!e31) { console.log('  ✗ 找不到 ff3-1 条目'); FAIL++; }
else {
  /* ACVP tg1 tc1：radix 10，56-bit tweak */
  try {
    const got = e31.enc('3992520240', '2DE79D232DF5585D68CE47882AE256D6', '10,CBD09280979564', 'utf8');
    chk('entry ff3-1 enc r10', got, '8901801106');
    const back = e31.dec('8901801106', '2DE79D232DF5585D68CE47882AE256D6', '10,CBD09280979564', 'utf8');
    chk('entry ff3-1 dec r10', back, '3992520240');
  } catch (err) { FAIL += 2; fails.push('entry ff3-1 r10 EXC ' + err.message); }
  /* ACVP tg3 tc51：radix 64，字符集 0-9A-Za-z+/ —— 顺带验字符集可配 */
  try {
    const p64 = '64,5F9140601D224B,' + A64;
    const got = e31.enc('ixvuuIHr0e', 'AEE87D0D485B3AFD12BD1E0B9D03D50D', p64, 'utf8');
    chk('entry ff3-1 enc r64', got, 'GR90R1q838');
    const back = e31.dec('GR90R1q838', 'AEE87D0D485B3AFD12BD1E0B9D03D50D', p64, 'utf8');
    chk('entry ff3-1 dec r64', back, 'ixvuuIHr0e');
  } catch (err) { FAIL += 2; fails.push('entry ff3-1 r64 EXC ' + err.message); }
  try {
    let threw = false;
    try { e31.enc('3992520240', '2DE79D232DF5585D68CE47882AE256D6', '10,D8E7920AFA330A73', 'utf8'); }
    catch (e2) { threw = true; }
    chk('entry ff3-1 tweak 长度校验', threw, true);
  } catch (err) { FAIL++; }
}
const e3 = ent('ff3');
if (e3) {
  try {
    chk('entry ff3 保持 64-bit tweak',
      e3.enc('890121234567890000', K128, '10,D8E7920AFA330A73', 'utf8'), '750918814058654607');
  } catch (err) { FAIL++; fails.push('entry ff3 EXC ' + err.message); }
}

console.log('FF1 ' + FF1.length * 2 + ' · FF3 ' + FF3.length * 2 + ' · FF3-1 ' + FF31.length * 2 + ' · 入口层 5');
console.log('PASS ' + PASS + '  FAIL ' + FAIL);
fails.forEach(function (s) { console.log('  ✗ ' + s); });
process.exit(FAIL ? 1 : 0);
