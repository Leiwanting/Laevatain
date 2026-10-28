const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
const V=JSON.parse(fs.readFileSync("_vec_legacy.json","utf8")).rc2;
let ok=0,od=0;
for(const t of V){
  const K=H(t.key),pt=H(t.pt);
  const bf=rc2BlockFn(K, 1024);
  const got=new Uint8Array(32);
  for(let i=0;i<32;i+=8) got.set(bf.enc(pt.subarray(i,i+8)),i);
  if(bytesToHex(got)===t.ct) ok++;
  const back=new Uint8Array(32);
  const ct=H(t.ct);
  for(let i=0;i<32;i+=8) back.set(bf.dec(ct.subarray(i,i+8)),i);
  if(bytesToHex(back)===t.pt) od++;
}
console.log("RC2: 加密 "+ok+"/12  解密 "+od+"/12");
