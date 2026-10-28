const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const V=JSON.parse(fs.readFileSync("_s512vec.json","utf8"));
const fns=[["sha512",d=>bytesToHex(sha512Digest(d)),64],
           ["sha512_224",d=>bytesToHex(sha512_224Digest(d)),28],
           ["sha512_256",d=>bytesToHex(sha512_256Digest(d)),32]];
for(const [name,fn,len] of fns){
  let ok=0,bad=0,first=null;
  V.in.forEach((h,i)=>{ const d=Uint8Array.from(Buffer.from(h,"hex"));
    const g=fn(d), e=V.exp[name][i];
    if(g===e) ok++; else {bad++; if(!first)first={len:d.length,g,e};} });
  console.log("  "+name.padEnd(12)+ok+"/"+V.in.length+(bad?"  失败 "+bad+"  首例 len="+first.len+"\n     got "+first.g+"\n     exp "+first.e:"  ✓"));
}
