const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const G=id=>ALGOS.filter(a=>a.id===id)[0];
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
for(const [id,l] of [['gost28147','GOST28147'],['aes256','AES-256'],['3des','3DES'],['des','DES'],
  ['aria128','ARIA-128'],['serpent','Serpent'],['kuznyechik','Kuznyechik'],['sm4','SM4']]){
  const a=G(id); const f=a.makeBlockFn(new Uint8Array(a.keyLen)); const t=Date.now();
  for(let o=0;o<data.length;o+=a.blockSize) f.enc(data.subarray(o,o+a.blockSize));
  console.log("  "+l.padEnd(16)+(Date.now()-t)+" ms");
}
