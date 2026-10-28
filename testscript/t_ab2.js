const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
const best=(fn,n)=>{let t=Infinity;for(let r=0;r<n;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6;if(ms<t)t=ms;}return t;};
/* 旧慢速 GOST：逐字节数组 + 每轮分配 */
function gostTOld(d){var r=new Uint8Array(4),i;for(i=0;i<4;i++){var lo=d[i]&15,hi=(d[i]&240)>>4;
  lo=GOST_SBOX[(3-i)*2][lo];hi=GOST_SBOX[(3-i)*2+1][hi];r[i]=(hi<<4)|lo;}return r;}
function gostAddOld(a,b){var r=new Uint8Array(4),i,c=0;for(i=3;i>=0;i--){var s=a[i]+b[i]+c;r[i]=s&255;c=s>>8;}return r;}
function gostGOld(k,a){var s=gostTOld(gostAddOld(k,a));
  var v=((s[0]<<24)|(s[1]<<16)|(s[2]<<8)|s[3])>>>0; var r=(((v<<11)|(v>>>21))>>>0);
  return new Uint8Array([(r>>>24)&255,(r>>>16)&255,(r>>>8)&255,r&255]);}
function gostSchOld(key){var K=new Array(32),r,j,i,t;
  for(r=0;r<4;r++){var rev=(r===3);for(j=0;j<8;j++){t=new Uint8Array(4);
    for(i=0;i<4;i++)t[i]=rev?key[28-(j*4)+i]:key[(j*4)+i];K[r*8+j]=t;}}return K;}
function gostFnOld(key){var K=gostSchOld(key);
  function gPrev(k,a){var a1=a.subarray(0,4),a0=a.subarray(4,8);var g=gostGOld(k,a0),o=new Uint8Array(8),i;
    for(i=0;i<4;i++)g[i]^=a1[i];o.set(a0,0);o.set(g,4);return o;}
  function gFin(k,a){var a1=a.subarray(0,4),a0=a.subarray(4,8);var g=gostGOld(k,a0),o=new Uint8Array(8),i;
    for(i=0;i<4;i++)g[i]^=a1[i];o.set(g,0);o.set(a0,4);return o;}
  return {enc:b=>{var r=gPrev(K[0],b);for(var i=1;i<31;i++)r=gPrev(K[i],r);return gFin(K[31],r);},
          dec:b=>{var r=gPrev(K[31],b);for(var i=30;i>=1;i--)r=gPrev(K[i],r);return gFin(K[0],r);}};}
const G=id=>ALGOS.filter(a=>a.id===id)[0];
const k32=new Uint8Array(32);
function ecb(fn,bs){for(let o=0;o<data.length;o+=bs) fn.enc(data.subarray(o,o+bs));}
const gOld=best(()=>ecb(gostFnOld(k32),8),3), gNew=best(()=>ecb(gostBlockFn(k32),8),3);
const kz=new Uint8Array(32);
function kuzLSlow(d){var r=new Uint8Array(d);for(var i=0;i<16;i++)r=kuzR(r);return r;}
function kuzSlowFn(key){var C=[];for(var i=1;i<=32;i++){var v=new Uint8Array(16);v[15]=i;C.push(kuzLSlow(v));}
  var k1=new Uint8Array(key.subarray(0,16)),k2=new Uint8Array(key.subarray(16,32));var it=[new Uint8Array(k1),new Uint8Array(k2)];
  for(var i=0;i<4;i++){for(var j=0;j<8;j++){var t=kuzLSlow(kuzS(kuzXor(k1,C[i*8+j])));var nk1=kuzXor(t,k2);
    k2=new Uint8Array(k1);k1=nk1;}it.push(new Uint8Array(k1));it.push(new Uint8Array(k2));}
  var K=it; return {enc:b=>{var s=new Uint8Array(b);for(var i=0;i<9;i++)s=kuzLSlow(kuzS(kuzXor(K[i],s)));return kuzXor(K[9],s);}};}
const zOld=best(()=>ecb(kuzSlowFn(kz),16),3), zNew=best(()=>ecb(kuzMakeBlockFn(kz),16),3);
const row=(n,o,w)=>console.log("  "+n.padEnd(14)+o.toFixed(1).padStart(7)+" ms →"+w.toFixed(1).padStart(7)+" ms  "+(o/w).toFixed(1)+"×");
console.log("64KB 公平 A/B（同预热，取最快）：");
row("GOST 28147", gOld, gNew);
row("Kuznyechik", zOld, zNew);
