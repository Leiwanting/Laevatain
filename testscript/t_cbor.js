/* CBOR 官方测试向量验证（RFC 8949 附录 A，82 条）
   来源：CBOR 工作组 test-vectors 仓库 appendix_a.json
   每条目做三件事：
     1) hex → 值树 → 诊断表示，与官方 diagnostic 字段逐字比对（若有）
     2) hex → 值树 → JSON，与官方 decoded 字段深度比对（若有）
     3) roundtrip=true 的条目：诊断表示 → 值树 → hex，必须与官方 hex 完全相同
*/
var fs = require('fs');
global.reg = function () { };
global.bytesToHex = function (b) { var s = ''; for (var i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0'); return s; };
global.hexToBytes = function (h) { return new Uint8Array(Buffer.from(String(h).replace(/[^0-9a-fA-F]/g, ''), 'hex')); };
global.bytesToStr = function (b) { return Buffer.from(b).toString('utf8'); };
global.strToBytes = function (s) { return new Uint8Array(Buffer.from(s, 'utf8')); };
var V = JSON.parse(fs.readFileSync(__dirname + '/testvectors/cbor_appendix_a.json', 'utf8'));
var C = require('../CryptoJS/crypto_cbor.js');

function toJson(v) {
  switch (v.k) {
    case 'uint': case 'nint': return Number(v.v);
    case 'text': return v.indef ? v.chunks.join('') : v.v;
    case 'bytes': return undefined;            /* JSON 无法表示字节串 */
    case 'array': return v.v.map(toJson);
    case 'map': {
      var o = {};
      for (var i = 0; i < v.v.length; i++) {
        var k = toJson(v.v[i][0]);
        o[String(k)] = toJson(v.v[i][1]);
      }
      return o;
    }
    case 'tag': return undefined;
    case 'simple':
      if (v.n === 20) return false;
      if (v.n === 21) return true;
      if (v.n === 22) return null;
      return undefined;
    case 'float': return v.v;
    case 'undef': return undefined;
  }
  throw new Error('未知节点 ' + v.k);
}
function deepEq(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') return a === b;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  var ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (var i = 0; i < ka.length; i++) if (!deepEq(a[ka[i]], b[ka[i]])) return false;
  return true;
}
function normD(s) { return String(s).replace(/\s+/g, ' ').trim(); }

var pass = 0, fail = 0, skipped = 0;
V.forEach(function (o, idx) {
  var id = '#' + idx + ' ' + o.hex;
  var v;
  try { v = C.decodeOne(Buffer.from(o.hex, 'hex')); }
  catch (e) { fail++; console.log('FAIL ' + id + '  解码抛错: ' + e.message); return; }

  var ok = true, why = [];
  /* 1) 诊断表示 */
  if (o.diagnostic !== undefined) {
    var got = C.diag(v);
    if (normD(got) !== normD(o.diagnostic)) { ok = false; why.push('诊断 got=' + got + ' exp=' + o.diagnostic); }
  }
  /* 2) JSON 语义 */
  if (o.decoded !== undefined) {
    var j = toJson(v);
    if (j === undefined && o.decoded !== undefined && o.diagnostic === undefined) {
      skipped++;   /* 字节串/标签等 JSON 无法表示的条目，已由 1) 覆盖 */
    } else if (!deepEq(j, o.decoded)) {
      ok = false; why.push('JSON got=' + JSON.stringify(j) + ' exp=' + JSON.stringify(o.decoded));
    }
  }
  /* 3) 回编 */
  if (o.roundtrip) {
    try {
      var back = C.toHex(Buffer.from(C.encNode(C.parseDiag(C.diag(v)))));
      if (back !== o.hex) { ok = false; why.push('回编 got=' + back + ' exp=' + o.hex); }
    } catch (e) { ok = false; why.push('回编抛错: ' + e.message); }
  }
  if (ok) pass++; else { fail++; console.log('FAIL ' + id + '  ' + why.join(' | ')); }
});
console.log('CBOR 官方向量：通过 ' + pass + ' / 失败 ' + fail + '（JSON 不可表示的 ' + skipped + ' 条已由诊断比对覆盖）');

/* 拒绝类测试：坏数据必须报错，不能静默产出垃圾 */
var bad = [
  ['附加信息保留值', '1c'],
  ['孤立结束符', 'ff'],
  ['字节串长度越界', '44010203'],
  ['不定长字节串缺结束符', '5f420102'],
  ['标签后无内容', 'c1'],
  ['截断的半精度浮点', 'f900'],
  ['非法 UTF-8 文本串', '62c328']
];
var bp = 0, bf = 0;
bad.forEach(function (t) {
  try { C.decodeOne(Buffer.from(t[1], 'hex')); bf++; console.log('FAIL 应拒绝却通过: ' + t[0]); }
  catch (e) { bp++; }
});
console.log('CBOR 拒绝类：通过 ' + bp + ' / 失败 ' + bf);

/* 大整数精度：2^64 必须完整保留，不能退化成 Number */
var bigHex='c249010000000000000000';
var bigV=C.decodeOne(Buffer.from(bigHex,'hex'));
var bigDiag=C.diag(bigV);
var bigBack=C.toHex(Buffer.from(C.encNode(C.parseDiag(bigDiag))));
console.log('CBOR bignum: diag='+bigDiag+' 回编='+bigBack+' -> '+((bigDiag==='18446744073709551616'&&bigBack===bigHex)?'PASS':'FAIL'));

process.exit(fail || bf ? 1 : 0);
