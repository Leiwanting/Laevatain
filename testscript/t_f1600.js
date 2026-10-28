const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
vm.runInThisContext(fs.readFileSync("crypto_bulletproof.js","utf8"));
// Keccak-f[1600] 全零状态置换后 lane0 = 0xF1258F7940E1DDE7（小端字节 E7 DD E1 40 79 8F 25 F1）
const buf=new Uint8Array(200);
bpF1600(buf);
console.log("前 8 字节:", bytesToHex(buf.subarray(0,8)));
console.log("期望     : e7dde140798f25f1");
// 顺便：ED_B 是否为标准 Ed25519 basepoint
console.log("ED_B.x =", ED_B[0].toString());
console.log("标准   = 15112221349535400772501151409588531511454012693041857206046113283949847762202");
console.log("ED_B.y =", ED_B[1].toString());
console.log("标准   = 46316835694926478169428394003475163141307993866256225615783033603165251855960");
// Pedersen B_blinding
const pg=bpPedersenGens();
console.log("B_blind.x =", pg.BBlind[0].toString(16).slice(0,20));
// 生成器 G[0][0]
if(!BP_GENS) BP_GENS=bpBpGens(64,8);
console.log("G[0][0].x =", BP_GENS.G[0][0][0].toString(16).slice(0,20));
console.log("H[0][0].x =", BP_GENS.H[0][0][0].toString(16).slice(0,20));
