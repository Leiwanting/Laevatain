const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n);}};
const a=ALGOS.filter(x=>x.id==="ff3")[0];
ck("ff3 已注册", !!a);
if(a){
  const P="10,D8E7920AFA330A73";
  const K="EF4359D8D580AA4F7F036D6F04FC6A94";
  const ct=a.enc(strToBytes("890121234567890000"),K,P,"utf8");
  ck("条目加密 == 官方", ct==="750918814058654607");
  const back=a.dec(strToBytes("750918814058654607"),K,P,"utf8");
  ck("条目解密往返", back==="890121234567890000");
  // radix 26 示例
  const ct2=a.enc(strToBytes("0123456789abcdefghijklmno"),K,"26,D8E7920AFA330A73","utf8");
  const bk2=a.dec(strToBytes(ct2),K,"26,D8E7920AFA330A73","utf8");
  ck("radix26 往返", bk2==="0123456789abcdefghijklmno");
  console.log("  radix26: 0123456789abcdefghijklmno -> "+ct2);
}
console.log("FF3 条目: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
