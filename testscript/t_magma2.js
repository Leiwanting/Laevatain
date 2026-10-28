const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){console.error('FAIL',f,e.message);}});
const hx=s=>Uint8Array.from(s.match(/../g).map(x=>parseInt(x,16)));
const toHex=u=>Array.from(u).map(b=>b.toString(16).padStart(2,'0')).join('');

/* 1) 预合成表 vs 逐半字节（穷举全部 256 项 × 4 张表） */
let ok=0,bad=0,firstBad=null;
for(let i=0;i<4;i++){
  const rowHi=MAGMA_SBOX[2*i+1], rowLo=MAGMA_SBOX[2*i];
  for(let b=0;b<256;b++){
    const want=((rowHi[(b&0xf0)>>4]<<4)|rowLo[b&0x0f])&0xff;
    if(MAGMA_T[3-i][b]===want) ok++;
    else {bad++; if(!firstBad)firstBad={i,b,got:MAGMA_T[3-i][b],want};}
  }
}
console.log('Magma 预合成表 vs 公式(4×256): '+ok+'/1024'+(bad?'  ✗':'  ✓'));
if(firstBad) console.log('  首例 i='+firstBad.i+' b='+firstBad.b+' got '+firstBad.got+' want '+firstBad.want);

/* 2) 整块等价：优化后的 F 与「逐半字节 + rotl」逐步对照 */
let s=0; const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return (s>>>16)&255;};
function oldSubst(x){let out=0;for(let i=0;i<8;i++){const nib=(x>>>(4*i))&0xF;out|=(MAGMA_SBOX[i][nib]<<(4*i));}return out>>>0;}
function oldF(k,x){const v=oldSubst((k+x)>>>0);return (((v<<11)|(v>>>21))>>>0);}
/* 用同一组轮密钥重建旧版整块加解密 */
function oldKeySchedule(keyBytes){const base=new Uint32Array(8);
  for(let i=0;i<8;i++)base[i]=readU32BE(keyBytes,i*4);
  const K=new Uint32Array(32);
  for(let i=0;i<24;i++)K[i]=base[i%8];
  for(let i=0;i<8;i++)K[24+i]=base[7-i];
  return K;}
function oldEnc(b,K){let a1=readU32BE(b,0),a0=readU32BE(b,4);
  for(let i=0;i<31;i++){const g=(a1^oldF(K[i],a0))>>>0;a1=a0;a0=g;}
  a1=(a1^oldF(K[31],a0))>>>0;
  const o=new Uint8Array(8);writeU32BE(a1,o,0);writeU32BE(a0,o,4);return o;}
function oldDec(b,K){let a1=readU32BE(b,0),a0=readU32BE(b,4);
  for(let i=31;i>=1;i--){const g=(a1^oldF(K[i],a0))>>>0;a1=a0;a0=g;}
  a1=(a1^oldF(K[0],a0))>>>0;
  const o=new Uint8Array(8);writeU32BE(a1,o,0);writeU32BE(a0,o,4);return o;}

const F=ALGOS.find(a=>a.id==='magma').makeBlockFn;
let eq=0,ne=0,fb=null;
for(let t=0;t<400;t++){
  const k=new Uint8Array(32),p=new Uint8Array(8);
  for(let i=0;i<32;i++)k[i]=rnd(); for(let i=0;i<8;i++)p[i]=rnd();
  const K=oldKeySchedule(k), f=F(k);
  const cNew=toHex(f.enc(p)), cOld=toHex(oldEnc(p,K));
  const rNew=toHex(f.dec(hx(cNew))), rOld=toHex(oldDec(hx(cNew),K));
  if(cNew===cOld && rNew===toHex(p) && rOld===rNew) eq++;
  else {ne++; if(!fb)fb={cNew,cOld,rNew,rOld,want:toHex(p)};}
}
console.log('Magma 新旧整块等价+往返(400): '+eq+'/400'+(ne?'  ✗':'  ✓'));
if(fb) console.log('  首例 新CT '+fb.cNew+' 旧CT '+fb.cOld+' 新PT '+fb.rNew+' 旧PT '+fb.rOld+' 应 '+fb.want);

/* 3) 边界：全 0 / 全 FF / 进位临界密钥 */
let z=0,zn=0;
const edge=[];
for(const fill of [0,255]){
  edge.push([new Uint8Array(32).fill(fill), new Uint8Array(8).fill(fill)]);
  edge.push([new Uint8Array(32).fill(fill), new Uint8Array(8).fill(fill^255)]);
}
const kCarry=new Uint8Array(32); for(let i=0;i<32;i++)kCarry[i]=i%2?0xff:0x00;
edge.push([kCarry,new Uint8Array([0xff,0xff,0xff,0xff,0,0,0,1])]);
edge.push([kCarry,new Uint8Array([0x7f,0xff,0xff,0xff,0x80,0,0,0])]);
for(const [k,p] of edge){
  const K=oldKeySchedule(k), f=F(k);
  const c=f.enc(p);
  if(toHex(c)===toHex(oldEnc(p,K)) && toHex(f.dec(c))===toHex(p)) z++; else zn++;
}
console.log('Magma 边界(全0/全FF/进位, 6 组): '+z+'/6'+(zn?'  ✗':'  ✓'));

/* 4) RFC 8891 官方向量 */
const VK=hx('ffeeddccbbaa99887766554433221100f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff');
const VP=hx('fedcba9876543210');
const VC='4ee901e5c2d8ca3d';
const got=toHex(F(VK).enc(VP));
console.log('RFC 8891 向量: '+got+'  want '+VC+'  '+(got===VC?'✓':'✗'));

/* 5) 公平 A/B：64KB */
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
const key=new Uint8Array(32); for(let i=0;i<32;i++)key[i]=i*7+1;
const best=(fn,reps)=>{let t=Infinity;for(let r=0;r<reps;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6; if(ms<t)t=ms;} return t;};
const KK=oldKeySchedule(key), ff=F(key);
const rE=()=>{for(let o=0;o<data.length;o+=8)ff.enc(data.subarray(o,o+8));};
const rD=()=>{for(let o=0;o<data.length;o+=8)ff.dec(data.subarray(o,o+8));};
const oE=()=>{for(let o=0;o<data.length;o+=8)oldEnc(data.subarray(o,o+8),KK);};
const oD=()=>{for(let o=0;o<data.length;o+=8)oldDec(data.subarray(o,o+8),KK);};
oE();rE();oD();rD();
console.log('\n64KB 公平 A/B：');
console.log('  加密  '+best(oE,7).toFixed(2).padStart(7)+' ms  →'+best(rE,7).toFixed(2).padStart(7)+' ms   '+(best(oE,3)/best(rE,3)).toFixed(2)+'×');
console.log('  解密  '+best(oD,7).toFixed(2).padStart(7)+' ms  →'+best(rD,7).toFixed(2).padStart(7)+' ms   '+(best(oD,3)/best(rD,3)).toFixed(2)+'×');
