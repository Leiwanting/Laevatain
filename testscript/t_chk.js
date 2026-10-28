const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const kw=["ed25519ph","ed25519ctx","ristretto","decaf","sm2","sm9","zuc","schnorr","kzg","verkle","pake","hpke","dkg","vss","bulletproof","rc2","cast","gost","mceliece","hqc","bfv","ckks","fhe","bn254","bn","bls12-377","b377","bip32","xts","hctr","gcm-siv","ff3","whirlpool","adiantum","essiv","eme2","xcb","ff1","sphincs","ml-kem","ml-dsa","frost","gg20","bls"];
for(const k of kw){
  const hit=ALGOS.filter(a=>a.id.toLowerCase().includes(k)||(a.name||"").toLowerCase().includes(k)).map(a=>a.id);
  if(hit.length) console.log(k.padEnd(12)+" -> "+hit.join(", "));
}
console.log("\n算法总数:", ALGOS.length);
