(async () => {
const fs=require("fs"),vm=require("vm");
global.crypto=require("crypto").webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});

const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
const small=new Uint8Array(256); for(let i=0;i<256;i++)small[i]=i&255;
const hex=u=>Array.from(u).map(b=>b.toString(16).padStart(2,'0')).join('');
const best=(fn,reps)=>{let t=Infinity;for(let r=0;r<reps;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6; if(ms<t)t=ms;} return t;};

const A=id=>ALGOS.find(x=>x.id===id);
const out={};
async function timed(id, fn, label){
  try{
    const r=await fn();
    let t;
    if(r && r.__t!==undefined) t=r.__t;
    else t=best(()=>{},1);
    out[id]={ms:t, note:label};
  }catch(e){ out[id]={err:e.message.slice(0,60)}; }
}
/* 单次操作计时：直接测一次 async 调用的墙钟 */
async function once(fn){
  const t0=process.hrtime.bigint();
  const r=await fn();
  return {r, ms:Number(process.hrtime.bigint()-t0)/1e6};
}
/* 重复 n 次取最快 */
async function rep(fn,n){
  let bestT=Infinity, lastR;
  for(let i=0;i<n;i++){ const o=await once(fn); if(o.ms<bestT)bestT=o.ms; lastR=o.r; }
  return {r:lastR, ms:bestT};
}

/* ---------- KDF：派生一次 ---------- */
const kdfCases=[
  ['pbkdf2', ()=>A('pbkdf2').enc(strToBytes('password123'),'mysalt','100000','hex')],
  ['scrypt', ()=>A('scrypt').enc(strToBytes('password123'),'mysalt','16384,8,1','hex')],
  ['argon2id',()=>A('argon2id').enc(strToBytes('mysalt12345678'),'password123','2,1024,32','hex')],
  ['argon2i', ()=>A('argon2i').enc(strToBytes('mysalt12345678'),'password123','2,1024,32','hex')],
  ['argon2d', ()=>A('argon2d').enc(strToBytes('mysalt12345678'),'password123','2,1024,32','hex')],
  ['hkdf',   ()=>A('hkdf').enc(hex(new Uint8Array(32).fill(7)),'app-info','32','hex')],
];
for(const [id,fn] of kdfCases){
  try{
    const o=await rep(fn,3);
    out[id]={ms:o.ms, kind:'单次派生'};
  }catch(e){ out[id]={err:e.message.slice(0,60)}; }
}
/* ---------- MAC：64KB 吞吐 ---------- */
const macCases=[
  ['hmac',    'secretkey', 'SHA-256'],
  ['cmac',    'secretkey', ''],
  ['kmac128', hex(new Uint8Array(16).fill(3)), '32'],
  ['kmac256', hex(new Uint8Array(16).fill(3)), '32'],
  ['poly1305',hex(new Uint8Array(32).fill(5)), ''],
];
for(const [id,k,p] of macCases){
  try{
    const probe=await A(id).enc(small,k,p,'hex');
    if(typeof probe!=='string'||!probe.length){ out[id]={err:'no output'}; continue; }
    const o=await rep(()=>A(id).enc(data,k,p,'hex'),3);
    out[id]={ms:o.ms, kind:'64KB'};
  }catch(e){ out[id]={err:e.message.slice(0,60)}; }
}
/* ---------- 对称补测：64KB ---------- */
const digits=new Uint8Array(64*1024); for(let i=0;i<digits.length;i++)digits[i]=48+(i%10);
const digSmall=new Uint8Array(256); for(let i=0;i<256;i++)digSmall[i]=48+(i%10);
const symCases=[
  ['hctr2',       hex(new Uint8Array(16).fill(9)), ''],
  ['aes-gcm-siv', hex(new Uint8Array(16).fill(9)), ''],
  ['ff1',         'mypassword', '10', true],
  ['ff3',         hex(new Uint8Array(16).fill(9)), '10,D8E7920AFA330A73', true],
];
for(const [id,k,p,isFpe] of symCases){
  const D=isFpe?digits:data, S=isFpe?digSmall:small;
  try{
    const probe=await A(id).enc(S,k,p,'hex');
    if(typeof probe!=='string'||!probe.length){ out[id]={err:'no output'}; continue; }
    const o=await rep(()=>A(id).enc(D,k,p,'hex'),3);
    out[id]={ms:o.ms, kind:'64KB'};
  }catch(e){ out[id]={err:e.message.slice(0,70)}; }
}
/* CAST6：走 makeBlockFn */
try{
  const a=A('cast6'); const key=new Uint8Array(32); for(let i=0;i<32;i++)key[i]=i+1;
  const f=a.makeBlockFn(key);
  const fns=f.enc?f:(f.encrypt?{enc:f.encrypt.bind(f),dec:f.decrypt.bind(f)}:null);
  if(fns){
    const rE=()=>{for(let o=0;o+16<=data.length;o+=16) fns.enc(data.subarray(o,o+16));};
    const rD=()=>{for(let o=0;o+16<=data.length;o+=16) fns.dec(data.subarray(o,o+16));};
    rE();rD();
    out['cast6']={ms:best(rE,3), msDec:best(rD,3), kind:'64KB'};
  } else out['cast6']={err:'blockFn shape: '+Object.keys(f).join(',')};
}catch(e){ out['cast6']={err:e.message.slice(0,60)}; }

console.log('===RESULT===');
for(const [id,v] of Object.entries(out)){
  console.log(id+'|'+(v.err?'ERR:'+v.err:(v.msDec!==undefined?v.ms.toFixed(2)+'|'+v.msDec.toFixed(2):v.ms.toFixed(2)))+'|'+v.kind);
}
})();
