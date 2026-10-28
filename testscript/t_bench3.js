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
async function bench(id,label,reps){
  const a=G(id); if(!a){console.log("  缺失 "+id);return;}
  let t=Infinity;
  try{
    for(let r=0;r<reps;r++){
      const t0=process.hrtime.bigint();
      if(a.oneway) await a.enc(data,'','hex'); else await a.enc(data.slice(0,2048),'0123456789abcdef','hex');
      const ms=Number(process.hrtime.bigint()-t0)/1e6;
      if(ms<t) t=ms;
    }
    console.log("  "+label.padEnd(20)+t.toFixed(1)+" ms");
  }catch(e){console.log("  "+label.padEnd(20)+" ERR "+e.message.slice(0,40));}
}
(async()=>{
console.log("哈希 64KB（取 5 次最快）:");
for(const [id,l] of [['sha256','SHA-256'],['sha3-256','SHA3-256'],['sm3','SM3'],['blake3','BLAKE3'],
 ['blake2b','BLAKE2b'],['ripemd160','RIPEMD-160'],['whirlpool','Whirlpool'],['streebog512','Streebog-512'],
 ['sha512','SHA-512']]) await bench(id,l,5);
console.log("\n对称 64KB 单块（取 3 次最快）:");
for(const [id,l] of [['aes256','AES-256'],['sm4','SM4'],['serpent','Serpent'],['kuznyechik','Kuznyechik'],
 ['aria128','ARIA-128'],['des','DES'],['3des','3DES'],['gost28147','GOST28147'],['camellia128','Camellia-128']]){
  const a=G(id); if(!a||!a.makeBlockFn){console.log("  "+l.padEnd(20)+" n/a");continue;}
  let t=Infinity;
  for(let r=0;r<3;r++){
    const f=a.makeBlockFn(new Uint8Array(a.keyLen));
    const t0=process.hrtime.bigint();
    for(let o=0;o<data.length;o+=a.blockSize) f.enc(data.subarray(o,o+a.blockSize));
    const ms=Number(process.hrtime.bigint()-t0)/1e6; if(ms<t)t=ms;
  }
  console.log("  "+l.padEnd(20)+t.toFixed(1)+" ms");
}
})();
