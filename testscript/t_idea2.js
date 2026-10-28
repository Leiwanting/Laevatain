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
const V=JSON.parse(fs.readFileSync("_ideavec.json","utf8"));
const N=32*1024;
const data=new Uint8Array(N); for(let i=0;i<N;i++)data[i]=(i*11+1)&0xff;
function run(f,bs){for(let o=0;o<N;o+=bs) f(data.subarray(o,o+bs));}
function best(f,k){let b=1e9;for(let i=0;i<k;i++){const t0=process.hrtime.bigint();f();const t=Number(process.hrtime.bigint()-t0)/1e6;if(t<b)b=t;}return b;}
const f=ALGOS.filter(x=>x.id==="idea")[0].makeBlockFn(h2b(V[0].k));
console.log("顺序1: 先 enc 后 dec");
console.log(`  enc ${best(()=>run(f.enc,8),5).toFixed(2)}   dec ${best(()=>run(f.dec,8),5).toFixed(2)}`);
console.log("顺序2: 先 dec 后 enc");
console.log(`  dec ${best(()=>run(f.dec,8),5).toFixed(2)}   enc ${best(()=>run(f.enc,8),5).toFixed(2)}`);
console.log("顺序3: 再交替");
console.log(`  enc ${best(()=>run(f.enc,8),5).toFixed(2)}   dec ${best(()=>run(f.dec,8),5).toFixed(2)}   enc ${best(()=>run(f.enc,8),5).toFixed(2)}   dec ${best(()=>run(f.dec,8),5).toFixed(2)}`);
