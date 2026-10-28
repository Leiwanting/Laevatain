const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
const best=(fn,reps)=>{let t=Infinity;for(let r=0;r<reps;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6; if(ms<t)t=ms;} return t;};
const res=[];
for(const a of ALGOS){
  if(!a.makeBlockFn) continue;
  const kl=a.keyLen||16; if(![8,16,24,32].includes(kl)) continue;
  const key=new Uint8Array(kl); for(let i=0;i<kl;i++)key[i]=i+1;
  let f; try{f=a.makeBlockFn(key);}catch(e){continue;}
  const bs=a.blockSize||8;
  try{
    const run=()=>{for(let o=0;o<data.length-bs;o+=bs) f.enc(data.subarray(o,o+bs));};
    run();
    res.push([a.id, best(run,3)]);
  }catch(e){}
}
res.sort((x,y)=>y[1]-x[1]);
console.log('块加密 64KB 耗时（慢→快）：');
for(const [id,t] of res) console.log('  '+id.padEnd(16)+t.toFixed(2).padStart(8)+' ms');
