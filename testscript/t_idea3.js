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
/* 旧版零件（与 crypto-extra.js 优化前一致） */
const MOD=0x10000, MULMOD=0x10001;
function mulOld(a,b){if(a===0)a=MOD;if(b===0)b=MOD;const r=(a*b)%MULMOD;return r===MOD?0:r;}
function mulInv(a){const x=a===0?MOD:a;let t0=0,t1=1,r0=MULMOD,r1=x;
  while(r1!==0){const q=Math.floor(r0/r1);const tr=r0-q*r1;r0=r1;r1=tr;const tt=t0-q*t1;t0=t1;t1=tt;}
  if(t0<0)t0+=MULMOD; if(t0<0)t0+=MULMOD; return t0===MOD?0:(t0%MULMOD);}
function expandKey(keyBytes){const K=new Uint16Array(52);
  for(let i=0;i<8;i++)K[i]=((keyBytes[i*2]<<8)|keyBytes[i*2+1])&0xFFFF;
  for(let idx=8;idx<52;idx+=8){const prev=[];for(let i=0;i<8;i++)prev.push(K[idx-8+i]);
    for(let j=0;j<8&&idx+j<52;j++){const hi=prev[(j+1)%8];const lo=prev[(j+2)%8];K[idx+j]=(((hi<<9)|(lo>>>7))&0xFFFF);}}
  return K;}
function decOld(block,K){
  const inv48=mulInv(K[48]), inv51=mulInv(K[51]);
  let x1=mulOld((block[0]<<8)|block[1],inv48);
  let x2=(((block[4]<<8)|block[5])-K[50])&0xFFFF;
  let x3=(((block[2]<<8)|block[3])-K[49])&0xFFFF;
  let x4=mulOld((block[6]<<8)|block[7],inv51);
  for(let r=7;r>=0;r--){const k=r*6;
    const w1=x1,w2=x2,w3=x3,w4=x4;
    const t2=mulOld(w1^w2,K[k+4]); const t3=((w3^w4)+t2)&0xFFFF;
    const t4=mulOld(t3,K[k+5]); const t5=(t2+t4)&0xFFFF;
    const a=(w1^t4)&0xFFFF, c=(w2^t4)&0xFFFF, b=(w3^t5)&0xFFFF, d=(w4^t5)&0xFFFF;
    x1=mulOld(a,mulInv(K[k])); x2=(b-K[k+1])&0xFFFF; x3=(c-K[k+2])&0xFFFF; x4=mulOld(d,mulInv(K[k+3]));}
  return new Uint8Array([(x1>>>8)&0xff,x1&0xff,(x2>>>8)&0xff,x2&0xff,(x3>>>8)&0xff,x3&0xff,(x4>>>8)&0xff,x4&0xff]);}
const k16=h2b(V[0].k);
const Kold=expandKey(k16);
const fnew=ALGOS.filter(x=>x.id==="idea")[0].makeBlockFn(k16);
const N=32*1024;
const data=new Uint8Array(N); for(let i=0;i<N;i++)data[i]=(i*11+1)&0xff;
function run(f,bs){for(let o=0;o<N;o+=bs) f(data.subarray(o,o+bs));}
function best(f,k){let b=1e9;for(let i=0;i<k;i++){const t0=process.hrtime.bigint();f();const t=Number(process.hrtime.bigint()-t0)/1e6;if(t<b)b=t;}return b;}
// 等价性
let eq=0; for(let i=0;i<200;i++){const p=data.subarray(i*8,i*8+8);
  if(b2h(fnew.dec(p))===b2h(decOld(p,Kold))) eq++; else if(eq===0&&i<2)console.log("  ✗",b2h(fnew.dec(p)),b2h(decOld(p,Kold)));}
console.log(`解密 新 vs 旧: ${eq}/200 ${eq===200?"OK":"FAIL"}`);

function encOld(block,K){
  let x1=(block[0]<<8)|block[1], x2=(block[2]<<8)|block[3], x3=(block[4]<<8)|block[5], x4=(block[6]<<8)|block[7];
  let k=0;
  for(let r=0;r<8;r++){
    const a=mulOld(x1,K[k]); const b=(x2+K[k+1])&0xFFFF;
    const c=(x3+K[k+2])&0xFFFF; const d=mulOld(x4,K[k+3]);
    const t2=mulOld(a^c,K[k+4]); const t3=(b^d)+t2&0xFFFF;
    const t4=mulOld(t3,K[k+5]); const t5=(t2+t4)&0xFFFF;
    let n1=a^t4,n2=b^t5,n3=c^t4,n4=d^t5; const tmp=n2;n2=n3;n3=tmp;
    x1=n1;x2=n2;x3=n3;x4=n4; k+=6;}
  const y1=mulOld(x1,K[48]); const y2=(x3+K[49])&0xFFFF;
  const y3=(x2+K[50])&0xFFFF; const y4=mulOld(x4,K[51]);
  return new Uint8Array([(y1>>>8)&0xff,y1&0xff,(y2>>>8)&0xff,y2&0xff,(y3>>>8)&0xff,y3&0xff,(y4>>>8)&0xff,y4&0xff]);}
const eo=best(()=>run(b=>encOld(b,Kold),8),5);
const en=best(()=>run(fnew.enc,8),5);
console.log(`  加密 旧 ${eo.toFixed(2)} ms → 新 ${en.toFixed(2)} ms  ${(eo/en).toFixed(2)}×`);

const o=best(()=>run(b=>decOld(b,Kold),8),5);
const n=best(()=>run(fnew.dec,8),5);
console.log(`\n=== 解密 A/B 32KB ===\n  旧（每块 32 次求逆 + 朴素取模） ${o.toFixed(2)} ms\n  新（预计算逆元 + hi/lo 乘法）   ${n.toFixed(2)} ms   ${(o/n).toFixed(2)}×`);
