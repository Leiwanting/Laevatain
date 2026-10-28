/* HChaCha20 KAT（常驻）
   参照物：libsodium master test/default/xchacha20.c 的 tv_hchacha20（10 条）
   文件：testvectors/xchacha20_libsodium.json 的 "hchacha20" 段

   【第 110 批】此前这 10 条向量虽然进了包，但 hchacha 是闭包私有函数，
   没有任何入口能喂进去 —— 等于「向量在、验不了」。本批导出 __hchachaTest
   并新增 hchacha20 独立条目后，才第一次真正跑通。 */
require('./_harness.js');
const fs = require('fs');
const hex = b => Buffer.from(b).toString('hex');
const h2b = s => new Uint8Array(Buffer.from(s, 'hex'));
/* 条目层 enc() 返回的是「已按 f 格式化后的字符串」，不是字节数组。
   第一版测试我统一套了 hex()，等于把 hex 文本又按 UTF-8 编了一次，
   得到 35393636... 这种假失败 —— 是测试脚本的错，不是实现的错。 */
const norm = x => (typeof x === 'string') ? x : hex(x);

let P = 0, F = 0; const bad = [];
const ck = (name, got, want) => {
  if (got === want) P++;
  else { F++; bad.push(name + ' got=' + String(got).slice(0, 64) + ' want=' + String(want).slice(0, 64)); }
};

const V = JSON.parse(fs.readFileSync('testvectors/xchacha20_libsodium.json', 'utf8'));
const vecs = V.hchacha20 || [];
ck('向量条数>=10', vecs.length >= 10, true);

const H = global.__hchachaTest;
if (typeof H !== 'function') { console.log('FAIL: __hchachaTest 未导出'); process.exit(1); }

/* A. 官方向量 10 条：内核层 */
for (let i = 0; i < vecs.length; i++) {
  const v = vecs[i];
  let got;
  try { got = hex(H(h2b(v.key), h2b(v['in']), 20)); }
  catch (e) { F++; bad.push('hchacha20 #' + i + ' 抛错 ' + e.message); continue; }
  ck('hchacha20 官方 #' + i, got, v.out);
}

/* B. 条目层（走 reg 出来的 algo.enc，验证 IV 框 / 输入内容两条取 nonce 的路径） */
const algo = (global.ALGOS || []).find(a => a.id === 'hchacha20');
if (!algo) { F++; bad.push('hchacha20 条目未注册'); }
else {
  for (let i = 0; i < 3; i++) {
    const v = vecs[i];
    /* B1. nonce 走 IV 框 */
    try { ck('条目 IV 框 #' + i, norm(algo.enc(h2b(v['in']), h2b(v.key), '', 'hex', null, v['in'])), v.out); }
    catch (e) { F++; bad.push('条目 IV 框 #' + i + ' 抛错 ' + e.message); }
    /* B2. nonce 取输入内容（IV 留空） */
    try { ck('条目 输入内容 #' + i, norm(algo.enc(h2b(v['in']), h2b(v.key), '', 'hex', null, '')), v.out); }
    catch (e) { F++; bad.push('条目 输入内容 #' + i + ' 抛错 ' + e.message); }
  }
  /* C. 边界：错误长度必须报错，不能静默出结果 */
  const throws = (name, fn) => { try { fn(); F++; bad.push(name + ' 未报错'); } catch (e) { P++; } };
  throws('key 长度 31', () => algo.enc(h2b('00'.repeat(16)), h2b('00'.repeat(31)), '', 'hex', null, '00'.repeat(16)));
  throws('nonce 长度 15', () => algo.enc(h2b('00'.repeat(15)), h2b('00'.repeat(32)), '', 'hex', null, '00'.repeat(15)));
  throws('nonce 空且输入非16字节', () => algo.enc(h2b('00'.repeat(5)), h2b('00'.repeat(32)), '', 'hex', null, ''));
  throws('nonce 非法 hex 长度', () => algo.enc(h2b('00'.repeat(16)), h2b('00'.repeat(32)), '', 'hex', null, 'abc'));

  /* D. 确定性：同参两次一致（KDF 不能有随机性） */
  const o1 = norm(algo.enc(h2b(vecs[0]['in']), h2b(vecs[0].key), '', 'hex', null, vecs[0]['in']));
  const o2 = norm(algo.enc(h2b(vecs[0]['in']), h2b(vecs[0].key), '', 'hex', null, vecs[0]['in']));
  ck('确定性 两次一致', o1 === o2, true);
}

/* E. 回归：XChaCha20 条目输出的流 == 内核 __xchachaTest 的流。
     （证明本批新增的 __hchachaTest 导出没有影响原有 XChaCha20 路径）
     注意 __xchachaTest 第二参是完整 24 字节 nonce，内部自己再跑 hchacha；
     第一版我传了 8 字节进去，subarray(0,16) 越界读出 undefined，纯属测试写错。 */
const xc = (global.ALGOS || []).find(a => a.id === 'xchacha20');
if (xc && global.__xchachaTest) {
  const key = h2b('11'.repeat(32)), n24 = h2b('22'.repeat(24)), n24hex = '22'.repeat(24);
  const msg = new Uint8Array([1, 2, 3, 4, 5]);
  const stream = global.__xchachaTest(key, n24, 20, msg.length, 0);
  const want = Buffer.from(msg);
  for (let i = 0; i < want.length; i++) want[i] ^= stream[i];
  const ref = Buffer.from(norm(xc.enc(msg, key, '', 'hex', null, n24hex)), 'hex');
  ck('XChaCha20 条目 vs 内核 流一致', ref.subarray(24).toString('hex'), want.toString('hex'));
}

console.log('PASS ' + P + '  FAIL ' + F);
if (bad.length) bad.slice(0, 12).forEach(b => console.log('  ' + b));
process.exit(F ? 1 : 0);
