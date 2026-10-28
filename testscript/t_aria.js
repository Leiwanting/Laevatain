const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=(id)=>({id,value:"",textContent:"",_h:{},addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},options:[],innerHTML:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
["Encryption_and_decryption_logic.js","crypto_tables.js","crypto_core.js","crypto_modes.js","aria_tables.js","aria_core.js"].forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
/* RFC 5794 附录 A：128 位密钥 */
const K=hexToBytes("000102030405060708090a0b0c0d0e0f");
const P=hexToBytes("00112233445566778899aabbccddeeff");
const C="d718fbd6ab644c739da95f3be6451778";
let win=null,tried=0;
for(const o1 of [1,2])for(const o2 of [1,2])for(const o3 of [1,2])
for(const krZero of [true,false])for(const slFirst of [1,2]){
  const opt={o1,o2,o3,krZero,slFirst};tried++;
  const W=ariaKeySchedule(K,opt);
  const ek=ariaRoundKeys(W,ariaNrounds(K.length));
  if(bytesToHex(ariaEncrypt(P,ek,opt))===C){
    const back=bytesToHex(ariaDecrypt(hexToBytes(C),ek,opt));
    win={opt,back:back===bytesToHex(P)};
    console.log("★ 命中: o1="+o1+" o2="+o2+" o3="+o3+" krZero="+krZero+" slFirst="+slFirst+" 解密往返="+(back===bytesToHex(P)));
  }
}
console.log("尝试组合数:",tried,"| 命中:",win?"是":"否");
if(!win)process.exit(1);
