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
for (const key of ["8_1","8_2"]) {
  const [n,m]=key.split("_").map(Number);
  const raw=hexToBytes(BP_VECTORS.proofs[key]);
  const vcs=BP_VECTORS.vc.slice(0,m).map(hexToBytes);
  const R0=bpVerifyRangeProofPoint(raw, vcs, n, 0n);
  const R1=bpVerifyRangeProofPoint(raw, vcs, n, 1n);
  console.log(key+":");
  console.log("  c=0 (IPA 部分) 为恒等:", isId(R0));
  console.log("  c=1 (IPA+多项式) 为恒等:", isId(R1));
  console.log("  R0 == R1 :", (R0&&R1)? (R0[0]===R1[0]&&R0[1]===R1[1]) : 'null');
  if(R0) console.log("  R0.x =", R0[0].toString(16).slice(0,16));
  if(R1) console.log("  R1.x =", R1[0].toString(16).slice(0,16));
}
