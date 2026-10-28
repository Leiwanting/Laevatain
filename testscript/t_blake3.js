const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=(id)=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
["Encryption_and_decryption_logic.js","crypto_tables.js","crypto_core.js","crypto_modes.js"].forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const V=JSON.parse(fs.readFileSync("vectors_blake3.json","utf8"));
const a=ALGOS.filter(x=>x.id==="blake3")[0];
let P=0,F=0;
(async()=>{
for(const v of V){
  const param = v.key?("key="+v.key):(v.ctx?("dk="+v.ctx):"");
  const o=await a.enc(hexToBytes(v.in),"",param,"hex");
  if(o===v.out)P++;else{F++;if(F<=3)console.log("  ✗ len="+v.len+" 得"+o.slice(0,32)+" 期"+v.out.slice(0,32));}
}
console.log("BLAKE3 vs 官方实现(21组，含密钥/派生/树哈希边界): 通过 "+P+" / 失败 "+F);
process.exit(F?1:0);
})();
