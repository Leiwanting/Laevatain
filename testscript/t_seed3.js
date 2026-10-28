const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=(id)=>({id,value:"",textContent:"",_h:{},addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},options:[],innerHTML:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
["Encryption_and_decryption_logic.js","crypto_tables.js","crypto_core.js","crypto_modes.js","seed_tables.js","seed_core.js"].forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const V=JSON.parse(fs.readFileSync("vectors_seed.json","utf8"));
let P=0,F=0;
for(const v of V){
  const K=seedKeySchedule(hexToBytes(v.k));
  if(bytesToHex(seedEncryptBlock(hexToBytes(v.p),K))===v.c)P++;else F++;
  if(bytesToHex(seedDecryptBlock(hexToBytes(v.c),K))===v.p)P++;else F++;
}
console.log("SEED vs OpenSSL(60 组随机): 通过 "+P+" / 失败 "+F);
process.exit(F?1:0);
