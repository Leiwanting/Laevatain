const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
const V=JSON.parse(fs.readFileSync("_vec_des.json","utf8"));
let ok=0,bad=0,first=null;
for(const t of V.des){ const f=desMakeBlockFn(H(t.k));
  const e=bytesToHex(f.enc(H(t.p))), d=bytesToHex(f.dec(H(t.e)));
  if(e===t.e&&d===t.p) ok++; else { bad++; if(!first) first={t,e,d}; } }
console.log("DES 对照旧实现: "+ok+"/"+V.des.length+" 一致  "+(bad?"失败 "+bad:""));
if(first) console.log("  首例 key="+first.t.k+" pt="+first.t.p+"\n    旧->"+first.t.e+"\n    新->"+first.e);
let ok3=0,bad3=0,first3=null;
for(const t of V.des3){ const f=des3MakeBlockFn(H(t.k));
  const e=bytesToHex(f.enc(H(t.p))), d=bytesToHex(f.dec(H(t.e)));
  if(e===t.e&&d===t.p) ok3++; else { bad3++; if(!first3) first3={t,e,d}; } }
console.log("3DES 对照旧实现: "+ok3+"/"+V.des3.length+" 一致  "+(bad3?"失败 "+bad3:""));
if(first3) console.log("  首例 pt="+first3.t.p+"\n    旧->"+first3.t.e+"\n    新->"+first3.e);
