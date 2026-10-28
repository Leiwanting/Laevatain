const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=(id)=>({id,value:"",textContent:"",_h:{},addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},options:[],innerHTML:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
["Encryption_and_decryption_logic.js","crypto_tables.js","crypto_core.js","crypto_modes.js","aria_tables.js","aria_core.js"].forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const P=hexToBytes("00112233445566778899aabbccddeeff");
const V=[
 {n:128,k:"000102030405060708090a0b0c0d0e0f",c:"d718fbd6ab644c739da95f3be6451778"},
 {n:192,k:"000102030405060708090a0b0c0d0e0f1011121314151617",c:"26449c1805dbe7aa25a468ce263a9e79"},
 {n:256,k:"000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",c:"f92bd7c79fb72e2f2b8f80c1972d24fc"},
];
let P2=0,F=0;
for(const v of V){
  const bf=ariaMakeBlockFn(hexToBytes(v.k));
  const ct=bytesToHex(bf.enc(P));
  const pt=bytesToHex(bf.dec(hexToBytes(v.c)));
  if(ct===v.c){P2++;}else{F++;console.log(`  ✗ ARIA-${v.n} 加密 得${ct} 期${v.c}`);}
  if(pt===bytesToHex(P)){P2++;}else{F++;console.log(`  ✗ ARIA-${v.n} 解密 得${pt}`);}
}
console.log("ARIA vs RFC 5794 附录A(128/192/256): 通过 "+P2+" / 失败 "+F);
process.exit(F?1:0);
