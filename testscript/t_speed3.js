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
const small=new Uint8Array(64); for(let i=0;i<64;i++)small[i]=65+(i%26);
const hex=u=>Array.from(u).map(b=>b.toString(16).padStart(2,'0')).join('');
const H=n=>{const u=new Uint8Array(n);for(let i=0;i<n;i++)u[i]=(i*7+3)&255;return hex(u);};
async function once(fn){const t0=process.hrtime.bigint();const r=await fn();return {r,ms:Number(process.hrtime.bigint()-t0)/1e6};}
async function rep(fn,n){let b=Infinity,l;for(let i=0;i<n;i++){const o=await once(fn);if(o.ms<b)b=o.ms;l=o.r;}return {r:l,ms:b};}
const out={};
async function T(id,fn,kind,note){
  try{ const o=await rep(fn,3); out[id]={ms:o.ms,kind:kind||'单次操作',note:note||''}; }
  catch(e){ out[id]={err:e.message.slice(0,60)}; }
}

/* 群运算 / 派生（无需外部密钥） */
await T('ristretto255', ()=>A('ristretto255').enc(small,H(32),'','hex'), '标量→点');
await T('decaf448',     ()=>A('decaf448').enc(small,H(32),'','hex'), '标量→点');
await T('bip32',        ()=>A('bip32').enc(small,H(32),'m/0\'/1/2\'','hex'), '派生 3 级路径');
await T('vss',          ()=>A('vss').enc(small,'123456789','2,5','hex'), 't=2,n=5 分发');
await T('dkg',          ()=>A('dkg').enc(small,'','2,5','hex'), 't=2,n=5');
await T('spake2p-register',()=>A('spake2p-register').enc(small,'password123','','hex'), '口令→w0/w1/L');
await T('hpke',         ()=>A('hpke').enc(small,'','','hex'), 'X25519+HKDF+AES-GCM 加密');

/* 签名类：自造 Hex 私钥（格式正确即可跑通算术） */
await T('schnorr',  ()=>A('schnorr').enc(small,H(32),'','hex'), 'secp256k1 签名');
await T('x448',     ()=>A('x448').enc(small,H(56),H(56),'hex'), '私钥×公钥');
await T('ed448',    ()=>A('ed448').enc(small,H(57),'','hex'), '自签自验');
await T('bls_sig',  ()=>A('bls_sig').enc(small,H(32),'','hex'), 'BLS12-381 签名');
await T('sm9-sign', ()=>A('sm9-sign').enc(small,'0001'+'00'.repeat(30),'alice@domain','hex'), 'SM9 签名');
await T('kzg-commit',()=>A('kzg-commit').enc(new Uint8Array([1,2,3,4,5,6,7,8]),'12345','999','hex'), '8 次多项式承诺');

/* 配对：用生成元 */
await T('bn254-pairing',()=>A('bn254-pairing').enc(small,'','','hex'), 'e(P,Q)');
await T('kzg-pairing',  ()=>A('kzg-pairing').enc(small,'','','hex'), 'e(P,Q)');
await T('bls_pair',     ()=>A('bls_pair').enc(small,'','','hex'), 'e(P,Q)');
await T('sm9-pairing',  ()=>A('sm9-pairing').enc(small,'','','hex'), 'e(P,Q)');

/* 密钥生成 */
await T('keygen-ecc', ()=>A('keygen').enc(small,'','ecc','hex'), 'ECC P-256 密钥对');
await T('keygen-sm2', ()=>A('keygen').enc(small,'','sm2','hex'), 'SM2 密钥对');
await T('keygen-dsa', ()=>A('keygen').enc(small,'','dsa','hex'), 'DSA 密钥对');
await T('keygen-rsa2048', ()=>A('keygen').enc(small,'','rsa','hex'), 'RSA 密钥对');

/* 后量子：看是否需要先生成密钥 */
await T('mlkem512', ()=>A('mlkem512').enc(small,'','','hex'), '封装/解封');
await T('mldsa44',  ()=>A('mldsa44').enc(small,'','','hex'), '签名');

console.log('===RESULT2===');
for(const [id,v] of Object.entries(out)){
  console.log(id+'|'+(v.err?'ERR:'+v.err:v.ms.toFixed(2))+'|'+v.kind+'|'+(v.note||''));
}
})();
