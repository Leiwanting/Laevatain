const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  X "+n);}};
const find=id=>ALGOS.find(a=>a.id===id);
const h2f=find('bls12-377-hash-to-field'), pr=find('bls12-377-pairing');
ck("hash-to-field 已注册", !!h2f);
ck("pairing 已注册", !!pr);
// 官方 G1 v0: msg="" → u[0] 应为 e91c9375...
const tv=JSON.parse(fs.readFileSync("testvectors/BLS12377G1_XMD-SHA-256_SSWU_RO_.json","utf8"));
const dst=tv.dst;
const out=h2f.enc(new Uint8Array(0), dst, "1:2", "hex");
const u0=BigInt(tv.vectors[0].u[0]);
ck("入口 m=1 首值 == 官方 u[0]", (()=>{const s=out.split("\n")[0];return BigInt("0x"+s)===u0%B377_P;})());
// G2: m=2
const tv2=JSON.parse(fs.readFileSync("testvectors/BLS12377G2_XMD-SHA-256_SSWU_RO_.json","utf8"));
const out2=h2f.enc(new Uint8Array(Buffer.from("abc")), tv2.dst, "2:2", "hex");
const a=tv2.vectors[1].u[0].split(",");
const got=out2.split("\n")[0].split(",");
ck("入口 m=2 (msg=abc) c0", BigInt("0x"+got[0])===BigInt(a[0].trim())%B377_P);
ck("入口 m=2 (msg=abc) c1", BigInt("0x"+got[1])===BigInt(a[1].trim())%B377_P);
// pairing 入口：默认生成元
const hx=v=>{let s=v.toString(16);while(s.length<96)s="0"+s;return s;};
const G2Hex=hx(B377_G2[0][0])+hx(B377_G2[0][1])+hx(B377_G2[1][0])+hx(B377_G2[1][1]);
try { const r=pr.enc(new Uint8Array(0), G2Hex, "", "hex"); ck("pairing 入口可调用", typeof r==="string"&&r.length>0); }
catch(e){ ck("pairing 入口可调用", false); console.log("   err:",e.message); }
console.log("BLS12-377 入口: 通过 "+pass+" / 失败 "+fail);
