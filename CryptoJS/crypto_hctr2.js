/* ============================================================
 * HCTR2 —— 长度保持的可调加密（tweakable SPRP）
 *
 * 来源：Google《Length-preserving encryption with HCTR2》(Crowley/Huckleberry/Biggers,
 *       NIST 2023 分组密码模式研讨会收录论文)。HCTR2 修复了原 HCTR 的两处缺陷：
 *       (1) HCTR 的哈希函数并非论文所声称的 almost-XOR-universal；
 *       (2) Chakraborty–Nandi 的安全性证明有误，二次安全界不成立。
 *       HCTR2 同时把「块密码密钥 + 独立哈希密钥」简化为**只要块密码密钥**，
 *       并支持**任意长度**的 tweak。Linux 内核已采用（fscrypt 的 hctr2）。
 *
 * 裁判：google/hctr2 官方 Python 参考实现（python/ciphers/{gf,polyval,hctr2,xctr}.py，
 *       MIT）。本文件的 GF 乘法、POLYVAL、H_h̄、XCTR、enc/dec 全部按该实现逐行转写；
 *       仅 AES 原语换成本项目自带的 aesMakeBlockFn（AES 是标准原语，非本文件自造）。
 *       向量由该官方实现实跑产出（Json/hctr2_vectors.json，150 条）。
 *
 * 转写要点（都是实测过或会静默错的坑，勿随手改）：
 *   1) 分块方向：M 是**前** 16 字节，N 是**尾部余下**（可为 0 字节）。
 *      输出 C = U ‖ V，U 对应 M、V 对应 N。写反则长度仍对、往返仍自洽，
 *      只有官方向量能抓出——典型「自洽测试掩盖真错」。
 *   2) bin(i) 是**小端**：i.to_bytes(16,'little')。写成大端则全错且不报错。
 *   3) XCTR 计数器从 **1** 开始（不是 0），nonce ⊕ 小端计数，逐块 AES 加密。
 *   4) hash 的长度字段 lengthint = len(tweak)*8*2 + 2；当 |N| 不是 16 的倍数时 **+1**，
 *      且消息尾部追加单字节 0x01 再补零。漏掉 +1 或漏掉 0x01 会静默错。
 *   5) H 用 POLYVAL，但乘的是 h̄⊗x⁻¹（代码里的 polyval_const），不是直接用 h̄。
 *   6) S = MM ⊕ UU ⊕ L，L = E_k(bin(1))；h̄ = E_k(bin(0))。两者次序勿换。
 *
 * 与 XTS 的关系：两者都用于磁盘加密且都是长度保持。XTS 是每 16 字节独立可调，
 *   相同明文块在同一 tweak 位置下必得相同密文块（会泄漏重复模式）；
 *   HCTR2 是整体 SPRP，一个字节变化扩散到全部输出。代价：XTS 可随机读写单块，
 *   HCTR2 必须整段加解密。
 * ============================================================ */
