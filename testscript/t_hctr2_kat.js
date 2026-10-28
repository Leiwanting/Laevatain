const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
const tv=JSON.parse(fs.readFileSync("testvectors/hctr2_official.json","utf8"));
let pe=0,pd=0,fe=[],fd=[];
tv.forEach((v,i)=>{
  const K=H(v.key),TW=H(v.tweak),PT=H(v.pt),CT=H(v.ct);
  try{
    const got=hctr2Crypt(K,TW,PT,true);
    if(bytesToHex(got)===v.ct) pe++; else if(fe.length<3) fe.push("加密#"+i+" key="+v.key.slice(0,16)+" len="+PT.length+" tw="+v.tweak.length+"\n  exp="+v.ct.slice(0,64)+"\n  got="+bytesToHex(got).slice(0,64));
  }catch(e){ if(fe.length<3) fe.push("加密#"+i+" 抛错 "+e.message); }
  try{
    const got=hctr2Crypt(K,TW,CT,false);
    if(bytesToHex(got)===v.pt) pd++; else if(fd.length<3) fd.push("解密#"+i+" len="+CT.length+" tw="+v.tweak.length+"\n  exp="+v.pt.slice(0,64)+"\n  got="+bytesToHex(got).slice(0,64));
  }catch(e){ if(fd.length<3) fd.push("解密#"+i+" 抛错 "+e.message); }
});
console.log("HCTR2 官方KAT  加密 PASS "+pe+"/"+tv.length+" FAIL "+(tv.length-pe));
console.log("HCTR2 官方KAT  解密 PASS "+pd+"/"+tv.length+" FAIL "+(tv.length-pd));
[...fe,...fd].slice(0,6).forEach(s=>console.log(s));
