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
  if(bytesToHex(kp.sk)===v.sk)pass++;else{fail++;console.log("  ✗ SK");}
}
console.log("SPHINCS+ 密钥 vs PySPX(3组×2项): 通过 "+pass+" / 失败 "+fail);
// 导出「我方签名」供 PySPX 验，并准备验 PySPX 签名
const out=[];
for(const v of V){
  const kp=spxGenKeypair(hexToBytes(v.seed));
  const msg=hexToBytes(v.msg);
  out.push({seed:v.seed,msg:v.msg,
    mineSig:bytesToHex(spxSign(msg,kp.sk,new Uint8Array(16))),
    pySig:v.sig, myVerifyPy:spxVerify(msg,hexToBytes(v.sig),kp.pk)});
}
fs.writeFileSync("_spx_cross.json",JSON.stringify(out));
console.log("我方验 PySPX 签名:", out.map(o=>o.myVerifyPy).join(","));
