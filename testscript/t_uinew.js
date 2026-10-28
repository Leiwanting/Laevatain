const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;global.requestAnimationFrame=f=>setTimeout(f,0);
const mk=(id)=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{_s:new Set(),add(c){this._s.add(c);},remove(c){this._s.delete(c);},toggle(c,v){if(v===undefined)this._s.has(c)?this._s.delete(c):this._s.add(c);else v?this._s.add(c):this._s.delete(c);},contains(c){return this._s.has(c);}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:"",files:[]});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const el=id=>document.getElementById(id);
function setSel(id,val){const e=el(id);e.value=val;(e._h['change']||[]).forEach(f=>f.call(e,{type:'change'}));}
async function click(id){const b=el(id);const hs=b._h['click']||[];for(const f of hs){await f.call(b,{type:'click'});}}
const PT='Hello, IGE & 容器与密钥模式 端到端测试文本 12345';
let pass=0,fail=0,bad=[];
async function roundtrip(name,cfg){
  // 重置关键字段
  ['iv','salt','key','param','aad'].forEach(k=>{el(k).value='';});
  setSel('algo',cfg.algo||'aes256');
  setSel('mode',cfg.mode||'CBC');
  setSel('keyMode',cfg.keyMode||'pw');
  setSel('kdf',cfg.kdf||'kdf2');
  setSel('container',cfg.container||'none');
  if(el('fmt')) el('fmt').value=cfg.fmt||'base64';
  if(el('padding')) setSel('padding',cfg.pad||'PKCS7');
  el('key').value=(cfg.key!==undefined)?cfg.key:((cfg.keyMode&&cfg.keyMode!=='pw')?'':'pw123');
  if(cfg.iter) el('kdfIter').value=String(cfg.iter);
  el('input').value=PT;
  try{
    await click('btnEnc');
    const ct=el('output').value;
    if(!ct){fail++;bad.push(name+': 加密无输出 | msg='+String(el('msg').textContent||el('msg').value||'').slice(0,120)+' | pad='+el('padding').value+' algo='+el('algo').value);return;}
    el('input').value=ct;
    await click('btnDec');
    const back=el('output').value;
    if(back===PT){pass++;console.log('  ✓ '+name);}
    else{fail++;bad.push(name+': 解密 mismatch | msg='+String(el('msg').textContent||el('msg').value||'').slice(0,120)+' | got '+String(back).slice(0,60));}
  }catch(e){fail++;bad.push(name+': '+String(e&&e.message||e).slice(0,160));}
}
(async()=>{
await roundtrip('warmup',{mode:'CBC'}); pass=0;fail=0;bad=[];
console.log('=== 容器 ===');
for(const c of ['none','ivct','json','pem','openssl-nosalt','openssl','cryptojs'])
  await roundtrip('container='+c,{container:c,mode:'CBC'});
console.log('=== 密钥模式 ===');
await roundtrip('keyMode=raw(Hex)',{keyMode:'raw',key:'000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'});
await roundtrip('keyMode=rawb64',{keyMode:'rawb64',key:Buffer.from(Buffer.alloc(32,7)).toString('base64')});
await roundtrip('keyMode=rawtext',{keyMode:'rawtext',key:'0123456789abcdefghijklmnopqrstuv'});
await roundtrip('keyMode=rawdec',{keyMode:'rawdec',key:Array.from(Buffer.alloc(32,9)).join(',')});
await roundtrip('keyMode=rand',{keyMode:'rand',key:''});
console.log('=== 口令派生 ===');
for(const k of ['kdf2','scrypt','bcrypt','pbkdf1','bcryptpbkdf','sp56a','sp56c','tls12','x942'])
  await roundtrip('kdf='+k,{kdf:k,iter:(k==='kdf2'?1000:undefined)});
console.log('=== 输出格式 ===');
for(const f of ['base64','hex','hexupper','base64url','jsonarr','mime64','z85','base45','base32','base58','ascii85'])
  await roundtrip('fmt='+f,{fmt:f,mode:'CBC'});
console.log('=== 模式 ===');
for(const m of ['CBC','IGE','PCBC','CTR','CFB','OFB','ECB'])
  await roundtrip('mode='+m,{mode:m});
console.log('PASS',pass,'FAIL',fail);bad.forEach(b=>console.log('  ✗ '+b));
})();
