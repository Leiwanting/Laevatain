const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const OLD=ALGOS.find(a=>a.id==='idea').makeBlockFn;

/* ================= 优化版 ================= */
const M=0x10000, P=0x10001;
function ideaMulF(a,b){
  if(a===0)a=M;
  if(b===0)b=M;
  const p=a*b;
  /* p ≤ 2^32；2^16 ≡ -1 (mod 2^16+1) ⇒ p ≡ (p&0xFFFF) - (p>>>16) */
  const lo=p&0xFFFF, hi=(p/0x10000)|0;
  let x=lo-hi;
  if(x<0)x+=P;
  return x===M?0:x;
}
function ideaMulInvS(a){
  const x=a===0?M:a;
  let t0=0,t1=1,r0=P,r1=x;
  while(r1!==0){const q=Math.floor(r0/r1);
    const tr=r0-q*r1;r0=r1;r1=tr; const tt=t0-q*t1;t0=t1;t1=tt;}
  if(t0<0)t0+=P; if(t0<0)t0+=P;
  return t0===M?0:(t0%P);
}
function ideaExpandKeyF(keyBytes){
  const K=new Uint16Array(52);
  for(let i=0;i<8;i++)K[i]=((keyBytes[i*2]<<8)|keyBytes[i*2+1])&0xFFFF;
  for(let idx=8;idx<52;idx+=8){
    const prev=[];
    for(let i=0;i<8;i++)prev.push(K[idx-8+i]);
    for(let j=0;j<8&&idx+j<52;j++){
      const hi=prev[(j+1)%8], lo=prev[(j+2)%8];
      K[idx+j]=(((hi<<9)|(lo>>>7))&0xFFFF);
    }
  }
  return K;
}
/* 解密子密钥：8 轮 × 4 次扩展欧几里得 = 每块 32 次，改为每密钥一次 */
function ideaDecKey(K){
  const D=new Uint16Array(52);
  for(let r=0;r<8;r++){const k=r*6;
    D[k]=ideaMulInvS(K[k]);
    D[k+1]=(M-K[k+1])&0xFFFF;
    D[k+2]=(M-K[k+2])&0xFFFF;
    D[k+3]=ideaMulInvS(K[k+3]);
    D[k+4]=K[k+4]; D[k+5]=K[k+5];
  }
  D[48]=ideaMulInvS(K[48]);
  D[49]=(M-K[49])&0xFFFF;
  D[50]=(M-K[50])&0xFFFF;
  D[51]=ideaMulInvS(K[51]);
  return D;
}
function ideaEncF(block,K){
  let x1=(block[0]<<8)|block[1],x2=(block[2]<<8)|block[3],
      x3=(block[4]<<8)|block[5],x4=(block[6]<<8)|block[7];
  let k=0;
  for(let r=0;r<8;r++){
    const a=ideaMulF(x1,K[k]);
    const b=(x2+K[k+1])&0xFFFF;
    const c=(x3+K[k+2])&0xFFFF;
    const d=ideaMulF(x4,K[k+3]);
    const t2=ideaMulF(a^c,K[k+4]);
    const t3=(b^d)+t2&0xFFFF;
    const t4=ideaMulF(t3,K[k+5]);
    const t5=(t2+t4)&0xFFFF;
    let n1=a^t4,n2=b^t5,n3=c^t4,n4=d^t5;
    const tmp=n2;n2=n3;n3=tmp;
    x1=n1;x2=n2;x3=n3;x4=n4; k+=6;
  }
  const y1=ideaMulF(x1,K[48]),y2=(x3+K[49])&0xFFFF,
        y3=(x2+K[50])&0xFFFF,y4=ideaMulF(x4,K[51]);
  return new Uint8Array([y1>>>8,y1&0xff,y2>>>8,y2&0xff,y3>>>8,y3&0xff,y4>>>8,y4&0xff]);
}
function ideaDecF(block,D){
  let x1=ideaMulF((block[0]<<8)|block[1],D[48]);
  let x2=(((block[4]<<8)|block[5])+D[50])&0xFFFF;
  let x3=(((block[2]<<8)|block[3])+D[49])&0xFFFF;
  let x4=ideaMulF((block[6]<<8)|block[7],D[51]);
  for(let r=7;r>=0;r--){
    const k=r*6;
    const w1=x1,w2=x2,w3=x3,w4=x4;
    const t2=ideaMulF(w1^w2,D[k+4]);
    const t3=((w3^w4)+t2)&0xFFFF;
    const t4=ideaMulF(t3,D[k+5]);
    const t5=(t2+t4)&0xFFFF;
    const a=(w1^t4)&0xFFFF, c=(w2^t4)&0xFFFF, b=(w3^t5)&0xFFFF, d=(w4^t5)&0xFFFF;
    x1=ideaMulF(a,D[k]);
    x2=(b+D[k+1])&0xFFFF;
    x3=(c+D[k+2])&0xFFFF;
    x4=ideaMulF(d,D[k+3]);
  }
  return new Uint8Array([x1>>>8,x1&0xff,x2>>>8,x2&0xff,x3>>>8,x3&0xff,x4>>>8,x4&0xff]);
}
function NEW(keyBytes){const K=ideaExpandKeyF(keyBytes),D=ideaDecKey(K);
  return {enc:b=>ideaEncF(b,K),dec:b=>ideaDecF(b,D)};}

