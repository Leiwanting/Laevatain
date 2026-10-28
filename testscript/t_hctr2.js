/* ============================================================
 * t_hctr2.js —— HCTR2 长度保持加密验收
 *
 * 裁判：google/hctr2 官方 Python 参考实现（MIT）。
 * 向量：Json/hctr2_vectors.json，由该官方实现实跑产出，
 *       3 种密钥长度 × 5 种 tweak 长度 × 10 种明文长度 = 150 条。
 *
 * 各段职责：
 *   A 加密与官方一致        B 解密与官方一致
 *   C 自洽往返              D 长度保持（len(ct) === len(pt)）
 *   E 边界护栏（<16 字节必须抛错，不得静默返回）
 *   F tweak 零长度
 *   G SPRP 扩散性（改 1 字节，输出须整体变化）
 *   H 原有 hctr2 条目与本内核交叉一致（两套独立实现互验）
 *   I 原有条目的密钥长度护栏
 *
 * 关于 H：本批原以为 HCTR2 是新增，写完才发现 `hctr2` 条目早已存在
 * （crypto_aead_adv.js）。故本文件改为「第二实现 + 裁判」，不注册新条目；
 * H 段验的是两套不同路线的实现必须逐字节一致。
 * 原有条目 dec **不套 fmt**（返回原始字节），按字符串比会恒失败——别写成恒真断言。
 *
 * 注意：G 段必须单列。若实现退化成「逐块独立可调」（XTS 语义），
 * A~F 照样全过（长度仍对、往返仍自洽），只有 G 能区分。
 * ============================================================ */
const path = require('path');
const fs = require('fs');
const { ALGOS } = require('./_harness.js');

let P = 0, F = 0;
function ok(c, m) { if (c) { P++; } else { F++; console.log('FAIL: ' + m); } }
function eq(a, b, m) { ok(a === b, m + '（期望 ' + b + '，实得 ' + a + '）'); }
function h2b(h) { return new Uint8Array(Buffer.from(h, 'hex')); }
function b2h(b) { return Buffer.from(b).toString('hex'); }

const K = globalThis.__hctr2Kat;
ok(!!K && typeof K.enc === 'function', 'HCTR2 裁判内核已暴露（__hctr2Kat）');
const vpath = path.join(__dirname, '..', 'Json', 'hctr2_vectors.json');
ok(fs.existsSync(vpath), '官方向量文件存在：Json/hctr2_vectors.json');

if (!K || typeof K.enc !== 'function' || !fs.existsSync(vpath)) {
  console.log(`\nPASS ${P} FAIL ${F}`);
  process.exit(1);
}

const VEC = JSON.parse(fs.readFileSync(vpath, 'utf8'));
ok(Array.isArray(VEC) && VEC.length === 150, '向量条数 150（实得 ' + (VEC || []).length + '）');

/* ---------- A/B/C/D：官方向量 + 往返 + 长度保持 ---------- */
let aF = 0, bF = 0, cF = 0, dF = 0;
for (const v of VEC) {
  const key = h2b(v.key), tw = h2b(v.tweak), pt = h2b(v.pt);
  let got;
  try { got = K.enc(pt, key, tw); } catch (e) { aF++; console.log('FAIL A 抛错: ' + e.message); continue; }
  if (b2h(got) !== v.ct) { if (aF < 3) console.log(`FAIL A klen=${v.klen} tlen=${v.tlen} plen=${v.plen}`); aF++; }
  let back;
  try { back = K.dec(h2b(v.ct), key, tw); } catch (e) { bF++; continue; }
  if (b2h(back) !== v.pt) { if (bF < 3) console.log(`FAIL B klen=${v.klen} tlen=${v.tlen} plen=${v.plen}`); bF++; }
  if (b2h(K.dec(got, key, tw)) !== v.pt) cF++;
  if (got.length !== pt.length) dF++;
}
eq(aF, 0, 'A 裁判内核加密与官方一致（150 条）');
eq(bF, 0, 'B 裁判内核解密与官方一致（150 条）');
eq(cF, 0, 'C 加密→解密自洽往返（150 条）');
eq(dF, 0, 'D 长度保持：len(ct) === len(pt)（150 条）');

