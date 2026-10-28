/* X448 对拍 Python cryptography（权威库）。
   ⚠ 向量由 cryptography 现场生成并固化到 testvectors/，不是凭记忆书写的——
   本项目已多次栽在"参照物写错"上，所以参照物必须来自可复现的权威库。 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return[];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
[...fs.readFileSync("index.html","utf8").matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1])
  .forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
let pass=0,fail=0; const ck=(n,c)=>{ if(c){pass++;} else {fail++;console.log("✗ "+n);} };
const V=JSON.parse(fs.readFileSync("x448vec.json","utf8"));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
const x=ALGOS.filter(a=>a.id==="x448")[0];
for(const t of V.x448){
  ck("a·pubB == cryptography 共享密钥", bytesToHex(x448ScalarMult(H(t.a),H(t.pubB)))===t.sh);
  ck("b·pubA == cryptography 共享密钥", bytesToHex(x448ScalarMult(H(t.b),H(t.pubA)))===t.sh);
  ck("a 推导公钥 == cryptography pubA", x.enc(new Uint8Array(0),t.a,null,"hex")===t.pubA);
  ck("b 推导公钥 == cryptography pubB", x.enc(new Uint8Array(0),t.b,null,"hex")===t.pubB);
  ck("入口 dec(a,pubB) == sh", x.dec(new Uint8Array(0),t.a,t.pubB,"hex")===t.sh);
  ck("入口 dec(b,pubA) == sh", x.dec(new Uint8Array(0),t.b,t.pubA,"hex")===t.sh);
}
console.log("X448 对拍 cryptography: 通过 "+pass+" / 失败 "+fail);
