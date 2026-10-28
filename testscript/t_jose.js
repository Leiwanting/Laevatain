/* JOSE 官方向量测试 —— RFC 7520
 * 向量来源：panva/jose cookbook（逐条标注 rfc7520 章节）+ dahnielson/rfc7520（4.1 全套私钥）
 * 验证方向：
 *   JWS —— 验签（全 8 条）+ 确定性算法重签比对（RS256/EdDSA/HS256）
 *   JWE —— 解密还原明文（全 12 条）+ 给定 cek/iv 重加密比对 compact
 */
const JOSE = require('../CryptoJS/crypto_jose.js');
const jws = require('../testvectors/jose/jws.json');
const jwe = require('../testvectors/jose/jwe.json');

let pass = 0, fail = 0;
const errs = [];
function ok(cond, name, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; errs.push(name + (detail ? ' :: ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' :: ' + detail : '')); }
}
const hex = b => Buffer.from(b).toString('hex');

function pubOf(jwk) {
  const o = Object.assign({}, jwk);
  delete o.d; delete o.p; delete o.q; delete o.dp; delete o.dq; delete o.qi;
  return o;
}

async function testJWS() {
  console.log('\n=== JWS（RFC 7515）验签 ===');
  for (let i = 0; i < jws.length; i++) {
    const e = jws[i];
    const t = e.title.split('#').slice(-1)[0].slice(0, 42);
    const out = e.output || {};
    const flat = out.json_flat || out.json || {};
    const protectedB64u = flat.protected !== undefined ? flat.protected
      : (e.signing && e.signing.protected ? JOSE.b64uEnc(JOSE.utf8(JSON.stringify(e.signing.protected))) : '');
    if (protectedB64u === undefined) { ok(false, '[' + i + '] ' + t + ' 缺 protected'); continue; }
    const payloadSeg = flat.payload;
    if (payloadSeg === undefined) { ok(false, '[' + i + '] ' + t + ' 缺 payload'); continue; }
    const sigB64u = flat.signature;
    if (sigB64u === undefined) { ok(false, '[' + i + '] ' + t + ' 缺 signature'); continue; }
    /* alg：优先 protected 里的，其次 unprotected，其次 input.alg */
    let alg = null;
    try { alg = JSON.parse(Buffer.from(JOSE.b64uDec(protectedB64u)).toString()).alg; } catch (_) { }
    if (!alg && e.signing && e.signing.unprotected) alg = e.signing.unprotected.alg;
    if (!alg) alg = e.input.alg;
    const b64 = (protectedB64u ? JSON.parse(Buffer.from(JOSE.b64uDec(protectedB64u)).toString()) : (e.signing.unprotected || {})).b64;
    try {
      const key = e.input.key;
      const vkey = (key.kty === 'oct' || (key.kty === 'RSA' && !alg.startsWith('RS') && !alg.startsWith('PS'))) ? key
        : (key.d ? pubOf(key) : key);
      const r = await JOSE.jwsVerify(alg, vkey, protectedB64u, payloadSeg, sigB64u, { b64: b64 === false ? false : undefined });
      ok(r === true, '[' + i + '] ' + t + ' 验签(' + alg + ')');
    } catch (ex) {
      ok(false, '[' + i + '] ' + t + ' 验签(' + alg + ')', ex.message);
    }
  }

  console.log('\n=== JWS 确定性算法重签比对 ===');
  /* RS256 / EdDSA / HS256 是确定性的：同一输入必得同一签名 */
  const detIdx = [];
  jws.forEach((e, i) => {
    let alg = e.input.alg;
    if (alg === 'RS256' || alg === 'EdDSA' || alg === 'HS256') detIdx.push(i);
  });
  for (const i of detIdx) {
    const e = jws[i];
    const t = e.title.split('#').slice(-1)[0].slice(0, 42);
    const flat = (e.output || {}).json_flat || (e.output || {}).json || {};
    const protectedB64u = flat.protected !== undefined ? flat.protected
      : JOSE.b64uEnc(JOSE.utf8(JSON.stringify(e.signing.protected)));
    if (flat.signature === undefined) continue;   /* 无签名值可比（如 4.7 只有 json 序列化） */
    /* ⚠ 4.7「Protecting Content Only」的 protected 段是空串 —— 此时 alg 全在 unprotected 里，
       JSON.parse('') 会崩。空串代表「无受保护头」，签名输入以 '.' + payload 开头。 */
    const protObj = protectedB64u
      ? JSON.parse(Buffer.from(JOSE.b64uDec(protectedB64u)).toString())
      : {};
    const b64 = protObj.b64;
    const payloadBytes = b64 === false ? JOSE.utf8(flat.payload) : JOSE.b64uDec(flat.payload);
    try {
      const r = await JOSE.jwsSign(e.input.alg, e.input.key, protObj, payloadBytes, { b64: b64, protectedB64u: protectedB64u });
      ok(r.signature === flat.signature, '[' + i + '] ' + t + ' 重签一致(' + e.input.alg + ')',
        r.signature === flat.signature ? '' : 'got ' + r.signature.slice(0, 30) + ' want ' + flat.signature.slice(0, 30));
    } catch (ex) {
      ok(false, '[' + i + '] ' + t + ' 重签(' + e.input.alg + ')', ex.message);
    }
  }
}

/* 从 panva cookbook 里取 header 字段。
   ⚠ epk / p2s / p2c / GCMKW 的 iv+tag 都挂在 encrypting_content.protected 上，
     不在 output.json_flat 顶层 —— 取错地方会导致 ECDH-ES / PBES2 / GCMKW 全部解不出 CEK。 */
function jweHeaderOf(e) {
  const ec = e.encrypting_content || {};
  const h = Object.assign({}, ec.protected || {}, ec.unprotected || {});
  return h;
}
/* 由 json_flat 构造 5 段 compact：protected 可能为空串（RFC 7520 §5.12 只有 unprotected） */
function compactOf(e) {
  if (e.output && e.output.compact) return e.output.compact;
  const f = (e.output && (e.output.json_flat || e.output.json)) || {};
  if (f.ciphertext === undefined) return null;
  return [f.protected || '', f.encrypted_key || '', f.iv || '', f.ciphertext, f.tag].join('.');
}

async function testJWE() {
  console.log('\n=== JWE（RFC 7516）解密还原明文 ===');
  for (let i = 0; i < jwe.length; i++) {
    const e = jwe[i];
    const t = e.title.split('#').slice(-1)[0].slice(0, 44);
    const compact = compactOf(e);
    if (!compact) { ok(false, '[' + i + '] ' + t + ' 无 compact/json'); continue; }
    const inp = e.input || {};
    const protSeg = compact.split('.')[0];
    /* §5.12「Protecting Content Only」的 protected 段是空串 —— JSON.parse('') 会崩 */
    const protectedObj = protSeg ? JSON.parse(Buffer.from(JOSE.b64uDec(protSeg)).toString()) : {};
    const flat = (e.output || {}).json_flat || (e.output || {}).json || {};
    /* ⚠ epk / p2s / p2c / GCMKW 的 iv+tag 挂在 encrypting_content 上，不在 output.json_flat 顶层 */
    const unprotectedPre = flat.unprotected || (e.encrypting_content || {}).unprotected || null;
    const algP = protectedObj.alg || (unprotectedPre && unprotectedPre.alg) || inp.alg || '';
    const hdr = Object.assign({}, jweHeaderOf(e), protectedObj, unprotectedPre || {});
    ['epk', 'p2s', 'p2c', 'apu', 'apv'].forEach(k => {
      if (flat[k] !== undefined && hdr[k] === undefined) hdr[k] = flat[k];
    });
    /* GCMKW 的 iv/tag 是解 CEK 用的配套参数，也在 encrypting_content.protected 里 */
    if (algP.indexOf('GCMKW') >= 0) {
      if (hdr.iv === undefined) hdr.iv = flat.iv;
      if (hdr.tag === undefined) hdr.tag = flat.tag;
    }
    const unprotected = flat.unprotected || (e.encrypting_content || {}).unprotected || null;
    const externalAad = flat.aad ? JOSE.b64uDec(flat.aad) : (inp.aad ? JOSE.utf8(inp.aad) : null);
    /* PBES2 用的是【口令】input.pwd，不是 input.key */
    const jweKey = algP.indexOf('PBES2') === 0 ? inp.pwd : inp.key;
    try {
      const r = await JOSE.jweDecrypt(compact, jweKey, { header: hdr, unprotected: unprotected, aad: externalAad });
      const want = typeof inp.plaintext === 'string' ? JOSE.utf8(inp.plaintext) : inp.plaintext;
      /* zip:DEF 的条目先解压 */
      let got = r.plaintext;
      const gotStr = Buffer.from(got).toString('utf8');
      ok(gotStr === inp.plaintext, '[' + i + '] ' + t + ' 解密(' + protectedObj.alg + '/' + protectedObj.enc + ')',
        gotStr === inp.plaintext ? '' : 'got ' + gotStr.slice(0, 40).replace(/\n/g, '\\n') + ' want ' + String(inp.plaintext).slice(0, 40));
    } catch (ex) {
      ok(false, '[' + i + '] ' + t + ' 解密(' + protectedObj.alg + '/' + protectedObj.enc + ')', ex.message);
    }
  }

  console.log('\n=== JWE 给定 cek/iv 重加密比对 compact ===');
  for (let i = 0; i < jwe.length; i++) {
    const e = jwe[i];
    const t = e.title.split('#').slice(-1)[0].slice(0, 44);
    const inp = e.input || {}, gen = e.generated || {};
    const compact = (e.output || {}).compact;
    if (!compact) continue;
    const flat = (e.output || {}).json_flat || (e.output || {}).json || {};
    const protSeg = compact.split('.')[0];
    const protectedObj = protSeg ? JSON.parse(Buffer.from(JOSE.b64uDec(protSeg)).toString()) : {};
    const alg = protectedObj.alg || (flat.unprotected && flat.unprotected.alg) || inp.alg;
    const enc = protectedObj.enc || (flat.unprotected && flat.unprotected.enc) || inp.enc;
    /* 只有同时给了 cek 和 iv（或 dir 给了 iv）才能确定性重放；RSA1_5/RSA-OAEP/ECDH-ES 加密本身随机 → 跳过 */
    /* RSA1_5 / RSA-OAEP / ECDH-ES 的「密钥加密」本身带随机性（padding 或临时密钥对），
       即使给定 cek 也复现不出官方 encrypted_key —— 它们只能验解密，不能验重放。 */
    const randomAlg = alg === 'RSA1_5' || alg.indexOf('RSA-OAEP') === 0 || alg.indexOf('ECDH-ES') === 0;
    /* zip:DEF 的 DEFLATE 字节流取决于压缩器实现（级别/策略），不同实现输出不同。
       密码学部分由解密侧验证即可，强行比对 compact 会因压缩器差异假失败。 */
    if (protectedObj.zip) { console.log('  SKIP [' + i + '] ' + t + ' (zip:DEF 压缩字节随实现而异，解密侧已验)'); continue; }
    const canReplay = !randomAlg && ((gen.cek && gen.iv) || (alg === 'dir' && gen.iv));
    if (!canReplay) { console.log('  SKIP [' + i + '] ' + t + ' (' + alg + ' 加密含随机量，仅解密可验)'); continue; }
    const unprotected = flat.unprotected || (e.encrypting_content || {}).unprotected || null;
    const externalAad = flat.aad ? JOSE.b64uDec(flat.aad) : (inp.aad ? JOSE.utf8(inp.aad) : null);
    try {
      const encKey = alg.indexOf('PBES2') === 0 ? inp.pwd : inp.key;
      const r = await JOSE.jweEncrypt({
        alg, enc, key: encKey, plaintext: inp.plaintext,
        cek: gen.cek, iv: gen.iv, generated: gen,
        protected: Object.assign({}, protectedObj),
        protectedB64u: compact.split('.')[0],   /* 用官方编码，保证键顺序一致 */
        zip: protectedObj.zip,
        aad: externalAad,
        generated: Object.assign({}, gen, jweHeaderOf(e)),
        unprotected: (unprotected && Object.keys(unprotected).length) ? unprotected : null
      });
      ok(r.compact === compact, '[' + i + '] ' + t + ' 重加密一致(' + alg + ')',
        r.compact === compact ? '' : 'got  ' + r.compact.slice(0, 90) + '\n        want ' + compact.slice(0, 90));
    } catch (ex) {
      ok(false, '[' + i + '] ' + t + ' 重加密(' + alg + ')', ex.message);
    }
  }
}

(async () => {
  await testJWS();
  await testJWE();
  console.log('\n=========================================');
  console.log('JOSE 官方向量：通过 ' + pass + ' / 失败 ' + fail);
  if (errs.length) { console.log('\n失败明细：'); errs.forEach(x => console.log('  - ' + x)); }
  process.exit(fail ? 1 : 0);
})();
