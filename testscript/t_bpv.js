const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){console.log("FAIL "+f+": "+e.message.slice(0,70));}});
vm.runInThisContext(fs.readFileSync("crypto_bulletproof.js","utf8"));
vm.runInThisContext(fs.readFileSync("_bpvec.js","utf8"));
const V=BP_VECTORS;
console.log("vc 数:", V.vc.length);
// 自检1：ristretto basepoint 编码
const comp = ristEncodeAffine([ED_B[0],ED_B[1]]);
console.log("basepoint 编码:", bytesToHex(comp));
console.log("  应为 e2f2ae0a6abc4e71a884a961c500515f58e30b6aa582dd8db6a65945e08d2d76");
// 自检2：STROBE 已知答案（用 Merlin 自身一致性难验，先看能否跑通）
const T = bpTranscriptNew("Merlin v1.0");
console.log("transcript 建立: OK");
for (const key of ["8_1","8_2"]) {
  const [n,m] = key.split("_").map(Number);
  const raw = hexToBytes(V.proofs[key]);
  console.log(key+": 长度 "+raw.length+" 字节（期望 "+(7*32 + (Math.log2(n*m)*2+2)*32)+"）");
  try {
    const ok = bpVerifyRangeProof(raw, V.vc.slice(0,m).map(hexToBytes), n, 1n);
    console.log("  验证结果:", ok);
  } catch(e) { console.log("  异常:", e.message.slice(0,90)); }
}
