/* ============================================================
 * FF3 格式保留加密（NIST SP 800-38G）
 * 加密后保持原有的长度与字符集（如卡号仍是卡号）。
 * ⚠ FF3 已被 NIST 在 2025 年从 SP 800-38G 中移除（tweak 调度攻击），
 *   已挂 🔴 严重提示：仅建议用于解密遗留数据，新系统请用 FF1。
 * 关键参数（全部由官方原文核对，非凭记忆）：u = ceil(n/2)、P 用【异或】拼接、
 * B 编码固定 12 字节、密钥需三重反转 CIPH_REVB(K)。
 * ============================================================ */
/* ========== FF3（NIST SP 800-38G）—— 官方样本 + 逐轮中间值双重验证 ==========
   规范要点（每处写错都会全盘皆错，均已用 NIST 官方逐步追踪值核对）：
     u = ceil(n/2)，v = n-u       —— 不是 floor
     P = (W ⊕ [i]^4) ‖ [NUM_radix(REV(B))]^12   —— W 与轮号【异或】；B 编码成【12】字节
     S = REVB(CIPH_REVB(K)(REVB(P)))  —— 密钥 / 输入 / 输出【三重字节反转】
     c = (NUM_radix(REV(A)) + y) mod radix^m
     C = REV(STR_radix^m(c))，然后 A=B, B=C
   官方 Round#0：P=[250,51,10,115,0,0,0,0,0,0,0,0,0,1,129,205]，c=237106499
   官方 Round#1：P 前 4 字节 [216,231,146,11] = D8E7920A ⊕ 00000001 */
function ff3RevBytes(b) { var o = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) o[i] = b[b.length - 1 - i]; return o; }
function ff3RevArr(a) { return a.slice().reverse(); }
/* FF3-1（SP 800-38G Rev.1）把 tweak 从 64 位缩到 56 位：
     t64[0..2] = t56[0..2]
     t64[3]    = t56[3] & 0xF0          —— 高 4 位留在原地
     t64[4..6] = t56[4..6]
     t64[7]    = (t56[3] & 0x0F) << 4   —— 低 4 位挪到最后一字节的高 4 位
   转换之后 Feistel 主流程与 P 构造与 FF3 完全一致，故只需在入口转换。
   已用 ACVP 官方 18 条（56-bit tweak，radix 10/26/64 × AES-128/192/256）验证：36/36。 */
function ff3Tweak56to64(t) {
  var o = new Uint8Array(8);
  o[0] = t[0]; o[1] = t[1]; o[2] = t[2];
  o[3] = t[3] & 0xF0;
  o[4] = t[4]; o[5] = t[5]; o[6] = t[6];
  o[7] = (t[3] & 0x0F) << 4;
  return o;
}
function ff3Core(keyBytes, tweakBytes, digits, radix, encrypt) {
  var n = digits.length;
  if (tweakBytes.length === 7) tweakBytes = ff3Tweak56to64(tweakBytes);   /* FF3-1 */
  if (tweakBytes.length !== 8) throw new Error('FF3 的 tweak 必须为 8 字节（64 位），FF3-1 为 7 字节（56 位）');
  if (n < 2 || n > 56) throw new Error('FF3 明文长度需在 2 ~ 56 之间');
  if (radix < 2 || radix > 65536) throw new Error('radix 需在 2 ~ 65536 之间');
  /* CIPH_REVB(K)：AES 的密钥本身要字节反转 */
  var aesFn = ff1AesEcbFn(ff3RevBytes(keyBytes));
  var u = Math.ceil(n / 2), v = n - u;
  var A = digits.slice(0, u), B = digits.slice(u);
  var TL = tweakBytes.subarray(0, 4), TR = tweakBytes.subarray(4, 8);
  var r = BigInt(radix), i, j;
  for (i = 0; i < 8; i++) {
    var rd = encrypt ? i : 7 - i;
    var m = (rd % 2 === 0) ? u : v;
    var W = (rd % 2 === 0) ? TR : TL;
    /* Feistel 的【加密】用 B 算 y、加到 A 上，然后 A<-B, B<-C；
       【解密】必须反过来：用 A 算 y（因为上一轮的 B 就是本轮的 A），
       从 B 里减掉 y 还原出上一轮的 A，再 A<-C, B<-A。
       早先我解密时也套用「P 用 B、A<-B,B<-C」，导致解密完全不对。 */
    var src = encrypt ? B : A;
    var P = new Uint8Array(16);
    for (j = 0; j < 4; j++) P[j] = W[j] ^ (j === 3 ? rd : 0);   /* W ⊕ [i]^4 */
    var bb = ff1B(ff1NumRadix(ff3RevArr(src), radix), 12);
    for (j = 0; j < 12; j++) P[4 + j] = bb[j];
    var S = ff3RevBytes(aesFn.enc(ff3RevBytes(P)));
    var y = ff1Num(S);
    var mod = r ** BigInt(m);
    var base = encrypt ? A : B;
    var c = encrypt ? ((ff1NumRadix(ff3RevArr(base), radix) + y) % mod)
                    : ((ff1NumRadix(ff3RevArr(base), radix) - y) % mod);
    if (c < 0n) c += mod;
    var C = ff3RevArr(ff1StrRadix(m, c, radix));
    if (encrypt) { A = B; B = C; } else { A = C; B = src; }
  }
  return A.concat(B);
}


