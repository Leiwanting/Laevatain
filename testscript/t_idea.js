const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;
global.btoa=function(s){return Buffer.from(s,"binary").toString("base64");};
global.atob=function(s){return Buffer.from(s,"base64").toString("binary");};
const mk=function(id){return {id:id,value:"",_h:{},options:[],addEventListener:function(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent:function(e){(this._h[e]||[]).forEach(function(f){f.call(this,e);});},classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},setAttribute:function(){},appendChild:function(){},style:{},innerHTML:""};};
const store={};
global.document={getElementById:function(id){return store[id]||(store[id]=mk(id));},createElement:function(t){return mk(t);},addEventListener:function(){},readyState:"complete",body:{appendChild:function(){}}};
global.window=global;global.addEventListener=function(){};
global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(function(f){vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});});
const h2b=h=>Uint8Array.from(Buffer.from(h,"hex"));
const b2h=b=>Buffer.from(b).toString("hex");
const V=JSON.parse(fs.readFileSync("_ideavec.json","utf8"));
const A=ALGOS.filter(x=>x.id==="idea")[0];
const ideaMakeBlockFn=A.makeBlockFn;
let ok=0,fail=0;
for(const v of V){
  const f=ideaMakeBlockFn(h2b(v.k));
  const e=f.enc(h2b(v.p));
  if(b2h(e)===v.c) ok++; else {fail++; if(fail<=3)console.log(`  ✗ k=${v.k}\n    JS=${b2h(e)}\n    py=${v.c}`);}
}
console.log(`=== IDEA 加密 vs 独立 Python 实现: ${ok}/40 ${fail?"FAIL":"OK"}`);
let rt=0; for(const v of V){const f=ideaMakeBlockFn(h2b(v.k)); if(b2h(f.dec(f.enc(h2b(v.p))))===v.p) rt++;}
console.log(`往返（解密 vs 加密）: ${rt}/40`);
// ideaMul 穷举等价：新 hi/lo 法 vs 朴素 % 法
let mok=0,mfail=0;
const naive=(a,b)=>{if(a===0)a=0x10000;if(b===0)b=0x10000;const r=(a*b)%0x10001;return r===0x10000?0:r;};
/* 源码实现（crypto-extra.js 内 ideaMul）的等价副本 */
const ideaMul=(a,b)=>{if(a===0){if(b===0)return 1;a=0x10000;}else if(b===0)b=0x10000;const t=a*b;let r=(t&0xFFFF)-(t>>>16);if(r<0)r+=0x10001;return r===0x10000?0:r;};
for(let i=0;i<300000;i++){
  const a=(Math.random()*65536)|0, b=(Math.random()*65536)|0;
  if(ideaMul(a,b)!==naive(a,b)){mfail++; if(mfail<=3)console.log(`  ✗ mul ${a},${b}: ${ideaMul(a,b)} vs ${naive(a,b)}`);} else mok++;
}
// 边界
for(const [a,b] of [[0,0],[0,1],[1,0],[0,65535],[65535,0],[65535,65535],[1,65535],[65535,65535]]){
  if(ideaMul(a,b)!==naive(a,b)){mfail++;console.log(`  ✗ 边界 ${a},${b}`);} else mok++;
}
console.log(`ideaMul 等价（30 万随机 + 8 边界）: ${mok}/${mok+mfail} ${mfail?"FAIL":"OK"}`);
const N=32*1024;
function mkdata(m){const d=new Uint8Array(m);for(let i=0;i<m;i++)d[i]=(i*11+1)&0xff;return d;}
const data=mkdata(N);
function run(f,bs){for(let o=0;o<N;o+=bs) f(data.subarray(o,o+bs));}
function best(f,k){let b=1e9;for(let i=0;i<k;i++){const t0=process.hrtime.bigint();f();const t=Number(process.hrtime.bigint()-t0)/1e6;if(t<b)b=t;}return b;}
const f=ideaMakeBlockFn(h2b(V[0].k));
console.log(`\n=== 32KB ===\n  IDEA 加密 ${best(()=>run(f.enc,8),5).toFixed(2)} ms (${(32/best(()=>run(f.enc,8),3)).toFixed(1)} MB/s)   解密 ${best(()=>run(f.dec,8),5).toFixed(2)} ms`);
