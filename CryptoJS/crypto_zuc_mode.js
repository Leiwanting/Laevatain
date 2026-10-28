/* ============================================================
 * ZUC-128-EEA3 / ZUC-128-EIA3
 *   GM/T 0001.2-2012《祖冲之序列密码算法 第2部分：基于祖冲之算法的机密性算法》
 *   GM/T 0001.3-2012《祖冲之序列密码算法 第3部分：基于祖冲之算法的完整性算法》
 *   二者分别与 3GPP LTE 128-EEA3 / 128-EIA3 保持一致。
 *
 * 依赖：crypto_zuc.js 提供的 zucKeystream(key, iv, words)（大端 4 字节/字）
 * ------------------------------------------------------------
 * 参数格式：COUNT,BEARER,DIRECTION[,LENGTH]（均为十六进制，逗号分隔）
 *   COUNT     32 位计数器
 *   BEARER     5 位承载层标识（0–0x1f）
 *   DIRECTION  1 位方向
 *   LENGTH     消息比特长度；省略时取「输入字节数 × 8」
 *   例：66035492,0f,00,c1
 *
 * ⚠ IV 构造是这两份标准最容易写错的地方，两次都踩过：
 *   EEA3：IV[4] = BEARER ‖ DIRECTION ‖ 00₂  →  (BEARER<<3) | (DIRECTION<<2)
 *         IV[5..7] = 0，IV[8..15] = IV[0..7]
 *   EIA3：IV[4] = BEARER ‖ 000₂             →  BEARER<<3
 *         IV[8] = IV[0] ⊕ (DIRECTION<<7)，IV[14] = IV[6] ⊕ (DIRECTION<<7)
 *         DIRECTION 在 EIA3 里【不在】IV[4]，而是异或进 IV[8] 与 IV[14]。
 *   本文件两组向量均来自标准正文附录 A，见 testvectors/。
 * ============================================================ */
function zucModeParse(p, defaultBits) {
  var d = { count: 0, bearer: 0, dir: 0, len: defaultBits };
  var parts = String(p == null ? '' : p).split(',');
  for (var i = 0; i < parts.length; i++) parts[i] = parts[i].trim();
  if (parts[0]) d.count = parseInt(parts[0], 16) >>> 0;
  if (parts[1]) d.bearer = parseInt(parts[1], 16) & 0x1f;
  if (parts[2]) d.dir = parseInt(parts[2], 16) & 1;
  if (parts[3]) d.len = parseInt(parts[3], 16);
  if (!(d.len >= 0)) d.len = defaultBits;
  return d;
}

function eea3IV(count, bearer, dir) {
  var v = new Uint8Array(16);
  v[0] = (count >>> 24) & 0xff; v[1] = (count >>> 16) & 0xff;
  v[2] = (count >>> 8) & 0xff;  v[3] = count & 0xff;
  v[4] = ((bearer & 0x1f) << 3) | ((dir & 1) << 2);
  for (var i = 8; i < 16; i++) v[i] = v[i - 8];
  return v;
}
function eia3IV(count, bearer, dir) {
  var v = new Uint8Array(16), d7 = (dir & 1) << 7;
  v[0] = (count >>> 24) & 0xff; v[1] = (count >>> 16) & 0xff;
  v[2] = (count >>> 8) & 0xff;  v[3] = count & 0xff;
  v[4] = (bearer & 0x1f) << 3;
  v[8] = v[0] ^ d7; v[9] = v[1]; v[10] = v[2]; v[11] = v[3];
  v[12] = v[4]; v[13] = v[5]; v[14] = v[6] ^ d7; v[15] = v[7];
  return v;
}

/* 机密性：OBS[i] = IBS[i] ⊕ k[i]，i = 0 .. LENGTH-1；超出 LENGTH 的填充位不动 */
/* 直接吃 16 字节 IV 的版本：界面 IV 框填的就是它，
   绕过 COUNT/BEARER/DIRECTION 构造，便于与其它实现（抓包、仪表）对齐。 */
function zucEEA3IV(data, key, iv, lenBits) {
  var L = Math.ceil(lenBits / 32);
  var ks = zucKeystream(key, iv, L);
  var nb = Math.ceil(lenBits / 8);
  var out = new Uint8Array(data.length), i;
  for (i = 0; i < data.length; i++) out[i] = (i < nb) ? (data[i] ^ ks[i]) : data[i];
  if (lenBits % 8) {
    var m = (0xFF << (8 - (lenBits % 8))) & 0xFF;
    out[nb - 1] = (data[nb - 1] & ~m & 0xFF) | ((data[nb - 1] ^ ks[nb - 1]) & m);
  }
  return out;
}

/* 完整性：T 按位累加 k_i，最后再 ⊕ k_LENGTH 与 k_{32(L-1)} */
function zucEIA3IV(data, key, iv, lenBits) {
  var L = Math.ceil(lenBits / 32) + 2;
  var ks = zucKeystream(key, iv, L);
  var bits = new Uint8Array(L * 32), bi = 0, i, j;
  for (i = 0; i < ks.length; i++)
    for (j = 7; j >= 0; j--) bits[bi++] = (ks[i] >> j) & 1;
  function K(idx) {
    var v = 0;
    for (var t = 0; t < 32; t++) v = ((v << 1) | bits[idx + t]) >>> 0;
    return v >>> 0;
  }
  var mb = new Uint8Array(data.length * 8), mi = 0;
  for (i = 0; i < data.length; i++)
    for (j = 7; j >= 0; j--) mb[mi++] = (data[i] >> j) & 1;
  var T = 0;
  for (i = 0; i < lenBits; i++) if (mb[i]) T = (T ^ K(i)) >>> 0;
  T = (T ^ K(lenBits)) >>> 0;
  var mac = (T ^ K(32 * (L - 1))) >>> 0;
  return new Uint8Array([(mac >>> 24) & 0xff, (mac >>> 16) & 0xff, (mac >>> 8) & 0xff, mac & 0xff]);
}

