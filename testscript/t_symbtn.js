/* t_symbtn.js —— 分组密码「加密/解密按钮互相踢皮球」回归测试
 *
 * 【第 117 批】真实缺陷：runEncrypt / runDecrypt 入口的
 *   if (typeof a.enc !== 'function') throw '只有解密操作，请点解密'
 *   if (typeof a.dec !== 'function') throw '只有加密操作，请点加密'
 * 这两行检查写在 `if (a.isSym)` 分支【之前】，而 77 个分组密码条目本就没有
 * enc/dec —— 它们走 symEncrypt/symDecrypt 统一引擎。于是点「加密」被劝去点
 * 「解密」、点「解密」又被劝去点「加密」，两个方向互相踢皮球。
 *
 * 引入批次：第六十八批（当时为修 "只注册了 dec 的条目" 抛 a.enc is not a function）。
 * 为何长期测不到：ST / 自检直连 symEncrypt 统一引擎，从不经过 runEncrypt 入口。
 *
 * 本脚本三重防护：
 *   1. 源码静态断言：两处检查必须带 !a.isSym 豁免
 *   2. 入口判定模拟：isSym 条目两个方向都不该被拦截
 *   3. 真实往返：代表性分组密码走统一引擎 enc→dec
 * 同时反向断言第 68 批原修复未被破坏（只注册一侧的条目仍要被正确拦截）。
 */
process.chdir(require('path').resolve(__dirname, '..'));
require('./_harness.js');
const fs = require('fs');
const A = global.ALGOS || [];
const hex = b => Buffer.from(b).toString('hex');
let P = 0, F = 0; const fail = [];
const ck = (n, c) => { if (c) P++; else { F++; fail.push(n); } };

function wouldBlock(a, op) {
  return op === 'enc'
    ? (!a.isSym && typeof a.enc !== 'function')
    : (!a.isSym && typeof a.dec !== 'function');
}

(async () => {
  /* 1. 源码静态断言 */
  const src = fs.readFileSync('Encryption_and_decryption_logic.js', 'utf8');
  ck('runEncrypt 带 isSym 豁免', /!a\.isSym && typeof a\.enc !== 'function'/.test(src));
  ck('runDecrypt 带 isSym 豁免', /!a\.isSym && typeof a\.dec !== 'function'/.test(src));
  ck('isSym 缺内核时有明确报错', (src.match(/makeBlockFn 不是函数/g) || []).length >= 2);

  /* 2. isSym 条目完整性 */
  const syms = A.filter(a => a.isSym);
  ck('isSym 条目存在 (' + syms.length + ')', syms.length > 0);
  const noMk = syms.filter(a => typeof a.makeBlockFn !== 'function');
  ck('isSym 全部有 makeBlockFn', noMk.length === 0);
  const blocked = syms.filter(a => wouldBlock(a, 'enc') || wouldBlock(a, 'dec'));
  ck('isSym 两方向均不被拦截', blocked.length === 0);

  /* 3. 第 68 批原修复未被破坏 */
  const nonSym = A.filter(a => !a.isSym && !a.oneway);
  const onlyDec = nonSym.filter(a => typeof a.enc !== 'function' && typeof a.dec === 'function');
  const onlyEnc = nonSym.filter(a => typeof a.dec !== 'function' && typeof a.enc === 'function');
  ck('只注册dec的仍拦加密 (' + onlyDec.length + ')', onlyDec.length > 0 && onlyDec.every(a => wouldBlock(a, 'enc')));
  ck('只注册enc的仍拦解密 (' + onlyEnc.length + ')', onlyEnc.length > 0 && onlyEnc.every(a => wouldBlock(a, 'dec')));

  /* 4. 真实往返：含用户报错的 camellia192 */
  const ids = ['camellia192', 'camellia128', 'camellia256', 'aes128', 'aes256', 'sm4',
    'des', '3des', 'aria128', 'twofish128', 'seed', 'blowfish', 'idea',
    'anubis128', 'clefia128', 'kalyna128', 'lea128', 'hight', 'cham64', 'loki89', 'khazad'];
  const salt = 'aabbccddeeff00112233445566778899';
  let rt = 0, rtBad = [];
  for (const id of ids) {
    const a = A.find(x => x.id === id);
    if (!a) { rtBad.push(id + ':NOT_FOUND'); continue; }
    try {
      const pt = Buffer.from('EternityLink-Camellia192', 'utf8');
      const r = await global.symEncrypt(a, new Uint8Array(pt), 'pw123', 'CBC', 'PKCS7', '', false, '', salt, 16);
      const back = await global.symDecrypt(a, r.ciphertext, 'pw123', 'CBC', 'PKCS7', hex(r.iv), '', salt, 16);
      if (Buffer.from(back).toString('hex') === pt.toString('hex')) rt++;
      else rtBad.push(id + ':MISMATCH');
    } catch (e) { rtBad.push(id + ':' + String(e && e.message || e).slice(0, 50)); }
  }
  ck('往返 ' + rt + '/' + ids.length, rtBad.length === 0);
  if (rtBad.length) console.log('  往返失败:', rtBad.join(' | '));

  console.log('\nPASS ' + P + '  FAIL ' + F);
  if (F) console.log('失败项: ' + fail.join(' | '));
  process.exit(F ? 1 : 0);
})();
