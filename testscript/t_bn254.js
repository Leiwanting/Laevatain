const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const V=JSON.parse(fs.readFileSync("_vec_bn254.json","utf8"));
const B=v=>BigInt(v);
let pass=0,fail=0;
// 1) 配对向量
for(const t of V.pair){
  const A=[B(t.a[0]),B(t.a[1])];
  const Q=[[B(t.b[0][0]),B(t.b[0][1])],[B(t.b[1][0]),B(t.b[1][1])]];
  let got;
  try{ got=bnPairing(Q,A); }catch(e){ fail++; if(fail<3){console.log("  ✗ "+t.desc+" 抛错 "+e.message); console.log("    A="+t.a); } continue; }
  const want=t.out.map(B);
  if(bn12eq(got,want)) pass++; else { fail++; if(fail<4)console.log("  ✗ "+t.desc+"\n    got[0] "+got[0].toString(16)+"\n    want[0] "+want[0].toString(16)); }
}
// 2) 双线性 e(aG1,bG2) == e(G1,G2)^(ab)
const base=bnPairing(BN_G2,BN_G1);
for(const t of V.pair){
  if(!t.pow_out) continue;
  const A=[B(t.a[0]),B(t.a[1])];
  const Q=[[B(t.b[0][0]),B(t.b[0][1])],[B(t.b[1][0]),B(t.b[1][1])]];
  const got=bnPairing(Q,A), want=t.pow_out.map(B);
  if(bn12eq(got,want)) pass++; else { fail++; console.log("  ✗ 双线性 "+t.desc); }
}
// 3) 标量乘
for(const t of V.mul){
  const k=B(t.k);
  const A=bnG1Mul(BN_G1,k);
  const ok1 = A && A[0]===B(t.g1[0]) && A[1]===B(t.g1[1]);
  const Bp=bnG2Mul(BN_G2,k);
  const ok2 = Bp && bn2eq(Bp[0],[B(t.g2[0][0]),B(t.g2[0][1])]) && bn2eq(Bp[1],[B(t.g2[1][0]),B(t.g2[1][1])]);
  if(ok1) pass++; else {fail++; console.log("  ✗ G1 标量乘");}
  if(ok2) pass++; else {fail++; console.log("  ✗ G2 标量乘");}
}
// 4) 双线性：e(a*G1, G2) == e(G1, a*G2)
for(const k of [2n, 7n, 12345n, BN_R-1n]){
  const A=bnG1Mul(BN_G1,k), Q=bnG2Mul(BN_G2,k);
  const l=bnPairing(BN_G2,A), r=bnPairing(Q,BN_G1);
  if(bn12eq(l,r)) pass++; else {fail++; console.log("  ✗ 双线性 k="+k);}
}
// 5) 单位元性质：e(G1, r*G2) 应为 1（r 为群阶）
const inf=bnG2Mul(BN_G2,BN_R);
if(inf===null) pass++; else {fail++; console.log("  ✗ r*G2 应为无穷远点");}
console.log("BN254: 通过 "+pass+" / 失败 "+fail);
