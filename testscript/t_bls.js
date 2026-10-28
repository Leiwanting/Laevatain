const fs=require("fs"),vm=require("vm");
const ctx={console,crypto:require("crypto").webcrypto,BigInt,Math,Array,JSON};
vm.createContext(ctx);
["bls_const.js","pqc_bls.js"].forEach(f=>vm.runInContext(fs.readFileSync(f,"utf8"),ctx,{filename:f}));
const {blsPairing,g2Mul,g1Mul,g1Normalize,g2Normalize,BLS_G1,BLS_G2}=ctx;
const V=JSON.parse(fs.readFileSync("vec_bls.json","utf8"));
let pass=0,fail=0;
const g1=g1Normalize(BLS_G1), g2=g2Normalize(BLS_G2);
if(g1[0]===BigInt(V.G1[0])&&g1[1]===BigInt(V.G1[1]))pass++;else{fail++;console.log("  ✗ G1 生成元");}
if(g2[0][0]===BigInt(V.G2[0])&&g2[0][1]===BigInt(V.G2[1])&&g2[1][0]===BigInt(V.G2[2])&&g2[1][1]===BigInt(V.G2[3]))pass++;else{fail++;console.log("  ✗ G2 生成元");}
for(const v of V.pairs){
  const P=g1Mul(BLS_G1,BigInt(v.a)), Q=g2Mul(BLS_G2,BigInt(v.b));
  const e=blsPairing(Q,P), want=v.e.map(BigInt);
  let ok=e.length===12; for(let i=0;i<12;i++) if(e[i]!==want[i]) ok=false;
  if(ok)pass++;else{fail++;if(fail<=2)console.log(`  ✗ a=${v.a} b=${v.b}`);}
}
console.log("BLS12-381 配对 vs py_ecc: 通过 "+pass+" / 失败 "+fail);
// 双线性：e(aG1,bG2) == e(G1,G2)^(ab)
let bp=0,bf=0;
for(const v of V.pairs){
  const P=g1Mul(BLS_G1,BigInt(v.a)), Q=g2Mul(BLS_G2,BigInt(v.b));
  const e1=blsPairing(Q,P);
  const eG=blsPairing(BLS_G2,BLS_G1);
  const e2=ctx.f12pow(eG,BigInt(v.a)*BigInt(v.b));
  let ok=true; for(let i=0;i<12;i++) if(e1[i]!==e2[i]) ok=false;
  if(ok)bp++;else{bf++;console.log("  ✗ 双线性 a="+v.a);}
}
console.log("双线性 e(aG1,bG2)==e(G1,G2)^(ab): 通过 "+bp+" / 失败 "+bf);
