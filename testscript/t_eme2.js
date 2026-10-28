/* ============================================================
 * t_eme2.js —— EME2-AES-128（IEEE 1619.2）验收
 *
 * 被验对象是 **对外条目 `eme2`**（crypto_wideblock.js，48 字节密钥）；
 * CryptoJS/crypto_eme2.js 是不注册的第二实现，两者在随机用例上必须逐字节一致。
 *
 * 参照值来源：TES-main 仓库 EME2/eme2_aes.c（gcc + AES-NI 实跑产出），
 *   落盘 Json/eme2_vectors.json，72 条 = 3 密钥 × 3 种 AD 长度 × 8 种块数
 *   （含 1、127、128、129、257 块，覆盖 i%128 的 mask renewal 分支）。
 *   本脚本**不再依赖 /tmp 或任何外部二进制**：向量缺失即 FAIL，不静默跳过。
 * ============================================================ */
require('./_harness.js');
const fs = require('fs'), path = require('path');
const E = globalThis.__eme2;

let PASS = 0, FAIL = 0;
function ok(c, name, extra) {
  if (c) { PASS++; } else { FAIL++; console.error('FAIL: ' + name + (extra ? '\n  ' + extra : '')); }
}

/* ---------- A. 前置（缺失不得静默通过） ---------- */
const vf = path.join(__dirname, '..', 'Json', 'eme2_vectors.json');
ok(fs.existsSync(vf), 'A1 向量文件 Json/eme2_vectors.json 存在');
const vecs = fs.existsSync(vf) ? JSON.parse(fs.readFileSync(vf, 'utf8')) : [];
ok(Array.isArray(vecs) && vecs.length >= 72, 'A2 向量条数 >= 72', '实得 ' + (Array.isArray(vecs) ? vecs.length : 'N/A'));
ok(!!E && typeof E.eme2Crypt === 'function', 'A3 __eme2.eme2Crypt 已导出（第二实现）');
const entry = (global.ALGOS || []).find(a => a.id === 'eme2');
ok(!!entry, 'A4 对外条目 eme2 已注册');

/* ---------- B. 对外条目 vs C 参考实现（72 条） ---------- */
let bEnc = 0, bDec = 0, bLen = 0, firstBad = '';
for (let i = 0; i < vecs.length; i++) {
  const v = vecs[i];
  const pt = E.hexToBytes(v.pt);
  const got = String(entry.enc(pt, v.key, v.ad || '', 'hex')).toLowerCase();
  if (got === v.ct) bEnc++; else if (!firstBad) firstBad = '#' + i + '\n  期望 ' + v.ct.slice(0, 48) + '\n  实得 ' + got.slice(0, 48);
  if (got.length === v.ct.length) bLen++;
  const back = String(entry.dec(E.hexToBytes(v.ct), v.key, v.ad || '', 'hex')).toLowerCase();
  if (back === v.pt) bDec++;
}
ok(bEnc === vecs.length, 'B1 条目加密与 C 参考实现逐字节一致', bEnc + '/' + vecs.length + (firstBad ? '\n  ' + firstBad : ''));
ok(bDec === vecs.length, 'B2 条目解密还原明文', bDec + '/' + vecs.length);
ok(bLen === vecs.length, 'B3 长度保持 len(ct)===len(pt)', bLen + '/' + vecs.length);

/* ---------- C. 第二实现与条目逐字节一致（互为佐证） ---------- */
const nc = require('crypto');
const rnd = n => { const b = new Uint8Array(n); nc.webcrypto.getRandomValues(b); return b; };
let cSame = 0, cTot = 0;
for (const blocks of [1, 2, 3, 16, 17, 128, 129, 257]) {
  for (const adlen of [0, 16, 32]) {
    const key = rnd(48), ad = rnd(adlen), pt = rnd(blocks * 16);
    cTot++;
    const mine = E.bytesToHex(E.eme2Crypt(key, pt, ad, true));
    const theirs = String(entry.enc(pt, E.bytesToHex(key), E.bytesToHex(ad), 'hex')).toLowerCase();
    if (mine === theirs) cSame++;
  }
}
ok(cSame === cTot, 'C1 第二实现与对外条目一致（24 组随机）', cSame + '/' + cTot);

/* ---------- D. 护栏（必须抛错，不得静默返回） ---------- */
function throws(fn) { try { fn(); return false; } catch (e) { return true; } }
const k48 = '00'.repeat(48);
const p16 = new Uint8Array(16);
ok(throws(() => E.eme2Crypt(E.hexToBytes('00'.repeat(32)), p16, new Uint8Array(0), true)), 'D1 密钥非 48 字节必须抛错');
ok(throws(() => E.eme2Crypt(E.hexToBytes(k48), new Uint8Array(8), new Uint8Array(0), true)), 'D2 明文 <16 字节必须抛错');
ok(throws(() => E.eme2Crypt(E.hexToBytes(k48), new Uint8Array(20), new Uint8Array(0), true)), 'D3 明文非 16 倍数必须抛错');
ok(throws(() => E.eme2Crypt(E.hexToBytes(k48), p16, new Uint8Array(8), true)), 'D4 AD 非 16 倍数必须抛错');

/* ---------- E. 倍增方向（小端 mult-by-alpha，IEEE 约定） ---------- */
const hi = new Uint8Array(16); hi[15] = 0x80;
ok(E.bytesToHex(E.crank(hi)) === '87' + '00'.repeat(15), 'E1 crank(0x80<<120) = 87 00..00（小端 + 0x87 约简）',
  '实得 ' + E.bytesToHex(E.crank(hi)));
const one = new Uint8Array(16); one[0] = 0x01;
ok(E.bytesToHex(E.crank(one)) === '02' + '00'.repeat(15), 'E2 crank(01) = 02（低字节为最低位）',
  '实得 ' + E.bytesToHex(E.crank(one)));

/* ---------- F. SPRP 扩散性：改 1 字节须影响全部块 ---------- */
const ptA = rnd(32 * 16);
const ctA = E.eme2Crypt(rnd(48).slice(), ptA, new Uint8Array(0), true);
const keyF = E.hexToBytes(vecs[0].key);
const ctA2 = E.eme2Crypt(keyF, ptA, new Uint8Array(0), true);
const ptB = ptA.slice(); ptB[5] ^= 0x01;
const ctB = E.eme2Crypt(keyF, ptB, new Uint8Array(0), true);
let diffBlocks = 0;
for (let i = 0; i < ctA2.length; i += 16) {
  for (let j = 0; j < 16; j++) if (ctA2[i + j] !== ctB[i + j]) { diffBlocks++; break; }
}
ok(diffBlocks === ctA2.length / 16, 'F1 改明文 1 字节 → 全部块变化（宽块 SPRP）', diffBlocks + '/' + (ctA2.length / 16));
const ad1 = new Uint8Array(16); ad1[0] = 0x01;
ok(E.bytesToHex(E.eme2Crypt(keyF, ptA, ad1, true)) !== E.bytesToHex(ctA2), 'F2 关联数据不同 → 密文必变');

/* ---------- G. 条目元数据 ---------- */
ok(entry.keyLen === 48, 'G1 条目声明 48 字节密钥', '实得 ' + entry.keyLen);
ok(/48/.test(entry.keyLabel || ''), 'G2 密钥标签说明 48 字节拆分', '实得 ' + entry.keyLabel);

console.log('t_eme2: PASS ' + PASS + '  FAIL ' + FAIL);
process.exit(FAIL ? 1 : 0);
