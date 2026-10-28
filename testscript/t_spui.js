const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const G=id=>ALGOS.filter(a=>a.id===id)[0];
for(const id of ['spake2p-register','spake2p-prover','spake2p-verifier'])
  console.log("注册:", id, "->", !!G(id), G(id)?("| "+G(id).name):"");

/* 用官方向量走 Prover 界面入口，验证 confirmP 与 K_shared */
const V={w0:"bb8e1bbcf3c48f62c08db243652ae55d3e5586053fca77102994f23ad95491b3",
 w1:"7e945f34d78785b8a3ef44d0df5a1a97d6b3b460409a345ca7830387a74b1dba",
 x:"d1232c8e8693d02368976c174e2088851b8365d0d79a9eee709c6a05a2fad539",
 Y:"04c0f65da0d11927bdf5d560c69e1d7d939a05b0e88291887d679fcadea75810fb5cc1ca7494db39e82ff2f50665255d76173e09986ab46742c798a9a68437b048",
 X:"04ef3bd051bf78a2234ec0df197f7828060fe9856503579bb1733009042c15c0c1de127727f418b5966afadfdd95a6e4591d171056b333dab97a79c7193e341727",
 L:"04eb7c9db3d9a9eb1f8adab81b5794c1f13ae3e225efbe91ea487425854c7fc00f00bfedcbd09b2400142d40a14f2064ef31dfaa903b91d1faea7093d835966efd",
 y:"717a72348a182085109c8d3917d6c43d59b224dc6a7fc4f0483232fa6516d8b3"};
const P=G('spake2p-prover');
let r=P.enc("", V.w0+","+V.w1+","+V.x, V.Y, 'hex');
console.log("\n--- Prover 界面输出 ---"); console.log(r);
const okX  = r.indexOf(V.X)!==-1;
const okKs = r.indexOf("0c5f8ccd1413423a54f6c1fb26ff01534a87f893779c6e68666d772bfd91f3e7")!==-1;
const okCf = r.indexOf("926cc713504b9b4d76c9162ded04b5493e89109f6d89462cd33adc46fda27527")!==-1;
console.log("X 正确:", okX, "| K_shared 正确:", okKs, "| confirmP 正确:", okCf);

/* 双侧 K_shared 必须一致 —— PAKE 的本质 */
const Vf=G('spake2p-verifier');
let r2=Vf.enc("", V.w0+","+V.L+","+V.y, V.X, 'hex');
const ks2=(r2.match(/K_shared\s*=\s*([0-9a-f]+)/)||[])[1];
const ks1=(r.match(/K_shared\s*=\s*([0-9a-f]+)/)||[])[1];
console.log("\n--- Verifier 界面输出 ---"); console.log(r2);
console.log("\n双侧 K_shared 一致:", ks1===ks2, ks1===ks2?"✓":"(P:"+ks1+" V:"+ks2+")");

/* 注册条目 */
const R=G('spake2p-register');
const rr=R.enc("hunter2","",'hex');
console.log("\n--- 注册条目 ---"); console.log(rr.split("\n")[0]);
console.log("注册产出 w0/w1/L 三项:", rr.split("\n").length===3 ? "✓" : "✗");
console.log("\n算法总数:", ALGOS.length);
