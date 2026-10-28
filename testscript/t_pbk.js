const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");
global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};
global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
console.log("typeof pbkdf2Sha256:", typeof pbkdf2Sha256);
try{
  const r=pbkdf2Sha256('password', strToBytes('salt'), 1, 20);
  console.log("iter=1  got:", bytesToHex(r));
  console.log("     want: 120fb6cffcf8b32c43e7225256c4f837a86548c9");
}catch(e){ console.log("iter=1 抛错:", e.message); }
try{
  const r2=pbkdf2Sha256('password', strToBytes('salt'), 4096, 20);
  console.log("iter=4096 got:", bytesToHex(r2));
  console.log("       want: c5e478d59288c841aa530db6845c4c8d962893a0");
}catch(e){ console.log("iter=4096 抛错:", e.message); }
