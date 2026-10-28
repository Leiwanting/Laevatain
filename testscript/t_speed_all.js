const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){},dispatchEvent(e){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
const best=(fn,reps)=>{let t=Infinity;for(let r=0;r<reps;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6; if(ms<t)t=ms;} return t;};
const isP=x=>x&&typeof x.then==='function';

const out={};
for(const a of ALGOS){
  /* --- 块密码：直接跑块函数 --- */
  if(a.makeBlockFn && a.blockSize){
    const bs=a.blockSize, kl=a.keyLen;
    if(![8,16,24,32].includes(kl)) continue;
    const key=new Uint8Array(kl); for(let i=0;i<kl;i++)key[i]=i+1;
    let f; try{f=a.makeBlockFn(key);}catch(e){continue;}
    try{
      const rE=()=>{for(let o=0;o+bs<=data.length;o+=bs) f.enc(data.subarray(o,o+bs));};
      const rD=()=>{for(let o=0;o+bs<=data.length;o+=bs) f.dec(data.subarray(o,o+bs));};
      rE();rD();
      out[a.id]={kind:'block',enc:best(rE,3),dec:best(rD,3)};
    }catch(e){}
    continue;
  }
  /* --- 单向（哈希/校验和/编码）--- */
  if(a.oneway && typeof a.enc==='function'){
    try{
      const probe=a.enc(new Uint8Array([1,2,3]));
      if(isP(probe)){ out[a.id]={kind:'native'}; continue; }
      if(typeof probe!=='string' || probe.length===0) continue;
      const r=()=>a.enc(data); r();
      out[a.id]={kind:'hash',enc:best(r,3)};
    }catch(e){}
    continue;
  }
  /* --- 对称加密组里的流密码 / AEAD / FPE --- */
  if(a.group==='对称加密' && typeof a.enc==='function'){
    const kl=a.keyLen||16;
    const key=new Uint8Array(kl); for(let i=0;i<kl;i++)key[i]=i+1;
    try{
      const probe=a.enc(new Uint8Array(64), key, '');
      if(isP(probe)){ out[a.id]={kind:'native'}; continue; }
      if(!(probe instanceof Uint8Array) || probe.length===0) continue;
      const r=()=>a.enc(data,key,''); r();
      out[a.id]={kind:'stream',enc:best(r,3)};
    }catch(e){}
  }
}
fs.writeFileSync('/tmp/speed.json', JSON.stringify(out,null,1));
const fmt=v=>v.toFixed(2).padStart(6);
const blk=Object.entries(out).filter(x=>x[1].kind==='block').sort((a,b)=>b[1].enc-a[1].enc);
const hsh=Object.entries(out).filter(x=>x[1].kind==='hash').sort((a,b)=>b[1].enc-a[1].enc);
const str=Object.entries(out).filter(x=>x[1].kind==='stream').sort((a,b)=>b[1].enc-a[1].enc);
const nat=Object.entries(out).filter(x=>x[1].kind==='native');
console.log('===BLOCK===');
for(const [id,v] of blk) console.log(id+'|'+fmt(v.enc)+'|'+fmt(v.dec));
console.log('===HASH===');
for(const [id,v] of hsh) console.log(id+'|'+fmt(v.enc));
console.log('===STREAM===');
for(const [id,v] of str) console.log(id+'|'+fmt(v.enc));
console.log('===NATIVE===');
console.log(nat.map(x=>x[0]).join(','));
console.log('COVERED|'+Object.keys(out).length+'|'+ALGOS.length);
