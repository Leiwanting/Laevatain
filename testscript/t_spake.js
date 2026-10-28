const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
vm.runInThisContext(fs.readFileSync("crypto_spake2p.js","utf8"));

/* RFC 9383 附录 C（经 BoringSSL 测试文件核对） */
const V = {
  ctx:"SPAKE2+-P256-SHA256-HKDF-SHA256-HMAC-SHA256 Test Vectors",
  idP:"client", idV:"server",
  w0:"bb8e1bbcf3c48f62c08db243652ae55d3e5586053fca77102994f23ad95491b3",
  w1:"7e945f34d78785b8a3ef44d0df5a1a97d6b3b460409a345ca7830387a74b1dba",
  L:"04eb7c9db3d9a9eb1f8adab81b5794c1f13ae3e225efbe91ea487425854c7fc00f00bfedcbd09b2400142d40a14f2064ef31dfaa903b91d1faea7093d835966efd",
  x:"d1232c8e8693d02368976c174e2088851b8365d0d79a9eee709c6a05a2fad539",
  shareP:"04ef3bd051bf78a2234ec0df197f7828060fe9856503579bb1733009042c15c0c1de127727f418b5966afadfdd95a6e4591d171056b333dab97a79c7193e341727",
  y:"717a72348a182085109c8d3917d6c43d59b224dc6a7fc4f0483232fa6516d8b3",
  shareV:"04c0f65da0d11927bdf5d560c69e1d7d939a05b0e88291887d679fcadea75810fb5cc1ca7494db39e82ff2f50665255d76173e09986ab46742c798a9a68437b048",
  confirmP:"926cc713504b9b4d76c9162ded04b5493e89109f6d89462cd33adc46fda27527",
  confirmV:"9747bcc4f8fe9f63defee53ac9b07876d907d55047e6ff2def2e7529089d3e68",
  secret:"0c5f8ccd1413423a54f6c1fb26ff01534a87f893779c6e68666d772bfd91f3e7"
};
const C=spakeCurve();
const H=h=>bytesToHex(h);
let p=0,f=0;
const chk=(name,got,exp)=>{const ok=got===exp; if(ok)p++;else f++;
  console.log((ok?"  ✓ ":"  ✗ ")+name); if(!ok)console.log("     got "+got.slice(0,50)+"\n     exp "+exp.slice(0,50)); return ok;};

const w0=bigFromHex(V.w0), w1=bigFromHex(V.w1), x=bigFromHex(V.x), y=bigFromHex(V.y);
const L=spakeCurve().bytesToPoint(hexToBytes(V.L));

console.log("--- 常量自证 ---");
chk("L == w1·P", H(spakePointBytes(C.mul(w1,{x:C.gx,y:C.gy}))), V.L);
const M=spakeM(), N=spakeN();
console.log("  M 在曲线上:", C.isOnCurve(M.x,M.y), " N 在曲线上:", C.isOnCurve(N.x,N.y));

console.log("--- 第一轮消息 ---");
const X=spakeProverShare(w0,x);
const Y=spakeVerifierShare(w0,y);
chk("X = x·P + w0·M  (验证 M)", H(spakePointBytes(X)), V.shareP);
chk("Y = y·P + w0·N  (验证 N)", H(spakePointBytes(Y)), V.shareV);

console.log("--- 共享值（两侧独立计算必须一致）---");
const PS=spakeProverShared(w0,w1,x,Y);
const VS=spakeVerifierShared(w0,L,y,X);
chk("Prover Z", H(spakePointBytes(PS.Z)), H(spakePointBytes(VS.Z)));
chk("Prover V", H(spakePointBytes(PS.V)), H(spakePointBytes(VS.V)));
chk("Z == x·y·P (自证)", H(spakePointBytes(PS.Z)), H(spakePointBytes(C.mul(x,C.mul(y,{x:C.gx,y:C.gy})))));
chk("V == y·L   (自证)", H(spakePointBytes(PS.V)), H(spakePointBytes(C.mul(y,L))));

console.log("--- 密钥与确认值 ---");
const D=spakeDerive(V.ctx,V.idP,V.idV,X,Y,PS.Z,PS.V,w0);
chk("confirmP", H(D.confirmP), V.confirmP);
chk("confirmV", H(D.confirmV), V.confirmV);
console.log("  K_shared = "+H(D.Kshared));
console.log("  (参考 secret = "+V.secret+")");
console.log("\nRFC 9383 官方向量: "+p+" 通过 / "+f+" 失败");
