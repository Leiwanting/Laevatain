/* ============================================================
 * KASUMI 的 3GPP 工作模式：f8（机密性）/ f9（完整性）
 *   规范：3GPP TS 35.201（算法） / TS 35.203（实施者测试数据）
 *   依赖：crypto_kasumi.js（KASUMI 分组，已过 3GPP 官方测试集）
 *
 * f8：类 OFB 流密码
 *   A = COUNT‖BEARER‖DIRECTION‖0…0（右 26 位补 0）
 *   A = KASUMI[A]_{CK⊕KM}          ← 仅初始化用修正密钥
 *   之后 KSBn = KASUMI[A ⊕ BLKCNT ⊕ KSBn-1]_{CK}   ← 用原始 CK
 *   BLKCNT = n-1，64 位大端
 *
 * f9：CBC-MAC
 *   PS = COUNT‖FRESH‖MESSAGE‖DIRECTION‖1‖0…0（补到 64 位整数倍）
 *   主循环用 KASUMI_{IK⊕KM}，KM = 0x55×16
 *   最后一步换 IK⊕0xAA×16（= IK⊕KM⊕0xFF×16），取输出高 32 位为 MAC-I
 *
 * 两个易错点：
 *   · f8 只有初始化那一次用 CK⊕KM，生成密钥流用原 CK
 *   · f9 的填充在 DIRECTION 之后要再补一个 1，然后才是 0
 * ============================================================ */
