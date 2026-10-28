const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const bad=[];
for(const a of ALGOS){
  if(a.group==='对称加密' && !a.key) bad.push(a.id+' ('+a.name+') 缺 key');
  if(a.group==='对称加密' && !a.isSym) bad.push(a.id+' ('+a.name+') 缺 isSym');
  if(a.isSym && !a.makeBlockFn) bad.push(a.id+' ('+a.name+') isSym 但无 makeBlockFn');
}
console.log("问题算法 "+bad.length+" 项:");
bad.forEach(b=>console.log("  ✗ "+b));
