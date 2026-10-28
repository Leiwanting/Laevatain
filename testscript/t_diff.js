/* Diff Test（常驻）：拿 Node 内置 crypto 当独立裁判，差分比对本项目实现。
   【第 107 批关键修正】必须先 KEY_MODE='raw'。
   密钥框默认是「口令（走 KDF 派生）」，若直接传 hex 密钥进去，会被当成口令
   派生出另一个 key——于是 AES 五个模式全部对不上，100% 是测试脚本的错、
   不是实现的错。上一批报的 99 个 FAIL 就是这个原因。 */
require('./_harness.js');
const nc = require('crypto');
const A = global.ALGOS || [];
const hex = b => Buffer.from(b).toString('hex');
const LENS = [0, 1, 15, 16, 17, 31, 32, 64, 100];
function mkMsg(n) { const b = Buffer.alloc(n); for (let i = 0; i < n; i++) b[i] = (i * 37 + 11) & 0xFF; return new Uint8Array(b); }

let P = 0, F = 0; const bad = [];
function nodeAes(alg, keyBuf, mode, pad, ivBuf, msgBuf) {
  const c = nc.createCipheriv(alg + (mode === 'ECB' ? '-ecb' : '-' + { CBC: 'cbc', CFB: 'cfb', OFB: 'ofb', CTR: 'ctr' }[mode]),
    keyBuf, mode === 'ECB' ? null : ivBuf);
  c.setAutoPadding(pad === 'PKCS7');
  return Buffer.concat([c.update(msgBuf), c.final()]).toString('hex');
}
(async () => {
  const savedKM = (typeof KEY_MODE !== 'undefined') ? KEY_MODE : null;
  KEY_MODE = 'raw';
  for (const [id, nn, kl] of [['aes128', 'aes-128', 16], ['aes192', 'aes-192', 24], ['aes256', 'aes-256', 32]]) {
    const algo = A.find(a => a.id === id); if (!algo) { bad.push(id + ' 未注册'); F++; continue; }
    const keyHex = 'ab'.repeat(kl), keyBuf = Buffer.from(keyHex, 'hex');
    for (const mode of ['ECB', 'CBC', 'CFB', 'OFB', 'CTR']) {
      const pad = (mode === 'ECB' || mode === 'CBC') ? 'PKCS7' : 'none';
      const ivHex = mode === 'ECB' ? '' : '00'.repeat(16);
      for (const n of LENS) {
        if (pad === 'none' && n === 0) continue;
        const msg = mkMsg(n);
        let mine;
        try { const r = await symEncrypt(algo, msg, keyHex, mode, pad, ivHex, false, '', null, 16); mine = hex(r.ciphertext); }
        catch (e) { F++; bad.push(id + ' ' + mode + ' n=' + n + ' 抛错 ' + String(e.message).slice(0, 60)); continue; }
        let theirs;
        try { theirs = nodeAes(nn, keyBuf, mode, pad, Buffer.alloc(16), Buffer.from(msg)); } catch (e) { continue; }
        if (mine === theirs) P++; else { F++; bad.push(id + ' ' + mode + ' n=' + n + ' mine=' + mine.slice(0, 32) + ' node=' + theirs.slice(0, 32)); }
      }
    }
  }
  for (const [id, na] of [['sha1', 'sha1'], ['sha256', 'sha256'], ['sha384', 'sha384'], ['sha512', 'sha512'], ['sha3-256', 'sha3-256'], ['sha3-512', 'sha3-512']]) {
    const a = A.find(x => x.id === id); if (!a || typeof a.enc !== 'function') continue;
    for (const n of LENS) {
      const msg = mkMsg(n); let mine;
      try { let r = a.enc(msg, '', '', 'hex'); if (r && r.then) r = await r; mine = (r instanceof Uint8Array || ArrayBuffer.isView(r)) ? hex(r) : String(r).trim(); } catch (e) { continue; }
      const theirs = nc.createHash(na).update(Buffer.from(msg)).digest('hex');
      if (mine === theirs) P++; else { F++; bad.push(id + ' n=' + n + ' mine=' + mine.slice(0, 32) + ' node=' + theirs.slice(0, 32)); }
    }
  }
  if (savedKM !== null) KEY_MODE = savedKM;
  console.log('=== Diff Test（裁判：Node 内置 crypto，KEY_MODE=raw）===');
  console.log('PASS ' + P + '   FAIL ' + F);
  bad.slice(0, 25).forEach(b => console.log('  ' + b));
  process.exit(F ? 1 : 0);
})();
