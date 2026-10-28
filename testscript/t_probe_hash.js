const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){},dispatchEvent(e){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
for(const id of ['sha256','md5','whirlpool','sm3','blake3','crc32','hmac','pbkdf2','sha3-256','streebog256']){
  const a=ALGOS.find(x=>x.id===id); if(!a){console.log(id,'NOT FOUND');continue;}
  const d=x=>{try{return x&&typeof x.then==='function'?'Promise':(x instanceof Uint8Array?'u8['+x.length+']':typeof x==='string'?'str:'+JSON.stringify(x.slice(0,16)):typeof x);}catch(e){return '?';}};
  for(const arg of [new Uint8Array([1,2,3]), 'abc']){
    let r; try{r=a.enc(arg);}catch(e){r='THROW:'+e.message.slice(0,30);}
    console.log(id, (arg instanceof Uint8Array?'bytes':'str  ')+' -> '+d(r));
  }
}
