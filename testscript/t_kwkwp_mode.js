/* KW / KWP 模式验收（常驻）
   裁判：Python cryptography（OpenSSL）的 keywrap 模块 —— 外部实现，不是自己跟自己对。
   非 AES 密码（Camellia / SM4 / SEED）没有现成的 KW 参考实现，做法是：
     先用 AES 验证「我写的通用 KW == OpenSSL 的 aes_key_wrap」（脚本内 selfchk），
     通过后才用同一份 KW 逻辑配合 OpenSSL 的 Camellia/SM4/SEED 原语出向量。
     即 KW 这层由 OpenSSL 背书，块密码本身也是 OpenSSL 的，不是自洽。
   ⚠ 结构坑（第 107 批教训）：symEncryptInner / symDecryptInner 是 async，
     比较必须包在 async IIFE 内；入口处 KEY_MODE 必须置 'raw'，
     否则 hex 密钥会被当成口令去跑 Argon2id，密文全对不上还不报错。 */
require('./_harness.js');
const fs = require('fs'), path = require('path');
const hex = b => Buffer.from(b).toString('hex');
const h2b = s => new Uint8Array(Buffer.from(s, 'hex'));
const rnd = n => new Uint8Array(Array.from({ length: n }, (_, i) => (i * 37 + 11) & 0xff));

let ok = 0; const bad = [];
const ck = (n, g, w) => { if (g === w) ok++; else bad.push(n + '\n   got =' + String(g).slice(0, 100) + '\n   want=' + String(w).slice(0, 100)); };
/* 抛异常要算 FAIL，不能让脚本崩掉——第一版就是这样：注入缺陷后脚本直接
   抛未捕获异常退出，看着像"测试挂了"而不是"被测代码错了"，反而更难定位。 */
const safe = f => { try { return f(); } catch (e) { return 'THREW:' + e.message; } };

