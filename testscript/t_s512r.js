const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const M64=0xFFFFFFFFFFFFFFFFn;
const q=(l,h)=>(BigInt(h)<<32n)|BigInt(l);
const refRound=(a,b,c,d,e,f,g,h,K,W)=>{
  const S1=((e>>14n)|(e<<50n))^((e>>18n)|(e<<46n))^((e>>41n)|(e<<23n));
  const S1m=S1&M64;
  const ch=(e&f)^((~e&M64)&g);
  const t1=(h+S1m+ch+K+W)&M64;
  const S0=((a>>28n)|(a<<36n))^((a>>34n)|(a<<30n))^((a>>39n)|(a<<25n));
  const S0m=S0&M64;
  const maj=(a&b)^(a&c)^(b&c);
  const t2=(S0m+maj)&M64;
  return [g,f,e,(d+t1)&M64,c,b,a,(t1+t2)&M64];
};
const block=new Uint8Array(128); for(let i=0;i<128;i++)block[i]=i;
sha512InitK();
const ivh=s512IvOf(IV_512);
const HL=new Uint32Array(ivh.lo),HH=new Uint32Array(ivh.hi);
sha512CompressHL(HL,HH,block);
/* 手动跑主循环第 0 轮，打印中间值 */
const WL=S512_WL,WH=S512_WH;
let a=q(HL[0],HH[0]),b=q(HL[1],HH[1]),c=q(HL[2],HH[2]),d=q(HL[3],HH[3]);
let e=q(HL[4],HH[4]),f=q(HL[5],HH[5]),g=q(HL[6],HH[6]),h=q(HL[7],HH[7]);
const K=(BigInt(S512_KH[0])<<32n)|BigInt(S512_KL[0]);
const W=(BigInt(WH[0])<<32n)|BigInt(WL[0]);
console.log("K[0] = "+K.toString(16).padStart(16,"0")+"  （应 428a2f98d728ae22）");
console.log("W[0] = "+W.toString(16).padStart(16,"0"));
/* 我的 hi/lo 计算 S1 */
const el=Number(e&0xffffffffn),eh=Number((e>>32n)&0xffffffffn);
s512Rotr(el,eh,14); const r1l=_rl,r1h=_rh;
s512Rotr(el,eh,18); const r2l=_rl,r2h=_rh;
s512Rotr(el,eh,41); const r3l=_rl,r3h=_rh;
const mineS1=q((r1l^r2l^r3l)>>>0,(r1h^r2h^r3h)>>>0);
/* 参考 S1 */
const refS1=(((e>>14n)|(e<<50n))^((e>>18n)|(e<<46n))^((e>>41n)|(e<<23n)))&M64;
console.log("S1: mine "+mineS1.toString(16).padStart(16,"0")+"  ref "+refS1.toString(16).padStart(16,"0")+"  "+(mineS1===refS1?"✓":"✗"));
/* S0 */
const al=Number(a&0xffffffffn),ah=Number((a>>32n)&0xffffffffn);
s512Rotr(al,ah,28); const u1l=_rl,u1h=_rh;
s512Rotr(al,ah,34); const u2l=_rl,u2h=_rh;
s512Rotr(al,ah,39); const u3l=_rl,u3h=_rh;
const mineS0=q((u1l^u2l^u3l)>>>0,(u1h^u2h^u3h)>>>0);
const refS0=(((a>>28n)|(a<<36n))^((a>>34n)|(a<<30n))^((a>>39n)|(a<<25n)))&M64;
console.log("S0: mine "+mineS0.toString(16).padStart(16,"0")+"  ref "+refS0.toString(16).padStart(16,"0")+"  "+(mineS0===refS0?"✓":"✗"));
