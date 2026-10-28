/* ============================================================
 * EME2-AES-128 —— IEEE Std 1619.2 宽块加密（ECB-Mask-ECB）
 *
 * ⚠ 本文件【不注册条目】。对外提供加解密的那个条目是 crypto_wideblock.js 里的
 *   `eme2`（同一算法、同一 48 字节密钥布局）。本文件是 **第二实现 + 裁判**，
 *   用途与 CryptoJS/crypto_hctr2.js 相同：给既有条目补一个独立参照。
 *
 *   第 152 批差点又一次重复造轮子：我写完实现、跑通 72 条官方向量之后，
 *   才在统计条目数时发现 `eme2` 早已存在。已撤销注册，算法数保持 450。
 *   （第 151 批 HCTR2 是同一类失误，这是第二次。）
 *
 * 来源与裁判：
 *   1) 主裁判：TES-main 仓库（Fast implementation of four TES standards:
 *      XTS / HCTR / XCB / EME2）的 EME2/eme2_aes.c，gcc + AES-NI 编译成二进制实跑。
 *      本文件全部常量、轮次、倍增方向都按该 C 源码逐行转写，AES 原语换成本项目
 *      自带的 aesMakeBlockFn（AES 是标准原语，非本文件自造）。
 *   2) 规范口径：IEEE Std 1619.2-2008《Wide-Block Encryption for Shared Storage
 *      Media》的 EME2-AES。IEEE 用「一个主密钥拆成 Key1/Key2/Key3」代替 EME*
 *      论文里彼此独立的掩码 L、R —— 所以收 **48 字节**密钥。
 *   3) 加密方向与既有 `eme2` 条目在 24 组随机用例上**逐字节一致**
 *      （块数 1/2/3/16/17/128/129/257 × AD 0/16/32），两条实现互为佐证。
 *
 * 密钥布局（与 C 参考 ae_init 一致，顺序勿改）：
 *   key[0..15]  = Kad  （Key1，关联数据处理密钥）
 *   key[16..31] = Kecb （Key2，两层 ECB 的初始掩码，即 L0）
 *   key[32..47] = Kaes （Key3，AES-128 密钥）
 *
 * 转写要点（写错不报错、只有裁判能抓，勿随手改）：
 *   1) 倍增是 **小端** mult-by-alpha：16 字节按 b[0] 为最低字节组成 128 位整数，
 *      左移 1 位，溢出位则异或 0x87（x^128+x^7+x^2+x+1）。这与 XTS 的 crank_lfsr
 *      同一约定。IEEE 是小端；**EME\* 论文的 2L 是 msb-first**，两者密文不互通。
 *   2) T* 的关联数据循环里，Kad 是 **先 crank 再用**（第一次用 crank(Kad)，
 *      不是 Kad 本身），且每次 temp 还要再异或一次 Kad。
 *   3) 混合层的 mask renewal：i % 128 == 0（i≥1）时走「重新加密」分支，
 *      其余走 crank(M)。M1 全程不变（始终是 MP⊕MC 的初值）。
 *   4) 第二层 ECB 是 C_i = E(CCC_i) ⊕ L_i（先加密再异或掩码），
 *      第一层是 PPP_i = E(L_i ⊕ P_i)（先异或掩码再加密）。次序写反长度照样对，
 *      而且**往返仍然自洽**——第 152 批反向验证实测：写反后 B1（官方向量）挂，
 *      B2（往返）照样过。典型「自洽测试掩盖真错」。
 *   5) 明文必须是 16 字节的整数倍（参考实现只定义整块行为），不足/不整除直接抛错。
 *   6) AD 只按整 16 字节块处理；**长度不是 16 倍数时抛错**，不猜测填充方式
 *      （参考实现会把不足一块的部分静默丢弃，我们不复制这个行为）。
 *
 * 与 XTS / HCTR2 的关系：三者都用于定长数据单元（扇区）加密。
 *   XTS 窄块（改 1 字节只影响 16 字节）、可随机读写单块；
 *   EME2 / HCTR2 宽块（改 1 字节整段全变）、必须整段加解密。
 *   三者都 **不提供完整性保护**，需要认证请另外接 MAC/AEAD。
 * ============================================================ */
