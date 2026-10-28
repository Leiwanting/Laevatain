const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=(id)=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
["Encryption_and_decryption_logic.js","crypto_tables.js","crypto_core.js","crypto_modes.js","pqc_core.js","pqc_dsa.js","bls_const.js","pqc_bls.js","crypto_sphincs+.js"].forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const V=JSON.parse(fs.readFileSync("vec_spx.json","utf8"));
let pass=0,fail=0;
for(const v of V){
  const kp=spxGenKeypair(hexToBytes(v.seed));
  if(bytesToHex(kp.pk)===v.pk)pass++;else{fail++;if(fail<3)console.log("  ✗ PK\n     JS="+bytesToHex(kp.pk)+"\n     期="+v.pk);}
}
console.log("SPHINCS+ 公钥 vs PySPX: 通过 "+pass+" / 失败 "+fail);
