/* HQC 界面入口回归：之前 crypto_hqc.js 因 index.html 标签嵌套错乱而全程未加载，
   所以"注册成功"这件事从未被真正验证过。这里只测注册入口是否可用 + 往返。 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
[...fs.readFileSync("index.html","utf8").matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){console.log("ERR "+f+": "+e.message);}});
let ok=0,bad=0;
for(const id of ["hqc128","hqc192","hqc256"]){
  const a=ALGOS.find(x=>x.id===id);
  if(!a){console.log(id+" ✗ 未注册");bad++;continue;}
  try{
    const kp=a.gen();
    const r=a.enc(new Uint8Array(1), kp.pub, "", "hex");
    const ct=String(r).split("::K::")[0].trim(), ss=String(r).split("::K::")[1].trim();
    const back=a.dec(ct, kp.priv, "", "hex");
    const bt=(typeof back==="string")?back:(back&&back.text)||"";
    if(bt.trim()===ss.trim()){ok++;console.log(id+" ✓ 注册且往返成功  pk="+kp.pub.length/2+"B  ct="+ct.length/2+"B");}
    else{bad++;console.log(id+" ✗ 往返不一致");}
  }catch(e){bad++;console.log(id+" ✗ 异常: "+e.message);}
}
console.log("HQC 入口可用: "+ok+"/3  失败 "+bad);
