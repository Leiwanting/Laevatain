const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
function oldRound(vl,vh,ml,mh,s){var t;
  function G(ia,ib,ic,id,xi,yi){
    t=b2bAdd(vl[ia],vh[ia],vl[ib],vh[ib]); t=b2bAdd(t[0],t[1],ml[xi],mh[xi]); vl[ia]=t[0];vh[ia]=t[1];
    t=b2bRotr((vl[id]^vl[ia])>>>0,(vh[id]^vh[ia])>>>0,32); vl[id]=t[0];vh[id]=t[1];
    t=b2bAdd(vl[ic],vh[ic],vl[id],vh[id]); vl[ic]=t[0];vh[ic]=t[1];
    t=b2bRotr((vl[ib]^vl[ic])>>>0,(vh[ib]^vh[ic])>>>0,24); vl[ib]=t[0];vh[ib]=t[1];
    t=b2bAdd(vl[ia],vh[ia],vl[ib],vh[ib]); t=b2bAdd(t[0],t[1],ml[yi],mh[yi]); vl[ia]=t[0];vh[ia]=t[1];
    t=b2bRotr((vl[id]^vl[ia])>>>0,(vh[id]^vh[ia])>>>0,16); vl[id]=t[0];vh[id]=t[1];
    t=b2bAdd(vl[ic],vh[ic],vl[id],vh[id]); vl[ic]=t[0];vh[ic]=t[1];
    t=b2bRotr((vl[ib]^vl[ic])>>>0,(vh[ib]^vh[ic])>>>0,63); vl[ib]=t[0];vh[ib]=t[1];
  }
  G(0,4,8,12,s[0],s[1]);G(1,5,9,13,s[2],s[3]);G(2,6,10,14,s[4],s[5]);G(3,7,11,15,s[6],s[7]);
  G(0,5,10,15,s[8],s[9]);G(1,6,11,12,s[10],s[11]);G(2,7,8,13,s[12],s[13]);G(3,4,9,14,s[14],s[15]);}
function oldDigest(input){ /* 旧结构：new Array + b2bLoadMsg + 每次返回数组 */
  var hl=new Array(8),hh=new Array(8),i;
  for(i=0;i<8;i++){hl[i]=B2B_IV_LO[i];hh[i]=B2B_IV_HI[i];}
  hl[0]=(hl[0]^(0x01010000^64))>>>0;
  var bs=128, nFull=Math.floor(input.length/bs), rem=input.length-nFull*bs;
  var blocks=[]; for(i=0;i<nFull;i++) blocks.push(input.subarray(i*bs,(i+1)*bs));
  var tail;
  if(rem===0 && nFull>0){ tail=new Uint8Array(0); }
  else { tail=input.subarray(nFull*bs); }
  var last=new Uint8Array(bs); last.set(tail); blocks.push(last);
  for(i=0;i<blocks.length;i++){ var isLast=(i===blocks.length-1);
    var t=(i===0)?tail.length:(isLast?tail.length:bs);
    if(isLast&&rem===0&&nFull>0) t=0;
    var vl=new Array(16),vh=new Array(16);
    for(var q=0;q<8;q++){vl[q]=hl[q];vh[q]=hh[q];}
    for(q=0;q<8;q++){vl[8+q]=B2B_IV_LO[q];vh[8+q]=B2B_IV_HI[q];}
    vl[12]=(vl[12]^(t>>>0))>>>0;
    if(isLast){vl[14]=(vl[14]^0xffffffff)>>>0;vh[14]=(vh[14]^0xffffffff)>>>0;}
    var m=b2bLoadMsg(blocks[i]);
    for(var r=0;r<12;r++) oldRound(vl,vh,m.l,m.h,B2B_SIGMA[r]);
    for(q=0;q<8;q++){hl[q]=(hl[q]^vl[q]^vl[8+q])>>>0;hh[q]=(hh[q]^vh[q]^vh[8+q])>>>0;}
  }
  var out=new Uint8Array(64);
  for(i=0;i<8;i++){ out[i*8]=hl[i]&255;out[i*8+1]=(hl[i]>>>8)&255;out[i*8+2]=(hl[i]>>>16)&255;out[i*8+3]=(hl[i]>>>24)&255;
    out[i*8+4]=hh[i]&255;out[i*8+5]=(hh[i]>>>8)&255;out[i*8+6]=(hh[i]>>>16)&255;out[i*8+7]=(hh[i]>>>24)&255; }
  return out;}
/* 先确认旧实现输出正确 */
const one=oldDigest(new Uint8Array(0));
console.log("旧实现空串 = "+Array.from(one).map(x=>x.toString(16).padStart(2,"0")).join("").slice(0,32)+"  （应为 786a02f7...）");
const best=(fn,n)=>{let t=Infinity;for(let r=0;r<n;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6;if(ms<t)t=ms;}return t;};
const o=best(()=>oldDigest(data),5), w=best(()=>blake2bDigest(data),5);
console.log("\nBLAKE2b 64KB: "+o.toFixed(1)+" ms → "+w.toFixed(1)+" ms  "+(o/w).toFixed(1)+"×");
