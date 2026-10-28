/* Montgomery ladder modPow + 无分支 ideaMul 的等价性与边界验证 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
for(const m of html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)) vm.runInThisContext(fs.readFileSync(m[1],"utf8"),{filename:m[1]});

/* ---- 参考实现（旧的平方-乘，作为预言机） ---- */
function refModPow(base, exp, mod){let r=1n,b=((base%mod)+mod)%mod,e=exp;while(e>0n){if(e&1n)r=(r*b)%mod;b=(b*b)%mod;e>>=1n;}return r;}
function refIdeaMul(a,b){const M=0x10000,P=0x10001;if(a===0)a=M;if(b===0)b=M;const p=a*b,lo=p&0xFFFF,hi=(p/0x10000)|0;let x=lo-hi;if(x<0)x+=P;return x===M?0:x;}

/* ---- 取到被测函数：通过 dhPublicKey 间接测 modPow；ideaMul 通过 IDEA 条目间接 ---- */
/* modPow 未导出，直接在同文件里 rebuild 一份不行 —— 用 DH 路径验证 */
const dh=ALGOS.find(a=>a.id==='dh-modp2');
console.log("DH 条目: "+(dh?"存在 ✓":"缺失 ✗"));

/* 直接重放 crypto_core.js 里的 modPow 源码做等价比对 */
const src=fs.readFileSync("crypto_core.js","utf8");
const body=src.substring(src.indexOf("function modPow(base, exp, mod)"));
const endi=body.indexOf("\n  }", body.indexOf("return x1;"));
const fnSrc=body.substring(0, body.indexOf("\n  }\n", body.indexOf("return x1;"))+4);
const newModPow=vm.runInThisContext("("+fnSrc+")");

let ok=0,bad=0;
/* 边界 */
const edge=[[2n,0n,97n],[2n,1n,97n],[2n,2n,97n],[2n,3n,97n],[2n,96n,97n],[2n,97n,97n],[0n,5n,97n],[5n,0n,1n]];
for(const [b,e,m] of edge){
  const got = newModPow(b,e,m), exp = refModPow(b,e,m) % m;  /* mod=1 时参考实现漏了最终归约 */
  if(got===exp) ok++; else {bad++;console.log("✗ modPow 边界 %d^%d mod %d: got %d exp %d",b,e,m,got,exp);}
}
/* 随机大数 */
const DH_P=0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE65381FFFFFFFFFFFFFFFFn;
for(let i=0;i<3000;i++){
  const b=BigInt('0x'+nc.randomBytes(32).toString('hex'))%DH_P;
  const e=BigInt('0x'+nc.randomBytes(32).toString('hex'))%(DH_P-1n)+1n;
  const got=newModPow(b,e,DH_P), exp=refModPow(b,e,DH_P);
  if(got===exp) ok++; else {bad++; if(bad<3) console.log("✗ modPow 随机");}
}
console.log("modPow 等价: "+ok+"/"+(ok+bad));

/* ---- ideaMul：全量遍历 a ∈ [0,0xFFFF] 对若干 b，含 0 边界 ---- */
const srcIdea=src.substring(src.indexOf("function ideaMul(a, b)"));
const ideaSrc=srcIdea.substring(0, srcIdea.indexOf("\n  }\n")+4);
const newIdeaMul=vm.runInThisContext("(function(){const IDEA_MOD=0x10000;const IDEA_MUL_MOD=0x10001;"+ideaSrc+" return ideaMul;})()");
let iok=0,ibad=0;
const bs=[0,1,2,0xFFFF,0x10000,0x8000,0x7fff,0x1234];
for(const b of bs){
  for(let a=0;a<=0xFFFF;a++){
    const g=newIdeaMul(a,b), e=refIdeaMul(a,b);
    if(g===e) iok++; else {ibad++; if(ibad<4) console.log("✗ ideaMul a="+a+" b="+b+" got="+g+" exp="+e);}
  }
}
console.log("ideaMul 等价(全量 a × 8 个 b): "+iok+"/"+(iok+ibad));
