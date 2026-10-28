const fs=require("fs"),vm=require("vm"),nc=require("crypto");
function sha256Bytes(b){ return new Uint8Array(nc.createHash("sha256").update(Buffer.from(b)).digest()); }
const ctx={console,crypto:nc.webcrypto,BigInt,Math,Array,JSON,Uint8Array,Error,Buffer,sha256Bytes};
vm.createContext(ctx);
vm.runInContext("var concatBytes=function(a,b){var o=new Uint8Array(a.length+b.length);o.set(a,0);o.set(b,a.length);return o;};",ctx);
["bls_const.js","pqc_bls.js"].forEach(f=>vm.runInContext(fs.readFileSync(f,"utf8"),ctx,{filename:f}));
const {blsInitSwu,blsSkToPk,blsSign,blsVerify,blsPairing,blsHashToG1,g1Mul,g2Mul,g1Normalize,g2Normalize,BLS_G1,BLS_G2}=ctx;
blsInitSwu(JSON.parse(fs.readFileSync("vec_swu.json","utf8")));
let pass=0,fail=0; const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<6)console.log("  ✗ "+n);}};
// A. hash_to_G1
for(const h of JSON.parse(fs.readFileSync("vec_h1.json","utf8"))){
  const p=g1Normalize(blsHashToG1(Uint8Array.from(Buffer.from(h.msg,"hex"))));
  ck("hash_to_G1 "+h.msg.slice(0,20), p[0]===BigInt(h.x)&&p[1]===BigInt(h.y));
}
const A=pass,AF=fail; console.log("A. hash_to_G1 vs py_ecc: 通过 "+A+" / 失败 "+AF);
let P=0,F=0;
// B. 配对
for(const v of JSON.parse(fs.readFileSync("vec_bls.json","utf8")).pairs){
  const e=blsPairing(g2Mul(BLS_G2,BigInt(v.b)),g1Mul(BLS_G1,BigInt(v.a)));
  let ok=true; for(let i=0;i<12;i++) if(e[i]!==BigInt(v.e[i])) ok=false;
  ck("配对 a="+v.a,ok);
}
console.log("B. 配对 vs py_ecc: 通过 "+(pass-A)+" / 失败 "+(fail-AF));
// C. BLS 签名 vs py_ecc
const SV=JSON.parse(fs.readFileSync("vec_bls_sig.json","utf8"));
const c0=pass,c1=fail;
for(const v of SV){
  const sk=BigInt(v.sk), msg=Uint8Array.from(Buffer.from(v.msg,"hex"));
  const pk=blsSkToPk(sk), pkN=g2Normalize(pk);
  ck("SkToPk", pkN[0][0]===BigInt(v.pk[0])&&pkN[0][1]===BigInt(v.pk[1])&&pkN[1][0]===BigInt(v.pk[2])&&pkN[1][1]===BigInt(v.pk[3]));
  const sigN=g1Normalize(blsSign(sk,msg));
  ck("Sign sk="+v.sk, sigN[0]===BigInt(v.sig[0])&&sigN[1]===BigInt(v.sig[1]));
  ck("Verify", blsVerify(pk,msg,blsSign(sk,msg))===true);
  ck("篡改拒绝", blsVerify(pk,Uint8Array.from(Buffer.concat([Buffer.from(v.msg,"hex"),Buffer.from("!")])),blsSign(sk,msg))===false);
}
console.log("C. BLS 签名 vs py_ecc(8组×4项): 通过 "+(pass-c0)+" / 失败 "+(fail-c1));
console.log("\nBLS12-381 总计: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