(async function () {
  /* ---------- 1. 函数与注册 ---------- */
  ck('kwWrap 已定义', typeof kwWrap, 'function');
  ck('kwUnwrap 已定义', typeof kwUnwrap, 'function');
  ck('kwpWrap 已定义', typeof kwpWrap, 'function');
  ck('kwpUnwrap 已定义', typeof kwpUnwrap, 'function');
  ck('KW_KWP 不在 BLOCK_MODES（不能走分块异步路径）', BLOCK_MODES.includes('KW') || BLOCK_MODES.includes('KWP'), false);
  ck('KW_KWP 在 NO_PAD_MODES（填充由模式自己定义）', NO_PAD_MODES.includes('KW') && NO_PAD_MODES.includes('KWP'), true);
  ck('KW 不需要 IV', modeNeedsIV('KW'), false);
  ck('KWP 不需要 IV', modeNeedsIV('KWP'), false);
  ck('KW 不显示 IV 框', modeShowsIVField('KW'), false);
  const aes128 = ALGOS.find(a => a.id === 'aes128');
  ck('aes128 支持 KW', modeSupportedBy('KW', aes128), true);
  ck('aes128 支持 KWP', modeSupportedBy('KWP', aes128), true);
  const bf64 = ALGOS.find(a => a.id === 'blowfish');
  if (bf64) ck('64 位块算法不支持 KW', modeSupportedBy('KW', bf64), false);

  /* ---------- 2. AES：对 OpenSSL ---------- */
  const vec = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'Json', 'kw_vectors.json'), 'utf8'));
  ck('向量自检：通用KW==OpenSSL aes_key_wrap 条数 > 0', vec.selfchk > 0, true);
  const byLen = { 16: 'aes128', 24: 'aes192', 32: 'aes256' };
  let nAes = 0;
  for (const v of vec.aes) {
    const a = ALGOS.find(x => x.id === byLen[v.k.length / 2]);
    if (!a) { bad.push('找不到算法 ' + v.k.length / 2 + ' 字节'); continue; }
    const bf = a.makeBlockFn(h2b(v.k));
    const pt = h2b(v.p);
    if (v.kw) {
      ck('KW/' + a.id + '/' + (v.p.length / 2) + 'B wrap', safe(() => hex(kwWrap(bf, pt))), v.kw);
      ck('KW/' + a.id + '/' + (v.p.length / 2) + 'B unwrap', safe(() => hex(kwUnwrap(bf, h2b(v.kw)))), v.p);
    } else {
      ck('KWP/' + a.id + '/' + (v.p.length / 2) + 'B wrap', safe(() => hex(kwpWrap(bf, pt))), v.kwp);
      ck('KWP/' + a.id + '/' + (v.p.length / 2) + 'B unwrap', safe(() => hex(kwpUnwrap(bf, h2b(v.kwp)))), v.p);
    }
    nAes++;
  }
  ck('AES 向量条数', nAes, vec.aes.length);

  /* ---------- 3. 非 AES 128 位块密码 ---------- */
  let nOther = 0;
  for (const v of vec.other) {
    const a = ALGOS.find(x => x.id === v.id);
    if (!a) { bad.push('找不到算法 ' + v.id); continue; }
    const bf = a.makeBlockFn(h2b(v.k));
    const pt = h2b(v.p);
    if (v.kw) {
      ck('KW/' + v.id + '/' + (v.p.length / 2) + 'B', safe(() => hex(kwWrap(bf, pt))), v.kw);
      ck('KW/' + v.id + ' 往返', safe(() => hex(kwUnwrap(bf, h2b(v.kw)))), v.p);
    } else {
      ck('KWP/' + v.id + '/' + (v.p.length / 2) + 'B', safe(() => hex(kwpWrap(bf, pt))), v.kwp);
      ck('KWP/' + v.id + ' 往返', safe(() => hex(kwpUnwrap(bf, h2b(v.kwp)))), v.p);
    }
    nOther++;
  }
  ck('其他密码向量条数', nOther, vec.other.length);

  /* ---------- 4. 长度与完整性规则 ---------- */
  const bf = aes128.makeBlockFn(h2b('000102030405060708090a0b0c0d0e0f'));
  const thr = (n, f) => { try { f(); bad.push(n + ' 应当抛错但没抛'); } catch (e) { ok++; } };
  thr('KW 拒绝 15 字节（非 8 倍数）', () => kwWrap(bf, rnd(15)));
  thr('KW 拒绝 8 字节（少于 2 个半块）', () => kwWrap(bf, rnd(8)));
  thr('KW 拒绝空明文', () => kwWrap(bf, new Uint8Array(0)));
  thr('KWP 拒绝空明文', () => kwpWrap(bf, new Uint8Array(0)));
  thr('KW 解包拒绝 16 字节密文', () => kwUnwrap(bf, rnd(16)));
  thr('KWP 解包拒绝 8 字节密文', () => kwpUnwrap(bf, rnd(8)));
  thr('KWP 解包拒绝非 8 倍数密文', () => kwpUnwrap(bf, rnd(20)));

  const ct = kwWrap(bf, rnd(32));
  const t1 = new Uint8Array(ct); t1[30] ^= 0x80;
  thr('KW 篡改密文被拒', () => kwUnwrap(bf, t1));
  const t2 = new Uint8Array(ct); t2[0] ^= 0x01;
  thr('KW 篡改首字节（完整性值）被拒', () => kwUnwrap(bf, t2));
  const wrongK = aes128.makeBlockFn(h2b('0f0e0d0c0b0a09080706050403020100'));
  thr('KW 错误密钥被拒', () => kwUnwrap(wrongK, ct));
  thr('KWP 错误密钥被拒', () => kwpUnwrap(wrongK, kwpWrap(bf, rnd(20))));

  /* KWP 单半块特例：长度 1..8 走 RFC 5649 §4.1 的单块分支 */
  for (let L = 1; L <= 8; L++) {
    const p = rnd(L);
    ck('KWP 单块长度 ' + L, safe(() => hex(kwpUnwrap(bf, kwpWrap(bf, p)))), hex(p));
    ck('KWP 单块长度 ' + L + ' 输出 16 字节', safe(() => kwpWrap(bf, p).length), 16);
  }
  /* 长度边界：8→9 字节跨过单块/多块分界 */
  ck('KWP 8B 输出 16', kwpWrap(bf, rnd(8)).length, 16);
  ck('KWP 9B 输出 24', kwpWrap(bf, rnd(9)).length, 24);

  /* 64 位计数器：t 超过 2^32 的高半部分必须参与，否则长明文静默算错。
     真跑 700MB 输入不现实，这里直接测计数器字节本身。 */
  ck('计数器 t=1', kwCounterBytes(1).join(','), '0,0,0,0,0,0,0,1');
  ck('计数器 t=2^32', kwCounterBytes(4294967296).join(','), '0,0,0,1,0,0,0,0');
  ck('计数器 t=2^32+5', kwCounterBytes(4294967301).join(','), '0,0,0,1,0,0,0,5');
  /* 期望值用 BigInt 独立推导，不要手算——我第一版手算写成 27,101,76,0，
     实际是 30,26,48,0。这已是本项目第七次栽在"标准答案/期望值写错"上。 */
  const bigT = 6n * 800000000n;   /* n=8亿个半块时的最后一轮计数器 */
  const bigExp = BigInt.asUintN(64, bigT).toString(16).padStart(16, '0').match(/../g).map(x => parseInt(x, 16)).join(',');
  ck('计数器 t=6n 大值（BigInt 推导）', kwCounterBytes(Number(bigT)).join(','), bigExp);
  ck('计数器 t=6n 与 32 位截断不同', kwCounterBytes(Number(bigT)).join(',') === kwCounterBytes(Number(bigT) % 4294967296).join(','), false);
  ck('计数器高半非恒零', kwCounterBytes(0x1122334455).join(','), '0,0,0,17,34,51,68,85');

  /* ---------- 5. 模式接线（走 symEncryptInner / symDecryptInner） ---------- */
  const savedKM = (typeof KEY_MODE !== 'undefined') ? KEY_MODE : null;
  KEY_MODE = 'raw';
  for (const m of ['KW', 'KWP']) {
    const keyHex = '000102030405060708090a0b0c0d0e0f';
    const pt = rnd(m === 'KW' ? 32 : 21);
    const r = await symEncryptInner(aes128, pt, keyHex, m, 'PKCS7', null, false, '', null, 16);
    ck(m + ' 接线：不返回 IV', r.iv, null);
    ck(m + ' 接线：密文长度', r.ciphertext.length, m === 'KW' ? 40 : 32);
    const back = await symDecryptInner(aes128, r.ciphertext, keyHex, m, 'PKCS7', null, '', null, 16);
    ck(m + ' 接线：往返', hex(back), hex(pt));
    /* 64 位块算法必须被挡住，否则会静默算错 */
    if (bf64) {
      try { await symEncryptInner(bf64, rnd(16), '0011223344556677', m, 'PKCS7', null, false, '', null, 16); bad.push(m + ' 未拒绝 64 位块算法'); }
      catch (e) { ok++; }
    }
  }
  KEY_MODE = savedKM;

  /* ---------- 6. 界面与多语言 ---------- */
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  ck('index.html 有 KW 选项', /<option value="KW"[^>]*>/.test(html), true);
  ck('index.html 有 KWP 选项', /<option value="KWP"[^>]*>/.test(html), true);
  ck('KW 选项带 i18n 键', /<option value="KW"[^>]*data-i18n="opt\.mode\.kw"/.test(html), true);
  ck('KWP 选项带 i18n 键', /<option value="KWP"[^>]*data-i18n="opt\.mode\.kwp"/.test(html), true);
  /* I18N.t(key) 取的是当前语言，切换要用 I18N.set(code)（没有第二参数）。
     第一版我按 I18N.DICT[lang][key] 猜结构，取到 undefined 却因为 Array.isArray
     判 false 才没静默通过——这类"猜 API"必须靠实际取值验证。 */
  const savedLang = I18N.get();
  const seen = {};
  for (const k of ['opt.mode.kw', 'opt.mode.kwp']) {
    const vals = I18N.LANGS.map(L => { I18N.set(L.code); return I18N.t(k); });
    ck(k + ' 八语言非空', vals.every(v => typeof v === 'string' && v.length > 0), true);
    ck(k + ' 未回退原键', vals.some(v => v === k), false);
    /* 英/俄/韩/德/法不得残留汉字（zh-CN / zh-TW / ja 排除：日文正字本就含汉字） */
    const nonCjk = I18N.LANGS.filter(L => ['en', 'ko', 'fr', 'de', 'ru'].includes(L.code));
    let dirty = '';
    nonCjk.forEach((L, i) => {
      I18N.set(L.code);
      const v = I18N.t(k);
      if (/[一-鿿]/.test(v)) dirty += L.code + ':' + v + ' ';
    });
    ck(k + ' 非中文语言无汉字残留', dirty, '');
    I18N.set('en'); seen[k] = I18N.t(k);
  }
  ck('KW 英文译文含标准号', /RFC 3394/.test(seen['opt.mode.kw']), true);
  ck('KWP 英文译文含标准号', /RFC 5649/.test(seen['opt.mode.kwp']), true);
  I18N.set(savedLang);

  console.log('KW/KWP 模式验收：PASS ' + ok + ' / FAIL ' + bad.length);
  if (bad.length) { bad.slice(0, 12).forEach(x => console.log('✗ ' + x)); process.exit(1); }
})();
