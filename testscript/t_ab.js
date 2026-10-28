const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
const best=(fn,reps)=>{let t=Infinity;for(let r=0;r<reps;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6; if(ms<t)t=ms;} return t;};

/* ---- Whirlpool：旧（三级函数+每轮分配） / 新（合成表） ---- */
function wpBlockSlow(K,M){var st=new Uint8Array(64),i;for(i=0;i<64;i++)st[i]=M[i]^K[i];
  var Kr=new Uint8Array(K);for(var r=1;r<=10;r++){Kr=wpKeyRound(Kr,r);wpRound(st,Kr);}return st;}
function wpDigSlow(m){var i;var padLen=((31-m.length)%64+64)%64;var total=m.length+1+padLen+32;
  var buf=new Uint8Array(total);buf.set(m,0);buf[m.length]=0x80;
  var bits=m.length*8,lo32=bits%4294967296,hi32=Math.floor(bits/4294967296);
  for(i=0;i<32;i++){var sh=8*(31-i);buf[total-32+i]=(sh>=32?(hi32>>>(sh-32)):(lo32>>>sh))&0xff;}
  var H=new Uint8Array(64);
  for(var off=0;off<total;off+=64){var blk=buf.subarray(off,off+64);var o=wpBlockSlow(H,blk);
    for(i=0;i<64;i++)H[i]=o[i]^H[i]^blk[i];}return H;}
const wOld=best(()=>wpDigSlow(data),5), wNew=best(()=>whirlpoolDigest(data),5);

/* ---- DES：旧（逐比特数组） / 新（SP 盒 + 32 位字） ---- */
function desSlowBlockFn(keyBytes){var sk=desSubkeys(keyBytes);var skRev=sk.slice().reverse();
  return {enc:b=>{var bits=permuteBits(bytesToBits(b),DES_IP);var L=bits.slice(0,32),R=bits.slice(32,64);
    for(var i=0;i<16;i++){var f=desFeistel(R,sk[i]);var nR=new Array(32);
      for(var j=0;j<32;j++)nR[j]=L[j]^f[j];L=R;R=nR;}
    return bitsToBytes(permuteBits(R.concat(L),DES_FP));},
   dec:b=>{var bits=permuteBits(bytesToBits(b),DES_IP);var L=bits.slice(0,32),R=bits.slice(32,64);
    for(var i=0;i<16;i++){var f=desFeistel(R,skRev[i]);var nR=new Array(32);
      for(var j=0;j<32;j++)nR[j]=L[j]^f[j];L=R;R=nR;}
    return bitsToBytes(permuteBits(R.concat(L),DES_FP));}};}
const k8=new Uint8Array(8);
function runECB(fn){for(let o=0;o<data.length;o+=8) fn.enc(data.subarray(o,o+8));}
const dOld=best(()=>runECB(desSlowBlockFn(k8)),3), dNew=best(()=>runECB(desMakeBlockFn(k8)),3);
/* 3DES */
const k24=new Uint8Array(24);
function des3Slow(k){const s1=desSubkeys(k.subarray(0,8)),s2=desSubkeys(k.subarray(8,16)),s3=desSubkeys(k.subarray(16,24));
  const s1r=s1.slice().reverse(),s2r=s2.slice().reverse(),s3r=s3.slice().reverse();
  return {enc:b=>desCryptBlockSlow(desCryptBlockSlow(desCryptBlockSlow(b,s3),s2r),s1)};}
function desCryptBlockSlow(block,sk){var bits=permuteBits(bytesToBits(block),DES_IP);var L=bits.slice(0,32),R=bits.slice(32,64);
  for(var i=0;i<16;i++){var f=desFeistel(R,sk[i]);var nR=new Array(32);for(var j=0;j<32;j++)nR[j]=L[j]^f[j];L=R;R=nR;}
  return bitsToBytes(permuteBits(R.concat(L),DES_FP));}
const tOld=best(()=>runECB(des3Slow(k24)),3), tNew=best(()=>runECB(des3MakeBlockFn(k24)),3);

const row=(n,o,w)=>console.log("  "+n.padEnd(14)+o.toFixed(1).padStart(7)+" ms  →"+w.toFixed(1).padStart(7)+" ms   "+(o/w).toFixed(1)+"×");
console.log("64KB 公平 A/B（同一预热方法，取最快）：");
row("Whirlpool", wOld, wNew);
row("DES",       dOld, dNew);
row("3DES",      tOld, tNew);
