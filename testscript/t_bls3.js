const fs=require("fs"),vm=require("vm"),nc=require("crypto");
function sha256Bytes(b){ return new Uint8Array(nc.createHash("sha256").update(Buffer.from(b)).digest()); }
const ctx={console,crypto:nc.webcrypto,BigInt,Math,Array,JSON,Uint8Array,Error,Buffer,sha256Bytes};
vm.createContext(ctx);
vm.runInContext("var concatBytes=function(a,b){var o=new Uint8Array(a.length+b.length);o.set(a,0);o.set(b,a.length);return o;};",ctx);
["bls_const.js","pqc_bls.js"].forEach(f=>vm.runInContext(fs.readFileSync(f,"utf8"),ctx,{filename:f}));
const {blsInitSwu,blsSkToPk,blsSign,blsVerify,g1Normalize,g2Normalize}=ctx;
blsInitSwu(JSON.parse(fs.readFileSync("vec_swu.json","utf8")));
let pass=0,fail=0;
for(const v of JSON.parse(fs.readFileSync("vec_sig2.json","utf8"))){
  const sk=BigInt(v.sk), msg=Uint8Array.from(Buffer.from(v.msg,"hex"));
  const pk=blsSkToPk(sk);
  const mine=g1Normalize(blsSign(sk,msg));
  const okX=mine[0]===BigInt(v.sigx), okY=mine[1]===BigInt(v.sigy);
  if(okX&&okY)pass++;else{fail++;console.log(`  ✗ sk=${v.sk} x匹配=${okX} y匹配=${okY}`);}
  const pySig=[BigInt(v.sigx),BigInt(v.sigy),1n];
  if(blsVerify(pk,msg,pySig)===true)pass++;else{fail++;console.log("  ✗ 验 py_ecc 签名失败");}
  if(blsVerify(pk,Uint8Array.from(Buffer.from(v.msg+"aa","hex")),pySig)===false)pass++;else{fail++;}
}
console.log("BLS 签名(坐标级+互验): 通过 "+pass+" / 失败 "+fail);
