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
async function bench(id,label){
  const a=G(id); if(!a){console.log("  缺失 "+id); return;}
  try{
    const t0=Date.now(); let out;
    if(a.oneway) out=await a.enc(data,'','hex');
    else out=await a.enc(data.slice(0,512),'0123456789abcdef','hex');
    console.log("  "+label.padEnd(22)+(Date.now()-t0)+" ms");
  }catch(e){ console.log("  "+label.padEnd(22)+" ERR "+e.message.slice(0,40)); }
}
(async()=>{
console.log("哈希 64KB:");
for(const [id,l] of [['sha256','SHA-256'],['sha3-256','SHA3-256'],['sha3-512','SHA3-512'],
  ['sm3','SM3'],['blake3','BLAKE3'],['blake2b','BLAKE2b'],['ripemd160','RIPEMD-160'],
  ['whirlpool','Whirlpool'],['streebog512','Streebog-512'],['sha512','SHA-512']]) await bench(id,l);
console.log("\n对称 64KB ECB:");
const t0=Date.now();
for(const [id,l] of [['aes256','AES-256'],['sm4','SM4'],['aria128','ARIA-128'],['des','DES'],
  ['3des','3DES'],['kuznyechik','Kuznyechik'],['camellia128','Camellia-128'],['seed','SEED'],
  ['serpent','Serpent'],['cast5','CAST5'],['rc2','RC2'],['gost28147','GOST28147']]){
  const a=G(id); if(!a||!a.makeBlockFn){console.log("  "+l.padEnd(22)+" n/a");continue;}
  try{ const f=a.makeBlockFn(new Uint8Array(a.keyLen)); const t=Date.now();
    for(let o=0;o<data.length;o+=a.blockSize) f.enc(data.subarray(o,o+a.blockSize));
    console.log("  "+l.padEnd(22)+(Date.now()-t)+" ms"); }catch(e){console.log("  "+l.padEnd(22)+" ERR "+e.message.slice(0,40));}
}
})();