/* ---------- E：边界护栏 ---------- */
let eF = 0;
const k32 = h2b('00'.repeat(32));
for (const n of [0, 1, 15]) {
  try { K.enc(new Uint8Array(n), k32, new Uint8Array(0)); eF++; }
  catch (e) { if (!/至少 16 字节/.test(e.message)) eF++; }
  try { K.dec(new Uint8Array(n), k32, new Uint8Array(0)); eF++; }
  catch (e) { if (!/至少 16 字节/.test(e.message)) eF++; }
}
eq(eF, 0, 'E 长度护栏：<16 字节加密/解密都必须抛错且给出可读提示');

/* ---------- F：tweak 零长度 ---------- */
let fF = 0;
const pt32 = h2b('11'.repeat(32));
try {
  const c0 = K.enc(pt32, k32, new Uint8Array(0));
  if (b2h(K.dec(c0, k32, new Uint8Array(0))) !== b2h(pt32)) fF++;
  const v0 = VEC.find(v => v.klen === 32 && v.tlen === 0 && v.plen === 32);
  if (v0 && b2h(c0) !== v0.ct) fF++;
} catch (e) { fF++; console.log('FAIL F 抛错: ' + e.message); }
eq(fF, 0, 'F tweak 零长度：与官方零长度 tweak 向量一致且可往返');

/* ---------- G：SPRP 扩散性 ---------- */
let gF = 0;
{
  const base = K.enc(pt32, k32, h2b('aabb'));
  for (let i = 0; i < 32; i += 7) {
    const p2 = new Uint8Array(pt32); p2[i] ^= 0x01;
    const c2 = K.enc(p2, k32, h2b('aabb'));
    let diff = 0;
    for (let j = 0; j < 32; j++) if (base[j] !== c2[j]) diff++;
    /* 整体置换：至少一半字节应改变；若只有 16 字节变，说明退化成逐块独立 */
    if (diff < 16) { gF++; console.log(`FAIL G 改第 ${i} 字节只影响 ${diff} 字节（疑似退化为逐块）`); }
  }
  if (b2h(K.enc(pt32, k32, h2b('aabc'))) === b2h(base)) gF++;
}
eq(gF, 0, 'G SPRP 扩散：改明文 1 字节影响 ≥16 字节输出，改 tweak 输出必变');

/* ---------- H：原有 hctr2 条目与本内核交叉一致 ---------- */
const OLD = ALGOS.find(x => x.id === 'hctr2');
ok(!!OLD, '原有 hctr2 条目在位（CryptoJS/crypto_aead_adv.js）');
let hF = 0, hN = 0;
if (OLD) {
  for (const v of VEC) {
    let out, back;
    try {
      out = OLD.enc(v.pt, v.key, v.tweak, 'hex');
      const raw = OLD.dec(out, v.key, v.tweak, 'hex');
      back = (raw && raw instanceof Uint8Array) ? b2h(raw) : String(raw);
    } catch (e) { hF++; if (hF < 3) console.log('FAIL H 抛错: ' + e.message); continue; }
    hN++;
    if (out !== v.ct) { hF++; if (hF < 4) console.log(`FAIL H 条目加密与官方不一致 klen=${v.klen} tlen=${v.tlen} plen=${v.plen}`); }
    if (back !== v.pt) { hF++; if (hF < 4) console.log(`FAIL H 条目解密往返不一致 plen=${v.plen}`); }
  }
}
eq(hF, 0, `H 原有 hctr2 条目与本内核一致（官方向量 ${hN} 条：AES-128/192/256、tweak 0/1/16/32/47、明文 16…4096 字节）`);

/* ---------- I：原有条目的密钥长度护栏 ---------- */
let iF = 0;
if (OLD) {
  for (const badKey of ['00'.repeat(8), '00'.repeat(20), '00'.repeat(33)]) {
    try { OLD.enc(b2h(pt32), badKey, '0102', 'hex'); iF++; }
    catch (e) { if (!/密钥需/.test(e.message)) iF++; }
  }
}
eq(iF, 0, 'I 原有条目密钥长度护栏：非 16/24/32 字节必须抛错');

console.log(`\nPASS ${P} FAIL ${F}`);
process.exit(F ? 1 : 0);
