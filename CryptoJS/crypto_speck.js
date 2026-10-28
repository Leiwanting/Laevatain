/* ============================================================
 * SPECK —— NSA 轻量分组密码（与 Simon 是姊妹算法，2013）
 * 现支持 5 个参数集：块 64（96/128 位密钥）、块 128（128/192/256 位密钥）。
 * 轮函数只用 加法 / 异或 / 循环移位，软件里通常明显快于 Simon。
 *
 * 关键实现点（Crypto++ 源码 + 官方向量核对）：
 *  1) 轮数随参数集变化：64/96→26、64/128→27、128/128→32、128/192→33、
 *     128/256→34。**不是** Simon 的 68 轮，两者混用会得到一个长度正确、
 *     能往返、但跟官方对不上的结果。
 *  2) 旋转常数 alpha=8（rotr）、beta=3（rotl），块 64 与块 128 相同。
 *  3) 字节序【小端】：y = 明文低字、x = 明文高字；输出时 y 写回低半、x 写回高半。
 *  4) 密钥调度：ks[0] = 密钥低字，L[0..m-2] = 其余密钥字；
 *     L' = (ROTR(L[i],8) + ks[i]) ^ i ；ks' = ROTL(ks[i],3) ^ L'。
 *     轮常数 i 是【异或】进 L'，不是加法。
 *  5) 解密：y = ROTR(y ^ x, 3)；x = ROTL((x ^ ks[i]) - y, 8)，减法需 mod 2^n。
 *
 * 向量：Crypto++ TestVectors/speck.txt（ECB，每参数集 8 条）全部 8/8。
 * ============================================================ */
(function () {
  var CFG = {
    'speck64-96'  : { n: 32, m: 3, T: 26 },
    'speck64-128' : { n: 32, m: 4, T: 27 },
    'speck128'    : { n: 64, m: 2, T: 32 },
    'speck128-192': { n: 64, m: 3, T: 33 },
    'speck128-256': { n: 64, m: 4, T: 34 }
  };
  var DESC = {
    'speck64-96'  : ['SPECK-64/96', 8, 12],
    'speck64-128' : ['SPECK-64/128', 8, 16],
    'speck128'    : ['SPECK-128/128', 16, 16],
    'speck128-192': ['SPECK-128/192', 16, 24],
    'speck128-256': ['SPECK-128/256', 16, 32]
  };
  var AL = 8, BE = 3;

  function make(id) {
    var c = CFG[id], n = c.n, W = n / 8, m = c.m, T = c.T;
    var MASK = (1n << BigInt(n)) - 1n;
    function ROTL(x, k) { return ((x << BigInt(k)) | (x >> BigInt(n - k))) & MASK; }
    function ROTR(x, k) { return ((x >> BigInt(k)) | (x << BigInt(n - k))) & MASK; }
    function rd(b, o) { var v = 0n; for (var i = W - 1; i >= 0; i--) v = (v << 8n) | BigInt(b[o + i]); return v; }
    function wr(v, b, o) { for (var i = 0; i < W; i++) { b[o + i] = Number(v & 0xffn); v >>= 8n; } }

    function ks(keyBytes) {
      var K = [rd(keyBytes, 0)], L = [];
      for (var i = 1; i < m; i++) L.push(rd(keyBytes, i * W));
      for (var r = 0; r < T - 1; r++) {
        var nl = ((ROTR(L[r], AL) + K[r]) & MASK) ^ BigInt(r);
        L.push(nl); K.push(ROTL(K[r], BE) ^ nl);
      }
      return K;
    }
    function enc(b, rk) {
      var y = rd(b, 0), x = rd(b, W);
      for (var i = 0; i < rk.length; i++) {
        x = ((ROTR(x, AL) + y) & MASK) ^ rk[i];
        y = ROTL(y, BE) ^ x;
      }
      var o = new Uint8Array(2 * W); wr(y, o, 0); wr(x, o, W); return o;
    }
    function dec(b, rk) {
      var y = rd(b, 0), x = rd(b, W);
      for (var i = rk.length - 1; i >= 0; i--) {
        y = ROTR(y ^ x, BE);
        x = ROTL(((x ^ rk[i]) - y) & MASK, AL);
      }
      var o = new Uint8Array(2 * W); wr(y, o, 0); wr(x, o, W); return o;
    }
    return function (keyBytes) {
      var want = DESC[id][2];
      if (!keyBytes || keyBytes.length !== want) {
        throw new Error(DESC[id][0] + ' 密钥必须是 ' + want + ' 字节（' + (want * 8) + ' 位），实得 ' + (keyBytes ? keyBytes.length : 0));
      }
      var rk = ks(keyBytes);
      return { enc: function (b) { return enc(b, rk); }, dec: function (b) { return dec(b, rk); } };
    };
  }

  globalThis.SPECK = { make: make, makeBlockFn: make('speck128') };

  if (typeof regSym !== 'function') return;
  Object.keys(CFG).forEach(function (id) {
    var d = DESC[id], c = CFG[id];
    regSym({
      id: id, name: d[0] + '（NSA 轻量分组密码）', group: '对称加密',
      blockSize: d[1], keyLen: d[2], makeBlockFn: make(id),
      info: 'NSA 2013 年轻量分组密码 SPECK，' + d[1] * 8 + ' 位块 / ' + d[2] * 8 + ' 位密钥 / ' +
        c.T + ' 轮（轮数随参数集变；姊妹算法 Simon 在同样块长下轮数更多）。' +
        '轮函数只用加法/异或/循环移位，软件实现通常比 Simon 快。' +
        '官方向量：Crypto++ TestVectors/speck.txt 8/8 全过。字节序【小端】。'
    });
  });
})();
