const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;
global.btoa=function(s){return Buffer.from(s,"binary").toString("base64");};
global.atob=function(s){return Buffer.from(s,"base64").toString("binary");};
const mk=function(id){return {id:id,value:"",_h:{},options:[],addEventListener:function(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent:function(e){(this._h[e]||[]).forEach(function(f){f.call(this,e);});},classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},setAttribute:function(){},appendChild:function(){},style:{},innerHTML:""};};
const store={};
global.document={getElementById:function(id){return store[id]||(store[id]=mk(id));},createElement:function(t){return mk(t);},addEventListener:function(){},readyState:"complete",body:{appendChild:function(){}}};
global.window=global;global.addEventListener=function(){};
global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(function(f){vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});});
const hx=b=>Buffer.from(b).toString("hex");
let p=0,f=0;
/* 1. magmaSubst 与参考实现等价（随机 + 边界） */
const xs=[0,1,0xFFFFFFFF,0x80000000,0x7FFFFFFF,0x12345678,0xDEADBEEF,0x0F0F0F0F,0xF0F0F0F0];
for(let i=0;i<5000;i++) xs.push((Math.random()*4294967296)>>>0);
for(const x of xs){ if(magmaSubst(x)===magmaSubstRef(x))p++; else {f++;console.log("✗ subst "+(x>>>0).toString(16));} }
console.log("magmaSubst 等价 "+p+"/"+(p+f));
/* 2. 块加解密与"参考版块函数"等价 */
function magmaEncRef(block,K){let a1=readU32BE(block,0),a0=readU32BE(block,4);
 for(let i=0;i<31;i++){const s=((a0+K[i])>>>0);const g=(a1^rotl32(magmaSubstRef(s),11))>>>0;a1=a0;a0=g;}
 a1=(a1^rotl32(magmaSubstRef((a0+K[31])>>>0),11))>>>0;
 const o=new Uint8Array(8);writeU32BE(a1,o,0);writeU32BE(a0,o,4);return o;}
function magmaDecRef(block,K){let a1=readU32BE(block,0),a0=readU32BE(block,4);
 for(let i=31;i>=1;i--){const s=((a0+K[i])>>>0);const g=(a1^rotl32(magmaSubstRef(s),11))>>>0;a1=a0;a0=g;}
 a1=(a1^rotl32(magmaSubstRef((a0+K[0])>>>0),11))>>>0;
 const o=new Uint8Array(8);writeU32BE(a1,o,0);writeU32BE(a0,o,4);return o;}
let q=0,g2=0;
for(let i=0;i<300;i++){
  const key=nc.randomBytes(32), pt=nc.randomBytes(8);
  const bf=magmaMakeBlockFn(new Uint8Array(key));
  const K=new Uint32Array(32);
  for(let j=0;j<8;j++)K[j]=readU32BE(key,j*4);
  for(let j=0;j<24;j++)K[j]=readU32BE(key,(j%8)*4);
  for(let j=0;j<8;j++)K[24+j]=readU32BE(key,(7-j)*4);
  const pb=new Uint8Array(pt);
  if(hx(bf.enc(pb))===hx(magmaEncRef(pb,K)))q++; else {g2++;console.log("✗ enc#"+i);}
  const ct=bf.enc(pb);
  if(hx(bf.dec(ct))===hx(magmaDecRef(ct,K)))q++; else {g2++;console.log("✗ dec#"+i);}
  if(hx(bf.dec(ct))!==hx(pt)){g2++;console.log("✗ roundtrip#"+i);}
}
console.log("块等价/往返 "+q+" 通过 / "+g2+" 失败");
