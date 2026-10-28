const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n);}};
// RFC 2144 官方向量
const RFC=[
 {k:"0123456712345678234567893456789A",pt:"0123456789ABCDEF",ct:"238B4FE5847E44B2"},
];
for(const v of RFC){
  const bf=cast5BlockFn(H(v.k));
  const got=bytesToHex(bf.enc(H(v.pt))).toUpperCase();
  ck("RFC "+v.k.length*4+"位: got "+got+" want "+v.ct, got===v.ct.toUpperCase());
  const back=bytesToHex(bf.dec(H(v.ct))).toUpperCase();
  ck("RFC 解密 "+v.k.length*4+"位", back===v.pt.toUpperCase());
}
// pycryptodome 随机向量
const V=JSON.parse(fs.readFileSync("_vec_legacy.json","utf8")).cast5;
let ok=0,od=0;
for(const t of V){
  const bf=cast5BlockFn(H(t.key));
  const got=new Uint8Array(32), pt=H(t.pt);
  for(let i=0;i<32;i+=8) got.set(bf.enc(pt.subarray(i,i+8)),i);
  if(bytesToHex(got)===t.ct) ok++;
  const back=new Uint8Array(32), ct=H(t.ct);
  for(let i=0;i<32;i+=8) back.set(bf.dec(ct.subarray(i,i+8)),i);
  if(bytesToHex(back)===t.pt) od++;
}
ck("vs pycryptodome 加密 "+ok+"/10", ok===10);
ck("vs pycryptodome 解密 "+od+"/10", od===10);
ck("密钥长度校验: 5 字节应报错", (function(){try{cast5BlockFn(H("0001020304"));return false;}catch(e){return /128 位/.test(e.message);}})());
console.log("CAST5: 通过 "+pass+" / 失败 "+fail);
