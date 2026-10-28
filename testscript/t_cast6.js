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
// RFC 2612 官方向量（明文全零）
const V=[
 {key:"2342bb9efa38542c0af75647f29f615d",ct:"c842a08972b43d20836c91d1b7530f6b"},
 {key:"2342bb9efa38542cbed0ac83940ac298bac77a7717942863",ct:"1b386c0210dcadcbdd0e41aa08a7a7e8"},
 {key:"2342bb9efa38542cbed0ac83940ac2988d7c47ce264908461cc1b5137ae6b604",ct:"4f6a2038286897b9c9870136553317fa"},
];
console.log("=== CAST-256 RFC 2612 官方向量 ===");
let ok=0;
for(const v of V){
  const f=cast6MakeBlockFn(h2b(v.key));
  const c=f.enc(new Uint8Array(16));
  const good=b2h(c)===v.ct;
  if(good) ok++; else console.log(`  ✗ key=${v.key}\n    我=${b2h(c)}\n    ref=${v.ct}`);
}
console.log(`  加密: ${ok}/3 ${ok===3?"OK":"FAIL"}`);
// 往返 + 等价（旧逻辑：每块重算调度）
let rt=0, eq=0, n=50;
for(let i=0;i<n;i++){
  const k=nc.randomBytes(32), p=nc.randomBytes(16);
  const f=cast6MakeBlockFn(k);
  const c=f.enc(p);
  if(b2h(f.dec(c))===b2h(p)) rt++;
  // 对照：走"每次重排密钥"的旧路径（cast6ProcessBlock），结果应与预排路径一致。
  // ⚠ 键名必须用 enc/dec：界面与 symEncrypt 走的就是 f.enc/f.dec。
  //   这个脚本原先写的是 f.encrypt/f.decrypt（错误的键名），
  //   于是"测试能过、界面一点就崩"，CAST-256 的不可用状态被完整掩盖。
  if(b2h(cast6ProcessBlock(p,k,false))===b2h(c)) eq++;
}
console.log(`  往返: ${rt}/${n}   等价(旧逻辑): ${eq}/${n}`);
// A/B
const N=32*1024;
function mkdata(m){const d=new Uint8Array(m);for(let i=0;i<m;i++)d[i]=(i*13+5)&0xff;return d;}
const data=mkdata(N);
function run(f,bs){for(let o=0;o<N;o+=bs) f(data.subarray(o,o+bs));}
function best(f,k){let b=1e9;for(let i=0;i<k;i++){const t0=process.hrtime.bigint();f();const t=Number(process.hrtime.bigint()-t0)/1e6;if(t<b)b=t;}return b;}
const k32=nc.randomBytes(32);
// 旧：每块重算调度
const oldBf={enc:b=>cast6ProcessBlock(b,k32,false)};
const newBf=cast6MakeBlockFn(k32);
const o=best(()=>run(oldBf.enc,16),4);
const nn=best(()=>run(newBf.enc,16),4);
console.log(`\n=== A/B 32KB ===\n  CAST-256  旧 ${o.toFixed(2)} ms  →  新 ${nn.toFixed(2)} ms   (${(o/nn).toFixed(2)}×, ${(32/nn).toFixed(1)} MB/s)`);
