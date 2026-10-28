const fs=require('fs'),vm=require('vm'),nc=require('crypto');
global.crypto=nc.webcrypto;global.TextEncoder=require('util').TextEncoder;
global.btoa=s=>Buffer.from(s,'binary').toString('base64');global.atob=s=>Buffer.from(s,'base64').toString('binary');
const mk=id=>({id,value:'',_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:'',textContent:''});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:'complete',body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync('index.html','utf8');
for(const f of [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1])) vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const hx=u=>Array.from(u).map(b=>b.toString(16).padStart(2,'0')).join('');
const hb=h=>new Uint8Array(Buffer.from(h,'hex'));
const vs=JSON.parse(fs.readFileSync('testvectors/aes_gcmsiv_cryptography.json','utf8'));
let pe=0,pd=0,fe=0,fd=0,firstE='';
for(const v of vs){
  const key=hb(v.key),nonce=hb(v.nonce),pt=hb(v.pt),aad=hb(v.aad),exp=v.out;
  try{ const r=sivCrypt(key,nonce,pt,aad,true);
    if(hx(r)===exp) pe++; else {fe++; if(!firstE)firstE='exp='+exp+' got='+hx(r);} }catch(e){fe++; if(!firstE)firstE='ERR '+e.message;}
  try{ const ct=hb(exp); const p2=sivCrypt(key,nonce,ct,aad,false);
    if(hx(p2)===v.pt) pd++; else fd++; }catch(e){fd++;}
}
console.log('实际注册的 aes-gcm-siv (crypto_aead_adv.js)  加密 PASS '+pe+' FAIL '+fe+(firstE?'  '+firstE:''));
console.log('                                            解密 PASS '+pd+' FAIL '+fd);
console.log('已注册条目:', typeof ALGOS!=='undefined'? ALGOS.filter(a=>a.id==='aes-gcm-siv').length : '?');
