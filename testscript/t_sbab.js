const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
/* 旧实现重建（每步都分配 + 每次 LPS 调 streebogGetTHL） */
function sbLpsOld(d){const TH=streebogGetTHHack();const o=new Uint8Array(64);
  for(let k=0;k<8;k++){let vl=0,vh=0;for(let r=0;r<8;r++){const idx=d[k+r*8];vl^=TH.lo[r][idx];vh^=TH.hi[r][idx];}
    vl>>>=0;vh>>>=0;o[k*8]=vl&255;o[k*8+1]=(vl>>>8)&255;o[k*8+2]=(vl>>>16)&255;o[k*8+3]=(vl>>>24)&255;
    o[k*8+4]=vh&255;o[k*8+5]=(vh>>>8)&255;o[k*8+6]=(vh>>>16)&255;o[k*8+7]=(vh>>>24)&255;}
  return o;}
let _cache=null;
function streebogGetTHHack(){ if(_cache)return _cache; const T=streebogGetT(); const lo=[],hi=[];
  for(let r=0;r<T.length;r++){const L=new Uint32Array(256),H=new Uint32Array(256);
    for(let j=0;j<256;j++){L[j]=Number(T[r][j]&0xffffffffn)>>>0;H[j]=Number((T[r][j]>>32n)&0xffffffffn)>>>0;}lo.push(L);hi.push(H);}
  _cache={lo,hi}; return _cache;}
function sbXorOld(a,b){const o=new Uint8Array(64);for(let i=0;i<64;i++)o[i]=a[i]^b[i];return o;}
function sbAddOld(a,b){const o=new Uint8Array(64);let c=0;for(let i=0;i<64;i++){c=a[i]+b[i]+(c>>8);o[i]=c&255;}return o;}
function sbEOld(k,d){let x=sbXorOld(k,d);for(let i=0;i<12;i++){x=sbLpsOld(x);k=sbLpsOld(sbXorOld(k,STREEBOG_C[i]));x=sbXorOld(x,k);}return x;}
function sbGOld(h,n,d){const k=sbLpsOld(sbXorOld(n,h));let x=sbEOld(k,d);x=sbXorOld(x,h);return sbXorOld(x,d);}
function sbDigOld(inp,outLen){outLen=outLen||64;let h=new Uint8Array(64);if(outLen===32)h.fill(1);
  let n=new Uint8Array(64),sg=new Uint8Array(64);const V512=new Uint8Array(64);V512[1]=2;const V0=new Uint8Array(64);
  const nf=Math.floor(inp.length/64);
  for(let i=0;i<nf;i++){const b=inp.subarray(i*64,(i+1)*64);h=sbGOld(h,n,b);n=sbAddOld(n,V512);sg=sbAddOld(sg,b);}
  const rem=inp.length-nf*64;const last=new Uint8Array(64);last.set(inp.subarray(nf*64));last[rem]=1;
  h=sbGOld(h,n,last);const bl=rem*8;const lb=new Uint8Array(64);lb[0]=bl&255;lb[1]=(bl>>>8)&255;
  n=sbAddOld(n,lb);sg=sbAddOld(sg,last);h=sbGOld(h,V0,n);h=sbGOld(h,V0,sg);return h.subarray(64-outLen);}
/* 旧实现正确性 */
console.log("旧实现空串 = "+Buffer.from(sbDigOld(new Uint8Array(0))).toString("hex").slice(0,32)+"  （应 8e945da2...）");
const best=(fn,n)=>{let t=Infinity;for(let r=0;r<n;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6;if(ms<t)t=ms;}return t;};
const o=best(()=>sbDigOld(data),5), w=best(()=>streebogDigest(data),5);
console.log("Streebog 64KB: "+o.toFixed(1)+" ms → "+w.toFixed(1)+" ms  "+(o/w).toFixed(2)+"×");
