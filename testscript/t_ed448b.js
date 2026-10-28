const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
// 基点自检
function M(a){const v=a%ED448_P;return v<0n?v+ED448_P:v;}
const lhs=M(M(ED448_BX*ED448_BX)+M(ED448_BY*ED448_BY));
const rhs=M(1n+M(ED448_D*M(ED448_BX*ED448_BX)*M(ED448_BY*ED448_BY)));
console.log("基点在曲线上:", lhs===rhs);
const V=JSON.parse(fs.readFileSync("_ed448.json","utf8"));
let op=0,os=0,ov=0;
for(const t of V){
  const sk=H(t.sk), msg=H(t.msg);
  try{
    if(bytesToHex(ed448PublicFromPriv(sk))===t.pk) op++;
    const sig=ed448Sign(msg,sk);
    if(bytesToHex(sig)===t.sig) os++;
    if(ed448Verify(msg,H(t.sig),H(t.pk))) ov++;
  }catch(e){ console.log("  抛错:",e.message); }
}
console.log("公钥推导 "+op+"/6  签名 "+os+"/6  验签 "+ov+"/6");
