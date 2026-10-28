/* t_malformed.js —— 畸形/非预期输入测试（Malformed Test）
   口径：对全部注册条目喂「非常规密钥 / 空输入 / 非十六进制」，只统计崩溃类缺陷：
     - 抛出原始 TypeError/ReferenceError/RangeError（未包装成友好错误）= 缺陷
     - 单条调用超过 3s                                                  = 超时缺陷
   正确性由各 KAT 负责，本脚本不做比对。
   矩阵刻意压小（每条目 4 次调用），保证能在 CI 时限内跑完。 */
require('./_harness.js');
let A = global.ALGOS || [];
/* 支持按 group 过滤：node t_malformed.js 对称加密 */
const FLT = process.argv[2];
if (FLT) A = A.filter(a => (a.group || '').indexOf(FLT) >= 0);
const enc = new TextEncoder();
const HELLO = enc.encode('hello 123 中文');
const EMPTY = new Uint8Array(0);

const KEYS = ['', 'zzzz'];            /* 空 / 非十六进制 */
const INPUTS = [['空', EMPTY], ['常规', HELLO]];

function isRawCrash(e) {
  const n = e && e.constructor && e.constructor.name;
  return n === 'TypeError' || n === 'ReferenceError' || n === 'RangeError';
}
function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rj) => setTimeout(() => rj(new Error('TIMEOUT')), ms))]);
}

(async () => {
  const crashes = [], timeouts = [];
  let calls = 0;
  const t0 = Date.now();
  for (const a of A) {
    if (Date.now() - t0 > 200000) { console.log('[预算耗尽，已跑 ' + calls + ' 次调用]'); break; }
    for (const key of KEYS) {
      for (const [iname, input] of INPUTS) {
        for (const fn of ['enc', 'dec']) {
          if (typeof a[fn] !== 'function') continue;
          calls++;
          try {
            await withTimeout(Promise.resolve().then(() => a[fn](input, key, '', 'hex')), 1200);
          } catch (e) {
            if (e.message === 'TIMEOUT') timeouts.push(a.id + '.' + fn);
            else if (isRawCrash(e)) crashes.push({ id: a.id, fn, key: key === '' ? '空' : 'zzzz', input: iname, err: (e.message || '').slice(0, 70) });
          }
        }
      }
    }
  }
  console.log('条目 ' + A.length + '   调用 ' + calls + '   耗时 ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
  console.log('原始崩溃 ' + crashes.length + '   超时 ' + timeouts.length);
  const byId = {};
  for (const c of crashes) {
    (byId[c.id] = byId[c.id] || []);
    if (byId[c.id].length < 3) byId[c.id].push(c.fn + '/' + c.key + '/' + c.input + ' :: ' + c.err);
  }
  const ids = Object.keys(byId).sort();
  console.log('涉及条目 ' + ids.length);
  for (const id of ids) console.log('  ' + id + '\n      ' + byId[id].join('\n      '));
  if (timeouts.length) console.log('超时: ' + [...new Set(timeouts.map(t => t.split('.')[0]))].join(', '));
  process.exit(0);
})();
