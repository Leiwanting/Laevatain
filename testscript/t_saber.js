/* Saber / LightSaber / FireSaber —— 官方 KAT 验收
 * ------------------------------------------------------------
 * 运行（必须在 index.html 所在目录）：
 *   node testscript/t_saber.js
 * ------------------------------------------------------------
 * 向量：KULeuven-COSIC/SABER 官方 KAT/PQCkemKAT_*.rsp，
 *       每组含 seed/pk/sk/ct/ss。随机性由【本项目的 CTR-DRBG】
 *       从 seed 复现（NIST AES256-CTR-DRBG，no-DF）——
 *       所以这组用例同时验证了 DRBG 与 Saber 两条链路（互操作性）。
 * 覆盖：3 参数集 × 10 组 = 30 组，校验 pk / sk / ct / ss / 解封装五项。
 */
require('./_harness.js');
var fs = require('fs'), path = require('path');
var D = globalThis.__nistDrbg;
if (!D) { console.error('缺少 __nistDrbg（crypto_drbg.js 未加载）'); process.exit(1); }

var hex2b = function (s) { var o = new Uint8Array(s.length / 2); for (var i = 0; i < o.length; i++) o[i] = parseInt(s.substr(i * 2, 2), 16); return o; };
var b2h = function (x) { var s = ''; for (var i = 0; i < x.length; i++) s += ('0' + x[i].toString(16)).slice(-2); return s; };

var lines = fs.readFileSync(path.join(__dirname, '..', 'testvectors', 'saber_kat.txt'), 'utf8').split('\n');
var cases = [];
for (var i = 0; i < lines.length; i++) {
  var L = lines[i].trim();
  if (!L || L.charAt(0) === '#') continue;
  var f = L.split(/\s+/);
  if (f.length < 7) continue;
  /* ⚠ 官方 .rsp 是【大写】Hex，b2h 输出小写，比较前必须统一大小写。
     否则会得出"30 组全 FAIL"的假象——实测踩到过。 */
  cases.push({ set: f[0], count: +f[1], seed: f[2].toLowerCase(), pk: f[3].toLowerCase(),
               sk: f[4].toLowerCase(), ct: f[5].toLowerCase(), ss: f[6].toLowerCase() });
}

function find(id) { for (var i = 0; i < ALGOS.length; i++) if (ALGOS[i].id === id) return ALGOS[i]; return null; }

/* 用 DRBG 复现官方 KAT 的确定性随机流，走条目层完成 KEM */
function runKat(setId, c) {
  var drbg = D.ctr(32, false, hex2b(c.seed), new Uint8Array(0), new Uint8Array(0));
  var rnd = function (n) { return drbg.generate(n); };
  var kg = find(setId + '-keygen'), en = find(setId + '-encaps'), de = find(setId + '-decaps');
  if (!kg || !en || !de) throw new Error('条目缺失 ' + setId);
  return { kg: kg, en: en, de: de, rnd: rnd };
}

var pass = 0, fail = 0, failed = [];
/* 直接调内部 KEM（条目层封装带格式化，KAT 比对用底层更准） */
var mod = null;
for (var i = 0; i < ALGOS.length; i++) { /* 条目已在 ALGOS 中即视为加载成功 */ }

/* 通过条目层跑：keygen 用注入式随机（临时替换 crypto.getRandomValues 不可行），
   故改为直接复用 harness 暴露的模块内部：用 _saberKat 钩子（若存在）。 */
var hook = globalThis.__saberKat || null;
if (!hook) { console.error('缺少 __saberKat 钩子'); process.exit(1); }

for (var i = 0; i < cases.length; i++) {
  var c = cases[i];
  var K = hook[c.set.toLowerCase()];
  if (!K) { fail++; failed.push(c.set + '#' + c.count + ' 参数集缺失'); continue; }
  var drbg = D.ctr(32, false, hex2b(c.seed), new Uint8Array(0), new Uint8Array(0));
  var kp = K.kemKeygen(function (n) { return drbg.generate(n); });
  var enc = K.kemEncaps(kp.pk, function (n) { return drbg.generate(n); });
  var ss2 = K.kemDecaps(enc.ct, kp.sk);
  var ok = b2h(kp.pk) === c.pk && b2h(kp.sk) === c.sk && b2h(enc.ct) === c.ct &&
           b2h(enc.ss) === c.ss && b2h(ss2) === c.ss;
  if (ok) pass++; else { fail++; failed.push(c.set + '#' + c.count); }
}
console.log('Saber 官方 KAT（' + cases.length + ' 组 × pk/sk/ct/ss/解封装）');
console.log('  PASS ' + pass + '   FAIL ' + fail);
if (fail) console.log('  失败：' + failed.slice(0, 5).join(', '));
process.exit(fail ? 1 : 0);
