const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto; global.TextEncoder=require("util").TextEncoder;
global.reg=a=>{(global.ALGOS=global.ALGOS||[]).push(a)};
vm.runInThisContext(fs.readFileSync("crypto_mceliece.js","utf8"),{filename:"mce"});
const T=global.__mceTest;
const kat=fs.readFileSync("/data/workspace/deps/mce348864.kat","utf8").trim().split("\n");
const kv={}; for(const l of kat){const i=l.indexOf(" = ");try{kv[l.slice(0,i)]=Buffer.from(l.slice(i+3),"hex")}catch(e){}}
const P=T.makeCtx(3488,64);
console.log("seed(sk前32) =",kv.sk.subarray(0,32).toString("hex"));
const t0=Date.now();
const kp=T.mceKeypair(kv.sk.subarray(0,32), P);
console.log("keypair 耗时",Date.now()-t0,"ms");
const h=b=>Buffer.from(b).toString("hex");
console.log("pk len",kp.pk.length,"want",kv.pk.length);
console.log("sk len",kp.sk.length,"want",kv.sk.length);
console.log("pk 匹配:",h(kp.pk)===kv.pk.toString("hex"));
console.log("sk 匹配:",h(kp.sk)===kv.sk.toString("hex"));
if(h(kp.pk)!==kv.pk.toString("hex")){
  // 找首个不同字节
  const a=kp.pk,b=kv.pk; for(let i=0;i<Math.min(a.length,b.length);i++) if(a[i]!==b[i]){console.log("pk 首个不同 @",i,a[i],b[i]);break;}
}
if(h(kp.sk)!==kv.sk.toString("hex")){
  const a=kp.sk,b=kv.sk; let n=0;
  for(let i=0;i<Math.min(a.length,b.length);i++) if(a[i]!==b[i]){ if(n<5)console.log("sk 不同 @",i,a[i],b[i]); n++;}
  console.log("sk 不同字节总数",n);
  console.log("  sk[0..31](seed):",h(a.subarray(0,32))===h(b.subarray(0,32))?"同":"异");
  console.log("  sk[32..39](pivots):",h(a.subarray(32,40))===h(b.subarray(32,40))?"同":"异");
  console.log("  sk[40..167](irr):",h(a.subarray(40,168))===h(b.subarray(40,168))?"同":"异");
  console.log("  sk[168..6055](cond):",h(a.subarray(168,6056))===h(b.subarray(168,6056))?"同":"异");
  console.log("  sk[6056..](s):",h(a.subarray(6056))===h(b.subarray(6056))?"同":"异");
}
