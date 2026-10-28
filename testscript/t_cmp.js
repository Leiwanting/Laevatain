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
for (const key of ["8_1","8_2"]) {
  const [n,m]=key.split("_").map(Number);
  try { bpVerifyRangeProofPoint(hexToBytes(BP_VECTORS.proofs[key]), BP_VECTORS.vc.slice(0,m).map(hexToBytes), n, 1n); } catch(e){}
  console.log(key+" JS: y="+BP_LAST.y.toString(16).slice(0,16)+" z="+BP_LAST.z.toString(16).slice(0,16)+" x="+BP_LAST.x.toString(16).slice(0,16)+" w="+BP_LAST.w.toString(16).slice(0,16));
}
