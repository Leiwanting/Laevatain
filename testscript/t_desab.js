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
const V=JSON.parse(fs.readFileSync("_desvec.json","utf8"));
const h2b=h=>Uint8Array.from(Buffer.from(h,"hex"));
const b2h=b=>Buffer.from(b).toString("hex");
let pass=0,fail=0;
console.log("=== DES：新 vs 旧 vs pycryptodome ===");
for(const v of V.des){
  const k=h2b(v.k), p=h2b(v.p), sk=desSubkeysFast(k), skr=desRevRounds(sk);
  const eOld=desCryptBlockOld(p,sk), eNew=desCryptBlock(p,sk);
  const dOld=desCryptBlockOld(p,skr), dNew=desCryptBlock(p,skr);
  const oke1=b2h(eOld)===b2h(eNew), oke2=b2h(eNew)===v.c;
  const okd1=b2h(dOld)===b2h(dNew), okd2=b2h(dNew)===v.d;
  if(oke1&&oke2&&okd1&&okd2) pass++;
  else {fail++; if(fail<=3)console.log(`  ✗ k=${v.k} p=${v.p}\n    旧E=${b2h(eOld)} 新E=${b2h(eNew)} ref=${v.c}\n    旧D=${b2h(dOld)} 新D=${b2h(dNew)} ref=${v.d}`);}
}
console.log(`  DES  ${pass}/40 ${fail?"FAIL":"OK  (新==旧==pycryptodome，加解密双向)"}`);
let p3=0,f3=0;
console.log("\n=== 3DES vs pycryptodome ===");
for(const v of V.des3){
  const k=h2b(v.k), p=h2b(v.p), f=des3MakeBlockFn(k);
  const e=f.enc(p), d=f.dec(p);
  if(b2h(e)===v.c && b2h(d)===v.d) p3++;
  else {f3++; if(f3<=3)console.log(`  ✗ k=${v.k}\n    E=${b2h(e)} ref=${v.c}\n    D=${b2h(d)} ref=${v.d}`);}
}
console.log(`  3DES ${p3}/30 ${f3?"FAIL":"OK  (加密+解密双向)"}`);
// A/B 测速
const N=32*1024;
function mkdata(n){const d=new Uint8Array(n);for(let i=0;i<n;i++)d[i]=(i*7+3)&0xff;return d;}
const data=mkdata(N);
function run(f,bs){for(let o=0;o<N;o+=bs) f(data.subarray(o,o+bs));}
function best(f,n){let b=1e9;for(let i=0;i<n;i++){const t0=process.hrtime.bigint();f();const t=Number(process.hrtime.bigint()-t0)/1e6;if(t<b)b=t;}return b;}
console.log("\n=== A/B 速度（32KB ECB，各取 5 次最小值 ms）===");
const k8=h2b(V.des[0].k), k24=h2b(V.des3[0].k);
const skDes=desSubkeysFast(k8);
const dOld=best(()=>run(b=>desCryptBlockOld(b,skDes),8),5);
const dNew=best(()=>run(b=>desCryptBlock(b,skDes),8),5);
console.log(`  DES   旧 ${dOld.toFixed(2)} ms  →  新 ${dNew.toFixed(2)} ms   (${(dOld/dNew).toFixed(2)}×, ${(32/dNew).toFixed(1)} MB/s)`);
const f3n=des3MakeBlockFn(k24);
const tNew=best(()=>run(f3n.enc,8),5);
console.log(`  3DES     新 ${tNew.toFixed(2)} ms  (${(32/tNew).toFixed(1)} MB/s)`);
