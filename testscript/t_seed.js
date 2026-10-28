const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=(id)=>({id,value:"",textContent:"",_h:{},addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},options:[],innerHTML:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
["Encryption_and_decryption_logic.js","crypto_tables.js","crypto_core.js","crypto_modes.js","seed_tables.js","seed_core.js"].forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
/* RFC 4269 Appendix B 官方测试向量 */
const V=[
{k:"00000000000000000000000000000000",p:"000102030405060708090A0B0C0D0E0F",c:"5EBAC6E0054E166819AFF1CC6D346CDB"},
{k:"000102030405060708090A0B0C0D0E0F",p:"00000000000000000000000000000000",c:"C11F22F20140505084483597E4370F43"},
{k:"4706480851E61BE85D74BFB3FD956185",p:"83A2F8A288641FB9A4E9A5CC2F131C7D",c:"EE54D13EBCAE706D226BC3142CD40D4A"},
{k:"28DBC3BC49FFD87DCFA509B11D422BE7",p:"B41E6BE2EBA84A148E2EED84593C5EC7",c:"9B9B7BFCD1813CB95D0B3618F40F5122"},
];
let P=0,F=0;
for(const v of V){
  const K=seedKeySchedule(hexToBytes(v.k));
  const ct=bytesToHex(seedEncryptBlock(hexToBytes(v.p),K)).toUpperCase();
  const pt=bytesToHex(seedDecryptBlock(hexToBytes(v.c),K)).toUpperCase();
  if(ct===v.c){P++;}else{F++;console.log("  ✗ 加密 得"+ct+" 期"+v.c);}
  if(pt===v.p){P++;}else{F++;console.log("  ✗ 解密 得"+pt+" 期"+v.p);}
}
console.log("SEED vs RFC 4269 官方向量: 通过 "+P+" / 失败 "+F+"  (共"+V.length*2+"项)");
process.exit(F?1:0);
