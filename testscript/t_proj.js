const fs=require("fs"),vm=require("vm");
global.crypto=require("crypto").webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});

/* ===== 扩展坐标 (X:Y:Z:T)，x=X/Z, y=Y/Z, T=XY/Z；a = -1 ===== */
const q=ED_P, D=ED_D;
const M=(a,b)=>(a*b)%q, A=(a,b)=>(a+b)%q, S=(a,b)=>((a-b)%q+q)%q;
const toProj=P=>P===null?[0n,1n,1n,0n]:[P[0],P[1],1n,M(P[0],P[1])];
const toAff=P=>[M(P[0],edqInv(P[2])),M(P[1],edqInv(P[2]))];

function pAdd(P,Q){ /* add-2008-hwcd, a=-1 */
  if(P[2]===0n) return Q;
  if(Q[2]===0n) return P;
  const X1=P[0],Y1=P[1],Z1=P[2],T1=P[3],X2=Q[0],Y2=Q[1],Z2=Q[2],T2=Q[3];
  const Aa=M(X1,X2), Bb=M(Y1,Y2), Cc=M(D,M(T1,T2)), Dd=M(Z1,Z2);
  const Ee=S(M(A(X1,Y1),A(X2,Y2)),A(Aa,Bb));
  const Ff=S(Dd,Cc), Gg=A(Dd,Cc);
  const Hh=A(Bb,Aa);            /* a=-1 → B + A */
  return [M(Ee,Ff), M(Gg,Hh), M(Ff,Gg), M(Ee,Hh)];
}
function pDbl(P){ /* dbl-2008-hwcd, a=-1 */
  const X1=P[0],Y1=P[1],Z1=P[2];
  const Aa=M(X1,X1), Bb=M(Y1,Y1), Cc=M(2n,M(Z1,Z1));
  const Dd=S(0n,Aa);                    /* a*A = -A */
  const Ee=S(M(A(X1,Y1),A(X1,Y1)),A(Aa,Bb));
  const Gg=A(Dd,Bb), Ff=S(Gg,Cc), Hh=S(Dd,Bb);
  return [M(Ee,Ff), M(Gg,Hh), M(Ff,Gg), M(Ee,Hh)];
}
function pMul(P,k){
  k=((k%ED_L)+ED_L)%ED_L;
  let R=[0n,1n,1n,0n], Qp=toProj(P);
  while(k>0n){ if(k&1n) R=pAdd(R,Qp); Qp=pDbl(Qp); k>>=1n; }
  return R;
}

let pass=0,fail=0;
const eq=(a,b)=>a[0]===b[0]&&a[1]===b[1];
/* 1) 基点标量乘 */
for(let i=0;i<60;i++){
  const k=BigInt('0x'+require('crypto').randomBytes(32).toString('hex'))%ED_L;
  const oldP=edMul(ED_B,k);
  const newP=toAff(pMul(ED_B,k));
  if(eq(oldP,newP))pass++;else{fail++;if(fail<=2)console.log('✗ base k='+k.toString(16).slice(0,16));}
}
/* 2) 一般点（含 2P, 3P ...） */
for(let i=1;i<=40;i++){
  const k=BigInt(i)*1234567891n;
  const oldP=edMul(ED_B,k), newP=toAff(pMul(ED_B,k));
  if(eq(oldP,newP))pass++;else{fail++;if(fail<=3)console.log('✗ gen i='+i);}
}
/* 3) 点加（两个不同点的加法 vs edAdd） */
for(let i=0;i<40;i++){
  const a=BigInt('0x'+require('crypto').randomBytes(16).toString('hex'));
  const b=BigInt('0x'+require('crypto').randomBytes(16).toString('hex'));
  const P=edMul(ED_B,a), Q=edMul(ED_B,b);
  const oldR=edAdd(P,Q);
  const newR=toAff(pAdd(toProj(P),toProj(Q)));
  if(eq(oldR,newR))pass++;else{fail++;if(fail<=3)console.log('✗ add i='+i);}
}
/* 4) 倍点 */
for(let i=0;i<20;i++){
  const a=BigInt('0x'+require('crypto').randomBytes(16).toString('hex'));
  const P=edMul(ED_B,a);
  if(eq(edAdd(P,P),toAff(pDbl(toProj(P)))))pass++;else{fail++;}
}
/* 5) 边界：k=0, 1, L-1 */
if(toAff(pMul(ED_B,0n))===null||true){
  const z=pMul(ED_B,0n); if(z[0]===0n&&z[1]===1n)pass++;else{fail++;console.log('✗ k=0 不是无穷远');}
}
if(eq(edMul(ED_B,1n),toAff(pMul(ED_B,1n))))pass++;else{fail++;console.log('✗ k=1');}
if(eq(edMul(ED_B,ED_L-1n),toAff(pMul(ED_B,ED_L-1n))))pass++;else{fail++;console.log('✗ k=L-1');}

console.log('扩展坐标 vs 原实现 等价性: 通过 '+pass+' / 失败 '+fail);

/* 速度 */
const ks=[];for(let i=0;i<50;i++)ks.push(BigInt('0x'+require('crypto').randomBytes(32).toString('hex'))%ED_L);
let t0=process.hrtime.bigint();
for(const k of ks) edMul(ED_B,k);
const told=Number(process.hrtime.bigint()-t0)/1e6;
for(const k of ks) toAff(pMul(ED_B,k));   /* 预热 */
t0=process.hrtime.bigint();
for(const k of ks) toAff(pMul(ED_B,k));
const tnew=Number(process.hrtime.bigint()-t0)/1e6;
console.log('标量乘 50 次: 原 '+told.toFixed(2)+' ms → 新 '+tnew.toFixed(2)+' ms  ('+(told/tnew).toFixed(1)+'×)');
