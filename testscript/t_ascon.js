const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){},dispatchEvent(e){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
vm.runInThisContext(fs.readFileSync("crypto_ascon.js","utf8"));
const a=ALGOS.find(x=>x.id==="ascon128a");
if(!a){console.log("ascon128a 未注册");process.exit(1);}
const txt=fs.readFileSync("testvectors/ascon128a_aead_kat.txt","utf8");
const blocks=txt.split(/\n\s*\n/).filter(s=>s.includes("Count"));
const H=s=>{s=(s||"").trim(); if(!s)return new Uint8Array(0); if(s.length%2)s="0"+s; const m=s.match(/../g); return m?new Uint8Array(m.map(x=>parseInt(x,16))):new Uint8Array(0);};
let ok=0,bad=0,dec=0,decBad=0,fails=[];
for(const b of blocks){
  const g=k=>{const m=b.match(new RegExp("^"+k+"[ \\t]*=[ \\t]*([0-9A-Fa-f]*)[ \\t]*$","m"));return m?m[1].trim():"";};
  const key=H(g("Key")),nonce=H(g("Nonce")),pt=H(g("PT")),ad=H(g("AD")),ct=H(g("CT"));
  if(key.length!==16||nonce.length!==16)continue;
  // 直接用底层：通过 hex 输入 "AD,PT"
  const inp=(ad.length?Buffer.from(ad).toString("hex"):"")+","+Buffer.from(pt).toString("hex");
  let got;
  try{ got=a.enc(inp,Buffer.from(key).toString("hex"),Buffer.from(nonce).toString("hex"),"hex"); }
  catch(e){ bad++; fails.push("enc err "+e.message); continue; }
  const gotHex=(typeof got==="string"?got:Buffer.from(got).toString("hex")).replace(/\s/g,"");
  const wantHex=Buffer.from(ct).toString("hex");
  if(gotHex===wantHex) ok++; else {bad++; if(fails.length<3)fails.push("CT\n got "+gotHex+"\n want "+wantHex);}
  // 解密
  try{ const p=a.dec(Buffer.from(ad).toString("hex")+","+Buffer.from(ct).toString("hex"),Buffer.from(key).toString("hex"),Buffer.from(nonce).toString("hex"),"hex");
    const ph=(typeof p==="string"?p:Buffer.from(p).toString("hex")).replace(/\s/g,"");
    if(ph===Buffer.from(pt).toString("hex"))dec++; else decBad++;
  }catch(e){decBad++;}
}
console.log("Ascon-128a 加密 vs 官方KAT: 通过 "+ok+" / 失败 "+bad);
console.log("Ascon-128a 解密往返:        通过 "+dec+" / 失败 "+decBad);
fails.slice(0,3).forEach(f=>console.log(f));

/* ---- Ascon-Hash256 vs 官方 LWC_HASH_KAT ---- */
const h=ALGOS.find(x=>x.id==="ascon-hash256");
if(h){
  const ht=fs.readFileSync("testvectors/ascon_hash256_kat.txt","utf8");
  const hb=ht.split(/\n\s*\n/).filter(s=>s.includes("Count"));
  let hok=0,hbad=0,hf=null;
  for(const b of hb){
    const g=k=>{const m=b.match(new RegExp("^"+k+"[ \\t]*=[ \\t]*([0-9A-Fa-f]*)[ \\t]*$","m"));return m?m[1].trim():"";};
    const msg=g("Msg"),md=g("MD").toLowerCase();
    if(!md)continue;
    const r=h.enc(H(msg),"","","hex");
    const got=(typeof r==="string"?r:Buffer.from(r).toString("hex")).replace(/\s/g,"").toLowerCase();
    if(got===md)hok++; else {hbad++; if(!hf)hf={msg,got,md};}
  }
  console.log("Ascon-Hash256 vs 官方KAT: 通过 "+hok+" / 失败 "+hbad);
  if(hf)console.log("  首个失败 msg="+hf.msg+"\n   got "+hf.got+"\n   want "+hf.md);
} else console.log("ascon-hash256 未注册");

console.log("算法总数 "+ALGOS.length);
