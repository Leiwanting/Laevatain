/* ============================================================
 * 轻量 / 经典分组密码统一注册入口
 *   依赖：crypto_gift.js / crypto_shacal2.js / crypto_noekeon.js
 *        crypto_misty1.js / crypto_kasumi.js / crypto_skipjack.js
 * 本文件只做注册，算法实现分别在各自文件里。
 * ============================================================ */
(function () {
  'use strict';
  function G(n) { return (typeof window !== 'undefined' ? window : globalThis)[n]; }

  function mk(fnEnc, fnDec) {
    return function (keyBytes) {
      return { enc: function (b) { return fnEnc(b, keyBytes); },
               dec: function (b) { return fnDec(b, keyBytes); } };
    };
  }

  /* GIFT 专用：轮密钥序列只跟密钥有关，在 makeBlockFn 里算一次复用。
     ⚠ 原来走通用 mk()，每个块都要重算 28/40 轮密钥状态（含每轮一次 slice 分配），
       是 GIFT 成为全项目最慢算法的重要原因之一。 */
  function mkGift(gift, rounds) {
    var enc = rounds === 28 ? gift.gift64Enc : gift.gift128Enc;
    var dec = rounds === 28 ? gift.gift64Dec : gift.gift128Dec;
    return function (keyBytes) {
      var rk = gift.giftKeySeq(keyBytes, rounds);
      return { enc: function (b) { return enc(b, keyBytes, rk); },
               dec: function (b) { return dec(b, keyBytes, rk); } };
    };
  }

  /* 通用「密钥编排只算一次」包装：makeKs 由调用方给出，encKS/decKS 接受预计算结果 */
  function mkKs(makeKs, fnEnc, fnDec) {
    return function (keyBytes) {
      var ks = makeKs(keyBytes);
      return { enc: function (b) { return fnEnc(b, ks); },
               dec: function (b) { return fnDec(b, ks); } };
    };
  }

  var items = [];

  var gift = G('GIFT');
  if (gift) {
    items.push({
      id: 'gift64', name: 'GIFT-64（轻量分组密码）', group: '对称加密',
      blockSize: 8, keyLen: 16, makeBlockFn: mkGift(gift, 28),
      info: 'CHES 2017 提出的轻量分组密码，块 64 位、密钥 128 位、28 轮。与 GIFT-128 同族，是 PRESENT 的改进版。已用官方测试向量（含每轮中间状态）验证。'
    });
    items.push({
      id: 'gift128', name: 'GIFT-128（轻量分组密码）', group: '对称加密',
      blockSize: 16, keyLen: 16, makeBlockFn: mkGift(gift, 40),
      info: 'CHES 2017 轻量分组密码，块 128 位、密钥 128 位、40 轮。S 盒 4 位、比特置换为「源→目的」方向，轮常数只作用于固定 6 个比特位加最高位。官方三组向量全过。'
    });
  }

  var sh = G('SHACAL2');
  if (sh) {
    items.push({
      id: 'shacal2', name: 'SHACAL-2（SHA-256 压缩函数分组密码）', group: '对称加密',
      blockSize: 32, keyLen: 64, makeBlockFn: mk(sh.shacal2Enc, sh.shacal2Dec),
      info: '基于 SHA-256 压缩函数的分组密码，块 256 位、密钥最长 512 位（不足补零）。加密即压缩函数终值（不加初值），解密为其逆推。NESSIE 收录，ISO/IEC 18033-3。'
    });
  }

  var s1 = G('SHACAL1');
  if (s1) {
    items.push({
      id: 'shacal1', name: 'SHACAL-1（SHA-1 压缩函数分组密码）', group: '对称加密',
      blockSize: 20, keyLen: 64, makeBlockFn: mk(s1.shacal1Enc, s1.shacal1Dec),
      info: '基于 SHA-1 压缩函数的分组密码，块 160 位、密钥最长 512 位（不足补零，建议不少于 128 位）。明文当链接变量、密钥当消息块，80 轮后输出终值且**不做** feed-forward 加法 —— 这是它与 SHA-1 的关键差异，也是可逆的原因。NESSIE 候选。已过 Crypto3 官方三条向量，并用 SHA1(m)-IV 独立交叉验算。密钥栏不足 64 字节时自动补零。'
    });
  }

  var nk = G('NOEKEON');
  if (nk) {
    items.push({
      id: 'noekeon', name: 'NOEKEON（轻量分组密码）', group: '对称加密',
      blockSize: 16, keyLen: 16, makeBlockFn: mkKs(nk.keySchedule, nk.noekeonEncKS, nk.noekeonDecKS),
      info: 'Daemen 等设计的 128 位分组密码，16 轮。gamma 与 theta 均为对合，故加解密共用函数；区别在加密用 EK、解密用 DK，轮常数 17 个反向使用。Botan 向量 1030 组全过。'
    });
  }

  var mi = G('MISTY1');
  if (mi) {
    items.push({
      id: 'misty1', name: 'MISTY1（NESSIE 认证分组密码）', group: '对称加密',
      blockSize: 8, keyLen: 16, makeBlockFn: mkKs(mi.keySchedule, mi.misty1EncKS, mi.misty1DecKS),
      info: '三菱电机设计，64 位块 / 128 位密钥，8 轮 Feistel 变体，含 FL/FO/FI 三层与 7 位、9 位两个 S 盒。NESSIE 认证算法，也是 KASUMI 的前身。'
    });
  }

  var ka = G('KASUMI');
  if (ka) {
    items.push({
      id: 'kasumi', name: 'KASUMI（3GPP 分组密码）', group: '对称加密',
      blockSize: 8, keyLen: 16, makeBlockFn: mkKs(ka.keySchedule, ka.kasumiEncKS, ka.kasumiDecKS),
      info: '3GPP TS 35.202 定义的 64 位块分组密码，由 MISTY1 改造而来，用于 UMTS/LTE 的 f8 加密与 f9 完整性。已通过 3GPP 官方测试集。'
    });
  }

  var sj = G('SKIPJACK');
  if (sj) {
    items.push({
      id: 'skipjack', name: 'SKIPJACK（NSA，1998 解密）', group: '对称加密',
      blockSize: 8, keyLen: 10, makeBlockFn: mk(sj.encBlock, sj.decBlock),
      info: 'NSA 1987 年为 Clipper 芯片设计的 64 位块 / 80 位密钥算法，32 轮非平衡 Feistel，Rule A/B 交替。1998 年解密公开。已用 NIST 规范第 18 页的 32 轮全部中间状态逐轮对拍（32/32），并与 Bouncy Castle、LibTomCrypt 向量一致。已废弃，仅供密码学史研究。'
    });
  }

  var pr = G('PRESENT');
  if (pr) {
    items.push({
      id: 'present80', name: 'PRESENT-80（超轻量分组密码）', group: '对称加密',
      blockSize: 8, keyLen: 10, makeBlockFn: mkKs(pr.keySchedule, pr.presentEnc, pr.presentDec),
      info: 'CHES 2007 提出的超轻量 SPN 分组密码，块 64 位、密钥 80 位（10 字节）、31 轮，每轮 addRoundKey → 4 位 S 盒 → 比特置换 pLayer，最后再白化一次。ISO/IEC 29192-2 收录。已过论文附录 I 的四条官方向量（全 0/全 F 密钥 × 明文组合），加解密双向均还原。密钥栏必须是 10 字节。'
    });
    items.push({
      id: 'present128', name: 'PRESENT-128（超轻量分组密码）', group: '对称加密',
      blockSize: 8, keyLen: 16, makeBlockFn: mkKs(pr.keySchedule, pr.presentEnc, pr.presentDec),
      info: 'PRESENT 的 128 位密钥版本（16 字节），31 轮。密钥更新与 80 位版有一处关键差异：最高**两个** nibble 各过一次 S 盒，且轮计数器异或位置不同（k66..k62，不是 k19..k15）。论文附录 II 只给了密钥调度没给向量，本实现的四条标准值与 32 个中间轮密钥均已逐条对拍通过。'
    });
  }

  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (typeof regSym === 'function') {
      regSym(it);
    } else if (typeof reg === 'function') {
      it.key = true; it.isSym = true; reg(it);
    }
  }
})();
