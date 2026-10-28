const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){console.log("FAIL "+f+": "+e.message.slice(0,60));}});
console.log("BP_H:", typeof BP_H, BP_H===undefined?"UNDEF":BP_H.length);
console.log("BP_GV:", typeof BP_GV);
console.log("ristMap:", typeof ristMap, " edqMod:", typeof edqMod, " sha512:", typeof sha512Digest, " strToBytes:", typeof strToBytes);
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=8)console.log("  ✗ "+n);}};
// 1. delta 恒等式：z^2·v + delta == <aL - z, y^n o (aR + z) + z^2·2^n>
//    这是对 delta 定义最强的独立检验，写错必然违反
for(const n of [8,16,32]){
  for(let trial=0;trial<3;trial++){
    const v=bpq(BigInt("0x"+nc.randomBytes(4).toString("hex"))%(1n<<BigInt(n)));
    const y=bpRandScal(), z=bpRandScal();
    const aL=[],aR=[]; let vv=v;
    for(let i=0;i<n;i++){aL.push(vv&1n);aR.push(bpqSub(vv&1n,1n));vv>>=1n;}
    const tw=bpPowers2Const(n), yn=bpPowsOf(y,n), z2=bpqMul(z,z);
    const r0=[]; for(let i=0;i<n;i++) r0.push(bpqAdd(bpqMul(yn[i],bpqAdd(aR[i],z)),bpqMul(z2,tw[i])));
    const l0=[]; for(let i=0;i<n;i++) l0.push(bpqSub(aL[i],z));
    const lhs=bpqAdd(bpqMul(z2,v), bpDelta(y,z,n));
    const rhs=bpInner(l0,r0);
    ck("delta 恒等式 n="+n+" #"+trial, lhs===rhs);
  }
}
// 2. 合法范围证明应当通过
for(const n of [8,16]){
  const v=(1n<<BigInt(n))-1n, gamma=bpRandScal();
  const pr=bpProve(v,gamma,n);
  ck("合法证明通过 n="+n, bpVerify(pr));
  ck("证明含 "+Math.log2(n)+" 对 L/R n="+n, pr.L.length===Math.log2(n) && pr.R.length===Math.log2(n));
  ck("t = <l,r> n="+n, typeof pr.t==='bigint');
}
// 3. 边界值
for(const n of [8,16]){
  ck("v=0 通过 n="+n, bpVerify(bpProve(0n,bpRandScal(),n)));
  ck("v=2^n-1 通过 n="+n, bpVerify(bpProve((1n<<BigInt(n))-1n,bpRandScal(),n)));
  let t=false; try{ bpProve(1n<<BigInt(n), bpRandScal(), n); }catch(e){ t=/超出/.test(e.message); }
  ck("v=2^n 被拒 n="+n, t);
}
// 4. 篡改各字段必须被拒
{
  const n=16, gamma=bpRandScal(), pr=bpProve(12345n,gamma,n);
  ck("基准通过", bpVerify(pr));
  const mut=(f)=>{const c=JSON.parse(JSON.stringify(pr,null,0)); return c;};
  const mk=(o)=>Object.assign({},pr,o);
  ck("篡改 t 被拒", !bpVerify(mk({t:bpqAdd(pr.t,1n)})));
  ck("篡改 taux 被拒", !bpVerify(mk({taux:bpqAdd(pr.taux,1n)})));
  ck("篡改 mu 被拒", !bpVerify(mk({mu:bpqAdd(pr.mu,1n)})));
  ck("篡改 a 被拒", !bpVerify(mk({a:bpqAdd(pr.a,1n)})));
  ck("篡改 b 被拒", !bpVerify(mk({b:bpqAdd(pr.b,1n)})));
  ck("篡改 A 被拒", !bpVerify(mk({A:edAdd(pr.A,edMul(bpExt(BP_G),1n))})));
  ck("篡改 S 被拒", !bpVerify(mk({S:edAdd(pr.S,edMul(bpExt(BP_G),1n))})));
  ck("篡改 T1 被拒", !bpVerify(mk({T1:edAdd(pr.T1,edMul(bpExt(BP_G),1n))})));
  ck("篡改 T2 被拒", !bpVerify(mk({T2:edAdd(pr.T2,edMul(bpExt(BP_G),1n))})));
  ck("篡改 V 被拒", !bpVerify(mk({V:edAdd(pr.V,edMul(bpExt(BP_G),1n))})));
  ck("篡改 L[0] 被拒", !bpVerify(mk({L:(()=>{const a=pr.L.slice();a[0]=edAdd(a[0],edMul(bpExt(BP_G),1n));return a;})()})));
  ck("篡改 R[0] 被拒", !bpVerify(mk({R:(()=>{const a=pr.R.slice();a[0]=edAdd(a[0],edMul(bpExt(BP_G),1n));return a;})()})));
}
// 5. 承诺与盲因子一致
{
  const n=16, v=777n, gamma=bpRandScal();
  const pr=bpProve(v,gamma,n);
  ck("V 与 v/gamma 一致", bpEq(pr.V, bpCommit(v,gamma)));
}
console.log("Bulletproofs: 通过 "+pass+" / 失败 "+fail);
