const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
/* 旧：三次 desCryptBlock */
function old3des(k){
  const s1=desSubkeysFast(k.subarray(0,8)),s2=desSubkeysFast(k.subarray(8,16)),s3=desSubkeysFast(k.subarray(16,24));
  const s1r=desRevRounds(s1),s2r=desRevRounds(s2),s3r=desRevRounds(s3);
  return {enc:b=>desCryptBlock(desCryptBlock(desCryptBlock(b,s3),s2r),s1),
          dec:b=>desCryptBlock(desCryptBlock(desCryptBlock(b,s1r),s2),s3r)};}
const k24=new Uint8Array(24);
const of=old3des(k24), nf=des3MakeBlockFn(k24);
/* 两者输出必须一致 */
let same=0; for(let o=0;o<2048;o+=8){ if(bytesToHex(of.enc(data.subarray(o,o+8)))===bytesToHex(nf.enc(data.subarray(o,o+8)))) same++; }
console.log("3DES 输出一致: "+same+"/256");
const best=(fn,n)=>{let t=Infinity;for(let r=0;r<n;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6;if(ms<t)t=ms;}return t;};
const run=f=>{for(let o=0;o<data.length;o+=8) f.enc(data.subarray(o,o+8));};
const o1=best(()=>run(of),3), n1=best(()=>run(nf),3);
console.log("3DES 64KB: "+o1.toFixed(1)+" ms → "+n1.toFixed(1)+" ms  "+(o1/n1).toFixed(2)+"×");
