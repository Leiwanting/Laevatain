const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
// FF3-1: 7 字节 tweak
const K=H("EF4359D8D580AA4F7F036D6F04FC6A94");
const TW=H("D8E7920AFA330A");   // 7 字节
const PT="890121234567890000".split("").map(Number);
const WANT="477064185124354662";
// 通用 FF3 轮函数（接受任意 8 字节 tweak）
function ff3gen(key,tweak8,pt,radix,enc){
  const n=pt.length, u=Math.ceil(n/2), v=n-u;
  let A=pt.slice(0,u), B=pt.slice(u);
  const TL=tweak8.subarray(0,4), TR=tweak8.subarray(4,8);
  const aes=ff1AesEcbFn(ff3RevBytes(key));
  const r=BigInt(radix);
  for(let i=0;i<8;i++){
    const rd=enc?i:7-i;
    const m=(rd%2===0)?u:v;
    const W=(rd%2===0)?TR:TL;
    const src=enc?B:A;
    const P=new Uint8Array(16);
    for(let j=0;j<4;j++)P[j]=W[j]^(j===3?rd:0);
    const bb=ff1B(ff1NumRadix(ff3RevArr(src),radix),12);
    for(let j=0;j<12;j++)P[4+j]=bb[j];
    const S=ff3RevBytes(aes.enc(ff3RevBytes(P)));
    const y=ff1Num(S);
    const mod=r**BigInt(m);
    const base=enc?A:B;
    let c=enc?((ff1NumRadix(ff3RevArr(base),radix)+y)%mod):((ff1NumRadix(ff3RevArr(base),radix)-y)%mod);
    if(c<0n)c+=mod;
    const C=ff3RevArr(ff1StrRadix(m,c,radix));
    if(enc){A=B;B=C;} else {A=C;B=src;}
  }
  return A.concat(B).join("");
}
console.log("目标:",WANT);
let hits=[];
// 穷举 T_R 第4字节的构造：从 tweak 某字节取 &0xF0，或常量
const cands=[];
for(let bi=0;bi<7;bi++){
  cands.push(["T["+bi+"]&F0", TW[bi]&0xF0]);
  cands.push(["T["+bi+"]", TW[bi]]);
}
cands.push(["0x00",0]);
for(const [nm,b4] of cands){
  const t8=new Uint8Array(8);
  t8.set(TW.subarray(0,4),0);      // T_L = 前4字节
  t8[4]=TW[4]; t8[5]=TW[5]; t8[6]=TW[6]; t8[7]=b4;
  let got;
  try{ got=ff3gen(K,t8,PT,10,true); }catch(e){ continue; }
  if(got===WANT){ hits.push(nm); console.log("★命中 T_R 第4字节 = "+nm+" (0x"+b4.toString(16)+")"); }
}
if(!hits){
  console.log("未命中。样例输出:");
  const t8=new Uint8Array(8);
  t8.set(TW.subarray(0,4),0); t8[4]=TW[4];t8[5]=TW[5];t8[6]=TW[6];t8[7]=TW[3]&0xF0;
  console.log("  T[3]&F0 构造 ->", ff3gen(K,t8,PT,10,true));
}
