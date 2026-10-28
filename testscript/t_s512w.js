const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const M64=0xFFFFFFFFFFFFFFFFn;
function rotr(x,n){ n=BigInt(n); return ((x>>n)|(x<<(64n-n)))&M64; }
const block=new Uint8Array(128); for(let i=0;i<128;i++)block[i]=i;
/* 参考 W */
const wref=[];
for(let i=0;i<16;i++){ let v=0n; for(let j=0;j<8;j++) v=(v<<8n)|BigInt(block[i*8+j]); wref.push(v); }
for(let i=16;i<80;i++){
  const a=wref[i-15], b=wref[i-2];
  const s0=rotr(a,1)^rotr(a,8)^(a>>7n);
  const s1=rotr(b,19)^rotr(b,61)^(b>>6n);
  wref.push((wref[i-16]+s0+wref[i-7]+s1)&M64);
}
sha512InitK();
const ivh=s512IvOf(IV_512);
const HL=new Uint32Array(ivh.lo), HH=new Uint32Array(ivh.hi);
/* 手动跑一遍 W 扩展，用完全独立的公式 */
const WL=new Uint32Array(80),WH=new Uint32Array(80);
for(let i=0;i<16;i++){const o=i*8;
  WH[i]=((block[o]<<24)|(block[o+1]<<16)|(block[o+2]<<8)|block[o+3])>>>0;
  WL[i]=((block[o+4]<<24)|(block[o+5]<<16)|(block[o+6]<<8)|block[o+7])>>>0;}
for(let i=16;i<80;i++){
  const al=WL[i-15],ah=WH[i-15];
  s512Rotr(al,ah,1); const r1l=_rl,r1h=_rh;
  s512Rotr(al,ah,8); const r2l=_rl,r2h=_rh;
  s512Shr(al,ah,7);  const r3l=_rl,r3h=_rh;
  const s0l=(r1l^r2l^r3l)>>>0, s0h=(r1h^r2h^r3h)>>>0;
  const bl=WL[i-2],bh=WH[i-2];
  s512Rotr(bl,bh,19); const q1l=_rl,q1h=_rh;
  s512Rotr(bl,bh,61); const q2l=_rl,q2h=_rh;
  s512Shr(bl,bh,6);   const q3l=_rl,q3h=_rh;
  const s1l=(q1l^q2l^q3l)>>>0, s1h=(q1h^q2h^q3h)>>>0;
  let t=(WL[i-16]+s0l)>>>0; let th=(WH[i-16]+s0h+((t<s0l)?1:0))>>>0;
  let t2=(t+WL[i-7])>>>0;   th=(th+WH[i-7]+((t2<WL[i-7])?1:0))>>>0;
  let t3=(t2+s1l)>>>0;      th=(th+s1h+((t3<s1l)?1:0))>>>0;
  WL[i]=t3; WH[i]=th;
}
let bad=0;
for(let i=0;i<80;i++){
  const mine=(BigInt(WH[i])<<32n)|BigInt(WL[i]);
  if(mine!==wref[i]){ bad++; if(bad<=4)console.log("W["+i+"] ✗\n  mine "+mine.toString(16).padStart(16,"0")+"\n  ref  "+wref[i].toString(16).padStart(16,"0")); }
}
console.log("W 数组: "+(80-bad)+"/80 一致"+(bad?"  失败 "+bad:"  ✓"));
/* 单步：第一轮后的 a..h */
