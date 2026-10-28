const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
vm.runInThisContext(fs.readFileSync("bp_vectors.js","utf8"));
let pass=0,fail=0;
/* 只跑代表性的 4 组：覆盖 lgN=3,4,5 与 m=1,2 */
for(const [i,j] of [[0,0],[0,1],[1,0],[2,0]]){
  const n=8<<i,m=1<<j;
  const raw=hexToBytes(BP_TESTVECTORS.proofs[i][j]);
  const vcs=BP_TESTVECTORS.vc.slice(0,m).map(hexToBytes);
  const t0=process.hrtime.bigint();
  let ok=false,err="";
  try{ ok=bpVerifyRangeProof(raw,vcs,n,1n); }catch(e){ err=e.message.slice(0,60); }
  const ms=Number(process.hrtime.bigint()-t0)/1e6;
  if(ok)pass++;else fail++;
  console.log(`n=${n} m=${m} len=${raw.length} -> ${ok?"✓":"✗ "+err}  ${ms.toFixed(0)} ms`);
}
/* 篡改必须失败 */
{
  const raw=hexToBytes(BP_TESTVECTORS.proofs[0][0]);
  raw[raw.length-1]^=1;
  const vcs=BP_TESTVECTORS.vc.slice(0,1).map(hexToBytes);
  let ok=false; try{ ok=bpVerifyRangeProof(raw,vcs,8,1n); }catch(e){}
  if(!ok)pass++;else fail++;
  console.log('篡改末字节 -> '+(ok?'✗ 误判通过':'✓ 正确拒绝'));
}
console.log(`Bulletproofs 快速回归: ${pass} 通过 / ${fail} 失败`);
