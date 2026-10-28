const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const G=id=>ALGOS.filter(a=>a.id===id)[0];
const V={w0:"bb8e1bbcf3c48f62c08db243652ae55d3e5586053fca77102994f23ad95491b3",
 w1:"7e945f34d78785b8a3ef44d0df5a1a97d6b3b460409a345ca7830387a74b1dba",
 x:"d1232c8e8693d02368976c174e2088851b8365d0d79a9eee709c6a05a2fad539",
 y:"717a72348a182085109c8d3917d6c43d59b224dc6a7fc4f0483232fa6516d8b3",
 Y:"04c0f65da0d11927bdf5d560c69e1d7d939a05b0e88291887d679fcadea75810fb5cc1ca7494db39e82ff2f50665255d76173e09986ab46742c798a9a68437b048",
 X:"04ef3bd051bf78a2234ec0df197f7828060fe9856503579bb1733009042c15c0c1de127727f418b5966afadfdd95a6e4591d171056b333dab97a79c7193e341727",
 L:"04eb7c9db3d9a9eb1f8adab81b5794c1f13ae3e225efbe91ea487425854c7fc00f00bfedcbd09b2400142d40a14f2064ef31dfaa903b91d1faea7093d835966efd",
 ctx:"SPAKE2+-P256-SHA256-HKDF-SHA256-HMAC-SHA256 Test Vectors"};
const EXP={K:"0c5f8ccd1413423a54f6c1fb26ff01534a87f893779c6e68666d772bfd91f3e7",
 cP:"926cc713504b9b4d76c9162ded04b5493e89109f6d89462cd33adc46fda27527",
 cV:"9747bcc4f8fe9f63defee53ac9b07876d907d55047e6ff2def2e7529089d3e68"};
let p=0,f=0; const chk=(n,ok)=>{ if(ok)p++;else f++; console.log((ok?"  ✓ ":"  ✗ ")+n); };

/* Prover 走界面入口，带完整 context/身份 */
const pm = V.Y+";"+V.ctx+";client;server";
const r1 = G('spake2p-prover').enc("", V.w0+","+V.w1+","+V.x, pm, 'hex');
console.log("--- Prover（界面入口）---"); console.log(r1);
chk("X 与官方向量一致", r1.indexOf(V.X)!==-1);
chk("K_shared 与官方 secret 一致", r1.indexOf(EXP.K)!==-1);
chk("confirmP 一致", r1.indexOf(EXP.cP)!==-1);

const r2 = G('spake2p-verifier').enc("", V.w0+","+V.L+","+V.y, V.X+";"+V.ctx+";client;server", 'hex');
console.log("--- Verifier（界面入口）---"); console.log(r2);
chk("Y 与官方向量一致", r2.indexOf(V.Y)!==-1);
chk("K_shared 与官方 secret 一致", r2.indexOf(EXP.K)!==-1);
chk("confirmV 一致", r2.indexOf(EXP.cV)!==-1);
const k1=(r1.match(/K_shared\s*=\s*([0-9a-f]+)/)||[])[1];
const k2=(r2.match(/K_shared\s*=\s*([0-9a-f]+)/)||[])[1];
chk("双侧 K_shared 相同（PAKE 本质）", k1===k2 && k1===EXP.K);

/* 注册条目 */
const r3 = G('spake2p-register').enc("hunter2","",'hex');
console.log("--- 注册 ---"); console.log(r3);
chk("注册产出 w0/L/w1 三项", r3.split("\n").length===3);
const w0h=(r3.match(/w0 = ([0-9a-f]+)/)||[])[1];
chk("w0 为 32 字节 Hex", !!w0h && w0h.length===64);
/* 口令相同 → w0/L 必须可复现 */
const r4 = G('spake2p-register').enc("hunter2","",'hex');
chk("同口令同盐 → 结果可复现", r3===r4);
const r5 = G('spake2p-register').enc("hunter3","",'hex');
chk("不同口令 → 结果不同", r3!==r5);
console.log("\n界面入口验证: "+p+" 通过 / "+f+" 失败");
console.log("算法总数:", ALGOS.length);
