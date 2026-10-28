const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
vm.runInThisContext(fs.readFileSync("bp_vectors.js","utf8"));
let pass=0, fail=0;
for(let i=0;i<4;i++){
  for(let j=0;j<4;j++){
    const n=8<<i, m=1<<j;
    const raw=hexToBytes(BP_TESTVECTORS.proofs[i][j]);
    const vcs=BP_TESTVECTORS.vc.slice(0,m).map(hexToBytes);
    let ok=false, err="";
    try { ok=bpVerifyRangeProof(raw, vcs, n, 1n); } catch(e){ err=e.message.slice(0,60); }
    if(ok) pass++; else fail++;
    console.log(`n=${String(n).padStart(2)} m=${m} 长度=${String(raw.length).padStart(4)} -> ${ok?"✓":"✗ "+err}`);
  }
}
console.log(`\n官方固定向量: ${pass} 通过 / ${fail} 失败`);
