const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
// POLYVAL
let pp=0,pv=JSON.parse(fs.readFileSync("testvectors/polyval_official.json","utf8"));
pv.forEach((v,i)=>{ try{ if(bytesToHex(polyvalHash(H(v.key),H(v.msg)))===v.hash) pp++; else if(pp<i) console.log("PV#"+i+" exp="+v.hash+" got="+bytesToHex(polyvalHash(H(v.key),H(v.msg)))); }catch(e){ if(pp<i)console.log("PV#"+i+" 抛错 "+e.message);} });
console.log("POLYVAL 官方: PASS "+pp+"/"+pv.length);
// XCTR
let xp=0,xv=JSON.parse(fs.readFileSync("testvectors/xctr_official.json","utf8"));
xv.forEach((v,i)=>{ try{ const aes=ff1AesEcbFn(H(v.key)); const got=bytesToHex(hctr2Xctr(aes,H(v.pt),H(v.nonce)));
  if(got===v.ct) xp++; else if(xp<i) console.log("XCTR#"+i+" len="+v.pt.length/2+" exp="+v.ct.slice(0,48)+" got="+got.slice(0,48)); }catch(e){ if(xp<i)console.log("XCTR#"+i+" 抛错 "+e.message);} });
console.log("XCTR 官方: PASS "+xp+"/"+xv.length);
