const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=(id)=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
["Encryption_and_decryption_logic.js","crypto_tables.js","crypto_core.js","crypto_modes.js","pqc_core.js"].forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const V=JSON.parse(fs.readFileSync("vectors_pqc.json","utf8")).mlkem;
const KOF={"ML-KEM-512":2,"ML-KEM-768":3,"ML-KEM-1024":4};
let P=0,F=0;
for(const v of V){
  const k=KOF[v.alg];
  const got=bytesToHex(mlkemDecaps(k,hexToBytes(v.dk),hexToBytes(v.c)));
  if(got===v.ss){P++;}else{F++;if(F<=2)console.log(`  ✗ ${v.alg} 得${got.slice(0,24)}… 期${v.ss.slice(0,24)}…`);}
}
console.log("ML-KEM 解封装 vs kyber_py(9组): 通过 "+P+" / 失败 "+F);
process.exit(F?1:0);
