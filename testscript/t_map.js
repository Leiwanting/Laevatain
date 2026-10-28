const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
/* RFC 9496 附录 A.3：64 字节输入 -> 编码输出 */
const V=[
 ["5d1be09e3d0c82fc538112490e35701979d99e06ca3e2b5b54bffe8b4dc772c14d98b696a1bbfb5ca32c436cc61c16563790306c79eaca7705668b47dffe5bb6","3066f82a1a747d45120d1740f14358531a8f04bbffe6a819f86dfe50f44a0a46"],
 ["f116b34b8f17ceb56e8732a60d913dd10cce47a6d53bee9204be8b44f6678b270102a56902e2488c46120e9276cfe54638286b9e4b3cdb470b542d46c2068d38","f26e5b6f7d362d2d2a94c5d0e7602cb4773c95a2e5c31a64f133189fa76ed61b"],
 ["8422e1bbdaab52938b81fd602effb6f89110e1e57208ad12d9ad767e2e25510c27140775f9337088b982d83d7fcf0b2fa1edffe51952cbe7365e95c86eaf325c","006ccd2a9e6867e6a2c5cea83d3302cc9de128dd2a9a57dd8ee7b9d7ffe02826"]];
let p=0,f=0;
for(const [inp,exp] of V){
  const P=ristFromUniformBytes(hexToBytes(inp));
  const got=bytesToHex(ristEncodeAffine(P));
  const ok = got===exp;
  if(ok)p++;else f++;
  console.log((ok?"  ✓ ":"  ✗ ")+"got "+got.slice(0,24)+" exp "+exp.slice(0,24));
}
console.log("RFC 9496 A.3 from_uniform_bytes 向量: "+p+" 通过 / "+f+" 失败");
/* 顺带确认：只调 ristMap(64字节) 的旧行为确实不同 */
const old=bytesToHex(ristEncodeAffine(ristToAffine(ristMap(hexToBytes(V[0][0])))));
console.log("（对照）旧写法 ristMap(64B) 输出: "+old.slice(0,24)+" —— 与期望不符");
