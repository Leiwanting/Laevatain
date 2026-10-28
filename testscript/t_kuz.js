const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
/* 旧慢速版（kuzR / kuzRReverse / kuzS / kuzSInv / kuzXor 均未被覆盖） */
function kuzLSlow(d){var r=new Uint8Array(d);for(var i=0;i<16;i++)r=kuzR(r);return r;}
function kuzLInvSlow(d){var r=new Uint8Array(d);for(var i=0;i<16;i++)r=kuzRReverse(r);return r;}
function kuzKeySlow(keyBytes){var C=[];for(var i=1;i<=32;i++){var v=new Uint8Array(16);v[15]=i;C.push(kuzLSlow(v));}
  var k1=new Uint8Array(keyBytes.subarray(0,16)),k2=new Uint8Array(keyBytes.subarray(16,32));
  var iter=[new Uint8Array(k1),new Uint8Array(k2)];
  for(var i=0;i<4;i++){for(var j=0;j<8;j++){var t=kuzLSlow(kuzS(kuzXor(k1,C[i*8+j])));var nk1=kuzXor(t,k2);
    k2=new Uint8Array(k1);k1=nk1;}iter.push(new Uint8Array(k1));iter.push(new Uint8Array(k2));}
  return iter;}
function kuzSlowFn(keyBytes){var K=kuzKeySlow(keyBytes);
  return {enc:b=>{var s=new Uint8Array(b);for(var i=0;i<9;i++)s=kuzLSlow(kuzS(kuzXor(K[i],s)));return kuzXor(K[9],s);},
          dec:b=>{var s=kuzXor(K[9],new Uint8Array(b));for(var i=8;i>=0;i--)s=kuzXor(K[i],kuzSInv(kuzLInvSlow(s)));return s;}};}
let ok=0,bad=0;
let s=4242; const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return (s>>>16)&255;};
for(let n=0;n<50;n++){
  const k=new Uint8Array(32),p=new Uint8Array(16);
  for(let i=0;i<32;i++)k[i]=rnd(); for(let i=0;i<16;i++)p[i]=rnd();
  const a=kuzMakeBlockFn(k);
  const b=kuzSlowFn(k);
  if(bytesToHex(a.enc(p))===bytesToHex(b.enc(p)) && bytesToHex(a.dec(new Uint8Array(a.enc(p))))===bytesToHex(p)) ok++;
  else {bad++; if(bad===1)console.log("  首例不一致 k="+bytesToHex(k)+"\n   新 "+bytesToHex(a.enc(p))+"\n   旧 "+bytesToHex(b.enc(p)));}
}
console.log("Kuznyechik 新旧等价: "+ok+"/50 一致  "+(bad?"失败 "+bad:""));
/* 官方 GOST R 34.12-2015 向量 */
const V=[{k:"8899aabbccddeeff0011223344556677fedcba98765432100123456789abcdef",
          p:"1122334455667700ffeeddccbbaa9988", c:"7f679d90bebc24305a468d42b9d4edcd"}];
for(const v of V){ const f=kuzMakeBlockFn(H(v.k)); const g=bytesToHex(f.enc(H(v.p)));
  console.log((g===v.c?"  ✓ ":"  ✗ ")+"官方向量 -> "+g+(g===v.c?"":"  期望 "+v.c)); }
