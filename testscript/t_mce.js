const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto; global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");
global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q')},querySelectorAll(){return[]},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global; global.addEventListener=()=>{}; global.Event=function(t){this.type=t};
function reg(a){ (global.ALGOS=global.ALGOS||[]).push(a); }
global.reg=reg;
vm.runInThisContext(fs.readFileSync("crypto_mceliece.js","utf8"),{filename:"crypto_mceliece.js"});
const T=global.__mceTest;

// 1. SHAKE256 自检
const s0=Buffer.from(T.shake256(new Uint8Array(0),32)).toString("hex");
console.log("SHAKE256(\"\") =",s0.slice(0,32));
console.log("  期望前16: 46b9dd2b0ba88d13233b3feb743eeb24");

// 2. 官方 KAT
const kat=fs.readFileSync("/data/workspace/deps/mce348864.kat","utf8").trim().split("\n");
const kv={}; for(const l of kat){const i=l.indexOf(" = "); kv[l.slice(0,i)]=Buffer.from(l.slice(i+3),"hex");}
console.log("pk",kv.pk.length,"sk",kv.sk.length,"ct",kv.ct.length,"ss",kv.ss.length);
const P=T.makeCtx(3488,64);
console.log("ctx PK_NROWS",P.PK_NROWS,"PK_ROW_BYTES",P.PK_ROW_BYTES,"SYND",P.SYND_BYTES,"IRR",P.IRR_BYTES,"COND",P.COND_BYTES);

const t0=Date.now();
const r=T.mceDecaps(kv.sk, kv.ct, P);
console.log("decaps 耗时",Date.now()-t0,"ms");
console.log("解密成功?",!!r.e);
console.log("ss got ",Buffer.from(r.ss).toString("hex"));
console.log("ss want",kv.ss.toString("hex"));
console.log("匹配:",Buffer.from(r.ss).toString("hex")===kv.ss.toString("hex"));
if(r.e){
  const ct2=T.syndrome(kv.pk,r.e,P);
  console.log("syndrome(pk,e)==ct ?",Buffer.from(ct2).toString("hex")===kv.ct.toString("hex"));
}
