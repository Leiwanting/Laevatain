const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){console.error('FAIL',f,e.message);}});

const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
const best=(fn,reps)=>{let t=Infinity;for(let r=0;r<reps;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6; if(ms<t)t=ms;} return t;};

/* 两条路径：逐比特 IP/FP（旧） 与 查表 IP/FP（新），其余完全相同 */
function runBits(b,sk){var w=desIpWordsBits(b),L=w[0],R=w[1];
  for(let i=0;i<16;i++){const nR=(L^desF32(R,sk,i*8))>>>0;L=R;R=nR;}
  return desFpBytesBits(R,L);}
function runTab(b,sk){var w=desIpWords(b),L=w[0],R=w[1];
  for(let i=0;i<16;i++){const nR=(L^desF32(R,sk,i*8))>>>0;L=R;R=nR;}
  return desFpBytes(R,L);}

const dk=new Uint8Array(8); for(let i=0;i<8;i++)dk[i]=i*13+1;
const sk=desSubkeysFast(dk);
const kBits=()=>{for(let o=0;o<data.length;o+=8)runBits(data.subarray(o,o+8),sk);};
const kTab =()=>{for(let o=0;o<data.length;o+=8)runTab(data.subarray(o,o+8),sk);};
/* 交替预热，抵消 JIT 顺序偏差 */
for(let i=0;i<3;i++){kBits();kTab();}
const rounds=[];
for(let i=0;i<5;i++){rounds.push([best(kBits,3),best(kTab,3)]);}
const med=a=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)];
const bB=med(rounds.map(r=>r[0])), bT=med(rounds.map(r=>r[1]));
console.log('DES 64KB  IP/FP 逐比特 vs 查表（各取 5 组中位数）：');
console.log('  逐比特 '+bB.toFixed(2)+' ms   查表 '+bT.toFixed(2)+' ms   '+(bB/bT).toFixed(2)+'×');

/* 纯 Feistel 成本（不含 IP/FP），用于判断瓶颈在哪 */
function runCore(b,sk){var w=desIpWords(b),L=w[0],R=w[1];
  for(let i=0;i<16;i++){const nR=(L^desF32(R,sk,i*8))>>>0;L=R;R=nR;}
  return (L^R)>>>0;}
const kCore=()=>{let s=0;for(let o=0;o<data.length;o+=8)s^=runCore(data.subarray(o,o+8),sk);return s;};
const kIp=()=>{let s=0;for(let o=0;o<data.length;o+=8)s^=desIpWords(data.subarray(o,o+8))[0];return s;};
for(let i=0;i<2;i++){kCore();kIp();}
const tCore=best(kCore,5), tIp=best(kIp,5);
console.log('  仅 Feistel(16 轮) '+tCore.toFixed(2)+' ms   仅 IP '+tIp.toFixed(2)+' ms');
