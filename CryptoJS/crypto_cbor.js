/* CBOR（RFC 8949，前身 RFC 7049）—— 结构化数据的二进制编码
   官方测试向量来源：CBOR 工作组 test-vectors 仓库 appendix_a.json（即 RFC 附录 A 诊断示例，82 条）
   见 t_cbor.js：82 条全部做 hex→诊断 双向比对，并对 roundtrip 条目做 诊断→hex 回编比对。

   值树节点约定（内部表示，不对外暴露）：
     {k:'uint'|'nint', v:BigInt}          整数（nint 的 v 已是 -1-n 的负值）
     {k:'bytes', v:Uint8Array}            定长字节串
     {k:'bytes', indef:true, chunks:[...]}不定长字节串
     {k:'text', v:string}                 定长文本串
     {k:'text', indef:true, chunks:[...]} 不定长文本串
     {k:'array', v:[...], indef:bool}
     {k:'map',  v:[[k,v],...], indef:bool} 保序，不用 Object（键可能非字符串）
     {k:'tag', t:BigInt, v:node}
     {k:'simple', n:int}                  n=20/21/22/23 即 false/true/null/undefined
     {k:'float', v:number}
*/
(function () {
  /* ---------------- 浮点：半精度（IEEE 754 binary16） ---------------- */
  function halfToDouble(h) {
    var s = (h >> 15) & 1, e = (h >> 10) & 0x1f, m = h & 0x3ff, v;
    if (e === 0) v = m * Math.pow(2, -24);          /* 次正规数：m × 2^-24 */
    else if (e === 31) v = m === 0 ? Infinity : NaN;
    else v = (m + 1024) * Math.pow(2, e - 25);
    return s ? -v : v;
  }
  /* 单/双精度位串 → Number */
  function bitsToDouble(bits, bytes) {
    var dv = new DataView(new ArrayBuffer(8));
    if (bytes === 4) { dv.setUint32(0, bits >>> 0); return dv.getFloat32(0); }
    dv.setBigUint64(0, BigInt(bits)); return dv.getFloat64(0);
  }
  /* Number → 半精度位串。误差由调用方用 halfToDouble 回验兜底，不追求完全正确 */
  function doubleToHalf(v) {
    var f = new Float32Array([v])[0];
    var dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, f);
    var x = dv.getUint32(0);
    var sign = (x >>> 31) & 1, exp = (x >>> 23) & 0xff, mant = x & 0x7fffff;
    if (exp === 0xff) return (sign << 15) | 0x7c00 | (mant ? 0x200 : 0);
    var e = exp - 127 + 15;
    if (e >= 31) return (sign << 15) | 0x7c00;
    if (e <= 0) {
      if (e < -10) return sign << 15;
      var shift = 14 - e, full = mant | 0x800000;
      var m = full >> shift, rem = full & ((1 << shift) - 1), half = 1 << (shift - 1);
      if (rem > half || (rem === half && (m & 1))) m += 1;
      return (sign << 15) | m;
    }
    var h = (sign << 15) | (e << 10) | (mant >> 13);
    if (mant & 0x1000) {                              /* 就近偶数舍入 */
      if ((mant & 0x1fff) !== 0x1000) h += 1;
      else if (h & 1) h += 1;
    }
    return h & 0xffff;
  }

  /* ---------------- 解码 ---------------- */
  function readU64(buf, p) {
    var v = 0n;
    for (var i = 0; i < 8; i++) v = (v << 8n) | BigInt(buf[p + i]);
    return v;
  }
  function decHead(buf, p) {
    if (p >= buf.length) throw new Error('CBOR：数据意外结束');
    var b = buf[p++], mt = b >> 5, ai = b & 0x1f, val = 0, indef = false;
    if (ai < 24) val = ai;
    else if (ai === 24) { if (p + 1 > buf.length) throw new Error('CBOR：数据意外结束'); val = buf[p]; p += 1; }
    else if (ai === 25) { if (p + 2 > buf.length) throw new Error('CBOR：数据意外结束'); val = (buf[p] << 8) | buf[p + 1]; p += 2; }
    else if (ai === 26) { if (p + 4 > buf.length) throw new Error('CBOR：数据意外结束'); val = ((buf[p] * 16777216) + (buf[p + 1] << 16) + (buf[p + 2] << 8) + buf[p + 3]) >>> 0; p += 4; }
    else if (ai === 27) { if (p + 8 > buf.length) throw new Error('CBOR：数据意外结束'); val = readU64(buf, p); p += 8; }
    else if (ai === 31) indef = true;
    else throw new Error('CBOR：附加信息 ' + ai + ' 为保留值，非规范编码');
    return { mt: mt, ai: ai, val: val, indef: indef, p: p };
  }
  function lenOf(h) {
    var n = typeof h.val === 'bigint' ? h.val : BigInt(h.val);
    if (n > 0xffffffn) throw new Error('CBOR：长度过大，拒绝解析');
    return Number(n);
  }
  function decode(buf, p, depth) {
    if (depth > 64) throw new Error('CBOR：嵌套层数超过 64，拒绝解析');
    var h = decHead(buf, p); p = h.p;
    if (h.mt === 0) return { v: { k: 'uint', v: BigInt(h.val) }, p: p };
    if (h.mt === 1) return { v: { k: 'nint', v: -1n - BigInt(h.val) }, p: p };
    if (h.mt === 2) {
      if (h.indef) {
        var cb = [], r;
        for (; ;) {
          if (p >= buf.length) throw new Error('CBOR：不定长字节串缺少结束符');
          if (buf[p] === 0xff) { p++; break; }
          r = decode(buf, p, depth + 1); p = r.p;
          if (r.v.k !== 'bytes' || r.v.indef) throw new Error('CBOR：不定长字节串的分块必须是定长字节串');
          cb.push(r.v.v);
        }
        return { v: { k: 'bytes', indef: true, chunks: cb }, p: p };
      }
      var n = lenOf(h);
      if (p + n > buf.length) throw new Error('CBOR：字节串长度超出数据');
      var bs = buf.slice(p, p + n); p += n;
      return { v: { k: 'bytes', v: bs }, p: p };
    }
    if (h.mt === 3) {
      if (h.indef) {
        var ct = [], r2;
        for (; ;) {
          if (p >= buf.length) throw new Error('CBOR：不定长文本串缺少结束符');
          if (buf[p] === 0xff) { p++; break; }
          r2 = decode(buf, p, depth + 1); p = r2.p;
          if (r2.v.k !== 'text' || r2.v.indef) throw new Error('CBOR：不定长文本串的分块必须是定长文本串');
          ct.push(r2.v.v);
        }
        return { v: { k: 'text', indef: true, chunks: ct }, p: p };
      }
      var m = lenOf(h);
      if (p + m > buf.length) throw new Error('CBOR：文本串长度超出数据');
      var ts = new TextDecoder('utf-8', { fatal: true }).decode(buf.slice(p, p + m)); p += m;
      return { v: { k: 'text', v: ts }, p: p };
    }
    if (h.mt === 4) {
      if (h.indef) {
        var ai = [], r3;
        for (; ;) {
          if (p >= buf.length) throw new Error('CBOR：不定长数组缺少结束符');
          if (buf[p] === 0xff) { p++; break; }
          r3 = decode(buf, p, depth + 1); p = r3.p; ai.push(r3.v);
        }
        return { v: { k: 'array', v: ai, indef: true }, p: p };
      }
      var c = lenOf(h), arr = [], r4;
      for (var i = 0; i < c; i++) { r4 = decode(buf, p, depth + 1); p = r4.p; arr.push(r4.v); }
      return { v: { k: 'array', v: arr, indef: false }, p: p };
    }
    if (h.mt === 5) {
      if (h.indef) {
        var mp = [], r5;
        for (; ;) {
          if (p >= buf.length) throw new Error('CBOR：不定长映射缺少结束符');
          if (buf[p] === 0xff) { p++; break; }
          r5 = decode(buf, p, depth + 1); p = r5.p;
          var r6 = decode(buf, p, depth + 1); p = r6.p;
          mp.push([r5.v, r6.v]);
        }
        return { v: { k: 'map', v: mp, indef: true }, p: p };
      }
      var c2 = lenOf(h), mp2 = [], r7, r8;
      for (var j = 0; j < c2; j++) {
        r7 = decode(buf, p, depth + 1); p = r7.p;
        r8 = decode(buf, p, depth + 1); p = r8.p;
        mp2.push([r7.v, r8.v]);
      }
      return { v: { k: 'map', v: mp2, indef: false }, p: p };
    }
    if (h.mt === 6) {
      if (h.indef) throw new Error('CBOR：标签不能是不定长');
      var r9 = decode(buf, p, depth + 1); p = r9.p;
      return { v: { k: 'tag', t: BigInt(h.val), v: r9.v }, p: p };
    }
    /* mt 7 */
    if (h.ai <= 23) return { v: { k: 'simple', n: h.ai }, p: p };
    if (h.ai === 24) return { v: { k: 'simple', n: Number(h.val) }, p: p };
    if (h.ai === 25) return { v: { k: 'float', v: halfToDouble(Number(h.val)) }, p: p };
    if (h.ai === 26) return { v: { k: 'float', v: bitsToDouble(Number(h.val), 4) }, p: p };
    if (h.ai === 27) return { v: { k: 'float', v: bitsToDouble(h.val, 8) }, p: p };
    if (h.ai === 31) throw new Error('CBOR：出现孤立的结束符 0xff');
    throw new Error('CBOR：无法解析的头部');
  }
  function decodeOne(buf) {
    var r = decode(buf, 0, 0);
    if (r.p !== buf.length) throw new Error('CBOR：数据末尾有 ' + (buf.length - r.p) + ' 个多余字节');
    return r.v;
  }

  /* ---------------- 编码 ---------------- */
  function headBytes(mt, n) {
    var N = BigInt(n), ai, ex = [];
    if (N < 0n) throw new Error('CBOR：长度/编号不能为负');
    if (N < 24n) ai = Number(N);
    else if (N < 0x100n) { ai = 24; ex = [Number(N)]; }
    else if (N < 0x10000n) { ai = 25; ex = [Number(N >> 8n), Number(N & 0xffn)]; }
    else if (N < 0x100000000n) { ai = 26; var x = Number(N); ex = [(x >>> 24) & 0xff, (x >>> 16) & 0xff, (x >>> 8) & 0xff, x & 0xff]; }
    else if (N < (1n << 64n)) { ai = 27; for (var i = 7; i >= 0; i--) ex.push(Number((N >> BigInt(8 * i)) & 0xffn)); }
    else throw new Error('CBOR：整数超出 64 位范围');
    return [(mt << 5) | ai].concat(ex);
  }
  var TE = new TextEncoder();
  function encFloat(v) {
    if (Number.isNaN(v)) return [0xf9, 0x7e, 0x00];
    if (v === Infinity) return [0xf9, 0x7c, 0x00];
    if (v === -Infinity) return [0xf9, 0xfc, 0x00];
    /* 负零的规范编码就是 f98000，不能因为 -0 === 0 就跳过半精度 */
    var h = doubleToHalf(v);
    if (halfToDouble(h) === v && Object.is(halfToDouble(h), v)) return [0xf9, (h >> 8) & 0xff, h & 0xff];
    if (Object.is(v, -0)) { var dz = new DataView(new ArrayBuffer(8)); dz.setFloat64(0, v); return [0xfb, dz.getUint8(0), dz.getUint8(1), dz.getUint8(2), dz.getUint8(3), dz.getUint8(4), dz.getUint8(5), dz.getUint8(6), dz.getUint8(7)]; }
    var f32 = new Float32Array([v])[0];
    if (f32 === v) { var d4 = new DataView(new ArrayBuffer(4)); d4.setFloat32(0, v); return [0xfa, d4.getUint8(0), d4.getUint8(1), d4.getUint8(2), d4.getUint8(3)]; }
    var d8 = new DataView(new ArrayBuffer(8)); d8.setFloat64(0, v);
    return [0xfb, d8.getUint8(0), d8.getUint8(1), d8.getUint8(2), d8.getUint8(3), d8.getUint8(4), d8.getUint8(5), d8.getUint8(6), d8.getUint8(7)];
  }
  /* 超过 64 位的整数：按 RFC 8949 §3.4.3 装进 bignum（标签 2 非负 / 标签 3 负） */
  function bignumEnc(tag, n) {
    var hex = n.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    var bytes = new Uint8Array(hex.length / 2);
    for (var i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return headBytes(6, tag).concat(headBytes(2, bytes.length), Array.prototype.slice.call(bytes));
  }
  function encNode(v) {
    var out = [], i;
    switch (v.k) {
      case 'uint': return v.v < (1n << 64n) ? headBytes(0, v.v) : bignumEnc(2n, v.v);
      case 'nint': {
        var nn = -1n - v.v;                   /* nint 的语义值 = -1 - nn */
        return nn < (1n << 64n) ? headBytes(1, nn) : bignumEnc(3n, nn);
      }
      case 'bytes':
        if (v.indef) {
          out.push(0x5f);
          for (i = 0; i < v.chunks.length; i++) out = out.concat(headBytes(2, v.chunks[i].length), Array.prototype.slice.call(v.chunks[i]));
          out.push(0xff); return out;
        }
        return headBytes(2, v.v.length).concat(Array.prototype.slice.call(v.v));
      case 'text':
        if (v.indef) {
          out.push(0x7f);
          for (i = 0; i < v.chunks.length; i++) { var cb = TE.encode(v.chunks[i]); out = out.concat(headBytes(3, cb.length), Array.prototype.slice.call(cb)); }
          out.push(0xff); return out;
        }
        var tb = TE.encode(v.v);
        return headBytes(3, tb.length).concat(Array.prototype.slice.call(tb));
      case 'array':
        if (v.indef) {
          out.push(0x9f);
          for (i = 0; i < v.v.length; i++) out = out.concat(encNode(v.v[i]));
          out.push(0xff); return out;
        }
        out = headBytes(4, v.v.length);
        for (i = 0; i < v.v.length; i++) out = out.concat(encNode(v.v[i]));
        return out;
      case 'map':
        if (v.indef) {
          out.push(0xbf);
          for (i = 0; i < v.v.length; i++) out = out.concat(encNode(v.v[i][0]), encNode(v.v[i][1]));
          out.push(0xff); return out;
        }
        out = headBytes(5, v.v.length);
        for (i = 0; i < v.v.length; i++) out = out.concat(encNode(v.v[i][0]), encNode(v.v[i][1]));
        return out;
      case 'tag': return headBytes(6, v.t).concat(encNode(v.v));
      case 'simple':
        if (v.n < 0 || v.n > 255) throw new Error('CBOR：simple 值必须在 0~255');
        return v.n < 24 ? [(7 << 5) | v.n] : [0xf8, v.n];
      case 'float': return encFloat(v.v);
      case 'undef': return [0xf7];
    }
    throw new Error('CBOR：无法编码的节点类型 ' + v.k);
  }

  /* ---------------- 诊断表示（RFC 8949 附录 G） ---------------- */
  function q(s) { return JSON.stringify(s); }
  function fmtFloat(v) {
    if (Number.isNaN(v)) return 'NaN';
    if (v === Infinity) return 'Infinity';
    if (v === -Infinity) return '-Infinity';
    if (v === 0 && Object.is(v, -0)) return '-0';
    var s = String(v);
    /* 关键：整数值的浮点必须写成 1.0 / 65504.0，否则回读时会被当成整数，
       编码结果从 fa47c35000 变成 1a000186a0 —— 与官方向量不符。 */
    if (/^[+-]?\d+$/.test(s)) return s + '.0';
    return s;
  }
  function diag(v) {
    var i;
    switch (v.k) {
      case 'uint': case 'nint': return v.v.toString();
      case 'bytes':
        if (v.indef) return '(_ ' + v.chunks.map(function (c) { return "h'" + bytesToHex(c) + "'"; }).join(', ') + ')';
        return "h'" + bytesToHex(v.v) + "'";
      case 'text':
        if (v.indef) return '(_ ' + v.chunks.map(q).join(', ') + ')';
        return q(v.v);
      case 'array':
        if (v.v.length === 0) return v.indef ? '[_ ]' : '[]';
        return (v.indef ? '[_ ' : '[') + v.v.map(diag).join(', ') + ']';
      case 'map':
        if (v.v.length === 0) return v.indef ? '{_ }' : '{}';
        return (v.indef ? '{_ ' : '{') + v.v.map(function (p) { return diag(p[0]) + ': ' + diag(p[1]); }).join(', ') + '}';
      case 'tag': {
        /* bignum（标签 2/3）按 RFC 附录 G 写成十进制数字，便于阅读且可无损回读 */
        if ((v.t === 2n || v.t === 3n) && v.v.k === 'bytes' && !v.v.indef) {
          var hex = '';
          for (i = 0; i < v.v.v.length; i++) hex += v.v.v[i].toString(16).padStart(2, '0');
          var bi = hex === '' ? 0n : BigInt('0x' + hex);
          return v.t === 2n ? bi.toString() : (-1n - bi).toString();
        }
        return v.t.toString() + '(' + diag(v.v) + ')';
      }
      case 'simple':
        if (v.n === 20) return 'false';
        if (v.n === 21) return 'true';
        if (v.n === 22) return 'null';
        if (v.n === 23) return 'undefined';
        return 'simple(' + v.n + ')';
      case 'float': return fmtFloat(v.v);
      case 'undef': return 'undefined';
    }
    throw new Error('CBOR：无法输出诊断表示的节点 ' + v.k);
  }

  /* 诊断表示 → 值树。同时能接受 JSON（键可加引号、数字写法一致） */
  function parseDiag(s) {
    var i = 0;
    function ws() { while (i < s.length && (s[i] === ' ' || s[i] === '\t' || s[i] === '\n' || s[i] === '\r')) i++; }
    function err(m) { throw new Error('CBOR 诊断表示第 ' + i + ' 字符处：' + m); }
    function pStr(quote) {
      i++; var out = '';
      while (i < s.length && s[i] !== quote) {
        var c = s[i];
        if (c === '\\') {
          i++; var e = s[i++];
          if (e === '"' || e === "'" || e === '\\' || e === '/') out += e;
          else if (e === 'b') out += '\b';
          else if (e === 'f') out += '\f';
          else if (e === 'n') out += '\n';
          else if (e === 'r') out += '\r';
          else if (e === 't') out += '\t';
          else if (e === 'u') { out += String.fromCharCode(parseInt(s.substr(i, 4), 16)); i += 4; }
          else err('未知转义 \\' + e);
        } else { out += c; i++; }
      }
      if (i >= s.length) err('字符串未闭合');
      i++; return out;
    }
    function pBytes() {
      i += 2; /* 跳过 h' */
      var hex = '';
      while (i < s.length && s[i] !== "'") {
        var c = s[i];
        if (/[0-9a-fA-F]/.test(c)) hex += c;
        else if (!/\s/.test(c)) err("h'...' 内含非十六进制字符 " + c);
        i++;
      }
      if (i >= s.length) err("h'...' 未闭合");
      i++;
      if (hex.length % 2) err("h'...' 十六进制字符数为奇数");
      return { k: 'bytes', v: hexToBytes(hex) };
    }
    function pArr() {
      i++; ws();
      var indef = false;
      if (s[i] === '_') { indef = true; i++; ws(); }
      if (s[i] === ']') { i++; return { k: 'array', v: [], indef: false }; }
      var items = [];
      for (; ;) {
        items.push(pVal()); ws();
        if (s[i] === ',') { i++; ws(); if (s[i] === ']') { i++; break; } continue; }
        if (s[i] === ']') { i++; break; }
        err('数组缺少 , 或 ]');
      }
      if (!indef) return { k: 'array', v: items, indef: false };
      var allB = items.length > 0 && items.every(function (x) { return x.k === 'bytes' && !x.indef; });
      if (allB) return { k: 'bytes', indef: true, chunks: items.map(function (x) { return x.v; }) };
      var allT = items.length > 0 && items.every(function (x) { return x.k === 'text' && !x.indef; });
      if (allT) return { k: 'text', indef: true, chunks: items.map(function (x) { return x.v; }) };
      return { k: 'array', v: items, indef: true };
    }
    function pMap() {
      i++; ws();
      var indef = false;
      if (s[i] === '_') { indef = true; i++; ws(); }
      if (s[i] === '}') { i++; return { k: 'map', v: [], indef: false }; }
      var pairs = [];
      for (; ;) {
        var k = pVal(); ws();
        if (s[i] !== ':') err('映射缺少 :');
        i++;
        var v = pVal(); ws();
        pairs.push([k, v]);
        if (s[i] === ',') { i++; ws(); if (s[i] === '}') { i++; break; } continue; }
        if (s[i] === '}') { i++; break; }
        err('映射缺少 , 或 }');
      }
      return { k: 'map', v: pairs, indef: indef };
    }
    function pVal() {
      ws();
      if (i >= s.length) err('意外结束');
      var c = s[i];
      if (c === '[') return pArr();
      if (c === '{') return pMap();
      if (c === '"') return { k: 'text', v: pStr('"') };
      if (c === "'") return { k: 'text', v: pStr("'") };
      if (c === 'h' && s[i + 1] === "'") return pBytes();
      var st = i;
      while (i < s.length && /[A-Za-z0-9_.+\-]/.test(s[i])) i++;
      if (i === st) err('无法识别的字符 ' + c);
      var tok = s.slice(st, i);
      ws();
      if (s[i] === '(') {                       /* 标签 或 simple(N) */
        i++;
        if (/^\d+$/.test(tok)) {
          var inner = pVal(); ws();
          if (s[i] !== ')') err('标签缺少 )');
          i++;
          return { k: 'tag', t: BigInt(tok), v: inner };
        }
        if (tok === 'simple') {
          var st2 = i; while (i < s.length && /[0-9]/.test(s[i])) i++;
          var num = s.slice(st2, i); ws();
          if (s[i] !== ')') err('simple(...) 缺少 )');
          i++;
          if (num === '') err('simple(...) 缺少数值');
          return { k: 'simple', n: parseInt(num, 10) };
        }
        err('未知的构造器 ' + tok);
      }
      if (tok === 'true') return { k: 'simple', n: 21 };
      if (tok === 'false') return { k: 'simple', n: 20 };
      if (tok === 'null') return { k: 'simple', n: 22 };
      if (tok === 'undefined') return { k: 'simple', n: 23 };
      if (tok === 'Infinity') return { k: 'float', v: Infinity };
      if (tok === '-Infinity') return { k: 'float', v: -Infinity };
      if (tok === 'NaN' || tok === '-NaN') return { k: 'float', v: NaN };
      if (tok === '-0') return { k: 'float', v: -0 };
      if (/^-?\d+$/.test(tok)) {
        var bi = BigInt(tok);
        return bi < 0n ? { k: 'nint', v: bi } : { k: 'uint', v: bi };
      }
      if (/^[+-]?(\d+\.\d*|\.\d+|\d+)([eE][+-]?\d+)?$/.test(tok)) {
        var f = Number(tok);
        if (!isFinite(f) && !Number.isNaN(f)) err('数值超出范围 ' + tok);
        return { k: 'float', v: f };
      }
      err('无法识别的记号 ' + tok);
    }
    var v = pVal();
    ws();
    if (i !== s.length) err('末尾有多余内容');
    return v;
  }

  /* ---------------- 对外：注册 ---------------- */
  var G = '编码';
  function toHex(buf) {
    var s = '';
    for (var i = 0; i < buf.length; i++) s += buf[i].toString(16).padStart(2, '0');
    return s;
  }

  var api = {
    decodeOne: decodeOne, diag: diag, parseDiag: parseDiag,
    encNode: encNode, toHex: toHex, halfToDouble: halfToDouble, doubleToHalf: doubleToHalf
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  /* 浏览器里没有 global（jsdom 环境会直接抛错），统一走 window */
  (typeof global !== 'undefined' ? global : window).CBOR = api;

  reg({
    id: 'cbor', name: 'CBOR（RFC 8949）', group: G, key: false, param: false,
    info: 'CBOR 是 RFC 8949 定义的结构化二进制编码（JSON 的二进制版）。加密方向：把输入的诊断表示（如 [1, {a: 2}, h\'0102\']）编码为 CBOR，输出十六进制；解密方向：解析十六进制 CBOR，输出诊断表示。',
    enc: function (b) {
      var s = bytesToStr(b);
      if (s === '') return '';
      return toHex(encNode(parseDiag(s)));
    },
    dec: function (s) {
      return strToBytes(diag(decodeOne(hexToBytes(String(s)))));
    }
  });
})();
