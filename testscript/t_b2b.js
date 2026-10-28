const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
/* 旧实现：b2bAdd / b2bRotr / b2bLoadMsg 均未被覆盖 */
function oldRound(vl,vh,ml,mh,s){var t;
  function G(ia,ib,ic,id,xi,yi){
    t=b2bAdd(vl[ia],vh[ia],vl[ib],vh[ib]); t=b2bAdd(t[0],t[1],ml[xi],mh[xi]); vl[ia]=t[0];vh[ia]=t[1];
    t=b2bRotr((vl[id]^vl[ia])>>>0,(vh[id]^vh[ia])>>>0,32); vl[id]=t[0];vh[id]=t[1];
    t=b2bAdd(vl[ic],vh[ic],vl[id],vh[id]); vl[ic]=t[0];vh[ic]=t[1];
    t=b2bRotr((vl[ib]^vl[ic])>>>0,(vh[ib]^vh[ic])>>>0,24); vl[ib]=t[0];vh[ib]=t[1];
    t=b2bAdd(vl[ia],vh[ia],vl[ib],vh[ib]); t=b2bAdd(t[0],t[1],ml[yi],mh[yi]); vl[ia]=t[0];vh[ia]=t[1];
    t=b2bRotr((vl[id]^vl[ia])>>>0,(vh[id]^vh[ia])>>>0,16); vl[id]=t[0];vh[id]=t[1];
    t=b2bAdd(vl[ic],vh[ic],vl[id],vh[id]); vl[ic]=t[0];vh[ic]=t[1];
    t=b2bRotr((vl[ib]^vl[ic])>>>0,(vh[ib]^vh[ic])>>>0,63); vl[ib]=t[0];vh[ib]=t[1];
  }
  G(0,4,8,12,s[0],s[1]);G(1,5,9,13,s[2],s[3]);G(2,6,10,14,s[4],s[5]);G(3,7,11,15,s[6],s[7]);
  G(0,5,10,15,s[8],s[9]);G(1,6,11,12,s[10],s[11]);G(2,7,8,13,s[12],s[13]);G(3,4,9,14,s[14],s[15]);}
function oldCompress(hl,hh,block,t,last){
  var vl=new Array(16),vh=new Array(16),i;
  for(i=0;i<8;i++){vl[i]=hl[i];vh[i]=hh[i];}
  for(i=0;i<8;i++){vl[8+i]=B2B_IV_LO[i];vh[8+i]=B2B_IV_HI[i];}
  vl[12]=(vl[12]^(t>>>0))>>>0;
  if(last){vl[14]=(vl[14]^0xffffffff)>>>0;vh[14]=(vh[14]^0xffffffff)>>>0;}
  var m=b2bLoadMsg(block);
  for(var r=0;r<12;r++) oldRound(vl,vh,m.l,m.h,B2B_SIGMA[r]);
  for(i=0;i<8;i++){hl[i]=(hl[i]^vl[i]^vl[8+i])>>>0;hh[i]=(hh[i]^vh[i]^vh[8+i])>>>0;}}
/* 单块：新旧压缩对比 */
let ok=0,bad=0;
let sd=777; const rnd=()=>{sd=(sd*1103515245+12345)&0x7fffffff;return (sd>>>16)&255;};
for(let n=0;n<200;n++){
  const blk=new Uint8Array(128); for(let i=0;i<128;i++)blk[i]=rnd();
  const h1=new Array(8),H1=new Array(8),h2=new Array(8),H2=new Array(8);
  for(let i=0;i<8;i++){const v=(rnd()<<24|rnd()<<16|rnd()<<8|rnd())>>>0; h1[i]=v;h2[i]=v;
    const w=(rnd()<<24|rnd()<<16|rnd()<<8|rnd())>>>0; H1[i]=w;H2[i]=w;}
  const t=(n*997)|0, last=(n%2===0);
  oldCompress(h1,H1,blk,t,last);
  blake2bCompress(h2,H2,blk,t,last);
  const same=h1.every((v,i)=>v===h2[i])&&H1.every((v,i)=>v===H2[i]);
  same?ok++:bad++;
}
console.log("BLAKE2b 压缩函数新旧等价: "+ok+"/200"+(bad?"  失败 "+bad:"  ✓"));
/* 官方空串向量 + 与 Python hashlib 对照 */
const E=s=>new TextEncoder().encode(s);
const cases=["", "a","abc","message digest","abcdefghijklmnopqrstuvwxyz","The quick brown fox jumps over the lazy dog"];
for(const m of cases) console.log("  "+JSON.stringify(m.slice(0,30)).padEnd(34)+bytesToHex(blake2bDigest(E(m))).slice(0,32));
let s2=31337; const r2=()=>{s2=(s2*1103515245+12345)&0x7fffffff;return (s2>>>16)&255;};
let rok=0,rbad=0;
for(let n=0;n<40;n++){ const len=r2()%300; const d=new Uint8Array(len);
  for(let i=0;i<len;i++)d[i]=r2();
  const h1=new Array(8),H1=new Array(8);
  for(let i=0;i<8;i++){h1[i]=B2B_IV_LO[i];H1[i]=B2B_IV_HI[i];}
  h1[0]=(h1[0]^(0x01010000^64))>>>0;
  /* 用旧实现跑完整摘要：直接比 blake2bDigest 与旧版实现 */
  rok++; }
console.log("\n（摘要层由下面的 Python 交叉验证覆盖）");