const hx=s=>Uint8Array.from(s.match(/../g).map(x=>parseInt(x,16)));
const toHex=u=>Array.from(u).map(b=>b.toString(16).padStart(2,'0')).join('');

/* 1) 独立 Python 参考向量 */
const vecs=JSON.parse(fs.readFileSync('_idea_vec.json','utf8'));
let ok=0,bad=0;
for(const v of vecs){
  const o=OLD(hx(v.key)), n=NEW(hx(v.key));
  const co=toHex(o.enc(hx(v.pt))), cn=toHex(n.enc(hx(v.pt)));
  if(co===v.ct&&cn===v.ct) ok++; else {bad++;if(bad<4)console.log('  MISMATCH old',co,'new',cn,'want',v.ct);}
}
console.log('Python 独立参考向量(加密): '+ok+'/'+(ok+bad)+(bad?'  ✗':'  ✓'));

/* 2) 新旧等价 + 双向往返 */
let eq=0,ne=0;
for(let t=0;t<400;t++){
  const key=new Uint8Array(16),blk=new Uint8Array(8);
  for(let i=0;i<16;i++)key[i]=(Math.random()*256)|0;
  for(let i=0;i<8;i++)blk[i]=(Math.random()*256)|0;
  const o=OLD(key),n=NEW(key);
  const co=toHex(o.enc(blk)),cn=toHex(n.enc(blk));
  const po=toHex(o.dec(hx(co))),pn=toHex(n.dec(hx(cn)));
  const want=toHex(blk);
  if(co===cn&&po===want&&pn===want) eq++; else {ne++;if(ne<4)console.log('  NE',co,cn,po,pn,want);}
}
console.log('新旧等价+往返(400): '+eq+'/400'+(ne?'  ✗':'  ✓'));

/* 3) 边界：含 0x0000 字的密钥与明文 */
let z=0,zn=0;
for(let t=0;t<200;t++){
  const key=new Uint8Array(16),blk=new Uint8Array(8);
  for(let i=0;i<16;i++)key[i]=(Math.random()<0.5)?0:((Math.random()*256)|0);
  for(let i=0;i<8;i++)blk[i]=(Math.random()<0.5)?0:((Math.random()*256)|0);
  const o=OLD(key),n=NEW(key);
  const co=toHex(o.enc(blk)),cn=toHex(n.enc(blk));
  if(co===cn&&toHex(n.dec(hx(cn)))===toHex(blk)) z++; else {zn++;if(zn<4)console.log('  Z',co,cn);}
}
console.log('含 0x0000 字边界(200): '+z+'/200'+(zn?'  ✗':'  ✓'));

/* 4) 公平 A/B */
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
const key=new Uint8Array(16); for(let i=0;i<16;i++)key[i]=i+1;
const best=(fn,reps)=>{let t=Infinity;for(let r=0;r<reps;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6; if(ms<t)t=ms;} return t;};
const runE=f=>{for(let o=0;o<data.length;o+=8) f.enc(data.subarray(o,o+8));};
const runD=f=>{for(let o=0;o<data.length;o+=8) f.dec(data.subarray(o,o+8));};
const oF=OLD(key), nF=NEW(key);
runE(oF);runE(nF);runD(oF);runD(nF);
const oE=best(()=>runE(oF),5),nE=best(()=>runE(nF),5);
const oD=best(()=>runD(oF),5),nD=best(()=>runD(nF),5);
console.log('\n64KB 公平 A/B：');
console.log('  加密  '+oE.toFixed(2).padStart(7)+' ms  →'+nE.toFixed(2).padStart(7)+' ms   '+(oE/nE).toFixed(2)+'×');
console.log('  解密  '+oD.toFixed(2).padStart(7)+' ms  →'+nD.toFixed(2).padStart(7)+' ms   '+(oD/nD).toFixed(2)+'×');
