const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){console.error('FAIL',f,e.message);}});
const toHex=u=>Array.from(u).map(b=>b.toString(16).padStart(2,'0')).join('');
const hx=s=>Uint8Array.from(s.match(/../g).map(x=>parseInt(x,16)));

/* 1) IP/FP 查表版 vs 逐比特版：穷举全部 256 值 × 8 字节位置，再叠加随机整块 */
let ok=0,bad=0,fb=null;
for(let p=0;p<8;p++){
  for(let v=0;v<256;v++){
    const b=new Uint8Array(8); b[p]=v;
    const a=desIpWords(b), c=desIpWordsBits(b);
    if(a[0]===c[0]&&a[1]===c[1]) ok++; else {bad++; if(!fb)fb={p,v,a,c};}
    const o1=desFpBytes(a[0],a[1]), o2=desFpBytesBits(a[0],a[1]);
    if(toHex(o1)===toHex(o2)) ok++; else {bad++; if(!fb)fb={p,v,o1:toHex(o1),o2:toHex(o2)};}
  }
}
console.log('IP/FP 查表 vs 逐比特(8×256×2): '+ok+'/'+(ok+bad)+(bad?'  ✗':'  ✓'));
if(fb)console.log('  首例',JSON.stringify(fb));
let r=12345; const rnd=()=>{r=(r*1103515245+12345)&0x7fffffff;return (r>>>16)&255;};
let ok2=0,bad2=0;
for(let t=0;t<500;t++){
  const b=new Uint8Array(8); for(let i=0;i<8;i++)b[i]=rnd();
  const a=desIpWords(b), c=desIpWordsBits(b);
  if(a[0]===c[0]&&a[1]===c[1]&&toHex(desFpBytes(a[0],a[1]))===toHex(desFpBytesBits(a[0],a[1]))) ok2++; else bad2++;
}
console.log('IP/FP 随机整块(500): '+ok2+'/500'+(bad2?'  ✗':'  ✓'));

/* 2) DES 官方向量 + 3DES 往返 */
const DK=hx('133457799bbcdff1'), DP=hx('0123456789abcdef'), DC='85e813540f0ab405';
const got=toHex(ALGOS.find(a=>a.id==='des').makeBlockFn(DK).enc(DP));
console.log('DES 官方向量: '+got+'  want '+DC+'  '+(got===DC?'✓':'✗'));
const k24=new Uint8Array(24); for(let i=0;i<24;i++)k24[i]=i*11+1;
const f3=ALGOS.find(a=>a.id==='3des').makeBlockFn(k24);
let e3=0,n3=0;
for(let t=0;t<300;t++){
  const p=new Uint8Array(8); for(let i=0;i<8;i++)p[i]=rnd();
  const c=f3.enc(p);
  if(toHex(f3.dec(c))===toHex(p)) e3++; else n3++;
}
console.log('3DES 往返(300): '+e3+'/300'+(n3?'  ✗':'  ✓'));
/* 3DES 与「三次独立 DES」对照 */
const f1=ALGOS.find(a=>a.id==='des').makeBlockFn(k24.subarray(0,8));
const f2=ALGOS.find(a=>a.id==='des').makeBlockFn(k24.subarray(8,16));
const f3b=ALGOS.find(a=>a.id==='des').makeBlockFn(k24.subarray(16,24));
let e4=0,n4=0;
for(let t=0;t<200;t++){
  const p=new Uint8Array(8); for(let i=0;i<8;i++)p[i]=rnd();
  const ref=f1.enc(f2.dec(f3b.enc(p)));
  if(toHex(f3.enc(p))===toHex(ref)) e4++; else n4++;
}
console.log('3DES vs 独立三次 DES(200): '+e4+'/200'+(n4?'  ✗':'  ✓'));

/* 3) 公平 A/B */
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
const best=(fn,reps)=>{let t=Infinity;for(let r=0;r<reps;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6; if(ms<t)t=ms;} return t;};
/* 旧路径：用逐比特版的 IP/FP 重建 */
function oldDes(b,sk){var w=desIpWordsBits(b),L=w[0],R=w[1];
  for(let i=0;i<16;i++){const nR=(L^desF32(R,sk,i*8))>>>0;L=R;R=nR;}
  return desFpBytesBits(R,L);}
const dk=new Uint8Array(8); for(let i=0;i<8;i++)dk[i]=i*13+1;
const skFlat=desSubkeysFast(dk);
const fNew=ALGOS.find(a=>a.id==='des').makeBlockFn(dk);
const rN=()=>{for(let o=0;o<data.length;o+=8)fNew.enc(data.subarray(o,o+8));};
const rO=()=>{for(let o=0;o<data.length;o+=8)oldDes(data.subarray(o,o+8),skFlat);};
rN();rO();
const nE=best(rN,7), oE=best(rO,7);
console.log('\n64KB 公平 A/B：');
console.log('  DES   '+oE.toFixed(2).padStart(7)+' ms → '+nE.toFixed(2).padStart(7)+' ms   '+(oE/nE).toFixed(2)+'×');
const n3E=best(()=>{for(let o=0;o<data.length;o+=8)f3.enc(data.subarray(o,o+8));},7);
console.log('  3DES  (优化后) '+n3E.toFixed(2)+' ms   —— 旧值 4.17 ms  '+(4.17/n3E).toFixed(2)+'×');
