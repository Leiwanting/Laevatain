const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
const lines=fs.readFileSync("test-vectors.csv","utf8").trim().split("\n");
let ok=0,fail=0,tot=0;
for(let i=1;i<lines.length;i++){
  const c=lines[i].split(",");
  const pk=c[2], msg=c[4], sig=c[5], res=c[6];
  if(!pk||!sig) continue;
  tot++;
  const exp = (res==="TRUE");
  const got = schnorrVerify(H(pk), H(msg), H(sig));
  if(got===exp) ok++; else { fail++; if(fail<=3)console.log("  ✗ #"+c[0]+" 期望"+exp+" 得到"+got+" ("+c[7]+")"); }
}
console.log("BIP-340 验签(全部用例): "+ok+"/"+tot+" 通过, "+fail+" 失败");