(function () {
  function G(n) { return (typeof window !== 'undefined' ? window : globalThis)[n]; }
  var aesMake = G('aesMakeBlockFn');
  if (typeof aesMake !== 'function' || typeof reg !== 'function') return;

  var M128 = (1n << 128n) - 1n;
  /* GF(2^128) 模多项式 x^128 + x^127 + x^126 + x^121 + 1（去掉最高位，移位后异或） */
  var MODN = (1n << 127n) | (1n << 126n) | (1n << 121n) | 1n;
  /* POLYVAL 常量 = x^-1 在该域中的表示（官方 polyval.py：bits 127,124,121,114,0） */
  var PVC = (1n << 127n) | (1n << 124n) | (1n << 121n) | (1n << 114n) | 1n;

  /* ---------- 本地小工具（crypto_core.js 的 IIFE 局部函数跨文件取不到） ---------- */
  function hexToBytes(s) {
    s = (s || '').replace(/[^0-9a-fA-F]/g, '');
    if (s.length % 2) throw new Error('十六进制长度必须为偶数');
    var o = new Uint8Array(s.length / 2);
    for (var i = 0; i < o.length; i++) o[i] = parseInt(s.substr(i * 2, 2), 16);
    return o;
  }
  function bytesToHex(b) {
    var s = '';
    for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return s;
  }
  function cat() {
    var tot = 0, i;
    for (i = 0; i < arguments.length; i++) tot += arguments[i].length;
    var o = new Uint8Array(tot), p = 0;
    for (i = 0; i < arguments.length; i++) { o.set(arguments[i], p); p += arguments[i].length; }
    return o;
  }
  function xor(a, b) {
    var o = new Uint8Array(a.length);
    for (var i = 0; i < a.length; i++) o[i] = a[i] ^ b[i];
    return o;
  }
  /* 小端 <-> BigInt（POLYVAL 全链路是小端字节序，写成大端全错且不报错） */
  function leInt(b) {
    var v = 0n;
    for (var i = b.length - 1; i >= 0; i--) v = (v << 8n) | BigInt(b[i]);
    return v;
  }
  function leBytes(v, n) {
    var o = new Uint8Array(n || 16);
    for (var i = 0; i < o.length; i++) { o[i] = Number(v & 0xffn); v >>= 8n; }
    return o;
  }
  /* 补零到 16 的倍数。注意 JS 的 % 对负数返回负值（Python 返回非负），
     写成 (-len) % 16 会得到负长度并抛 RangeError——必须这样写。 */
  function pad16(s) { return cat(s, new Uint8Array((16 - (s.length % 16)) % 16)); }

  /* ---------- GF(2^128) 乘法（按官方 gf.py 的 _mul 转写） ---------- */
  function gfMul(a, b) {
    var p = 0n, i;
    for (i = 0; i < 128; i++) {
      if (b & 1n) p ^= a;
      b >>= 1n;
      var carry = (a >> 127n) & 1n;
      a = (a << 1n) & M128;
      if (carry) a ^= MODN;
    }
    return p;
  }

  /* ---------- POLYVAL（按官方 polyval.py 的 hash 转写） ---------- */
  function polyval(key, message) {
    if (message.length % 16 !== 0) throw new Error('POLYVAL 输入必须是 16 字节的整数倍');
    var hpoly = gfMul(leInt(key), PVC);
    var acc = 0n;
    for (var i = 0; i < message.length; i += 16) {
      acc ^= leInt(message.subarray(i, i + 16));
      acc = gfMul(acc, hpoly);
    }
    return leBytes(acc);
  }

  /* ---------- H_h̄(T, M)：按官方 hctr2.py 的 _hash 转写 ---------- */
  function hHash(hashKey, message, tweak) {
    var awkward = message.length % 16 !== 0;
    var lengthint = tweak.length * 8 * 2 + 2;
    if (awkward) lengthint += 1;
    var blocks = leBytes(BigInt(lengthint));
    blocks = cat(blocks, pad16(tweak));
    blocks = cat(blocks, awkward ? pad16(cat(message, new Uint8Array([1]))) : message);
    return polyval(hashKey, blocks);
  }

  /* ---------- XCTR：按官方 xctr.py 的 gen 转写（计数器从 1 起，小端） ---------- */
  function xctrGen(len, nonce, aes) {
    var out = new Uint8Array(len), p = 0, count = 0, i, n;
    while (p < len) {
      count++;
      var cb = leBytes(BigInt(count), nonce.length);
      var blk = new Uint8Array(nonce.length);
      for (i = 0; i < nonce.length; i++) blk[i] = nonce[i] ^ cb[i];
      var e = aes.enc(blk);
      n = Math.min(16, len - p);
      for (i = 0; i < n; i++) out[p + i] = e[i];
      p += n;
    }
    return out;
  }

  /* ---------- HCTR2 主体 ---------- */
  function hctr2Setup(key) {
    var aes = aesMake(key);
    return { aes: aes, hk: aes.enc(leBytes(0n)), l: aes.enc(leBytes(1n)) };
  }
  function hctr2Encrypt(pt, key, tweak) {
    if (pt.length < 16) throw new Error('HCTR2 输入至少 16 字节（一个块），实得 ' + pt.length + ' 字节');
    var S = hctr2Setup(key);
    var m = pt.subarray(0, 16), n = pt.subarray(16);
    var mm = xor(m, hHash(S.hk, n, tweak));
    var uu = S.aes.enc(mm);
    var s = xor(xor(mm, uu), S.l);
    var v = xor(n, xctrGen(n.length, s, S.aes));
    var u = xor(uu, hHash(S.hk, v, tweak));
    return cat(u, v);
  }
  function hctr2Decrypt(ct, key, tweak) {
    if (ct.length < 16) throw new Error('HCTR2 密文至少 16 字节（一个块），实得 ' + ct.length + ' 字节');
    var S = hctr2Setup(key);
    var u = ct.subarray(0, 16), v = ct.subarray(16);
    var uu = xor(u, hHash(S.hk, v, tweak));
    var mm = S.aes.dec(uu);
    var s = xor(xor(mm, uu), S.l);
    var n = xor(v, xctrGen(v.length, s, S.aes));
    var m = xor(mm, hHash(S.hk, n, tweak));
    return cat(m, n);
  }

  /* ---------- 不注册条目：本文件是「第二实现 + 裁判」，不是新算法 ----------
   * 发现经过：本批原计划以 HCTR2 作为新增条目上线，写完并跑通 150 条官方向量后，
   * 统计 ALGOS 时发现**已存在** `hctr2` 条目（CryptoJS/crypto_aead_adv.js，
   * 用 google/hctr2 仓库 test_vectors/ours/HCTR2/HCTR2_AES128.json 200 组向量验收，
   * 且密钥已支持 16/24/32 字节）。再注册 aes128/192/256-hctr2 就是纯冗余，
   * 会让界面出现 4 个 HCTR2。故改为：本文件只做裁判，不注册条目。
   *
   * 为什么保留而不是删掉：两套实现的 POLYVAL 走不同路线——
   *   本文件：BigInt 直接按官方 gf.py 的 _mul 转写（慢，但几乎不可能写错）
   *   原有实现：pvMontH 预表 + Montgomery 域（快，但依赖表与位序约定）
   * 两者在同一组输入上必须逐字节一致，这条断言的价值高于「再抄一遍」。
   * 实测：40 组交叉（含 192/256 密钥、4096 字节）全部一致。
   * 本文件另外补上了原有向量没覆盖的三种情形：AES-192/256、tweak 长度 0/1/47、
   * 以及 4096 字节长消息（原仓库向量只到 AES-128）。
   */
  /* 供 testscript/t_hctr2.js 与官方向量做差分（绕过条目层格式化） */
  globalThis.__hctr2Kat = {
    enc: hctr2Encrypt, dec: hctr2Decrypt, polyval: polyval, gfMul: gfMul,
    hHash: hHash, xctrGen: xctrGen, leInt: leInt, leBytes: leBytes, cat: cat, xor: xor
  };
})();
