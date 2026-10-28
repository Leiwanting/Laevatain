const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e].type||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){console.error('LOAD FAIL',f,e.message);}});

/* ---- 旧实现（逐字复制自优化前，用于等价对照） ---- */
const _S=[_sbox0,_sbox1,_sbox2,_sbox3,_sbox4,_sbox5,_sbox6,_sbox7];
const _I=[_inbox0,_inbox1,_inbox2,_inbox3,_inbox4,_inbox5,_inbox6,_inbox7];
function oldEncBlock(block,K){
  var a=readU32LE(block,0),b=readU32LE(block,4),c=readU32LE(block,8),d=readU32LE(block,12);
  for(var i=0;i<32;i++){
    a=(a^K[4*i+8])>>>0;b=(b^K[4*i+9])>>>0;c=(c^K[4*i+10])>>>0;d=(d^K[4*i+11])>>>0;
    var r=_S[i%8](a,b,c,d); a=r[0];b=r[1];c=r[2];d=r[3];
    if(i<31){var t=serpentLinear(a,b,c,d);a=t[0];b=t[1];c=t[2];d=t[3];}
  }
  a=(a^K[4*32+8])>>>0;b=(b^K[4*32+9])>>>0;c=(c^K[4*32+10])>>>0;d=(d^K[4*32+11])>>>0;
  var out=new Uint8Array(16);writeU32LE(a,out,0);writeU32LE(b,out,4);writeU32LE(c,out,8);writeU32LE(d,out,12);return out;}
function oldDecBlock(block,K){
  var a=readU32LE(block,0),b=readU32LE(block,4),c=readU32LE(block,8),d=readU32LE(block,12);
  a=(a^K[4*32+8])>>>0;b=(b^K[4*32+9])>>>0;c=(c^K[4*32+10])>>>0;d=(d^K[4*32+11])>>>0;
  for(var i=31;i>=0;i--){
    if(i<31){var t=serpentLinearInv(a,b,c,d);a=t[0];b=t[1];c=t[2];d=t[3];}
    var r=_I[i%8](a,b,c,d);a=r[0];b=r[1];c=r[2];d=r[3];
    a=(a^K[4*i+8])>>>0;b=(b^K[4*i+9])>>>0;c=(c^K[4*i+10])>>>0;d=(d^K[4*i+11])>>>0;
  }
  var out=new Uint8Array(16);writeU32LE(a,out,0);writeU32LE(b,out,4);writeU32LE(c,out,8);writeU32LE(d,out,12);return out;}
function oldMake(keyBytes){var K=serpentKeySchedule(keyBytes);
  return {enc:b=>oldEncBlock(b,K),dec:b=>oldDecBlock(b,K)};}

const hx=s=>Uint8Array.from(s.match(/../g).map(x=>parseInt(x,16)));
const toHex=u=>Array.from(u).map(b=>b.toString(16).padStart(2,'0')).join('');

/* ---- 1) 对 pyserpent 官方向量 ---- */
const vecs=JSON.parse(fs.readFileSync('_serpent_vec.json','utf8'));
let ok=0,bad=0;
for(const v of vecs){
  const f=serpentMakeBlockFn(hx(v.key));
  const c=toHex(f.enc(hx(v.pt)));
  const p=toHex(f.dec(hx(v.ct)));
  if(c===v.ct&&p===v.pt) ok++; else {bad++;console.log('  MISMATCH',v.key,c,v.ct);}
}
console.log('pyserpent 向量: '+ok+'/'+(ok+bad)+(bad?'  ✗':'  ✓'));

/* ---- 2) 新旧等价（随机 key/block，双向） ---- */
let eq=0,ne=0;
for(let t=0;t<300;t++){
  const kl=16+8*(t%3);
  const key=new Uint8Array(kl),blk=new Uint8Array(16);
  for(let i=0;i<kl;i++)key[i]=(Math.random()*256)|0;
  for(let i=0;i<16;i++)blk[i]=(Math.random()*256)|0;
  const o=oldMake(key),n=serpentMakeBlockFn(key);
  const c1=toHex(o.enc(blk)),c2=toHex(n.enc(blk));
  const p1=toHex(o.dec(hx(c1))),p2=toHex(n.dec(hx(c2)));
  if(c1===c2&&p1===p2&&p1===toHex(blk)) eq++; else {ne++;if(ne<3)console.log('  NE',c1,c2,p1,p2);}
}
console.log('新旧等价(300): '+eq+'/300'+(ne?'  ✗':'  ✓'));

/* ---- 3) 公平 A/B 基准：64KB ---- */
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
const key32=new Uint8Array(32); for(let i=0;i<32;i++)key32[i]=i;
const best=(fn,reps)=>{let t=Infinity;for(let r=0;r<reps;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6; if(ms<t)t=ms;} return t;};
const run=(f)=>{for(let o=0;o<data.length;o+=16) f.enc(data.subarray(o,o+16));};
const runD=(f)=>{for(let o=0;o<data.length;o+=16) f.dec(data.subarray(o,o+16));};
const oF=oldMake(key32), nF=serpentMakeBlockFn(key32);
best(()=>run(oF),2); best(()=>run(nF),2);   // 预热，抵消 JIT 冷启动差异
const oldE=best(()=>run(oF),5), newE=best(()=>run(nF),5);
const oldD=best(()=>runD(oF),5), newD=best(()=>runD(nF),5);
console.log('\n64KB 公平 A/B（同一预热方法，取最快）：');
console.log('  加密  '+oldE.toFixed(1).padStart(7)+' ms  →'+newE.toFixed(1).padStart(7)+' ms   '+(oldE/newE).toFixed(2)+'×');
console.log('  解密  '+oldD.toFixed(1).padStart(7)+' ms  →'+newD.toFixed(1).padStart(7)+' ms   '+(oldD/newD).toFixed(2)+'×');
