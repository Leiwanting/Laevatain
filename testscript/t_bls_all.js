const fs=require("fs"),vm=require("vm"),nc=require("crypto");
function sha256Bytes(b){ return new Uint8Array(nc.createHash("sha256").update(Buffer.from(b)).digest()); }
const ctx={console,crypto:nc.webcrypto,BigInt,Math,Array,JSON,Uint8Array,Error,Buffer,sha256Bytes};
vm.createContext(ctx);
vm.runInContext("var concatBytes=function(a,b){var o=new Uint8Array(a.length+b.length);o.set(a,0);o.set(b,a.length);return o;};",ctx);
["bls_const.js","pqc_bls.js"].forEach(f=>vm.runInContext(fs.readFileSync(f,"utf8"),ctx,{filename:f}));
const {blsInitSwu,blsSkToPk,blsSign,blsVerify,blsPairing,blsHashToG1,g1Mul,g2Mul,g1Normalize,g2Normalize,BLS_G1,BLS_G2,f12eq}=ctx;
blsInitSwu(JSON.parse(fs.readFileSync("vec_swu.json","utf8")));
let pass=0,fail=0; const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<5)console.log("  ✗ "+n);}};
// A. hash_to_G1
const H1=JSON.parse(fs.readFileSync("vec_h1.json","utf8"));
for(const h of H1){
  const p=g1Normalize(blsHashToG1(Uint8Array.from(Buffer.from(h.msg,"hex"))));
  ck("hash_to_G1 "+h.msg, p[0]===BigInt(h.x)&&p[1]===BigInt(h.y));
}
console.log("A. hash_to_G1 vs py_ecc: 通过 "+pass+" / 失败 "+fail);
// B. 配对 + 双线性
let p2=0,f2=0;
const V=JSON.parse(fs.readFileSync("vec_bls.json","utf8"));
for(const v of V.pairs){
  const e=blsPairing(g2Mul(BLS_G2,BigInt(v.b)), g1Mul(BLS_G1,BigInt(v.a)));
  let ok=true; for(let i=0;i<12;i++) if(e[i]!==BigInt(v.e[i])) ok=false;
  if(ok)p2++;else f2++;
}
console.log("B. 配对 vs py_ecc: 通过 "+p2+" / 失败 "+f2);
// C. BLS 签名：输出供 py 交叉验
pass+=p2; fail+=f2;
const out=[];
for(const sk of [12345678901234567890n,42n,999999999999n,7n,123456789n]){
  const m=Buffer.from("bls sig "+sk.toString(),"utf8"), mu=Uint8Array.from(m);
  const pk=blsSkToPk(sk), pkN=g2Normalize(pk);
  const sig=blsSign(sk,mu), sigN=g1Normalize(sig);
  ck("自验签", blsVerify(pk,mu,sig)===true);
  ck("篡改拒绝", blsVerify(pk,Uint8Array.from(Buffer.concat([m,Buffer.from("!")])),sig)===false);
  out.push({sk:sk.toString(),msg:m.toString("hex"),
    pk:[pkN[0][0].toString(),pkN[0][1].toString(),pkN[1][0].toString(),pkN[1][1].toString()],
    sig:[sigN[0].toString(),sigN[1].toString()]});
}
console.log("C. 自身验签/篡改: 累计 通过 "+pass+" / 失败 "+fail);
fs.writeFileSync("_js_sig.json",JSON.stringify(out));
console.log("总计: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
