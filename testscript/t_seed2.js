const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=(id)=>({id,value:"",textContent:"",_h:{},addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},options:[],innerHTML:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
["Encryption_and_decryption_logic.js","crypto_tables.js","crypto_core.js","crypto_modes.js","seed_tables.js"].forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const SS=seedGetSS();
function G(X){return (SS.SS0[X&0xff]^SS.SS1[(X>>>8)&0xff]^SS.SS2[(X>>>16)&0xff]^SS.SS3[(X>>>24)&0xff])>>>0;}
function F(k0,k1,r0,r1){const A=(r0^k0)>>>0,B=(r1^k1)>>>0;
  const t0=G((A^B)>>>0),t1=G((t0+A)>>>0),t2=G((t1+t0)>>>0);return [((t2+t1)>>>0),t2];}
const V={k:"000102030405060708090A0B0C0D0E0F",p:"00000000000000000000000000000000",c:"C11F22F20140505084483597E4370F43"};
const kb=hexToBytes(V.k), pb=hexToBytes(V.p);
const names=[];
function KS(rd,firstRight){
  let A=rd(kb,0),B=rd(kb,4),C=rd(kb,8),D=rd(kb,12);const K=[];
  for(let i=0;i<16;i++){
    const kc=SEED_KC[i];
    K.push([G((((A+C)>>>0)-kc)>>>0), G((((B-D)>>>0)+kc)>>>0)]);
    const odd = firstRight ? (i%2===0) : (i%2===1);
    if(odd){const nb=((B>>>8)|(A<<24))>>>0; A=(A>>>8)>>>0; B=nb;}
    else   {const nc=((C<<8)|(D>>>24))>>>0; D=(D<<8)>>>0; C=nc;}
  }
  return K;
}
function ENC(pt,K,rd,wr){
  let L0=rd(pt,0),L1=rd(pt,4),R0=rd(pt,8),R1=rd(pt,12);
  for(let i=0;i<15;i++){const f=F(K[i][0],K[i][1],R0,R1);
    const nR0=(L0^f[0])>>>0,nR1=(L1^f[1])>>>0;L0=R0;L1=R1;R0=nR0;R1=nR1;}
  const g=F(K[15][0],K[15][1],R0,R1);
  L0=(L0^g[0])>>>0;L1=(L1^g[1])>>>0;
  const o=new Uint8Array(16);wr(L0,o,0);wr(L1,o,4);wr(R0,o,8);wr(R1,o,12);return o;
}
for(const [rn,rd,wr] of [["BE",readU32BE,writeU32BE],["LE",readU32LE,writeU32LE]]){
  for(const fr of [true,false]){
    const K=KS(rd,fr);
    const ct=bytesToHex(ENC(pb,K,rd,wr)).toUpperCase();
    const ok=ct===V.c;
    console.log(`字节序=${rn} 首轮右移=${fr}  -> ${ct.slice(0,24)}… ${ok?"✓ 匹配":"✗"}`);
    if(ok)console.log("   ★ 正确变体: 字节序="+rn+" 奇数轮(第1,3..轮)右移="+fr);
  }
}
console.log("\n期望密文:",V.c);
