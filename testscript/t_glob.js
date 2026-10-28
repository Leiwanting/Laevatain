const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const names=["CURVES","CURVES_p256","EC","bigToBytes","bigFromBytes","bigFromHex","bigToHex",
 "sha256Digest","hmacSha256","hkdf","hkdfSha256","sha256","shaDigest","bytesToHex","hexToBytes",
 "concatBytes","strToBytes","bytesToStr","reg","oneway"];
for(const n of names){
  let t="undefined";
  try{ t = eval("typeof "+n); }catch(e){ t="err"; }
  console.log(n.padEnd(16)+" -> "+t);
}
console.log("\n--- EC 方法 ---");
try{
  const C = (typeof CURVES!=='undefined') ? CURVES : null;
  if(C){ console.log("可用曲线:", Object.keys(C).join(", "));
    const p=C.p256||C['p256'];
    if(p){ console.log("p256.byteLen =", p.byteLen);
      console.log("方法:", ["add","mul","neg","double","pointToBytes","bytesToPoint"].filter(m=>typeof p[m]==='function').join(", ")); }
  } else console.log("CURVES 不可访问");
}catch(e){console.log("EC 探测异常:", e.message.slice(0,60));}
