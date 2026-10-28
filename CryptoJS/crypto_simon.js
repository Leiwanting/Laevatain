/* ============================================================
 * Simon —— NSA 轻量分组密码（Beaulieu / Shors / Smith 等，2013）
 * 现支持 5 个参数集：块 64（96/128 位密钥）、块 128（128/192/256 位密钥）。
 * 轮函数只用了与、异或、循环移位三种操作，与 SPECK 是姊妹算法。
 *
 * 关键实现点（都从 Crypto++ 官方源码 + 官方向量逐条核对出来）：
 *  1) 轮数随参数集变化，不是常数：64/96→42、64/128→44、128/128→68、
 *     128/192→69、128/256→72。当初把 128/128 按 32 写（那是 SPECK 的轮数）
 *     会得到一个长度正确、能往返、但跟官方对不上的结果。
 *  2) 字节序【小端】：明文的第 0 字节是字的最低字节；x = 高字、y = 低字。
 *     大小端在这里不报错，只是密文全错——必须靠向量定。
 *  3) 密钥调度是【队列】：reg 初始为逆序的密钥字，每轮
 *     nk = c ^ z位 ^ ROTR(reg[0],3) ^ ROTR(reg[0],4) ^ reg[m-1]，
 *     然后 push(pop()) 取【右端】、unshift(nk) 放左端。
 *     **注意是 ROTR 不是 ROTL** —— 我曾把通用版的旋转方向写反，
 *     结果 5 个参数集 40 条向量全错，而 128/128 的旧实现却是对的，
 *     排查时差点误判成"官方向量有问题"。
 *  4) 密钥字数为 4 时多两项：^ reg[m-2] ^ ROTR(reg[m-2],1)。m=2/3 没有。
 *  5) z 序列按参数集不同（Crypto++ simon.cpp 里的三个 64 位常量），
 *     取 bit (i % 62)，i 从 0 计。128/128 那个常量最高半字节是 0x7 不是 0x3，
 *     但 bit62 以上不参与（只取 0..61），所以两者等价。
 *
 * 向量：Crypto++ TestVectors/simon.txt（ECB，每参数集 8 条）全部 8/8。
 * ============================================================ */
(function () {
  var CFG = {
    'simon64-96'  : { n: 32, m: 3, T: 42, z: 0x7369f885192c0ef5n },
    'simon64-128' : { n: 32, m: 4, T: 44, z: 0xfc2ce51207a635dbn },
    'simon128'    : { n: 64, m: 2, T: 68, z: 0x7369f885192c0ef5n },
    'simon128-192': { n: 64, m: 3, T: 69, z: 0xfc2ce51207a635dbn },
    'simon128-256': { n: 64, m: 4, T: 72, z: 0xfdc94c3a046d678bn }
  };
  var DESC = {
    'simon64-96'  : ['Simon-64/96', 8, 12],
    'simon64-128' : ['Simon-64/128', 8, 16],
    'simon128'    : ['Simon-128/128', 16, 16],
    'simon128-192': ['Simon-128/192', 16, 24],
    'simon128-256': ['Simon-128/256', 16, 32]
  };

  function make(id) {
    var c = CFG[id], n = c.n, W = n / 8, m = c.m, T = c.T;
    var MASK = (1n << BigInt(n)) - 1n, C = MASK ^ 3n;
    function ROTL(x, k) { return ((x << BigInt(k)) | (x >> BigInt(n - k))) & MASK; }
    function ROTR(x, k) { return ((x >> BigInt(k)) | (x << BigInt(n - k))) & MASK; }
    function rd(b, o) { var v = 0n; for (var i = W - 1; i >= 0; i--) v = (v << 8n) | BigInt(b[o + i]); return v; }
    function wr(v, b, o) { for (var i = 0; i < W; i++) { b[o + i] = Number(v & 0xffn); v >>= 8n; } }

    function ks(keyBytes) {
      var reg = [];
      for (var i = m - 1; i >= 0; i--) reg.push(rd(keyBytes, i * W));
      var rk = [];
      for (var r = 0; r < T; r++) {
        var zb = (c.z >> BigInt(r % 62)) & 1n;
        var v = C ^ zb ^ ROTR(reg[0], 3) ^ ROTR(reg[0], 4) ^ reg[m - 1];
        if (m === 4) { var t = reg[m - 2]; v ^= t ^ ROTR(t, 1); }
        rk.push(reg.pop()); reg.unshift(v & MASK);
      }
      return rk;
    }
    function enc(b, rk) {
      var x = rd(b, W), y = rd(b, 0);
      for (var i = 0; i < rk.length; i++) {
        var nx = rk[i] ^ ((((ROTL(x, 1) & ROTL(x, 8)) ^ y) ^ ROTL(x, 2)) & MASK);
        y = x; x = nx & MASK;
      }
      var o = new Uint8Array(2 * W); wr(y, o, 0); wr(x, o, W); return o;
    }
    function dec(b, rk) {
      var x = rd(b, W), y = rd(b, 0);
      for (var i = rk.length - 1; i >= 0; i--) {
        var ny = ((rk[i] ^ x) ^ ROTL(y, 2)) ^ (ROTL(y, 1) & ROTL(y, 8));
        x = y; y = ny & MASK;
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

  globalThis.SIMON = { make: make, makeBlockFn: make('simon128') };

  if (typeof regSym !== 'function') return;
  Object.keys(CFG).forEach(function (id) {
    var d = DESC[id], c = CFG[id];
    regSym({
      id: id, name: d[0] + '（NSA 轻量分组密码）', group: '对称加密',
      blockSize: d[1], keyLen: d[2], makeBlockFn: make(id),
      info: 'NSA 2013 年轻量分组密码 Simon，' + d[1] * 8 + ' 位块 / ' + d[2] * 8 + ' 位密钥 / ' +
        c.T + ' 轮（轮数随参数集变，不是常数）。轮函数只用与/异或/循环移位。' +
        '官方向量：Crypto++ TestVectors/simon.txt 8/8 全过。字节序【小端】。'
    });
  });
})();
