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
async function once(fn){const t0=process.hrtime.bigint();const r=await fn();return {r,ms:Number(process.hrtime.bigint()-t0)/1e6};}
async function rep(fn,n){let b=Infinity,l;for(let i=0;i<n;i++){const o=await once(fn);if(o.ms<b)b=o.ms;l=o.r;}return {r:l,ms:b};}
const out={};
async function T(id,fn,kind){ try{const o=await rep(fn,3); out[id]={ms:o.ms,kind:kind||'单次操作'};}catch(e){ out[id]={err:e.message.slice(0,70)}; } }
const msg=new Uint8Array(64); for(let i=0;i<64;i++)msg[i]=65+(i%26);
const B=x=>x.toString(16).padStart(64,'0');
const hex=u=>Array.from(u).map(b=>b.toString(16).padStart(2,'0')).join('');

/* SM9 配对 */
const g2=B(SM9_G2[0][0])+B(SM9_G2[0][1])+B(SM9_G2[1][0])+B(SM9_G2[1][1]);
await T('SM9 配对 e(P,Q)', ()=>A('sm9-pairing').enc(msg,g2,'','hex'));
/* BLS12-381 配对：用 G2 生成元 */
try{
  const g2b = (typeof BLS_G2_GEN!=='undefined')?BLS_G2_GEN:(typeof G2_GEN!=='undefined'?G2_GEN:null);
  if(g2b) await T('BLS12-381 配对', ()=>A('bls_pair').enc(msg,hex(g2b),'','hex'));
  else out['BLS12-381 配对']={err:'no gen'};
}catch(e){ out['BLS12-381 配对']={err:e.message.slice(0,50)}; }
/* SPHINCS+ 验签 */
try{
  const sk=hex(new Uint8Array(64).fill(3)), pk=hex(new Uint8Array(32).fill(5));
  const sig=await A('sphincs').enc(msg.slice(0,32),sk,'','hex');
  await T('SPHINCS+ 验签', ()=>A('sphincs').dec(msg.slice(0,32),pk,sig,'hex'));
}catch(e){ out['SPHINCS+ 验签']={err:e.message.slice(0,50)}; }
/* SM2 密钥协商：A 方完整参数 */
try{
  const g=await A('keygen').enc(new Uint8Array(1),'','sm2','hex');
  const d=(g.match(/私钥 d[^（(]*[（(][^）)]*[）)][：:]\s*([0-9a-fA-F]+)/)||[])[1];
  const pub=(g.match(/公钥[^（(]*[（(][^）)]*[）)][：:]\s*([0-9a-fA-F]+)/)||[])[1];
  const rA=hex(new Uint8Array(32).fill(21));
  const p=d+'|'+rA+'|'+pub+'|'+pub+'|1234567812345678|A';
  await T('SM2 密钥协商', ()=>A('sm2-keyxchg').enc(msg,'1234567812345678',p,'hex'));
}catch(e){ out['SM2 密钥协商']={err:e.message.slice(0,50)}; }
/* FROST / GG20 */
try{
  await T('FROST 签名', ()=>A('frost').enc(msg,'','1,2','hex'));
}catch(e){ out['FROST 签名']={err:e.message.slice(0,50)}; }
try{
  await T('GG20 签名', ()=>A('gg20').enc(msg,'','1,2','hex'));
}catch(e){ out['GG20 签名']={err:e.message.slice(0,50)}; }
/* Ristretto255 / Decaf448 DH */
try{
  const r=await A('ristretto255').enc(msg,hex(new Uint8Array(32).fill(9)),'','hex');
  await T('Ristretto255 DH', ()=>A('ristretto255-dh').enc(msg,hex(new Uint8Array(32).fill(9)),r,'hex'));
}catch(e){ out['Ristretto255 DH']={err:e.message.slice(0,50)}; }
/* Bulletproofs：用最小向量 n=8,m=1 */
try{
  const src=fs.readFileSync('bp_vectors.js','utf8');
  const m=src.match(/proofs\s*=\s*(\[[\s\S]*?\n\s*\]);/);
  if(m){
    const proofs=eval(m[1]);
    const p0=proofs[0][0];
    const vc=(src.match(/hex\.decode\("([0-9a-f]{64})"\)/g)||[]).map(x=>x.match(/([0-9a-f]{64})/)[1]);
    await T('Bulletproofs 验证(n=8,m=1)', ()=>A('bulletproof-verify').enc(Uint8Array.from(Buffer.from(p0,'hex')),vc[0],'8','hex'));
  } else out['Bulletproofs 验证(n=8,m=1)']={err:'no vec'};
}catch(e){ out['Bulletproofs 验证(n=8,m=1)']={err:e.message.slice(0,60)}; }
console.log('===RESULT7===');
for(const [id,v] of Object.entries(out)) console.log(id+'|'+(v.err?'ERR:'+v.err:v.ms.toFixed(2))+'|'+v.kind);
})();
