const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const out=[];
let s=12345; const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff; return (s>>>16)&255;};
for(let n=0;n<40;n++){
  const k=new Uint8Array(8), p=new Uint8Array(8);
  for(let i=0;i<8;i++){k[i]=rnd();p[i]=rnd();}
  const f=desMakeBlockFn(k);
  out.push({k:bytesToHex(k),p:bytesToHex(p),e:bytesToHex(f.enc(p)),d:bytesToHex(f.dec(new Uint8Array(f.enc(p))))});
}
/* 3DES 24 字节密钥 */
const out3=[];
for(let n=0;n<20;n++){
  const k=new Uint8Array(24), p=new Uint8Array(8);
  for(let i=0;i<24;i++)k[i]=rnd();
  for(let i=0;i<8;i++)p[i]=rnd();
  const f=des3MakeBlockFn(k);
  out3.push({k:bytesToHex(k),p:bytesToHex(p),e:bytesToHex(f.enc(p)),d:bytesToHex(f.dec(new Uint8Array(f.enc(p))))});
}
fs.writeFileSync("_vec_des.json",JSON.stringify({des:out,des3:out3},null,1));
console.log("已保存 DES "+out.length+" 组 / 3DES "+out3.length+" 组参照输出");
console.log("样例 DES:", out[0].k, out[0].p, "->", out[0].e);
