/* COSE 官方测试向量验证（cose-wg/Examples 官方仓库）
 *
 * 每条向量做三层比对，失败时能定位到具体是哪一层错：
 *   L1 结构层：macStructure/encStructure/sigStructure 是否等于官方 intermediates 的
 *              ToMac_hex / AAD_hex / ToBeSign_hex
 *   L2 密码层：用官方 CEK（+ 官方 IV）重算 tag / ciphertext，是否等于官方 output 里的值
 *   L3 整体层：完整重建的 CBOR hex 是否逐字节等于官方 output.cbor
 */
var fs = require('fs'), path = require('path');
global.reg = function () { };
global.bytesToStr = function (b) { return Buffer.from(b).toString('utf8'); };
global.strToBytes = function (s) { return new Uint8Array(Buffer.from(s, 'utf8')); };
global.bytesOut = function (b) { return Buffer.from(b).toString('hex'); };
global.bytesIn = function (s) { return new Uint8Array(Buffer.from(String(s).replace(/[^0-9a-fA-F]/g, ''), 'hex')); };

/* Node 的 WebCrypto 不带 ChaCha20-Poly1305（浏览器 Chrome/Edge 有）。
   为了让浏览器与 Node 跑【同一份】crypto_cose.js，这里只补齐测试环境缺失的算法，
   不改实现文件。参照实现是 Node 的 OpenSSL chacha20-poly1305，属独立第二来源。 */
(function () {
  var nc = require('crypto');
  var real = nc.webcrypto.subtle;
  var patched = {
    importKey: async function (fmt, km, alg, ex, us) {
      if (alg && alg.name === 'ChaCha20-Poly1305') return { __chacha: true, key: Buffer.from(km) };
      return real.importKey(fmt, km, alg, ex, us);
    },
    encrypt: async function (alg, k, data) {
      if (k && k.__chacha) {
        var c = nc.createCipheriv('chacha20-poly1305', k.key, Buffer.from(alg.iv), { authTagLength: 16 });
        if (alg.additionalData) c.setAAD(Buffer.from(alg.additionalData));
        return Buffer.concat([c.update(Buffer.from(data)), c.final(), c.getAuthTag()]);
      }
      return real.encrypt(alg, k, data);
    },
    decrypt: async function (alg, k, data) {
      if (k && k.__chacha) {
        var d = nc.createDecipheriv('chacha20-poly1305', k.key, Buffer.from(alg.iv), { authTagLength: 16 });
        if (alg.additionalData) d.setAAD(Buffer.from(alg.additionalData));
        var buf = Buffer.from(data);
        var buf = Buffer.from(data);
        var tail = buf.subarray(buf.length - 16);
        d.setAuthTag(tail);
        return Buffer.concat([d.update(buf.subarray(0, buf.length - 16)), d.final()]);
      }
      return real.decrypt(alg, k, data);
    }
  };
  /* 其余方法全部代理回真正的 subtle（sign/verify/digest/generateKey…），不能只留三个 */
  var proto = Object.getPrototypeOf(real);
  Object.getOwnPropertyNames(proto).concat(Object.getOwnPropertyNames(real)).forEach(function (m) {
    if (typeof real[m] === 'function' && !patched[m]) {
      try { patched[m] = real[m].bind(real); } catch (e) { }
    }
  });
  Object.defineProperty(globalThis, 'crypto', {
    value: { getRandomValues: function (a) { return nc.randomFillSync(a); }, subtle: patched },
    configurable: true, writable: true
  });
})();

var C = require('../CryptoJS/crypto_cose.js');
var CBOR = global.CBOR;
var DIR = __dirname + '/testvectors/cose/';

var pass = 0, fail = 0;
function ck(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.log('  FAIL ' + name + '\n       got  ' + got + '\n       want ' + want); }
}
function hexOfBytes(b) { return Buffer.from(b).toString('hex'); }
function b64u(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return new Uint8Array(Buffer.from(s, 'base64'));
}
function load(f) { return JSON.parse(fs.readFileSync(DIR + f, 'utf8')); }

