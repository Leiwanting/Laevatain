const fs=require("fs"),vm=require("vm");
global.crypto=require("crypto").webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
const best=(fn,reps)=>{let t=Infinity;for(let r=0;r<reps;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6; if(ms<t)t=ms;} return t;};
const hex=u=>Array.from(u).map(b=>b.toString(16).padStart(2,'0')).join('');
const out={};
const tryOne=(id,mkKey,mkParam)=>{
  const a=ALGOS.find(x=>x.id===id); if(!a) return;
  const key=mkKey();
  try{
    const p1=mkParam();
    const probe=a.enc(new Uint8Array(64), key, p1);
    if(!probe || typeof probe.then==='function') return;
    if(!(probe instanceof Uint8Array) || probe.length===0) return;
    const rE=()=>a.enc(data, key, mkParam()); rE();
    let dec='—';
    try{
      const ct=a.enc(new Uint8Array(64), key, mkParam());
      const rD=()=>a.dec(ct, key, mkParam()); rD();
      dec=best(rD,3).toFixed(2);
    }catch(e){}
    out[id]={enc:best(rE,3).toFixed(2), dec};
  }catch(e){ out[id]=null; }
};
const k=n=>{const u=new Uint8Array(n);for(let i=0;i<n;i++)u[i]=i+1;return u;};
/* Salsa20：key 32 + nonce 8 */
tryOne('salsa20', ()=>k(32), ()=>hex(k(8)));
/* ZUC：key 16 hex + iv 16 hex */
tryOne('zuc', ()=>hex(k(16)), ()=>hex(k(16)));
/* HCTR2：key 16 hex + tweak */
tryOne('hctr2', ()=>hex(k(16)), ()=>'');
/* AES-GCM-SIV：key 16 hex */
tryOne('aes-gcm-siv', ()=>hex(k(16)), ()=>'');
/* FF3：key hex + tweak */
tryOne('ff3', ()=>hex(k(16)), ()=>'');
/* XXTEA key 16 */
tryOne('xxtea', ()=>hex(k(16)), ()=>'');
console.log('===补测===');
for(const [id,v] of Object.entries(out)){
  console.log(id+'|'+(v?v.enc+'|'+v.dec:'SKIP'));
}
