const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
vm.runInThisContext(fs.readFileSync("crypto_bulletproof.js","utf8"));
vm.runInThisContext(fs.readFileSync("_bpvec.js","utf8"));
const neg = P => P===null?null:[edqSub(0n,P[0]),P[1]];
const add = (P,Q)=>{ if(P===null)return Q; if(Q===null)return P; return edAdd(P,Q); };
for (const key of ["8_1"]) {
  const [n,m]=key.split("_").map(Number);
  const raw=hexToBytes(BP_VECTORS.proofs[key]);
  const vcs=BP_VECTORS.vc.slice(0,m).map(hexToBytes);
  const R0=bpVerifyRangeProofPoint(raw,vcs,n,0n);
  const R1=bpVerifyRangeProofPoint(raw,vcs,n,1n);
  const R2=bpVerifyRangeProofPoint(raw,vcs,n,2n);
  // 线性性：M(2) - 2M(1) + M(0) 应为 identity
  const t1=add(R2, neg(R1));
  const t2=add(neg(R1), R0);
  const lin=add(t1,t2);
  console.log("R0 identity:", bpIsIdentity(R0));
  console.log("R1 identity:", bpIsIdentity(R1));
  console.log("线性性 M(2)-2M(1)+M(0) 为恒等:", bpIsIdentity(lin));
  // 各部分点解码检查
  const pr=bpRangeProofFromBytes(raw);
  console.log("A/S/T1/T2 解码:", [pr.A,pr.S,pr.T1,pr.T2].every(p=>p!==null));
  console.log("L 数:", pr.L.length, " R 数:", pr.R.length, " 空:", pr.L.some(p=>p===null)||pr.R.some(p=>p===null));
  console.log("V 解码:", vcs.every(v=>bpPointFromBytes(v)!==null));
  // 生成器检查：G[0][0] 与 H[0][0] 是否不同且在曲线上
  if(!BP_GENS) BP_GENS=bpBpGens(64,8);
  const G00=BP_GENS.G[0][0], H00=BP_GENS.H[0][0];
  const onCurve = P => { const x=P[0],y=P[1]; return edqSub(edqAdd(edqMul(x,x),edqMul(y,y)), edqAdd(1n, edqMul(ED_D, edqMul(edqMul(x,x),edqMul(y,y)))))===0n; };
  console.log("G[0][0] 在曲线上:", onCurve(G00), " H[0][0] 在曲线上:", onCurve(H00));
  const pg=bpPedersenGens();
  console.log("B 在曲线上:", onCurve(pg.B), " B_blind 在曲线上:", onCurve(pg.BBlind));
}
// twisted Edwards: -x^2 + y^2 = 1 + d*x^2*y^2
const onTE = P => { const x=P[0],y=P[1];
  return edqSub(edqSub(edqMul(y,y),edqMul(x,x)), edqAdd(1n, edqMul(ED_D, edqMul(edqMul(x,x),edqMul(y,y)))))===0n; };
const P_=2n**255n-19n;
const stdD = (P_ - 121665n) * (function(a,e,m){let r=1n,b=a%m;while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return r;})(121666n, P_-2n, P_) % P_;
console.log("=== 正确方程复检 ===");
console.log("ED_D == 标准 -121665/121666 :", ED_D===stdD, " ED_D =", ED_D.toString().slice(0,12));
console.log("B 在 twisted Edwards 上:", onTE(pg.B));
console.log("B_blind 在曲线上:", onTE(pg.BBlind));
console.log("G[0][0] 在曲线上:", onTE(G00), " H[0][0] 在曲线上:", onTE(H00));
console.log("A 在曲线上:", onTE(pr.A), " V[0] 在曲线上:", onTE(bpPointFromBytes(vcs[0])));
console.log("L[0] 在曲线上:", onTE(pr.L[0]), " R[0] 在曲线上:", onTE(pr.R[0]));
// P 与 Q 分离
const Q = add(R1, neg(R0));
console.log("P (=M(0)) 为恒等:", bpIsIdentity(R0));
console.log("Q (=M(1)-M(0)) 为恒等:", bpIsIdentity(Q));
