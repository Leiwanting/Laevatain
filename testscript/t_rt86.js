/* 全算法往返冒烟：遍历 ALGOS，逐个「加密 → 把界面输出原样喂回解密 → 比对明文」。
   与界面链路一致：输出按 renderOutput 的规则转成文本，解密端收到的就是这段文本。
   密钥/参数自动探测：多组候选里挑第一个不抛错的。 */
require('./_harness.js');
var A = global.ALGOS;
var TE = new TextEncoder(), TD = new TextDecoder();

function hx(n) {
  var s = '';
  for (var i = 0; i < n; i++) s += ((i * 7 + 3) & 0xff).toString(16).padStart(2, '0');
  return s;
}
var CAND = ['', hx(8), hx(16), hx(24), hx(32), hx(64), 'password'];
var PARAM = ['', '10', '1000', 'aes256', 'SHA-256'];
var PLAIN = 'hello-123-中文';

function toText(r) {
  if (typeof r === 'string') return r;
  if (r && typeof r === 'object' && r.length === undefined && typeof r.text === 'string') return r.text;
  if (!r || r.length === 0) return '';
  try { return TD.decode(r); } catch (e) { var t=''; for (var i=0;i<r.length;i++) t+=r[i].toString(16).padStart(2,'0'); return t; }
}

(async function () {
  var pass = 0, fail = 0, skip = 0, fails = [];
  for (var i = 0; i < A.length; i++) {
    var a = A[i];
    if (typeof a.enc !== 'function' || typeof a.dec !== 'function') { skip++; continue; }
    if (a.oneway) { skip++; continue; }
    var done = false;
    for (var ci = 0; ci < CAND.length && !done; ci++) {
      for (var pi = 0; pi < PARAM.length && !done; pi++) {
        var out;
        try {
          out = await a.enc(TE.encode(PLAIN), CAND[ci], PARAM[pi], 'hex');
        } catch (e) { continue; }
        var txt;
        try { txt = toText(out); }
        catch (e) { continue; }
        if (txt === '') continue;
        var back;
        try {
          back = await a.dec(txt, CAND[ci], PARAM[pi], 'hex');
        } catch (e) {
          fail++; fails.push(a.id + '  解密抛错: ' + (e && e.message ? e.message : e).slice(0, 90));
          done = true; break;
        }
        var bt = toText(back);
        if (bt === PLAIN) { pass++; done = true; break; }
        fail++; fails.push(a.id + '  往返不一致 got=' + JSON.stringify(bt.slice(0, 40)));
        done = true; break;
      }
    }
    if (!done) skip++;
  }
  console.log('往返冒烟：通过 ' + pass + ' / 失败 ' + fail + ' / 跳过 ' + skip);
  fails.slice(0, 40).forEach(function (f) { console.log('  FAIL ' + f); });
})();