(function (global) {
  'use strict';
  var K = global.KASUMI;

  function xor16(a, b, v) {
    var o = new Uint8Array(16), i;
    for (i = 0; i < 16; i++) o[i] = a[i] ^ b[i] ^ (v === undefined ? 0 : v);
    return o;
  }
  function constBytes(v, n) { var a = new Uint8Array(n), i; for (i = 0; i < n; i++) a[i] = v; return a; }
  function xor8(a, b) { var o = new Uint8Array(8), i; for (i = 0; i < 8; i++) o[i] = a[i] ^ b[i]; return o; }
  function u8(hexs) { var a = [], i; for (i = 0; i < hexs.length; i += 2) a.push(parseInt(hexs.substr(i, 2), 16)); return new Uint8Array(a); }
  function toHex(b) { return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }

  /* ---- f8 ---- */
  function f8(CK, count, bearer, direction, ibs, lengthBits) {
    var KM = constBytes(0x55, 16);
    var modKey = xor16(CK, KM);
    /* A = COUNT(32) ‖ BEARER(5) ‖ DIRECTION(1) ‖ 0(26) */
    var A = new Uint8Array(8);
    A[0] = (count >>> 24) & 255; A[1] = (count >>> 16) & 255;
    A[2] = (count >>> 8) & 255;  A[3] = count & 255;
    A[4] = ((bearer & 0x1F) << 3) | ((direction & 1) << 2);
    A[5] = A[6] = A[7] = 0;
    A = K.kasumiEnc(A, modKey);                 /* Modified A */

    var blocks = Math.ceil(lengthBits / 64);
    var ks = [], n, i;
    var prev = new Uint8Array(8);
    for (n = 1; n <= blocks; n++) {
      var inb = new Uint8Array(8), cnt = n - 1;
      for (i = 0; i < 8; i++) inb[i] = A[i] ^ prev[i];
      inb[7] ^= (cnt & 0xFF);                   /* BLKCNT = n-1（≤5114 位，不会超过 1 字节） */
      var ksb = K.kasumiEnc(inb, CK);
      ks.push(ksb);
      prev = ksb;
    }
    var outBytes = Math.ceil(lengthBits / 8);
    var out = new Uint8Array(outBytes);
    for (i = 0; i < outBytes; i++) {
      out[i] = ibs[i] ^ ks[Math.floor(i / 8)][i % 8];
    }
    return out;
  }

  /* ---- f9 ---- */
  function f9(IK, count, fresh, direction, msg, lengthBits) {
    /* ⚠ f9 与 f8 的 KM 取值不同：f8 用 0x55… 修正密钥，f9 主循环用**原始 IK**，
       只在最后一步换成 IK⊕0xAA…（TS 35.203 把它标为 "New Key"）。
       写成 IK⊕0x55 会让第一块 KASUMI 输出变成 6E68F513…（应为 89E0A6D0…）。 */
    var key1 = IK;
    var key2 = xor16(IK, constBytes(0xAA, 16));

    /* PS = COUNT ‖ FRESH ‖ MESSAGE ‖ DIRECTION ‖ 1 ‖ 0…0 补齐到 8 字节倍数 */
    var totalBits = 64 + lengthBits + 1 + 1;    /* +1 是 DIRECTION 后的那个 1 */
    var padBytes = Math.ceil(totalBits / 8);
    var ps = new Uint8Array(padBytes);
    var i;
    ps[0] = (count >>> 24) & 255; ps[1] = (count >>> 16) & 255;
    ps[2] = (count >>> 8) & 255;  ps[3] = count & 255;
    ps[4] = (fresh >>> 24) & 255; ps[5] = (fresh >>> 16) & 255;
    ps[6] = (fresh >>> 8) & 255;  ps[7] = fresh & 255;
    for (i = 0; i < Math.ceil(lengthBits / 8); i++) ps[8 + i] = msg[i];
    /* 置 DIRECTION 位与随后的 1 */
    var bitPos = 64 + lengthBits;
    ps[Math.floor(bitPos / 8)] |= (direction & 1) << (7 - (bitPos % 8));
    bitPos++;
    ps[Math.floor(bitPos / 8)] |= 1 << (7 - (bitPos % 8));

    var acc = new Uint8Array(8), state = new Uint8Array(8);
    for (i = 0; i < padBytes; i += 8) {
      var blk = ps.slice(i, i + 8);
      state = K.kasumiEnc(xor8(blk, state), key1);
      acc = xor8(acc, state);
    }
    var fin = K.kasumiEnc(acc, key2);
    return fin.slice(0, 4);
  }

  global.KASUMI_MODE = { f8: f8, f9: f9 };

  /* ---- 注册 ---- */
  if (typeof reg === 'function') {
    function parseKey(k) {
      var s = String(k || '').replace(/\s|:/g, '');
      if (/^[0-9a-fA-F]{32}$/.test(s)) return u8(s);
      throw new Error('密钥须为 32 位十六进制（16 字节）');
    }
    function parseTriple(p, n, maskB) {
      var parts = String(p || '').split(',');
      if (parts.length < n) throw new Error('参数须形如 ' + (n === 3 ? 'COUNT,BEARER,DIRECTION' : 'COUNT,FRESH,DIRECTION') + '（十六进制）');
      var a = parseInt(String(parts[0]).trim(), 16);
      var b = parseInt(String(parts[1]).trim(), 16);
      var d = parseInt(String(parts[2]).trim(), 16);
      if (isNaN(a) || isNaN(b) || isNaN(d)) throw new Error('参数须为十六进制数');
      var len = parts.length > 3 ? parseInt(String(parts[3]).trim(), 10) : 0;
      /* ⚠ 第 2 位的位宽随算法变：f8 是 BEARER（5 位，须 &0x1F），
         f9 是 FRESH（32 位，不能截）。统一写 &0x1F 会让 FRESH 0x05D2EC49
         变成 0x09，MAC 直接算错。 */
      return [a >>> 0, b & maskB, d & 1, isNaN(len) ? 0 : len];
    }
    /* ⚠ 界面把输出框的文本原样交给 dec，内部调用则给字节，两种都要接受。
       少了这一步，解密时 b 是「64 个十六进制字符」的字符串：f8 会按字符逐个
       异或（结果错），且 bitLen 按字符串长度算成 512 位而不是 256 位。
       表现为「加密正常、一点解密就出另一串数据」，且不报错。 */
    function entryBytes(b, fmt) {
      /* 注意必须 new Uint8Array(b) 而不是 b.buffer：b 若是 subarray 视图，
           取 buffer 会丢掉 byteOffset/length，把整段底层缓冲一起算进去。 */
      if (b instanceof Uint8Array || ArrayBuffer.isView(b)) return new Uint8Array(b);
      var s = String(b === undefined || b === null ? '' : b);
      try { return bytesIn(s, fmt || 'hex'); } catch (e) { return u8(s.replace(/\s+/g, '')); }
    }
    /* 比特长度：参数第 4 位给了就用它（可复现官方 189/253/798 等非整字节用例），
       否则按整字节（字节数×8）。必须传入**已转成字节**的 b，否则长度翻倍。 */
    function bitLen(p, b, maskB) { var t = parseTriple(p, 3, maskB); return t[3] > 0 ? t[3] : b.length * 8; }
    reg({
      id: 'kasumi_f8', name: 'KASUMI f8（3GPP 机密性算法）', group: '对称加密',
      key: true, param: true,
      keyLabel: 'CK 机密性密钥（32 位十六进制）',
      paramLabel: 'COUNT,BEARER,DIRECTION[,比特长度]（十六进制，如 72A4F20F,0C,1,798）',
      info: '3GPP TS 35.201 的 f8 机密性算法：以 KASUMI 为核心的类 OFB 流密码，用于 UMTS 空口加密。初始化用 CK⊕0x55… 修正密钥，生成密钥流改用原始 CK。已用 TS 35.203 官方测试集验证（Test Set 1 的 13 块密钥流逐字节一致，2–5 往返一致）。按整字节处理，加解密同为异或。',
      enc: function (b, k, p, f) {
        var t = parseTriple(p, 3, 0x1F), ib = entryBytes(b, f);
        return bytesOut(f8(parseKey(k), t[0], t[1], t[2], ib, bitLen(p, ib, 0x1F)), f);
      },
      dec: function (b, k, p, f) {
        var t = parseTriple(p, 3, 0x1F), ib = entryBytes(b, f);
        /* 解密输出的是明文：不能套 fmt，否则界面显示一串 Hex 而不是原文 */
        return f8(parseKey(k), t[0], t[1], t[2], ib, bitLen(p, ib, 0x1F));
      }
    });
    reg({
      id: 'kasumi_f9', name: 'KASUMI f9（3GPP 完整性算法）', group: '单向哈希',
      key: true, param: true,
      keyLabel: 'IK 完整性密钥（32 位十六进制）',
      paramLabel: 'COUNT,FRESH,DIRECTION[,比特长度]（十六进制，如 38A6F056,05D2EC49,0,189）',
      info: '3GPP TS 35.201 的 f9 完整性算法：基于 KASUMI 的 CBC-MAC，输出 32 位 MAC-I，用于 UMTS 信令完整性。填充为 COUNT‖FRESH‖MESSAGE‖DIRECTION‖1‖0…0。⚠ 与 f8 的密钥修正不同：主循环用原始 IK，仅最后一步换 IK⊕0xAA…。已用 TS 35.203 官方测试集验证（F63BD72C / A9DAF1FF）。',
      enc: function (b, k, p, f) {
        var t = parseTriple(p, 3, 0xFFFFFFFF), ib = entryBytes(b, f);
        return bytesOut(f9(parseKey(k), t[0], t[1] >>> 0, t[2], ib, bitLen(p, ib, 0xFFFFFFFF)), f);
      }
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = global.KASUMI_MODE;
})(typeof window !== 'undefined' ? window : globalThis);
