const fs=require("fs"),vm=require("vm"),nc=require("crypto");
function sha256Bytes(b){ return new Uint8Array(nc.createHash("sha256").update(Buffer.from(b)).digest()); }
const ctx={console,crypto:nc.webcrypto,BigInt,Math,Array,JSON,Uint8Array,Error,Buffer,sha256Bytes};
vm.createContext(ctx);
vm.runInContext("var concatBytes=function(a,b){var o=new Uint8Array(a.length+b.length);o.set(a,0);o.set(b,a.length);return o;};",ctx);
["bls_const.js","pqc_bls.js"].forEach(f=>vm.runInContext(fs.readFileSync(f,"utf8"),ctx,{filename:f}));
const {blsInitSwu,blsSkToPk,blsSign,blsVerify,g1Normalize,g2Normalize}=ctx;
blsInitSwu(JSON.parse(fs.readFileSync("vec_swu.json","utf8")));
const out=[];
for(const sk of [12345678901234567890n, 42n, 999999999999n]){
  const msg=new TextEncoder?null:null;
  const m=Buffer.from("bls sig "+sk.toString(),"utf8");
  const mu=Uint8Array.from(m);
  const pk=blsSkToPk(sk), pkN=g2Normalize(pk);
  const sig=blsSign(sk,mu), sigN=g1Normalize(sig);
  out.push({sk:sk.toString(),msg:m.toString("hex"),
    pk:[pkN[0][0].toString(),pkN[0][1].toString(),pkN[1][0].toString(),pkN[1][1].toString()],
    sig:[sigN[0].toString(),sigN[1].toString()],
    self:blsVerify(pk,mu,sig)===true,
    bad:blsVerify(pk,Uint8Array.from(Buffer.concat([m,Buffer.from("!")])),sig)===false});
}
fs.writeFileSync("_js_sig.json",JSON.stringify(out));
console.log("JS 自身验签:",out.map(o=>o.self).join(","),"| 篡改拒绝:",out.map(o=>o.bad).join(","));