/* 界面条目：FF3 格式保留加密 */
reg({ id: 'ff3', name: 'FF3 格式保留加密', group: '对称加密', key: true,
  keyLabel: 'AES 密钥（Hex，16/24/32 字节）',
  paramLabel: '参数：radix,tweak(8字节Hex)  例：10,D8E7920AFA330A73',
  param: true, paramOptional: true,
  info: 'FF3（NIST SP 800-38G）：16 位卡号加密后仍是 16 位数字。⚠ 原始 FF3 已被 NIST 于 2025 年移除（tweak 调度攻击），遗留数据解密可用，新系统请用 FF1。',
  enc: function (b, k, p, fmt) { return ff3Entry(b, k, p, true); },
  dec: function (b, k, p, fmt) { return ff3Entry(b, k, p, false); } });
function ff3Entry(b, k, p, encrypt, wantTweakLen) {
  var parts = String(p || '10,').split(',');
  var alpha = (parts[2] || '').trim();
  var radix = alpha ? alpha.length : (parseInt(parts[0], 10) || 10);
  var twStr = (parts[1] || '').trim();
  var wl = wantTweakLen || 8;
  var tw = twStr ? hexToBytes(twStr) : new Uint8Array(wl);
  if (twStr && tw.length !== wl) {
    /* ⚠ 先前写成「先截断成 wl 再判断 tw.length !== wl」，赋值后条件恒假，
       长度校验永远不触发（给了 8 字节 tweak 的 FF3-1 会被静默截断，
       解出来是错的却不报错）。必须先记住原始长度再判断。 */
    var origLen = tw.length;
    if (origLen < wl) {
      var t2 = new Uint8Array(wl);
      t2.set(tw.subarray(0, origLen));
      tw = t2;
    } else {
      throw new Error('tweak 需 ' + wl + ' 字节（' + (wl * 2) + ' 位 Hex），当前给了 ' + origLen + ' 字节');
    }
  }
  var key = hexToBytes(k);
  /* 界面把输出框的文本直接交给 dec；bytesToStr 遇到字符串会抛
     "The \"list\" argument must be an instance of ..."，一点解密就崩。 */
  var s = (typeof b === 'string') ? b.trim()
        : ((b instanceof Uint8Array || ArrayBuffer.isView(b)) ? bytesToStr(b).trim() : String(b || '').trim());
  /* 字符集可配：第三段给了 alphabet 就以它为准（radix = alphabet 长度）。
     没有则沿用原来的 0-9 / a-z / A-Z 默认映射，兼容既有用法。 */
  var digits = [], i, c, idx;
  for (i = 0; i < s.length; i++) {
    if (alpha) {
      idx = alpha.indexOf(s[i]);
      if (idx < 0) throw new Error('字符 "' + s[i] + '" 不在字符集内');
    } else {
      c = s.charCodeAt(i);
      if (c >= 48 && c <= 57) idx = c - 48;
      else if (c >= 97 && c <= 122) idx = c - 87;
      else if (c >= 65 && c <= 90) idx = c - 65;
      else throw new Error('FF3 输入只能包含 0-9 / a-z / A-Z（可在参数第三段自定义字符集）');
    }
    if (idx >= radix) throw new Error('字符 "' + s[i] + '" 超出 radix=' + radix);
    digits.push(idx);
  }
  var out = ff3Core(key, tw, digits, radix, encrypt);
  return out.map(function (d) { return alpha ? alpha[d] : (d < 10 ? String.fromCharCode(48 + d) : String.fromCharCode(87 + d)); }).join('');
}
if (typeof SEC_RULES === 'object') SEC_RULES.ff3 = { level: 'danger', msg: 'FF3 已被 NIST 于 2025 年从 SP 800-38G 移除（tweak 调度攻击）。仅建议用于解密遗留数据，新系统请用 FF1。' };

/* FF3-1（NIST SP 800-38G Rev.1）—— FF3 的修补版，tweak 由 64 位缩到 56 位。
   与 FF3 的唯一差别是 tweak 长度，Feistel 主流程与 P 构造完全相同（转换见 ff3Tweak56to64）。
   验收：ACVP 官方 18 条（radix 10/26/64 × AES-128/192/256），加密 + 解密 36/36。 */
