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

/* ---- 配对：BN254 G2 生成元（4 个 FQ 分量，各 32 字节，共 128） ---- */
const G2hex=B(BN_G2[0][0])+B(BN_G2[0][1])+B(BN_G2[1][0])+B(BN_G2[1][1]);
await T('BN254 配对 e(P,Q)', ()=>A('bn254-pairing').enc(msg,G2hex,'','hex'));
await T('BN254 配对(kzg条目)', ()=>A('kzg-pairing').enc(msg,G2hex,'','hex'));
/* ---- BLS12-381 与 SM9：用各自生成元 ---- */
try{
  const g2=BLS_G2||null;
  if(g2){ /* 结构未知，跳过 */ }
}catch(e){}
await T('BLS 签名', ()=>A('bls_sig').enc(msg,hex(new Uint8Array(32).fill(7)),'','hex'));
await T('SM9 签名', ()=>A('sm9-sign').enc(msg,'0001'+'00'.repeat(30),'alice@domain','hex'));
/* ---- KZG 承诺：系数用空格分隔文本 ---- */
{
  const txt='3 5 7 11 13';
  await T('KZG 承诺+开放', ()=>A('kzg-commit').enc(new TextEncoder().encode(txt),'12345','999','hex'));
}
/* ---- Ristretto255 复核 ---- */
await T('Ristretto255 标量→点', ()=>A('ristretto255').enc(msg,hex(new Uint8Array(32).fill(7)),'','hex'));
await T('Ristretto255 标量→点(二次)', ()=>A('ristretto255').enc(msg,hex(new Uint8Array(32).fill(7)),'','hex'));
await T('Decaf448 标量→点', ()=>A('decaf448').enc(msg,hex(new Uint8Array(32).fill(7)),'','hex'));
/* ---- Bulletproofs 验证 ---- */
try{
  const V=JSON.parse(fs.readFileSync('bp_vectors.js','utf8').toString().replace(/^[^{]*/,'').replace(/;?\s*$/,''));
}catch(e){}
/* ---- 门限签名 ---- */
await T('SPAKE2+ 注册', ()=>A('spake2p-register').enc(msg,'password123','','hex'));
await T('SM2 密钥协商', ()=>A('sm2-keyxchg').enc(msg,'1234567812345678','','hex'));
/* ---- Ed25519 变体 ---- */
{
  const sk=hex(new Uint8Array(32).fill(11));
  await T('Ed25519ctx 签名', ()=>A('ed25519-ctx').enc(msg,sk,'','hex'));
  await T('Ed25519ph 签名', ()=>A('ed25519-ph').enc(msg,sk,'','hex'));
}
/* ---- HPKE 解密：用 x25519 原始私钥（PKCS#8 末 32 字节） ---- */
{
  const r=await A('x25519').enc(msg,'','','hex');
  const pk=(r.match(/公钥[^：:]*[：:]\s*([0-9a-fA-F]{64})/)||[])[1];
  const p8=(r.match(/私钥[^：:]*[：:]\s*([0-9a-fA-F]+)/)||[])[1];
  const sk=p8&&p8.length>64?p8.slice(-64):p8;
  if(pk&&sk){
    const ct=await A('hpke').enc(msg,'',pk,'hex');
    await T('HPKE 解密', async()=>A('hpke').dec(ct,sk,'','hex'));
  } else out['HPKE 解密']={err:'extract fail'};
}
console.log('===RESULT6===');
for(const [id,v] of Object.entries(out)) console.log(id+'|'+(v.err?'ERR:'+v.err:v.ms.toFixed(2))+'|'+v.kind);
})();
