const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;global.requestAnimationFrame=f=>setTimeout(f,0);
const mk=(id)=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{_s:new Set(),add(c){this._s.add(c);},remove(c){this._s.delete(c);},toggle(c,v){if(v===undefined)this._s.has(c)?this._s.delete(c):this._s.add(c);else v?this._s.add(c):this._s.delete(c);},contains(c){return this._s.has(c);}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:"",files:[]});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
const html=fs.readFileSync("index.html","utf8");
const files=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
let fail=0;
files.forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){fail++;console.log('LOAD-FAIL',f,e.message.slice(0,120));}});
console.log('scripts:',files.length,'| load fail:',fail);
const ids={},dup=[];
ALGOS.forEach(o=>{ids[o.id]=(ids[o.id]||0)+1;});
Object.keys(ids).forEach(k=>{if(ids[k]>1)dup.push(k)});
console.log('ALGOS:',ALGOS.length,'| dup:',dup.length,dup.slice(0,5).join(','));
const long=ALGOS.filter(o=>o.info&&o.info.length>200);
console.log('info>200:',long.length);
console.log('OUT_FORMATS:',Object.keys(OUT_FORMATS).length);
const A={};ALGOS.forEach(o=>A[o.id]=o);
// Base85 往返（全长度）
let p=0,f2=0;
if(A['base85']){
  for(let n=0;n<=64;n++){
    const pt=new Uint8Array(n);for(let i=0;i<n;i++)pt[i]=(i*13+5)&0xff;
    try{
      const c=A['base85'].enc(pt,'','','text');
      const d=A['base85'].dec(c,'','','hex');
      const got=typeof d==='string'?d:(global.bytesToHex?global.bytesToHex(new Uint8Array(d)):'');
      if(got.replace(/\s/g,'')===global.bytesToHex(pt))p++;else{f2++;console.log('  b85 fail n='+n+' got '+String(got).slice(0,40));}
    }catch(e){f2++;console.log('  b85 err n='+n+': '+e.message.slice(0,60));}
  }
  console.log('base85 roundtrip: pass',p,'fail',f2);
}
// BIP-39
if(A['bip39-mnemonic']){
  try{
    const m=A['bip39-mnemonic'].enc(new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),'','','text');
    console.log('bip39 mnemonic ok:',String(m).slice(0,60));
  }catch(e){console.log('bip39 FAIL:',e.message.slice(0,100));}
}
