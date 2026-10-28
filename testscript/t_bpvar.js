const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
vm.runInThisContext(fs.readFileSync("crypto_bulletproof.js","utf8"));
vm.runInThisContext(fs.readFileSync("_bpvec.js","utf8"));
const isId = R => R!==null && R[0]===0n && R[1]===1n;
let found=[];
for (const sidx of [0,1]) for (const chrev of [false]) for (const lr of [true])
for (const gh of [false,true]) for (const sr of [true,false]) {
  BP_SIDX=sidx; BP_CHREV=chrev; BP_LRFIRST=lr; BP_GHSWAP=gh; BP_SINVREV=sr;
  let ok1=false, ok2=false;
  try { ok1 = isId(bpVerifyRangeProofPoint(hexToBytes(BP_VECTORS.proofs["8_1"]), [hexToBytes(BP_VECTORS.vc[0])], 8, 1n)); } catch(e){}
  try { ok2 = isId(bpVerifyRangeProofPoint(hexToBytes(BP_VECTORS.proofs["8_2"]), BP_VECTORS.vc.slice(0,2).map(hexToBytes), 8, 1n)); } catch(e){}
  const tag = `sidx=${sidx} gh=${gh} sr=${sr}`;
  if (ok1||ok2) { console.log("  ★ "+tag+" -> n8m1:"+ok1+" n8m2:"+ok2); found.push(tag); }
}
console.log(found.length? "命中: "+found.join(" | ") : "8 种组合全部失败");
