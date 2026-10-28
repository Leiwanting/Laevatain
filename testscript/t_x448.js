const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const V=JSON.parse(fs.readFileSync("_vec_new.json","utf8"));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n);}};
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
// 用私钥 a 与对方公钥 pubB 计算共享密钥
let ok=0;
for(const t of V.x448){
  const got=x448ScalarMult(H(t.a),H(t.pubB));
  if(bytesToHex(got)===t.sh) ok++; else console.log("    got "+bytesToHex(got)+"\n    want "+t.sh);
}
ck("X448 vs cryptography: "+ok+"/5", ok===5);
// 双向：b 的私钥配 a 的公钥
const a=ALGOS.filter(x=>x.id==="x448")[0];
ck("x448 已注册", !!a);
console.log("X448: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
