const fs=require("fs"),vm=require("vm"),nc=require("crypto");
function sha256Bytes(b){ return new Uint8Array(nc.createHash("sha256").update(Buffer.from(b)).digest()); }
const ctx={console,crypto:nc.webcrypto,BigInt,Math,Array,JSON,Uint8Array,Error,Buffer,sha256Bytes,concatBytes:null};
vm.createContext(ctx);
vm.runInContext("var concatBytes=function(a,b){var o=new Uint8Array(a.length+b.length);o.set(a,0);o.set(b,a.length);return o;};",ctx);
["bls_const.js","pqc_bls.js"].forEach(f=>vm.runInContext(fs.readFileSync(f,"utf8"),ctx,{filename:f}));
const {blsInitSwu,blsSkToPk,blsSign,blsVerify,g2Normalize,g1Normalize,blsHashToG1}=ctx;
blsInitSwu(JSON.parse(fs.readFileSync("vec_swu.json","utf8")));
const V=JSON.parse(fs.readFileSync("vec_bls.json","utf8"));
let pass=0,fail=0;
for(const h of JSON.parse(fs.readFileSync("vec_h1.json","utf8"))){
  const p=g1Normalize(blsHashToG1(Uint8Array.from(Buffer.from(h.msg,"hex"))));
  if(p[0]===BigInt(h.x)&&p[1]===BigInt(h.y))pass++;else{fail++;if(fail<=2)console.log(`  ✗ hash_to_G1 msg="${h.msg}"\n     JS  x=${p[0]}\n     期望 ${h.x}`);}
}
console.log("hash_to_G1 vs py_ecc: 通过 "+pass+" / 失败 "+fail);
let sp=0,sf=0;
for(const v of V.bls_sig){
  const sk=BigInt(v.sk), pk=blsSkToPk(sk), pkN=g2Normalize(pk);
  const hex96=x=>x.toString(16).padStart(96,'0');
  const pkHex=hex96(pkN[0][0])+hex96(pkN[0][1])+hex96(pkN[1][0])+hex96(pkN[1][1]);
  if(pkHex===v.pk)sp++;else{sf++;if(sf<=2)console.log("  ✗ SkToPk");}
  const msg=Uint8Array.from(Buffer.from(v.msg,"hex"));
  const sigN=g1Normalize(blsSign(sk,msg));
  const sigHex=hex96(sigN[0])+hex96(sigN[1]);
  if(sigHex===v.sig)sp++;else{sf++;if(sf<=2)console.log("  ✗ Sign\n     JS  ="+sigHex+"\n     期望="+v.sig);}
  if(blsVerify(pk,msg,blsSign(sk,msg))===true)sp++;else{sf++;}
  if(blsVerify(pk,Uint8Array.from(Buffer.from(v.msg+"aa","hex")),blsSign(sk,msg))===false)sp++;else{sf++;}
}
console.log("BLS 签名(4组×4项): 通过 "+sp+" / 失败 "+sf);
console.log("\n总计: 通过 "+(pass+sp)+" / 失败 "+(fail+sf));
