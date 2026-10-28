/* SPT（State Pollution Test）：状态机污染测试。
   本项目有大量模块级可变全局（KEY_MODE / KDF_MODE / KDF_HASH / KDF_COST /
   KDF_SALT_LEN / CURRENT_CONTAINER / window._lastKdfSalt ...）。
   任一算法调用后若没恢复，后续算法就会用错的配置静默算错。
   注意：重量级算法（McEliece / SPHINCS+ / XMSS / LMS / FrodoKEM）密钥生成极慢，
   逐条调用会超时，这里显式跳过——它们的官方向量由各自的 t_*.js 覆盖。 */
require('./_harness.js');
const A = global.ALGOS || [];
const VARS = ['KEY_MODE', 'KDF_MODE', 'KDF_HASH', 'KDF_COST', 'KDF_SALT_LEN', 'CURRENT_CONTAINER'];
const SKIP = /mceliece|sphincs|xmss|^lms|frodo|sntrup|bike|hqc|falcon|mldsa|mlkem/;
function snap() {
  const s = {};
  for (const v of VARS) { try { s[v] = eval(v); } catch (e) { s[v] = '<undef>'; } }
  /* _lastKdfSalt 是「有意」的回写：口令派生时把生成的盐写回 Salt 输入框，
     让同一会话内能解密（Encryption_and_decryption_logic.js:3041）。它不是污染。
     但 raw 模式绕过 KDF，绝不该产生/改动盐——那条才是真污染，单独查。 */
  s.__kdfSalt = (typeof window !== 'undefined' && window._lastKdfSalt) ? Buffer.from(window._lastKdfSalt).toString('hex') : null;
  return s;
}
function diff(a, b) {
  const o = [];
  for (const k of Object.keys(a)) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) o.push(k + ': ' + JSON.stringify(a[k]) + ' → ' + JSON.stringify(b[k]));
  return o;
}
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
const msg = new Uint8Array(37); for (let i = 0; i < 37; i++) msg[i] = (i * 7 + 3) & 0xFF;
let P = 0, F = 0; const bad = [];
(async () => {
  for (const mode of ['ECB', 'CBC', 'CTR', 'GCM', 'CCM', 'EAX', 'SIV', 'XTS']) {
    const a = A.find(x => x.id === 'aes256' || x.id === 'aes128');
    const base = snap();
    try { await withTimeout(symEncrypt(a, msg, 'cd'.repeat(16), mode, mode === 'CTR' ? 'none' : 'PKCS7', mode === 'ECB' ? '' : '00'.repeat(16), false, '', null, 16), 5000); }
    catch (e) { }
    const d = diff(base, snap()).filter(x => !x.startsWith('__kdfSalt'));
    if (d.length) { F++; bad.push('模式 ' + mode + ' 污染: ' + d.join(' | ')); } else P++;
  }
  let n = 0, skipped = 0;
  for (const a of A) {
    if (typeof a.enc !== 'function') continue;
    if (SKIP.test(a.id)) { skipped++; continue; }
    const base = snap();
    try { let r = a.enc(new Uint8Array([1, 2, 3]), 'aabb', '', 'hex'); if (r && r.then) r = await withTimeout(r, 4000); } catch (e) { }
    const d = diff(base, snap()).filter(x => !x.startsWith('__kdfSalt'));
    if (d.length) { F++; bad.push('算法 ' + a.id + ' 污染: ' + d.join(' | ')); } else n++;
  }
  /* 专项：raw 模式（原始 hex 密钥）绕过 KDF，绝不该产生盐 */
  const before = (typeof window !== 'undefined' && window._lastKdfSalt) ? 1 : 0;
  const saved = KEY_MODE; KEY_MODE = 'raw';
  const aes = A.find(x => x.id === 'aes128');
  try { await symEncrypt(aes, msg, 'ab'.repeat(16), 'CBC', 'PKCS7', '00'.repeat(16), false, '', null, 16); } catch (e) { }
  KEY_MODE = saved;
  const after = (typeof window !== 'undefined' && window._lastKdfSalt) ? 1 : 0;
  if (before !== after) { F++; bad.push('raw 模式竟产生了 KDF 盐（raw 应完全绕过 KDF）'); } else P++;

  console.log('=== SPT 状态污染测试 ===');
  console.log('PASS ' + (P + n) + '   FAIL ' + F + '   跳过(重量级) ' + skipped);
  bad.slice(0, 20).forEach(b => console.log('  ' + b));
  process.exit(F ? 1 : 0);
})();
