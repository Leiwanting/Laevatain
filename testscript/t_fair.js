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
/* 与最初 92ms 测量完全相同的输入：H(32) = 满 256 位标量 */
const H=n=>{const u=new Uint8Array(n);for(let i=0;i<n;i++)u[i]=(i*7+3)&255;return Array.from(u).map(b=>b.toString(16).padStart(2,'0')).join('');};
const k=H(32);
(async()=>{
  const out=await A.enc(msg,k,'','hex');
  console.log('输出长度', out.length, '前16', out.slice(0,16));
  let best=Infinity;
  for(let i=0;i<10;i++){const t0=process.hrtime.bigint();await A.enc(msg,k,'','hex');const m=Number(process.hrtime.bigint()-t0)/1e6;if(m<best)best=m;}
  console.log('ristretto255 enc (满标量): '+best.toFixed(2)+' ms   [优化前 92.05 ms]');
})();
