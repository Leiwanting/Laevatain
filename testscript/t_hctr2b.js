const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
// 长度保持 + 与原位往返
let lp=0;
for(const len of [16,17,31,32,33,48,64,65,255]){
  const K=H("000102030405060708090a0b0c0d0e0f"), TW=H("0011223344556677");
  const pt=new Uint8Array(len); for(let i=0;i<len;i++)pt[i]=i&0xff;
  try{
    const ct=hctr2Crypt(K,TW,pt,true);
    const back=hctr2Crypt(K,TW,ct,false);
    if(ct.length===len && bytesToHex(back)===bytesToHex(pt)) lp++;
  }catch(e){}
}
console.log("HCTR2 长度保持+往返: "+lp+"/9");
