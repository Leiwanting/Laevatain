(async () => {
const fs=require("fs"),vm=require("vm");
global.crypto=require("crypto").webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const A=id=>ALGOS.find(x=>x.id===id);
const hex=u=>Array.from(u).map(b=>b.toString(16).padStart(2,'0')).join('');
async function once(fn){const t0=process.hrtime.bigint();const r=await fn();return {r,ms:Number(process.hrtime.bigint()-t0)/1e6};}
async function rep(fn,n){let b=Infinity,l;for(let i=0;i<n;i++){const o=await once(fn);if(o.ms<b)b=o.ms;l=o.r;}return {r:l,ms:b};}
const out={};
async function T(id,fn,kind,note){
  try{ const o=await rep(fn,3); out[id]={ms:o.ms,kind:kind||'单次操作',note:note||''}; }
  catch(e){ out[id]={err:e.message.slice(0,70)}; }
}
const msg=new Uint8Array(64); for(let i=0;i<64;i++)msg[i]=65+(i%26);

/* ---- 后量子 ML-KEM：密钥生成 / 封装 / 解封 ---- */
{
  const KOF={'mlkem512':2,'mlkem768':3,'mlkem1024':4};
  for(const [id,k] of Object.entries(KOF)){
    let kp=null, kgMs=0;
    try{ const t0=process.hrtime.bigint(); kp=mlkemKeygen(k); kgMs=Number(process.hrtime.bigint()-t0)/1e6; }catch(e){}
    if(!kp){ out[id+' 密钥生成']={err:'keygen fail'}; continue; }
    /* 密钥生成取 3 次最快 */
    let kg=Infinity;
    for(let i=0;i<3;i++){const t0=process.hrtime.bigint();mlkemKeygen(k);const m=Number(process.hrtime.bigint()-t0)/1e6;if(m<kg)kg=m;}
    out[id+' 密钥生成']={ms:kg,kind:'单次操作'};
    const ek=hex(kp.ek||kp.pk), dk=hex(kp.dk||kp.sk);
    let ct='';
    await T(id+' 封装', async()=>{ const r=await A(id).enc(msg,ek,'','hex'); ct=r; return r; }, '单次操作');
    await T(id+' 解封', async()=>A(id).dec(msg,dk+','+ct,'','hex'), '单次操作');
  }
}
/* ---- ML-DSA 签名 / 验签 ---- */
{
  const LV={'mldsa44':44,'mldsa65':65,'mldsa87':87};
  for(const [id,lv] of Object.entries(LV)){
    let kp=null;
    try{ kp=mldsaKeygen(lv); }catch(e){ out[id+' 密钥生成']={err:e.message.slice(0,50)}; continue; }
    let kg=Infinity;
    for(let i=0;i<3;i++){const t0=process.hrtime.bigint();mldsaKeygen(lv);const m=Number(process.hrtime.bigint()-t0)/1e6;if(m<kg)kg=m;}
    out[id+' 密钥生成']={ms:kg,kind:'单次操作'};
    const skHex=hex(kp.sk), pkHex=hex(kp.pk);
    let sig='';
    await T(id+' 签名', async()=>{const r=await A(id).enc(msg,skHex,'','hex'); sig=r; return r;}, '单次操作');
    await T(id+' 验签', async()=>A(id).dec(msg,pkHex,sig,'hex'), '单次操作');
  }
}
/* ---- SPHINCS+ ---- */
try{
  const sk=new Uint8Array(64); for(let i=0;i<64;i++)sk[i]=(i*7+3)&255;
  const pk=new Uint8Array(32); for(let i=0;i<32;i++)pk[i]=(i*11+5)&255;
  await T('sphincs 签名', ()=>A('sphincs').enc(msg,hex(sk),'','hex'), '单次操作');
}catch(e){ out['sphincs 签名']={err:e.message.slice(0,50)}; }

console.log('===RESULT4===');
for(const [id,v] of Object.entries(out)) console.log(id+'|'+(v.err?'ERR:'+v.err:v.ms.toFixed(2))+'|'+v.kind);
})();