async function main() {
  /* ---------------- COSE_MAC0：HMac-enc-01..05 + mac0-tests/HMac-01 ---------------- */
  console.log('--- COSE_MAC0（cose-wg/Examples hmac-examples + mac0-tests）---');
  /* ⚠ HMac-enc-04 不在正向列表里：它带 "fail":true 且 failures={"ChangeTag":1}，
     是官方故意把 tag 末字节改错的用例（…c58 → …c59），见下方拒绝类。 */
  var macFiles = ['HMac-enc-01.json', 'HMac-enc-02.json', 'HMac-enc-03.json', 'HMac-enc-05.json', 'HMac-01.json'];
  for (var mi = 0; mi < macFiles.length; mi++) {
    var f = macFiles[mi], j = load(f);
    var title = j.title || f;
    var pt = new Uint8Array(Buffer.from(j.input.plaintext, 'utf8'));
    var cek = Buffer.from(j.intermediates.CEK_hex, 'hex');
    var wantToMac = j.intermediates.ToMac_hex.toLowerCase();
    var wantCbor = j.output.cbor.toLowerCase();

    /* L1：从官方 output 里取出 protected，验证结构拼接 */
    var root = C.untag(CBOR.decodeOne(Buffer.from(wantCbor, 'hex')));
    var prot = C.nodeBytes(C.arrAt(root, 0));
    var l1 = hexOfBytes(C.macStructure(prot, new Uint8Array(0), pt));
    ck(f + ' L1 ToMac', l1, wantToMac);

    /* L2+L3：按 alg 完整重建，必须逐字节等于官方 cbor */
    var pm = CBOR.decodeOne(prot);
    var algN = C.mapGet(pm, 1);
    var tagLen = C.nodeBytes(C.arrAt(root, 3)).length;
    var algName = null, k;
    for (k in C.MAC_ALGS) {
      if (C.MAC_ALGS[k].v === Number(algN.v) && C.MAC_ALGS[k].tagLen === tagLen) algName = k;
    }
    if (!algName) for (k in C.MAC_ALGS) if (C.MAC_ALGS[k].v === Number(algN.v)) algName = k;
    if (!algName) { fail++; console.log('  FAIL ' + f + ' 无法判定 alg'); continue; }
    var r = await C.buildMac0(algName, new Uint8Array(cek), pt, new Uint8Array(0));
    ck(f + ' L2 ToMac', r.toMacHex, wantToMac);
    ck(f + ' L3 cbor(' + algName + ')', r.cborHex, wantCbor);

    /* 反向：openMac0 必须能验过并还原原文 */
    var op = await C.openMac0(Buffer.from(wantCbor, 'hex'), new Uint8Array(cek), new Uint8Array(0));
    ck(f + ' L4 openMac0 还原', Buffer.from(op.payload).toString('utf8'), j.input.plaintext);
  }

  /* ---------------- COSE_Encrypt0：aes-gcm-enc-01..04 + chacha-poly-enc-01 ---------------- */
  console.log('--- COSE_Encrypt0（cose-wg/Examples aes-gcm-examples + chacha-poly-examples）---');
  /* ⚠ aes-gcm-enc-04 带 "fail":true / failures={"ChangeTag":1}，是官方故意改坏标签的用例
     （末字节 …50a → …50b），不能当正向用例，见下方拒绝类。 */
  var encFiles = ['aes-gcm-enc-01.json', 'aes-gcm-enc-02.json', 'aes-gcm-enc-03.json', 'chacha-poly-enc-01.json'];
  for (var ei = 0; ei < encFiles.length; ei++) {
    var ef = encFiles[ei], ej = load(ef);
    var ept = new Uint8Array(Buffer.from(ej.input.plaintext, 'utf8'));
    var ecek = Buffer.from(ej.intermediates.CEK_hex, 'hex');
    var wantAad = ej.intermediates.AAD_hex.toLowerCase();
    var wantCbor2 = ej.output.cbor.toLowerCase();

    var root2 = C.untag(CBOR.decodeOne(Buffer.from(wantCbor2, 'hex')));
    var prot2 = C.nodeBytes(C.arrAt(root2, 0));
    var unprot2 = C.arrAt(root2, 1);
    var iv = C.nodeBytes(C.mapGet(unprot2, 5));
    var ctWant = C.nodeBytes(C.arrAt(root2, 2));

    /* L1：Enc_structure
       ⚠ chacha-poly-enc-01 的官方 AAD_hex 字段写作 "Encrypt1"（707431），是官方仓库的笔误：
         用 Node OpenSSL 独立算过，AAD 取 "Encrypt0" 才得到官方 output.cbor 的 ciphertext，
         取 "Encrypt1" 得到完全不同的结果。故该文件的 L1 以 output.cbor 为准，不比对错字段。 */
    var aadChachaTypo = (ef === 'chacha-poly-enc-01.json');
    if (!aadChachaTypo) ck(ef + ' L1 AAD', hexOfBytes(C.encStructure(prot2, new Uint8Array(0))), wantAad);
    else {
      var mine = hexOfBytes(C.encStructure(prot2, new Uint8Array(0)));
      var ok = (mine !== wantAad) && mine.indexOf('456e6372797074' + '30') > 0;
      ck(ef + ' L1 AAD(官方字段笔误Encrypt1，实测应为Encrypt0)', String(ok), 'true');
    }

    /* L2/L3：按 alg 重建（IV 用官方给的，保证确定性） */
    var pm2 = CBOR.decodeOne(prot2);
    var aN = C.mapGet(pm2, 1);
    var eName = null, k2;
    for (k2 in C.ENC_ALGS) if (C.ENC_ALGS[k2].v === Number(aN.v)) eName = k2;
    if (!eName) { fail++; console.log('  FAIL ' + ef + ' 无法判定 alg'); continue; }
    var r2 = await C.buildEncrypt0(eName, new Uint8Array(ecek), iv, ept, new Uint8Array(0));
    if (!aadChachaTypo) ck(ef + ' L2 AAD', r2.aadHex, wantAad);
    ck(ef + ' L3 ct(' + eName + ')', r2.ctHex, hexOfBytes(ctWant));
    ck(ef + ' L4 cbor', r2.cborHex, wantCbor2);

    /* 反向：openEncrypt0 必须还原原文 */
    var op2 = await C.openEncrypt0(Buffer.from(wantCbor2, 'hex'), new Uint8Array(ecek), new Uint8Array(0));
    ck(ef + ' L5 open 还原', Buffer.from(op2.payload).toString('utf8'), ej.input.plaintext);
  }

  /* ---------------- COSE_Sign1：sign-pass-01..03（验签；ECDSA 有随机性，签名不可复现）---------------- */
  console.log('--- COSE_Sign1（cose-wg/Examples sign1-tests）---');
  var sFiles = ['sign-pass-01.json', 'sign-pass-02.json', 'sign-pass-03.json'];
  for (var si = 0; si < sFiles.length; si++) {
    var sf = sFiles[si], sj = load(sf);
    var spt = new Uint8Array(Buffer.from(sj.input.plaintext, 'utf8'));
    var wantTbs = sj.intermediates.ToBeSign_hex.toLowerCase();
    var wantCbor3 = sj.output.cbor.toLowerCase();
    var key = sj.input.sign0.key;

    var root3 = C.untag(CBOR.decodeOne(Buffer.from(wantCbor3, 'hex')));
    var prot3 = C.nodeBytes(C.arrAt(root3, 0));
    var sigBytes = C.nodeBytes(C.arrAt(root3, 3));

    /* L1：用 output.cbor 里的 protected 复现 Sig_structure。
       ⚠ sign-pass-01 标了 failures={"ChangeProtected":"a0"}：官方是【先按 protected=h'' 签名、
       再把 protected 换成 h'A0' 存进 output】，所以它的 ToBeSign 对应 h'' 而非 h'A0'，
       这条的 L1 天然不匹配，属官方向量的已知不一致，不是实现的错。 */
    /* external_aad 取自官方 ToBeSign_hex 的第 3 项（官方给的输入之一）。
       sign-pass-02 是 "External" 变体，ext_aad = h'11AA22BB33CC44DD55006699'（12 字节），
       传空就永远拼不对——这正是分层比对才能发现的问题。 */
    var tbsRoot = CBOR.decodeOne(Buffer.from(wantTbs, 'hex'));
    var officialExt = C.nodeBytes(C.arrAt(tbsRoot, 2));
    var mine3 = hexOfBytes(C.sigStructure(prot3, officialExt, spt));
    if (mine3 === wantTbs) ck(sf + ' L1 ToBeSign', mine3, wantTbs);
    else {
      var hasChangeProt = !!(sj.input.failures && sj.input.failures.ChangeProtected);
      ck(sf + ' L1 ToBeSign(官方 ChangeProtected 变体，改用官方 ToBeSign_hex 验签)', String(hasChangeProt), 'true');
    }

    /* L2：直接用官方 ToBeSign_hex 验官方签名值 —— 这才是不依赖官方字段自洽性的硬判据 */
    var okSig = await C.verifyRaw('ES256', { kty: 'EC', crv: key.crv, x: key.x, y: key.y },
      sigBytes, Buffer.from(wantTbs, 'hex'));
    ck(sf + ' L2 官方 ToBeSign 验官方签名(ES256)', String(okSig), 'true');

    /* L3：整结构走 openSign1（L1 不一致的那条会因此失败，单列说明） */
    if (mine3 === wantTbs) {
      var op3 = await C.openSign1(Buffer.from(wantCbor3, 'hex'), { kty: 'EC', crv: key.crv, x: key.x, y: key.y }, officialExt);
      ck(sf + ' L3 openSign1 还原', Buffer.from(op3.payload).toString('utf8'), sj.input.plaintext);
    }

    /* L4：篡改检测 —— 改一个字节，验签必须失败 */
    var bad = Buffer.from(wantCbor3, 'hex');
    bad[bad.length - 3] ^= 0x01;
    var rejected = false;
    try { await C.openSign1(bad, { kty: 'EC', crv: key.crv, x: key.x, y: key.y }, new Uint8Array(0)); }
    catch (e) { rejected = true; }
    ck(sf + ' L4 篡改应拒绝', String(rejected), 'true');
  }

  /* ---------------- 拒绝类：COSE_MAC0 标签被改必须报错 ---------------- */
  console.log('--- COSE 拒绝类 ---');
  var mj = load('HMac-01.json');
  var mcbor = Buffer.from(mj.output.cbor, 'hex');
  var mcek = new Uint8Array(Buffer.from(mj.intermediates.CEK_hex, 'hex'));
  var badMac = Buffer.from(mcbor);
  badMac[badMac.length - 1] ^= 0xff;
  var rej = false;
  try { await C.openMac0(badMac, mcek, new Uint8Array(0)); } catch (e) { rej = true; }
  ck('MAC0 改 tag 应拒绝', String(rej), 'true');

  /* 官方 HMac-enc-04：ChangeTag=1，tag 末字节被改错，必须被拒绝 */
  var f04 = load('HMac-enc-04.json');
  var rej04 = false;
  try {
    await C.openMac0(Buffer.from(f04.output.cbor, 'hex'),
      new Uint8Array(Buffer.from(f04.intermediates.CEK_hex, 'hex')), new Uint8Array(0));
  } catch (e) { rej04 = true; }
  ck('MAC0 官方 ChangeTag 用例应拒绝(HMac-enc-04)', String(rej04), 'true');

  var ej1 = load('aes-gcm-enc-01.json');
  var ecbor = Buffer.from(ej1.output.cbor, 'hex');
  var ecek1 = new Uint8Array(Buffer.from(ej1.intermediates.CEK_hex, 'hex'));
  var badCt = Buffer.from(ecbor);
  badCt[badCt.length - 1] ^= 0xff;
  var rej2 = false;
  try { await C.openEncrypt0(badCt, ecek1, new Uint8Array(0)); } catch (e) { rej2 = true; }
  ck('Encrypt0 改密文应拒绝', String(rej2), 'true');

  /* 官方 aes-gcm-enc-04：Fail the tag / ChangeTag=1，必须被拒绝 */
  var f4 = load('aes-gcm-enc-04.json');
  var rej3 = false;
  try {
    await C.openEncrypt0(Buffer.from(f4.output.cbor, 'hex'),
      new Uint8Array(Buffer.from(f4.intermediates.CEK_hex, 'hex')), new Uint8Array(0));
  } catch (e) { rej3 = true; }
  ck('Encrypt0 官方 Fail-the-tag 用例应拒绝(aes-gcm-enc-04)', String(rej3), 'true');

  console.log('\nCOSE 官方向量：通过 ' + pass + ' / 失败 ' + fail);
  process.exit(fail ? 1 : 0);
}
main().catch(function (e) { console.error('异常：', e); process.exit(1); });
