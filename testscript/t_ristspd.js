const fs=require("fs"),vm=require("vm");
global.crypto=require("crypto").webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const A=ALGOS.find(x=>x.id==='ristretto255');
const msg=new Uint8Array(64);for(let i=0;i<64;i++)msg[i]=65+(i%26);
const k='0'.repeat(62)+'07';
(async()=>{
  const r1=await A.enc(msg,k,'','hex');
  let best=Infinity;
  for(let i=0;i<10;i++){const t0=process.hrtime.bigint();await A.enc(msg,k,'','hex');const m=Number(process.hrtime.bigint()-t0)/1e6;if(m<best)best=m;}
  console.log('ristretto255 enc: '+best.toFixed(2)+' ms');
  const dh=ALGOS.find(x=>x.id==='ristretto255-dh');
  const pk=r1;
  let b2=Infinity;
  for(let i=0;i<10;i++){const t0=process.hrtime.bigint();await dh.enc(msg,k,pk,'hex');const m=Number(process.hrtime.bigint()-t0)/1e6;if(m<b2)b2=m;}
  console.log('ristretto255-dh: '+b2.toFixed(2)+' ms');
  /* 纯标量乘对照 */
  const s=12345678901234567890n;
  let b3=Infinity;
  for(let i=0;i<20;i++){const t0=process.hrtime.bigint();edMulFast(ED_B,s);const m=Number(process.hrtime.bigint()-t0)/1e6;if(m<b3)b3=m;}
  console.log('edMulFast 单次: '+b3.toFixed(2)+' ms');
})();