(function () {
  function G(n) { return (typeof window !== 'undefined' ? window : globalThis)[n]; }
  var aesMake = G('aesMakeBlockFn');
  if (typeof aesMake !== 'function' || typeof reg !== 'function') return;

  var M128 = (1n << 128n) - 1n;

  function hexToBytes(s) {
    s = (s || '').replace(/[^0-9a-fA-F]/g, '');
    if (s.length % 2) throw new Error('十六进制长度必须为偶数');
    var o = new Uint8Array(s.length / 2);
    for (var i = 0; i < o.length; i++) {
      var v = parseInt(s.substr(i * 2, 2), 16);
      if (isNaN(v)) throw new Error('非法十六进制：' + s.substr(i * 2, 2));
      o[i] = v;
    }
    return o;
  }
  function bytesToHex(b) {
    var s = '';
    for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return s;
  }
  function xor16(a, b) {
    var o = new Uint8Array(16);
    for (var i = 0; i < 16; i++) o[i] = a[i] ^ b[i];
    return o;
  }
  /* 小端 mult-by-alpha：把 16 字节当作以 b[0] 为最低字节的 128 位整数 */
  function crank(b) {
    var v = 0n, i;
    for (i = 15; i >= 0; i--) v = (v << 8n) | BigInt(b[i]);
    var carry = (v >> 127n) & 1n;
    v = (v << 1n) & M128;
    if (carry) v ^= 0x87n;
    var o = new Uint8Array(16);
    for (i = 0; i < 16; i++) { o[i] = Number(v & 0xffn); v >>= 8n; }
    return o;
  }

  /* ---------- 关联数据 → T* ---------- */
  function eme2Tstar(aes, Kad, ad) {
    if (!ad.length) return aes.enc(Kad.slice());
    var T = new Uint8Array(16), kad = Kad.slice(), i;
    for (i = 0; i < ad.length / 16; i++) {
      kad = crank(kad);
      var blk = new Uint8Array(16);
      for (var j = 0; j < 16; j++) blk[j] = ad[i * 16 + j];
      var t = xor16(aes.enc(xor16(kad, blk)), kad);
      T = xor16(T, t);
    }
    return T;
  }

  /* ---------- 主体：enc / dec ---------- */
  function eme2Crypt(key, pt, ad, encrypt) {
    if (key.length !== 48) throw new Error('EME2-AES-128 密钥需 48 字节（Kad‖Kecb‖Kaes）');
    if (pt.length < 16) throw new Error('EME2 明文至少 16 字节');
    if (pt.length % 16 !== 0) throw new Error('EME2 明文长度必须是 16 字节的整数倍（参考实现只定义整块行为）');
    if (ad.length % 16 !== 0) throw new Error('关联数据长度必须是 16 字节的整数倍');

    var Kad = key.subarray(0, 16), Kecb = key.subarray(16, 32), Kaes = key.subarray(32, 48);
    var aes = aesMake(Kaes);
    var m = pt.length / 16, i, j;
    var Tstar = eme2Tstar(aes, Kad, ad);

    var PPP = [], CCC = [], L = Kecb.slice();
    if (encrypt) {
      /* 第一层 ECB：PPP_i = E(L_i ⊕ P_i) */
      for (i = 0; i < m; i++) {
        var p = new Uint8Array(16);
        for (j = 0; j < 16; j++) p[j] = pt[i * 16 + j];
        PPP.push(aes.enc(xor16(L, p)));
        L = crank(L);
      }
      /* 中间混合 */
      var MP = Tstar.slice();
      for (i = 0; i < m; i++) MP = xor16(MP, PPP[i]);
      var MC = aes.enc(MP), MC1 = MC.slice();
      var M0 = xor16(MP, MC), M = M0.slice(), M1 = M0.slice();
      var C0 = xor16(MC1, Tstar);
      for (i = 1; i < m; i++) {
        var ci;
        if (i % 128) {
          M = crank(M);
          ci = xor16(PPP[i], M);
        } else {
          var mp2 = xor16(PPP[i], M1);
          var mc2 = aes.enc(mp2);
          M = xor16(mp2, mc2);
          ci = xor16(mc2, M1);
        }
        CCC[i] = ci;
        C0 = xor16(C0, ci);
      }
      CCC[0] = C0;
      /* 第二层 ECB：C_i = E(CCC_i) ⊕ L_i */
      var out = new Uint8Array(pt.length);
      L = Kecb.slice();
      for (i = 0; i < m; i++) {
        var c = xor16(aes.enc(CCC[i]), L);
        for (j = 0; j < 16; j++) out[i * 16 + j] = c[j];
        L = crank(L);
      }
      return out;
    }

    /* ---------- 解密：全程逆向 ---------- */
    L = Kecb.slice();
    for (i = 0; i < m; i++) {
      var c2 = new Uint8Array(16);
      for (j = 0; j < 16; j++) c2[j] = pt[i * 16 + j];
      CCC[i] = aes.dec(xor16(c2, L));
      L = crank(L);
    }
    var C0d = CCC[0].slice();
    for (i = 1; i < m; i++) C0d = xor16(C0d, CCC[i]);
    var MC1 = xor16(C0d, Tstar);
    var MPd = aes.dec(MC1);
    var M0d = xor16(MPd, MC1), Md = M0d.slice(), M1d = M0d.slice();
    for (i = 1; i < m; i++) {
      if (i % 128) {
        Md = crank(Md);
        PPP[i] = xor16(CCC[i], Md);
      } else {
        var mc3 = xor16(CCC[i], M1d);
        var mp3 = aes.dec(mc3);
        Md = xor16(mp3, mc3);
        PPP[i] = xor16(mp3, M1d);
      }
    }
    /* PPP_0 由 MP = T* ⊕ XOR(PPP_i) 反解 */
    var xr = Tstar.slice();
    for (i = 1; i < m; i++) xr = xor16(xr, PPP[i]);
    PPP[0] = xor16(MPd, xr);
    var out2 = new Uint8Array(pt.length);
    L = Kecb.slice();
    for (i = 0; i < m; i++) {
      var pp = xor16(aes.dec(PPP[i]), L);
      for (j = 0; j < 16; j++) out2[i * 16 + j] = pp[j];
      L = crank(L);
    }
    return out2;
  }

  /* 导出给测试脚本（不污染全局 ALGOS 表） */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { eme2Crypt: eme2Crypt, crank: crank, bytesToHex: bytesToHex, hexToBytes: hexToBytes };
  } else if (typeof globalThis !== 'undefined') {
    globalThis.__eme2 = { eme2Crypt: eme2Crypt, crank: crank, bytesToHex: bytesToHex, hexToBytes: hexToBytes };
  }
})();
