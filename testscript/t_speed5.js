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
const h2b=s=>Uint8Array.from(s.match(/../g).map(x=>parseInt(x,16)));
const b642b=s=>Uint8Array.from(Buffer.from(s,'base64'));
async function once(fn){const t0=process.hrtime.bigint();const r=await fn();return {r,ms:Number(process.hrtime.bigint()-t0)/1e6};}
async function rep(fn,n){let b=Infinity,l;for(let i=0;i<n;i++){const o=await once(fn);if(o.ms<b)b=o.ms;l=o.r;}return {r:l,ms:b};}
const out={};
async function T(id,fn,kind){ try{const o=await rep(fn,3); out[id]={ms:o.ms,kind:kind||'单次操作'};}catch(e){ out[id]={err:e.message.slice(0,70)}; } }
const msg=new Uint8Array(64); for(let i=0;i<64;i++)msg[i]=65+(i%26);

/* 用 keygen 取密钥对 */
async function gen(type){
  const r=await A('keygen').enc(new Uint8Array(1),'',type,'hex');
  const priv=(r.match(/私钥[^（(]*[（(]?[^）)]*[）)]?[：:]\s*([0-9a-fA-F]+)/)||[])[1];
  const pub=(r.match(/公钥[^（(]*[（(][^）)]*[）)][：:]\s*([0-9a-fA-F]+)/)||[])[1];
  return {priv,pub,raw:r};
}
/* --- ecc-ecdsa / sm2-sign / dsa：私钥签名 + 公钥验签 --- */
for(const [type,sigId,label] of [['ecc','ecc-ecdsa','ECDSA P-256'],['sm2','sm2-sign','SM2'],['dsa','dsa','DSA']]){
  let g;
  try{ g=await gen(type); }catch(e){ out[label+' 签名']={err:'keygen:'+e.message.slice(0,40)}; continue; }
  if(!g.priv||!g.pub){ out[label+' 签名']={err:'parse fail'}; continue; }
  let sig='';
  await T(label+' 签名', async()=>{const r=await A(sigId).enc(msg,g.priv,'','hex'); sig=r; return r;});
  await T(label+' 验签', async()=>A(sigId).dec(msg,g.pub,sig,'hex'));
}
/* --- ecc-ecdh / ecc-ecies --- */
{
  const g=await gen('ecc');
  if(g.priv&&g.pub){
    await T('ECDH 协商', async()=>A('ecc-ecdh').enc(msg,g.priv,g.pub,'hex'));
    await T('ECIES 加密', async()=>A('ecc-ecies').enc(msg,g.priv,g.pub,'hex'));
  }
}
/* --- elgamal / dh --- */
{
  const g=await gen('elgamal');
  const gd=await gen('dh');
  if(g.priv){
    const y=(g.raw.match(/公钥 y[^：:]*[：:]\s*([0-9a-fA-F]+)/)||[])[1];
    if(y){
      await T('ElGamal 加密', async()=>A('elgamal').enc(msg,g.priv,y,'hex'));
      const ct=await A('elgamal').enc(msg,g.priv,y,'hex');
      await T('ElGamal 解密', async()=>A('elgamal').dec(ct,g.priv,'','hex'));
    }
  }
  if(gd.priv){
    const y2=(gd.raw.match(/公钥[^：:]*[：:]\s*([0-9a-fA-F]+)/)||[])[1];
    if(y2) await T('DH 协商', async()=>A('dh-modp2').enc(msg,gd.priv,y2,'hex'));
  }
}
/* --- sm2-enc --- */
{
  const g=await gen('sm2');
  if(g.priv&&g.pub){
    const ct=await A('sm2-enc').enc(msg,g.priv,g.pub,'hex');
    await T('SM2 加密', async()=>A('sm2-enc').enc(msg,g.priv,g.pub,'hex'));
    await T('SM2 解密', async()=>A('sm2-enc').dec(ct,g.priv,'','hex'));
  }
}
/* --- RSA：用 node crypto 生成 PEM --- */
{
  const nc=require('crypto');
  const {publicKey,privateKey}=nc.generateKeyPairSync('rsa',{modulusLength:2048,
    publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  const pubB=Buffer.from(publicKey), privB=Buffer.from(privateKey);
  const ct=await A('rsa').enc(msg.slice(0,32),pubB,'','base64');
  await T('RSA-2048 加密', async()=>A('rsa').enc(msg.slice(0,32),pubB,'','base64'));
  await T('RSA-2048 解密', async()=>A('rsa').dec(ct,privB,'','base64'));
  const sg=await A('rsa-pss').enc(msg,privB,'','base64');
  await T('RSA-PSS 签名', async()=>A('rsa-pss').enc(msg,privB,'','base64'));
  await T('RSA-PSS 验签', async()=>A('rsa-pss').dec(msg,pubB,sg,'base64'));
}
/* --- Ed25519 / ECDSA P-256/P-384（浏览器原生 PEM 路径） --- */
{
  const nc=require('crypto');
  const ed=nc.generateKeyPairSync('ed25519',{publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  const pb=Buffer.from(ed.publicKey), sb=Buffer.from(ed.privateKey);
  const sg=await A('ed25519').enc(msg,sb,'','base64');
  await T('Ed25519 签名', async()=>A('ed25519').enc(msg,sb,'','base64'));
  await T('Ed25519 验签', async()=>A('ed25519').dec(msg,pb,sg,'base64'));
  for(const [curve,id,label] of [['prime256v1','ecdsa-p256','ECDSA P-256(原生)'],['secp384r1','ecdsa-p384','ECDSA P-384(原生)']]){
    const kp=nc.generateKeyPairSync('ec',{namedCurve:curve,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
    const pb2=Buffer.from(kp.publicKey), sb2=Buffer.from(kp.privateKey);
    const s2=await A(id).enc(msg,sb2,'','base64');
    await T(label+' 签名', async()=>A(id).enc(msg,sb2,'','base64'));
    await T(label+' 验签', async()=>A(id).dec(msg,pb2,s2,'base64'));
  }
  const kp2=nc.generateKeyPairSync('ec',{namedCurve:'prime256v1',publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  await T('ECDH P-256 协商', async()=>A('ecdh-p256').enc(msg,Buffer.from(kp2.privateKey),Buffer.from(kp2.publicKey),'hex'));
}
/* --- x25519 --- */
await T('X25519 密钥对', ()=>A('x25519').enc(msg,'','','hex'));
/* --- hpke（先取一个 x25519 公钥） --- */
{
  const r=await A('x25519').enc(msg,'','','hex');
  const pk=(r.match(/公钥[^：:]*[：:]\s*([0-9a-fA-F]{64})/)||[])[1];
  const sk=(r.match(/私钥[^：:]*[：:]\s*([0-9a-fA-F]{64})/)||[])[1];
  if(pk&&sk){
    await T('HPKE 加密', async()=>A('hpke').enc(msg,'',pk,'hex'));
    const ct=await A('hpke').enc(msg,'',pk,'hex');
    await T('HPKE 解密', async()=>A('hpke').dec(ct,sk,'','hex'));
  }
}
console.log('===RESULT5===');
for(const [id,v] of Object.entries(out)) console.log(id+'|'+(v.err?'ERR:'+v.err:v.ms.toFixed(2))+'|'+v.kind);
})();
