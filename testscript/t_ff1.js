const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=(id)=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
["Encryption_and_decryption_logic.js","crypto_tables.js","crypto_core.js","crypto_modes.js"].forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
/* NIST SP 800-38G FF1 官方样本（多来源一致） */
const K128=hexToBytes("2B7E151628AED2A6ABF7158809CF4F3C");
const K192=hexToBytes("2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F");
const K256=hexToBytes("2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F7F036D6F04FC6A94");
const V=[
 {name:"AES-128 radix10 无tweak",k:K128,t:"",r:10,pt:"0123456789",ct:"2433477484"},
 {name:"AES-128 radix10 tweak",  k:K128,t:"39383736353433323130",r:10,pt:"0123456789",ct:"6124200773"},
 {name:"AES-128 radix36 tweak",  k:K128,t:"3737373770717273373737",r:36,pt:"0123456789abcdefghi",ct:"a9tv40mll9kdu509eum"},
 {name:"AES-192 radix10 无tweak",k:K192,t:"",r:10,pt:"0123456789",ct:"2830668132"},
 {name:"AES-192 radix10 tweak",  k:K192,t:"39383736353433323130",r:10,pt:"0123456789",ct:"2496655549"},
];
let P=0,F=0;
for(const v of V){
  const tw=v.t?hexToBytes(v.t):new Uint8Array(0);
  let ct="";
  try{ ct=ff1EncryptText(v.pt,v.k,tw,v.r); }catch(e){ F++; console.log("  ✗ "+v.name+" 加密异常: "+e.message); continue; }
  if(ct===v.ct){ P++; }else{ F++; console.log("  ✗ "+v.name+" 加密 得"+ct+" 期"+v.ct); }
  let pt="";
  try{ pt=ff1DecryptText(v.ct,v.k,tw,v.r); }catch(e){ F++; console.log("  ✗ "+v.name+" 解密异常: "+e.message); continue; }
  if(pt===v.pt){ P++; }else{ F++; console.log("  ✗ "+v.name+" 解密 得"+pt+" 期"+v.pt); }
}
console.log("FF1 vs NIST SP 800-38G 官方样本: 通过 "+P+" / 失败 "+F+"  (共"+V.length*2+"项)");
process.exit(F?1:0);
