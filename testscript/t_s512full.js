const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const M64=0xFFFFFFFFFFFFFFFFn;
function q(l,h){return (BigInt(h)<<32n)|BigInt(l);}
function rotr(x,n){n=BigInt(n);return ((x>>n)|(x<<(64n-n)))&M64;}
const block=new Uint8Array(128); for(let i=0;i<128;i++)block[i]=i;
const H0=[0x6a09e667f3bcc908n,0xbb67ae8584caa73bn,0x3c6ef372fe94f82bn,0xa54ff53a5f1d36f1n,
0x510e527fade682d1n,0x9b05688c2b3e6c1fn,0x1f83d9abfb41bd6bn,0x5be0cd19137e2179n];
/* 参考：完整 compress */
const wref=[];
for(let i=0;i<16;i++){let v=0n;for(let j=0;j<8;j++)v=(v<<8n)|BigInt(block[i*8+j]);wref.push(v);}
for(let i=16;i<80;i++){const a=wref[i-15],b=wref[i-2];
  wref.push((wref[i-16]+(rotr(a,1)^rotr(a,8)^(a>>7n))+wref[i-7]+(rotr(b,19)^rotr(b,61)^(b>>6n)))&M64);}
let R=H0.slice();
const trace=[];
for(let i=0;i<80;i++){
  let [a,b,c,d,e,f,g,h]=R;
  const S1=rotr(e,14)^rotr(e,18)^rotr(e,41);
  const ch=(e&f)^((~e&M64)&g);
  const t1=(h+S1+ch+SHA512_K[i]+wref[i])&M64;
  const S0=rotr(a,28)^rotr(a,34)^rotr(a,39);
  const maj=(a&b)^(a&c)^(b&c);
  const t2=(S0+maj)&M64;
  R=[g,f,e,(d+t1)&M64,c,b,a,(t1+t2)&M64];
  if(i<2){ trace.push({i,t1,t2,a:R[7]});
    console.log("  REF[轮"+i+"] a="+R[7].toString(16).padStart(16,"0")+" b="+R[6].toString(16).padStart(16,"0")+" e="+R[4].toString(16).padStart(16,"0")+" h="+R[3].toString(16).padStart(16,"0")); }
}
/* 我的手动 hi/lo 复现 */
sha512InitK();
const WL=new Uint32Array(80),WH=new Uint32Array(80);
for(let i=0;i<16;i++){const o=i*8;
  WH[i]=((block[o]<<24)|(block[o+1]<<16)|(block[o+2]<<8)|block[o+3])>>>0;
  WL[i]=((block[o+4]<<24)|(block[o+5]<<16)|(block[o+6]<<8)|block[o+7])>>>0;}
