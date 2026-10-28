const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
/* BigInt 参考实现（独立重写，不依赖被替换的旧代码） */
const M64=0xFFFFFFFFFFFFFFFFn;
function rotr(x,n){ n=BigInt(n); return ((x>>n)|(x<<(64n-n)))&M64; }
function refCompress(H, block){
  const w=[];
  for(let i=0;i<16;i++){ let v=0n; for(let j=0;j<8;j++) v=(v<<8n)|BigInt(block[i*8+j]); w.push(v); }
  for(let i=16;i<80;i++){
    const a=w[i-15], b=w[i-2];
    const s0=rotr(a,1)^rotr(a,8)^(a>>7n);
    const s1=rotr(b,19)^rotr(b,61)^(b>>6n);
    w.push((w[i-16]+s0+w[i-7]+s1)&M64);
  }
  let [a,b,c,d,e,f,g,h]=H;
  for(let i=0;i<80;i++){
    const S1=rotr(e,14)^rotr(e,18)^rotr(e,41);
    const ch=(e&f)^((~e&M64)&g);
    const t1=(h+S1+ch+SHA512_K[i]+w[i])&M64;
    const S0=rotr(a,28)^rotr(a,34)^rotr(a,39);
    const maj=(a&b)^(a&c)^(b&c);
    const t2=(S0+maj)&M64;
    h=g;g=f;f=e;e=(d+t1)&M64;d=c;c=b;b=a;a=(t1+t2)&M64;
  }
  return [(H[0]+a)&M64,(H[1]+b)&M64,(H[2]+c)&M64,(H[3]+d)&M64,(H[4]+e)&M64,(H[5]+f)&M64,(H[6]+g)&M64,(H[7]+h)&M64];
}
const block=new Uint8Array(128); for(let i=0;i<128;i++)block[i]=i;
const H0=[0x6a09e667f3bcc908n,0xbb67ae8584caa73bn,0x3c6ef372fe94f82bn,0xa54ff53a5f1d36f1n,
0x510e527fade682d1n,0x9b05688c2b3e6c1fn,0x1f83d9abfb41bd6bn,0x5be0cd19137e2179n];
const ref=refCompress(H0.slice(),block);
/* 我的 hi/lo 版 */
sha512InitK();
const ivh=s512IvOf(IV_512);
const HL=new Uint32Array(ivh.lo), HH=new Uint32Array(ivh.hi);
sha512CompressHL(HL,HH,block);
const mine=[]; for(let i=0;i<8;i++) mine.push((BigInt(HH[i])<<32n)|BigInt(HL[i]));
console.log("参考 H:"); ref.forEach((v,i)=>console.log("  ["+i+"] "+v.toString(16).padStart(16,"0")));
console.log("我的 H:"); mine.forEach((v,i)=>console.log("  ["+i+"] "+v.toString(16).padStart(16,"0")+(v===ref[i]?"  ✓":"  ✗")));
/* 对比 W 数组 */
const WL=S512_WL, WH=S512_WH;
