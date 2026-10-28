const fs=require("fs"),vm=require("vm");
global.crypto=require("crypto").webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
vm.runInThisContext(fs.readFileSync("bp_vectors.js","utf8"));
/* 统计各类底层运算耗时 */
const C={};
function wrap(name){
  const orig=global[name];
  if(typeof orig!=='function'){console.log('no '+name);return;}
  global[name]=function(){const t0=process.hrtime.bigint();const r=orig.apply(null,arguments);
    const d=Number(process.hrtime.bigint()-t0)/1e6;C[name]=(C[name]||0)+d;return r;};
}
['edqInv','edqSqrt','edqPow','edqMul','scReduce'].forEach(wrap);
const raw=hexToBytes(BP_TESTVECTORS.proofs[0][0]);
const vcs=BP_TESTVECTORS.vc.slice(0,1).map(hexToBytes);
const t0=process.hrtime.bigint();
const ok=bpVerifyRangeProof(raw,vcs,8,1n);
const total=Number(process.hrtime.bigint()-t0)/1e6;
console.log('总耗时 '+total.toFixed(0)+' ms, ok='+ok);
for(const [k,v] of Object.entries(C).sort((a,b)=>b[1]-a[1])) console.log('  '+k+': '+v.toFixed(0)+' ms');
