const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){console.log("FAIL "+f+": "+e.message.slice(0,60));}});
const V=JSON.parse(fs.readFileSync("_vec_sm2kx.json","utf8"));
const H=h=>hexToBytes(h);
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=4)console.log("  ✗ "+n);}};
const C=SM2KX_C;
for(const v of V){
  const dA=BigInt("0x"+v.dA), dB=BigInt("0x"+v.dB);
  const pkA=sm2kxPointFrom(H(v.pkA)), pkB=sm2kxPointFrom(H(v.pkB));
  const RA=sm2kxPointFrom(H(v.RA)), RB=sm2kxPointFrom(H(v.RB));
  const tA=BigInt("0x"+v.tA), tB=BigInt("0x"+v.tB);
  const idA=Buffer.from(v.idA,"hex").toString("utf8"), idB=Buffer.from(v.idB,"hex").toString("utf8");
  const zA=sm2kxZ(pkA, idA), zB=sm2kxZ(pkB, idB);
  const x1=sm2kxBar(RA.x), x2=sm2kxBar(RB.x);
  const U=sm2kxSharedPoint(tA, pkB, x2, RB);
  const Vp=sm2kxSharedPoint(tB, pkA, x1, RA);
  const KA=bytesToHex(sm2kxDerive(U, zA, zB, v.klen));
  const KB=bytesToHex(sm2kxDerive(Vp, zA, zB, v.klen));
  ck("与gmalg A方一致 klen="+v.klen, KA===v.KA);
  ck("与gmalg B方一致 klen="+v.klen, KB===v.KB);
  ck("双方密钥一致 klen="+v.klen, KA===KB);
  ck("共享点 U==V klen="+v.klen, bytesToHex(sm2kxPointToBytes(U))===bytesToHex(sm2kxPointToBytes(Vp)));
}
/* 端到端：用本地随机数自己跑一遍完整协议，双方必须得到同一个密钥 */
for(let i=0;i<4;i++){
  const dA=sm2kxMod(sm2kxFromBytes(crypto.getRandomValues(new Uint8Array(32))), C.n);
  const dB=sm2kxMod(sm2kxFromBytes(crypto.getRandomValues(new Uint8Array(32))), C.n);
  const rA=sm2kxMod(sm2kxFromBytes(crypto.getRandomValues(new Uint8Array(32))), C.n);
  const rB=sm2kxMod(sm2kxFromBytes(crypto.getRandomValues(new Uint8Array(32))), C.n);
  const PA=C.mul(dA,{x:C.gx,y:C.gy}), PB=C.mul(dB,{x:C.gx,y:C.gy});
  const RA=C.mul(rA,{x:C.gx,y:C.gy}), RB=C.mul(rB,{x:C.gx,y:C.gy});
  const zA=sm2kxZ(PA,"Alice"), zB=sm2kxZ(PB,"Bob");
  const A=sm2kxInitiator(dA,rA,RA,PB,RB,zA,zB,32);
  const B=sm2kxResponder(dB,rB,RB,PA,RA,zA,zB,32);
  ck("端到端 双方一致 #"+i, bytesToHex(A.key)===bytesToHex(B.key));
  ck("端到端 密钥32字节 #"+i, A.key.length===32);
}
console.log("SM2 密钥协商（gmalg 交叉 + 端到端）: 通过 "+pass+" / 失败 "+fail);