function zucEEA3(data, key, count, bearer, dir, lenBits) {
  return zucEEA3IV(data, key, eea3IV(count, bearer, dir), lenBits);
}
function zucEIA3(data, key, count, bearer, dir, lenBits) {
  return zucEIA3IV(data, key, eia3IV(count, bearer, dir), lenBits);
}

/* 界面 IV 框：16 字节 Hex。给了就用它，没给才回落到 COUNT/BEARER/DIRECTION。 */
function zucModeIV(ivHex) {
  var t = String(ivHex == null ? '' : ivHex).replace(/[\s,:_-]/g, '');
  if (!t) return null;
  if (!/^[0-9a-fA-F]{32}$/.test(t)) throw new Error('ZUC 的 IV 必须是 16 字节（32 位 Hex），当前 ' + t.length + ' 位');
  return hexToBytes(t);
}

function zucModeKey(k) {
  var key = hexToBytes(k);
  if (key.length !== 16) throw new Error('ZUC 密钥需 16 字节（32 位 Hex），当前 ' + key.length + ' 字节');
  return key;
}

reg({
  id: 'zuc-eea3', name: 'ZUC-128-EEA3（LTE 机密性算法）', group: '对称加密',
  key: true, param: true, paramOptional: true,
  keyLabel: '密钥 CK（Hex，16 字节）',
  paramLabel: 'COUNT,BEARER,DIRECTION[,LENGTH]（Hex）；留空则均为 0，LENGTH 取输入字节数×8',
  ivNeed: true, ivOptional: true, ivLabel: 'IV（16 字节 Hex，32 位）；填了就直接用它，留空则由下面的 COUNT/BEARER/DIRECTION 构造',
  info: 'ZUC-128-EEA3（GM/T 0001.2-2012，等同 3GPP 128-EEA3）：用 CK 与 COUNT/BEARER/DIRECTION 构造 IV 驱动 ZUC 密钥流，明文按位异或。流密码，加解密同一操作。已用标准附录 A 第 1 组（LENGTH=0xc1）逐位验证：192 位密钥流与官方 IBS⊕OBS 完全一致。',
  enc: function (b, k, p, fmt, k2, ivHex) {
    var d = zucModeParse(p, b.length * 8);
    var iv = zucModeIV(ivHex) || eea3IV(d.count, d.bearer, d.dir);
    return bytesOut(zucEEA3IV(b, zucModeKey(k), iv, d.len), fmt);
  },
  dec: function (b, k, p, fmt, k2, ivHex) {
    /* 解密侧界面给的是输出框文本，必须先按密文格式还原成字节：
       少了这一步会把「44 个十六进制字符」当 44 字节处理，长度算成 352 位。 */
    var bb = (b instanceof Uint8Array || ArrayBuffer.isView(b)) ? new Uint8Array(b) : bytesIn(String(b), fmt || 'hex');
    var d = zucModeParse(p, bb.length * 8);
    var iv = zucModeIV(ivHex) || eea3IV(d.count, d.bearer, d.dir);
    return zucEEA3IV(bb, zucModeKey(k), iv, d.len);
  }
});

reg({
  id: 'zuc-eia3', name: 'ZUC-128-EIA3（LTE 完整性算法）', group: '单向哈希',
  key: true, param: true, paramOptional: true,
  keyLabel: '完整性密钥 IK（Hex，16 字节）',
  paramLabel: 'COUNT,BEARER,DIRECTION[,LENGTH]（Hex）；留空则均为 0，LENGTH 取输入字节数×8',
  ivNeed: true, ivOptional: true, ivLabel: 'IV（16 字节 Hex，32 位）；填了就直接用它，留空则由下面的 COUNT/BEARER/DIRECTION 构造',
  info: 'ZUC-128-EIA3（GM/T 0001.3-2012，等同 3GPP 128-EIA3）：带密钥的消息认证码，输出 32 位 MAC-I。按消息比特逐位累加滑动窗口密钥字 k_i，可与 EEA3 配套做完整性校验。已用标准附录 A 第 1 组（IK=COUNT=0、LENGTH=1）验证：MAC=c8a9595e 与官方一致。',
  enc: function (b, k, p, fmt, k2, ivHex) {
    var d = zucModeParse(p, b.length * 8);
    var iv = zucModeIV(ivHex) || eia3IV(d.count, d.bearer, d.dir);
    return bytesOut(zucEIA3IV(b, zucModeKey(k), iv, d.len), fmt);
  },
  dec: function (b, k, p, fmt, k2, ivHex) {
    var bb = (b instanceof Uint8Array || ArrayBuffer.isView(b)) ? new Uint8Array(b) : bytesIn(String(b), fmt || 'hex');
    var d = zucModeParse(p, bb.length * 8);
    var iv = zucModeIV(ivHex) || eia3IV(d.count, d.bearer, d.dir);
    return bytesOut(zucEIA3IV(bb, zucModeKey(k), iv, d.len), fmt);
  }
});