for(let i=16;i<80;i++){
  const l15=WL[i-15],h15=WH[i-15];
  s512Rotr(l15,h15,1);const q1l=_rl,q1h=_rh; s512Rotr(l15,h15,8);const q2l=_rl,q2h=_rh; s512Shr(l15,h15,7);const q3l=_rl,q3h=_rh;
  const s0l=(q1l^q2l^q3l)>>>0,s0h=(q1h^q2h^q3h)>>>0;
  const l2=WL[i-2],h2=WH[i-2];
  s512Rotr(l2,h2,19);const p1l=_rl,p1h=_rh; s512Rotr(l2,h2,61);const p2l=_rl,p2h=_rh; s512Shr(l2,h2,6);const p3l=_rl,p3h=_rh;
  const s1l=(p1l^p2l^p3l)>>>0,s1h=(p1h^p2h^p3h)>>>0;
  let t=(WL[i-16]+s0l)>>>0;let th=(WH[i-16]+s0h+((t<s0l)?1:0))>>>0;
  let t2=(t+WL[i-7])>>>0; th=(th+WH[i-7]+((t2<WL[i-7])?1:0))>>>0;
  let t3=(t2+s1l)>>>0;    th=(th+s1h+((t3<s1l)?1:0))>>>0;
  WL[i]=t3;WH[i]=th;
}
const ivh=s512IvOf(IV_512);
let al=ivh.lo[0],ah=ivh.hi[0],bl=ivh.lo[1],bh=ivh.hi[1],cl=ivh.lo[2],cw=ivh.hi[2];
let dl=ivh.lo[3],dh=ivh.hi[3],el=ivh.lo[4],eh=ivh.hi[4],fl=ivh.lo[5],fh=ivh.hi[5];
let gl=ivh.lo[6],gh=ivh.hi[6],hlv=ivh.lo[7],hhv=ivh.hi[7];
for(let i=0;i<80;i++){
  s512Rotr(el,eh,14);const r1l=_rl,r1h=_rh; s512Rotr(el,eh,18);const r2l=_rl,r2h=_rh; s512Rotr(el,eh,41);const r3l=_rl,r3h=_rh;
  const S1l=(r1l^r2l^r3l)>>>0,S1h=(r1h^r2h^r3h)>>>0;
  const chxl=((el&fl)^(~el&gl))>>>0,chxh=((eh&fh)^(~eh&gh))>>>0;
  let t=(hlv+S1l)>>>0; let th=(hhv+S1h+((t<S1l)?1:0))>>>0;
  let t2=(t+chxl)>>>0;  th=(th+chxh+((t2<chxl)?1:0))>>>0;
  let t3=(t2+S512_KL[i])>>>0; th=(th+S512_KH[i]+((t3<S512_KL[i])?1:0))>>>0;
  let t4=(t3+WL[i])>>>0; const T1h=(th+WH[i]+((t4<WL[i])?1:0))>>>0; const T1l=t4;
  s512Rotr(al,ah,28);const u1l=_rl,u1h=_rh; s512Rotr(al,ah,34);const u2l=_rl,u2h=_rh; s512Rotr(al,ah,39);const u3l=_rl,u3h=_rh;
  const S0l=(u1l^u2l^u3l)>>>0,S0h=(u1h^u2h^u3h)>>>0;
  const majl=((al&bl)^(al&cl)^(bl&cl))>>>0, majh=((ah&bh)^(ah&cw)^(bh&cw))>>>0;
  const v1=(S0l+majl)>>>0; const T2l=v1,T2h=(S0h+majh+((v1<S0l)?1:0))>>>0;
  hhv=gh;gh=fh;fh=eh;
  const v2=(dl+T1l)>>>0; el=v2; eh=(dh+T1h+((v2<T1l)?1:0))>>>0;
  dh=cw;cw=bh;bh=ah;
  const v3=(T1l+T2l)>>>0; al=v3; ah=(T1h+T2h+((v3<T1l)?1:0))>>>0;
  if(i<2){
    console.log("  [轮"+i+"] a="+q(al,ah).toString(16).padStart(16,"0")+" b="+q(bl,bh).toString(16).padStart(16,"0")+" e="+q(el,eh).toString(16).padStart(16,"0")+" h="+q(hlv,hhv).toString(16).padStart(16,"0"));
    const mineT1=(BigInt(T1h)<<32n)|BigInt(T1l);
    const mineT2=(BigInt(T2h)<<32n)|BigInt(T2l);
    console.log("轮"+i+" T1: mine "+mineT1.toString(16).padStart(16,"0")+"  ref "+trace[i].t1.toString(16).padStart(16,"0")+"  "+(mineT1===trace[i].t1?"✓":"✗"));
    console.log("轮"+i+" T2: mine "+mineT2.toString(16).padStart(16,"0")+"  ref "+trace[i].t2.toString(16).padStart(16,"0")+"  "+(mineT2===trace[i].t2?"✓":"✗"));
  }
}
const mine=[q(al,ah),q(bl,bh),q(cl,cw),q(dl,dh),q(el,eh),q(fl,fh),q(gl,gh),q(hlv,hhv)];
/* 参考最终 H（未累加） —— 用 trace 的方式跑完后 R 就是 a..h，再累加 */
const Rf=R;
const finalRef=[0,1,2,3,4,5,6,7].map(i=>(H0[i]+Rf[i])&M64);
const finalMine=[0,1,2,3,4,5,6,7].map(i=>(H0[i]+mine[i])&M64);
for(let i=0;i<8;i++) console.log("H["+i+"] mine "+finalMine[i].toString(16).padStart(16,"0")+"  ref "+finalRef[i].toString(16).padStart(16,"0")+"  "+(finalMine[i]===finalRef[i]?"✓":"✗"));
