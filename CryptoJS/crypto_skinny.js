/* SKINNY 可调分组密码族 —— 常量与轮函数逐条转写自 hadipourh/skinny 官方参考 C++ 实现
 * 注意：本文件所有常量均由脚本从参考源码提取，未人工抄写。*/
(function(){
  var S128=[101,76,106,66,75,99,67,107,85,117,90,122,83,115,91,123,53,140,58,129,137,51,128,59,149,37,152,42,144,35,153,43,229,204,232,193,201,224,192,233,213,245,216,248,208,240,217,249,165,28,168,18,27,160,19,169,5,181,10,184,3,176,11,185,50,136,60,133,141,52,132,61,145,34,156,44,148,36,157,45,98,74,108,69,77,100,68,109,82,114,92,124,84,116,93,125,161,26,172,21,29,164,20,173,2,177,12,188,4,180,13,189,225,200,236,197,205,228,196,237,209,241,220,252,212,244,221,253,54,142,56,130,139,48,131,57,150,38,154,40,147,32,155,41,102,78,104,65,73,96,64,105,86,118,88,120,80,112,89,121,166,30,170,17,25,163,16,171,6,182,8,186,0,179,9,187,230,206,234,194,203,227,195,235,214,246,218,250,211,243,219,251,49,138,62,134,143,55,135,63,146,33,158,46,151,39,159,47,97,72,110,70,79,103,71,111,81,113,94,126,87,119,95,127,162,24,174,22,31,167,23,175,1,178,14,190,7,183,15,191,226,202,238,198,207,231,199,239,210,242,222,254,215,247,223,255];
  var Si128=[172,232,104,60,108,56,168,236,170,174,58,62,106,110,234,238,166,163,51,54,102,99,227,230,225,164,97,52,49,100,161,228,141,201,73,29,77,25,137,205,139,143,27,31,75,79,203,207,133,192,64,21,69,16,128,197,130,135,18,23,66,71,194,199,150,147,3,6,86,83,211,214,209,148,81,4,1,84,145,212,156,216,88,12,92,8,152,220,154,158,10,14,90,94,218,222,149,208,80,5,85,0,144,213,146,151,2,7,82,87,210,215,157,217,89,13,93,9,153,221,155,159,11,15,91,95,219,223,22,19,131,134,70,67,195,198,65,20,193,132,17,68,129,196,28,72,200,140,76,24,136,204,26,30,138,142,74,78,202,206,53,96,224,165,101,48,160,229,50,55,162,167,98,103,226,231,61,105,233,173,109,57,169,237,59,63,171,175,107,111,235,239,38,35,179,182,118,115,243,246,113,36,241,180,33,116,177,244,44,120,248,188,124,40,184,252,42,46,186,190,122,126,250,254,37,112,240,181,117,32,176,245,34,39,178,183,114,119,242,247,45,121,249,189,125,41,185,253,43,47,187,191,123,127,251,255];
  var P128=[0,1,2,3,7,4,5,6,10,11,8,9,13,14,15,12];
  var Pi128=[0,1,2,3,5,6,7,4,10,11,8,9,15,12,13,14];
  var Q128=[9,15,8,13,10,14,12,11,0,1,2,3,4,5,6,7];
  var RC128=[1,3,7,15,31,62,61,59,55,47,30,60,57,51,39,14,29,58,53,43,22,44,24,48,33,2,5,11,23,46,28,56,49,35,6,13,27,54,45,26,52,41,18,36,8,17,34,4,9,19,38,12,25,50,37,10,21,42,20,40,16,32];
  var S64=[12,6,9,0,1,10,2,11,3,8,5,13,4,14,7,15];
  var Si64=[3,4,6,8,12,10,1,14,9,2,5,7,0,11,13,15];
  var P64=[0,1,2,3,7,4,5,6,10,11,8,9,13,14,15,12];
  var Pi64=[0,1,2,3,5,6,7,4,10,11,8,9,15,12,13,14];
  var Q64=[9,15,8,13,10,14,12,11,0,1,2,3,4,5,6,7];
  var RC64=[1,3,7,15,31,62,61,59,55,47,30,60,57,51,39,14,29,58,53,43,22,44,24,48,33,2,5,11,23,46,28,56,49,35,6,13];

  function lfsr8(x){ x = ((x<<1)&0xFE) ^ (((x>>7)&1)^((x>>5)&1)); return x & 0xff; }
  function lfsr4(x){ x = (x<<1) ^ ((x>>3)&1) ^ ((x>>2)&1); return x & 0xf; }
  function tkSched(tk1,tk2,rounds,lfsr,Q){
    var rtk=[],a=tk1.slice(),b=tk2.slice(),r,i;
    for(r=0;r<rounds;r++){
      var cur=new Uint8Array(8);
      for(i=0;i<8;i++) cur[i]=(a[i]^b[i])&0xff;
      rtk.push(cur);
      var na=new Uint8Array(16),nb=new Uint8Array(16);
      for(i=0;i<16;i++){ na[i]=a[Q[i]]; nb[i]=b[Q[i]]; }
      for(i=0;i<8;i++) nb[i]=lfsr(nb[i]);
      a=na; b=nb;
    }
    return rtk;
  }
  function mixColumns(s){ var tmp,j;
    for(j=0;j<4;j++){
      s[j+4]^=s[j+8]; s[j+8]^=s[j]; s[j+12]^=s[j+8];
      tmp=s[j+12]; s[j+12]=s[j+8]; s[j+8]=s[j+4]; s[j+4]=s[j]; s[j]=tmp;
    }
  }
  function invMixColumns(s){ var tmp,j;
    for(j=0;j<4;j++){
      tmp=s[j+12]; s[j+12]=s[j]; s[j]=s[j+4]; s[j+4]=s[j+8]; s[j+8]=tmp;
      s[j+12]^=s[j+8]; s[j+8]^=s[j]; s[j+4]^=s[j+8];
    }
  }
  function enc(st,rtk,rounds,S,RC,P,c2){
    var r,i,t;
    for(r=0;r<rounds;r++){
      for(i=0;i<16;i++) st[i]=S[st[i]];
      st[0]^=(RC[r]&0xf); st[4]^=((RC[r]>>4)&0x3);
      if(c2) st[8]^=0x2;
      for(i=0;i<8;i++) st[i]^=rtk[r][i];
      t=st.slice(); for(i=0;i<16;i++) st[i]=t[P[i]];
      mixColumns(st);
    }
  }
  function dec(st,rtk,rounds,Si,RC,Pi,c2){
    var r,i,t;
    for(r=rounds-1;r>=0;r--){
      invMixColumns(st);
      t=st.slice(); for(i=0;i<16;i++) st[i]=t[Pi[i]];
      for(i=0;i<8;i++) st[i]^=rtk[r][i];
      st[0]^=(RC[r]&0xf); st[4]^=((RC[r]>>4)&0x3);
      if(c2) st[8]^=0x2;
      for(i=0;i<16;i++) st[i]=Si[st[i]];
    }
  }
  function b2n(b){ var s=new Uint8Array(16),i; for(i=0;i<16;i++){ var by=b[i>>1]; s[i]=(i&1)?(by&0xf):((by>>4)&0xf); } return s; }
  function n2b(s){ var b=new Uint8Array(8),i; for(i=0;i<8;i++) b[i]=((s[2*i]&0xf)<<4)|(s[2*i+1]&0xf); return b; }
  function keyNib(kb){ var k=new Uint8Array(32),i; for(i=0;i<32;i++){ var by=kb[i>>1]; k[i]=(i&1)?(by&0xf):((by>>4)&0xf); } return k; }
  function enc128_256(keyBytes,blk){
    var a=new Uint8Array(16),b=new Uint8Array(16),st=new Uint8Array(16),i;
    for(i=0;i<16;i++){ a[i]=keyBytes[i]&0xff; b[i]=keyBytes[16+i]&0xff; st[i]=blk[i]&0xff; }
    var rtk=tkSched(a,b,48,lfsr8,Q128);
    enc(st,rtk,48,S128,RC128,P128,true); return st;
  }
  function dec128_256(keyBytes,blk){
    var a=new Uint8Array(16),b=new Uint8Array(16),st=new Uint8Array(16),i;
    for(i=0;i<16;i++){ a[i]=keyBytes[i]&0xff; b[i]=keyBytes[16+i]&0xff; st[i]=blk[i]&0xff; }
    var rtk=tkSched(a,b,48,lfsr8,Q128);
    dec(st,rtk,48,Si128,RC128,Pi128,true); return st;
  }
  function enc64_128(keyBytes,blk){
    var k=keyNib(keyBytes), rtk=tkSched(k.slice(0,16),k.slice(16,32),36,lfsr4,Q64);
    var st=b2n(blk); enc(st,rtk,36,S64,RC64,P64,true); return n2b(st);
  }
  function dec64_128(keyBytes,blk){
    var k=keyNib(keyBytes), rtk=tkSched(k.slice(0,16),k.slice(16,32),36,lfsr4,Q64);
    var st=b2n(blk); dec(st,rtk,36,Si64,RC64,Pi64,true); return n2b(st);
  }
  function mk(e,d){ return function(key){ return { enc:function(p){return e(key,p);}, dec:function(c){return d(key,c);} }; }; }
  var items=[];
  items.push({ id:'skinny128-256', name:'SKINNY-128-256（轻量可调分组密码）', group:'对称加密',
    blockSize:16, keyLen:32, makeBlockFn:mk(enc128_256,dec128_256),
    info:'SKINNY 是 CHES/CRYPTO 2016 提出的轻量可调分组密码（Beierle 等），块 128 位、tweakey 256 位（32 字节，内部视为 TK1||TK2）、48 轮，是 Romulus AEAD（NIST LWC 最终轮）的底层。轮序：SubCells(8位S盒) → AddConstants → AddRoundTweakey(仅前两行) → ShiftRows(P) → MixColumns。已过参考实现 README 与 SKINNY-AEAD 论文附录 B 两组独立官方向量，并与编译后的官方 C++ 参考实现做随机差分比对。密钥栏须填 32 字节 Hex。' });
  items.push({ id:'skinny64-128', name:'SKINNY-64-128（轻量可调分组密码）', group:'对称加密',
    blockSize:8, keyLen:16, makeBlockFn:mk(enc64_128,dec64_128),
    info:'SKINNY 的 64 位块版本，tweakey 128 位（16 字节，内部 TK1||TK2）、36 轮，4 位 S 盒。与 128 位版差异：4 位 S 盒、4 位 LFSR。⚠ 两个版本**都**有 state[8]^=0x2 常量项（第一版误判 64 位版没有，导致 400 条差分全错，勿改回）（x<<1 ^ (x>>3&1) ^ (x>>2&1)）。已过参考实现 README 与源码内置两组独立向量，并与编译后的官方 C++ 参考实现做随机差分比对。密钥栏须填 16 字节 Hex。' });
  for(var i=0;i<items.length;i++){ var it=items[i];
    if(typeof regSym==='function'){ regSym(it); } else if(typeof reg==='function'){ it.key=true; it.isSym=true; reg(it); } }
})();