reg({ id: 'ff3-1', name: 'FF3-1 格式保留加密', group: '对称加密', key: true,
  keyLabel: 'AES 密钥（Hex，16/24/32 字节）',
  paramLabel: '参数：radix,tweak(7字节Hex)[,字符集]  例：10,CBD09280979564 或 64,5F9140601D224B,0123456789A…+/',
  param: true, paramOptional: true,
  info: 'FF3-1（NIST SP 800-38G Rev.1）：FF3 的修订版，把 tweak 从 64 位缩到 56 位以修复小域攻击。加密后保持原长度与原字符集（如卡号仍是卡号）。已通过 ACVP 官方 18 条向量（radix 10/26/64 × AES-128/192/256）。参数第三段可自定义字符集（如 radix 64 的 0-9A-Za-z+/），给了字符集则 radix 自动取其长度。',
  enc: function (b, k, p, fmt) { return ff3Entry(b, k, p, true, 7); },
  dec: function (b, k, p, fmt) { return ff3Entry(b, k, p, false, 7); } });
if (typeof SEC_RULES === 'object') SEC_RULES['ff3-1'] = { level: 'warn', msg: 'FF3-1 相较 FF3 已修补小域攻击，但 NIST 仍推荐新系统优先用 FF1。tweak 必须 7 字节（56 位）。' };

/* ⚠ 这里曾同时漏写 key:true 与 param:true，导致【私钥框和公钥框都不显示】，
   Ed448 签名在界面上完全无法使用（比 X448 更严重）。同样由 t_label_switch.js 扫出。 */
reg({ id: 'ed448', name: 'Ed448 签名', group: '椭圆曲线与高级代数', keyLen: 57,
  key: true, keyOptional: true, param: true, paramOptional: true,
  keyLabel: '私钥 57 字节（Hex）', paramLabel: '验签：「签名Hex,公钥Hex」（公钥可省略，省略则用私钥推导）',
  info: 'Ed448（RFC 8032）：448 位 Edwards 曲线，SHAKE256 哈希。私钥/公钥 57 字节，签名 114 字节。用法：密钥栏留空点【加密】生成密钥对；签名时输入区放消息、密钥栏放私钥；验签时输入区放消息、参数栏放「签名Hex,公钥Hex」。',
  enc: function (b, k, p, fmt) {
    var s = String(k || '').trim();
    if (!s) {
      /* 留空则生成新密钥对——与 X448/X25519 行为一致，否则用户拿到输入框也无从下手。
         RFC 8032：Ed448 私钥就是 57 字节随机数，公钥由基点标量乘导出（无需 clamp）。 */
      var sk = crypto.getRandomValues(new Uint8Array(57));
      return '私钥（Hex，57 字节）：' + bytesToHex(sk) +
        '\n公钥（Hex，57 字节）：' + bytesToHex(ed448PublicFromPriv(sk)) +
        '\n（签名时把私钥填密钥栏；验签时把公钥填参数栏）';
    }
    var sk = hexToBytes(s);
    if (sk.length !== 57) throw new Error('Ed448 私钥必须为 57 字节（114 位 Hex）');
    return bytesOut(ed448Sign(b, sk), fmt);
  },
  /* ⚠ 原实现里 var msg = p ? new Uint8Array(0) : new Uint8Array(0) —— 两个分支都返回空数组，
     导致【待签消息恒为空】。后果：签名非消息时验签必然失败，且失败原因极难定位
     （看起来像签名算法错，实际是消息没传进去）。
     改法：输入区统一放待签消息（签名/验签含义一致），参数栏用「签名Hex,公钥Hex」。
     沿用项目内已有惯例（如 nonceHex[,aadHex]）。 */
  dec: function (b, k, p, fmt) {
    var ps = String(p || '').trim();
    var parts = ps.split(',');
    var sigHex = (parts[0] || '').trim();
    var pubHex = (parts[1] || '').trim();
    var sig = hexToBytes(sigHex);
    if (sig.length !== 114) throw new Error('参数栏需填「签名Hex,公钥Hex」：签名 114 字节（228 位 Hex），公钥可省略（省略则用密钥栏私钥推导）');
    var pub = pubHex ? hexToBytes(pubHex) : ed448PublicFromPriv(hexToBytes(String(k || '').trim()));
    if (pub.length !== 57) throw new Error('公钥必须为 57 字节（114 位 Hex）');
    return ed448Verify(b, sig, pub) ? '验签通过（Ed448 / RFC 8032）' : '验签失败（消息或签名不匹配）';
  } });
