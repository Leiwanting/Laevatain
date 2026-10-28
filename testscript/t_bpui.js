const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
vm.runInThisContext(fs.readFileSync("bp_vectors.js","utf8"));
const A = ALGOS.filter(a=>a.id==='bulletproof-verify')[0];
console.log("条目注册:", !!A, " 名称:", A && A.name);
if(A){
  // 用官方向量走界面入口
  let p=0,f=0;
  for(const [i,j] of [[0,0],[0,3],[3,3]]){
    const n=8<<i, m=1<<j;
    const r=A.enc(BP_TESTVECTORS.proofs[i][j], BP_TESTVECTORS.vc.slice(0,m).join(","), String(n), 'hex');
    const ok = r.indexOf("✓")===0;
    if(ok)p++;else f++;
    console.log(`  n=${n} m=${m} -> ${r.slice(0,40)}`);
  }
  // 篡改应被拒
  const bad = BP_TESTVECTORS.proofs[0][0].slice(0,-2) + (BP_TESTVECTORS.proofs[0][0].slice(-2)==="06"?"07":"06");
  let r2="";
  try { r2 = A.enc(bad, BP_TESTVECTORS.vc[0], "8", 'hex'); } catch(e){ r2="异常:"+e.message.slice(0,40); }
  console.log("  篡改证明 ->", r2.slice(0,40));
  console.log("界面入口: "+p+" 通过 / "+f+" 失败；篡改验证:", r2.indexOf("✗")===0||r2.indexOf("异常")===0);
}
console.log("算法总数:", ALGOS.length);
