/* AES-KW / AES-KW-unwrap / AES-KWP 验收（常驻）
   裁判：Python cryptography 的 keywrap 模块（独立实现），双向对拍。
   【第 107 批教训】必须先 KEY_MODE='raw'，否则 hex 密钥被当口令派生，全对不上。
   ⚠ 结构坑：条目 enc/dec 是 async，主体必须包在 async IIFE 里且 console.log /
     process.exit 必须在 IIFE **内部** —— 放外面会在异步完成前就 exit(0)，脚本
     静默无输出（我第一版就是这样，看着像"没跑"）。 */
require('./_harness.js');
const { execFileSync } = require('child_process');
const hex = b => Buffer.from(b).toString('hex');
const h2b = s => new Uint8Array(Buffer.from(s, 'hex'));

const P = { n: 0 }, bad = [];
const ck = (n, g, w) => { if (g === w) P.n++; else { F.n++; bad.push(n + '\n   got =' + String(g).slice(0, 90) + '\n   want=' + String(w).slice(0, 90)); } };
const F = { n: 0 };

(async function () {
  const savedKM = (typeof KEY_MODE !== 'undefined') ? KEY_MODE : null;
  KEY_MODE = 'raw';

  const A = global.ALGOS || [];
  const get = id => A.find(a => a.id === id);
  const kw = get('aes-kw'), kwu = get('aes-kw-unwrap'), kwp = get('aes-kwp');
  ck('条目 aes-kw 存在', !!kw, true);
  ck('条目 aes-kw-unwrap 存在', !!kwu, true);
  ck('条目 aes-kwp 存在', !!kwp, true);

  const py = `
import json
from cryptography.hazmat.primitives.keywrap import aes_key_wrap, aes_key_wrap_with_padding
import secrets
out=[]
for i in range(6):
    kek=secrets.token_bytes(32)   # raw 模式硬性要求 32 字节 KEK
    pt=secrets.token_bytes(16+8*(i%4))
    out.append({"kek":kek.hex(),"pt":pt.hex(),
                "ct":aes_key_wrap(kek,pt).hex(),
                "ctp":aes_key_wrap_with_padding(kek,pt).hex()})
print(json.dumps(out))
`;
  const cases = JSON.parse(execFileSync('python3', ['-c', py], { encoding: 'utf8' }));

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    ck('KAT' + i + ' JS-wrap == Py-wrap', String(await kw.enc(h2b(c.pt), c.kek, '', 'hex')), c.ct);
    ck('KAT' + i + ' JS-unwrap == pt', hex(Buffer.from(await kw.dec(c.ct, c.kek, '', 'hex'))), c.pt);
    /* enc 走 bytesOut 返回 hex 字符串，再套 hex() 会把 hex 文本按 utf8 再编一次（双重编码） */
    ck('KAT' + i + ' unwrap条目 enc == pt', String(await kwu.enc(h2b(c.ct), c.kek, '', 'hex')), c.pt);
    ck('KAT' + i + ' unwrap条目 dec == ct', String(await kwu.dec(c.pt, c.kek, '', 'hex')), c.ct);
    const jwp = await kwp.enc(h2b(c.pt), c.kek, '', 'hex');
    ck('KAT' + i + ' KWP 往返', hex(Buffer.from(await kwp.dec(String(jwp), c.kek, '', 'hex'))), c.pt);
  }

  const c0 = cases[0];
  const tampered = h2b(c0.ct); tampered[20] ^= 0x01;
  let rej = false;
  try { await kwu.enc(tampered, c0.kek, '', 'hex'); } catch (e) { rej = /完整性|校验|失败/.test(e.message); }
  ck('篡改密文被拒绝', rej, true);

  let e1 = false;
  try { await kwu.enc(h2b('0011223344556677'), c0.kek, '', 'hex'); } catch (e) { e1 = true; }
  ck('16 字节密文被拒绝（需≥24）', e1, true);

  if (savedKM !== null) KEY_MODE = savedKM;
  console.log('\n=== AES-KW / unwrap / KWP（裁判：Python cryptography）===');
  console.log('PASS ' + P.n + '  FAIL ' + F.n);
  bad.forEach(b => console.log('  ✗ ' + b));
  process.exit(F.n ? 1 : 0);
})();
