const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  X "+n);}};
const byId=id=>ALGOS.find(a=>a.id===id);
const enc=(id,msg,dst)=>{const a=byId(id);return a.enc(Buffer.from(msg,"utf8"),"",dst,"hex");};

const d1=JSON.parse(fs.readFileSync("testvectors/BLS12377G1_XMD-SHA-256_SSWU_RO_.json","utf8"));
const d2=JSON.parse(fs.readFileSync("testvectors/BLS12377G2_XMD-SHA-256_SSWU_RO_.json","utf8"));
ck("条目 g1 存在", !!byId("bls12-377-hash-to-curve-g1"));
ck("条目 g2 存在", !!byId("bls12-377-hash-to-curve-g2"));
ck("g1 单向（无 dec）", byId("bls12-377-hash-to-curve-g1").dec===false);
ck("g2 单向（无 dec）", byId("bls12-377-hash-to-curve-g2").dec===false);
/* 默认 DST（留空）应等于官方向量 */
for(const v of d1.vectors){
  const out=enc("bls12-377-hash-to-curve-g1", v.msg, "");
  const s=typeof out==="string"?out:(out.text||String(out));
  ck(`g1 入口默认DST[${v.msg.slice(0,8)}] 含 P.x`, s.includes(BigInt(v.P.x).toString(16).replace(/^0+/,"").padStart(96,"0")) ||
     s.toLowerCase().includes(BigInt(v.P.x).toString(16).padStart(96,"0").toLowerCase()));
}
for(const v of d2.vectors){
  const out=enc("bls12-377-hash-to-curve-g2", v.msg, "");
  const s=typeof out==="string"?out:(out.text||String(out));
  const c0=BigInt(v.P.x.split(",")[0]).toString(16).padStart(96,"0");
  ck(`g2 入口默认DST[${v.msg.slice(0,8)}] 含 P.x.c0`, s.toLowerCase().includes(c0.toLowerCase()));
}
/* 自定义 DST 也应能跑且不崩 */
ck("g1 自定义 DST", typeof enc("bls12-377-hash-to-curve-g1","abc","MY-DST")==="string" || enc("bls12-377-hash-to-curve-g1","abc","MY-DST")!=null);
ck("g2 自定义 DST", enc("bls12-377-hash-to-curve-g2","abc","MY-DST")!=null);
/* 不同 DST 应给出不同点 */
const A=String(enc("bls12-377-hash-to-curve-g1","abc","DST-A")), B=String(enc("bls12-377-hash-to-curve-g1","abc","DST-B"));
ck("g1 不同 DST 结果不同", A!==B);
console.log(`入口测试: ${pass} pass, ${fail} fail`);
if(fail)process.exit(1);
