/* XChaCha20 独立条目验收
 *
 * 参照物：libsodium master  test/default/xchacha20.c
 *   - tv_stream_xchacha20 : 10 条（key 32B / nonce 24B / 密钥流 22~91 字节，含跨块）
 *   - tv_hchacha20        : 10 条（HChaCha20 派生，本脚本无法直接调用，见下方说明）
 *
 * 验证方式：条目 enc(明文=全零) 的输出 = nonce(24B) ‖ 密钥流，
 * 剥掉前 24 字节后与官方 keystream 逐位比对。全零明文保证「密文 == 密钥流」。
 *
 * 关于 hchacha20 那 10 条：本项目的 hchacha 是 crypto_adiantum.js 闭包内的私有函数，
 * 没有独立条目暴露，所以无法直接喂向量。但它被 XChaCha20 全程使用——
 * 子密钥若错，10 条流向量必然全错（雪崩）。故流向量通过即间接覆盖 hchacha。
 * 这 10 条向量仍保存在 json 里，等将来若暴露 hchacha20 条目即可直接跑。
 *
 * 运行：cd 到 index.html 所在目录，node testscript/t_xchacha20.js
 */
const fs = require('fs');
const { ALGOS } = require('./_harness.js');
const tv = JSON.parse(fs.readFileSync('testvectors/xchacha20_libsodium.json', 'utf8'));
const h2b = s => new Uint8Array(Buffer.from(s, 'hex'));

let P = 0, F = 0;
const chk = (name, got, want) => {
  if (got === want) P++;
  else { F++; console.log('FAIL ' + name + '\n  got  ' + got + '\n  want ' + want); }
};

const alg = ALGOS.find(a => a.id === 'xchacha20');
if (!alg) { console.error('xchacha20 条目未注册'); process.exit(1); }

/* 1. 官方流向量 10 条 */
for (let i = 0; i < tv.xchacha20.length; i++) {
  const t = tv.xchacha20[i];
  const len = t.keystream.length / 2;
  const out = alg.enc(new Uint8Array(len), h2b(t.key), '', 'hex', null, t.nonce);
  chk('xchacha20#' + i + ' len=' + len, out.slice(48), t.keystream);
}

/* 2. 往返：随机 nonce 留空 → 密文自带前缀 → dec 还原 */
const key = h2b(tv.xchacha20[0].key);
for (const L of [0, 1, 15, 16, 63, 64, 65, 100, 191, 192]) {
  const pt = new Uint8Array(L);
  for (let i = 0; i < L; i++) pt[i] = (i * 7 + 3) & 0xff;
  const ct = alg.enc(pt, key, '', 'hex', null, '');
  const back = alg.dec(ct, key, '', 'hex', null, '');
  const s = Buffer.from(back).toString('hex');
  chk('往返 L=' + L, s, Buffer.from(pt).toString('hex'));
}

/* 3. 显式 nonce 时不再剥前缀（防「前缀误判」回归） */
{
  const n = tv.xchacha20[1].nonce;
  const pt = new Uint8Array([1, 2, 3, 4, 5]);
  const ct = alg.enc(pt, key, '', 'hex', null, n);
  /* 加密带前缀；解密时用同一 nonce 且前缀匹配 → 应自动剥掉 */
  const back = alg.dec(ct, key, '', 'hex', null, n);
  chk('显式 nonce 往返', Buffer.from(back).toString('hex'), '0102030405');
  /* 只给密文本体（无前缀）时也应能解 */
  const body = ct.slice(48);
  chk('无前缀密文', Buffer.from(alg.dec(body, key, '', 'hex', null, n)).toString('hex'), '0102030405');
}

/* 4. nonce 长度不为 24 必须报错 */
{
  let threw = false;
  try { alg.enc(new Uint8Array(4), key, '', 'hex', null, '00112233'); } catch (e) { threw = /24 字节/.test(e.message); }
  chk('nonce 长度校验', threw, true);
}

console.log('\nxchacha20 KAT  PASS ' + P + '  FAIL ' + F);
console.log('（hchacha20 官方 10 条为间接覆盖，见脚本顶部说明）');
process.exit(F ? 1 : 0);
