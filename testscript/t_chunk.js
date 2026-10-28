const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");
global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};
global.Event=function(t){this.type=t;};
global.requestAnimationFrame=f=>setTimeout(()=>f(Date.now()),0);
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n);}};
(async()=>{
const key=new Uint8Array(32); for(let i=0;i<32;i++)key[i]=i;
const bf=aesMakeBlockFn(key);
const sizes=[300*1024, 700*1024, 16*3+7];  // 大于阈值、远大于阈值、小块
const modes=['ECB','CBC','CFB','OFB','CTR'];
for(const n of sizes){
  const d=new Uint8Array(n); for(let i=0;i<n;i++)d[i]=(i*31+7)&0xff;
  for(const mode of modes){
    const iv=new Uint8Array(16); for(let i=0;i<16;i++)iv[i]=(i*5+1)&0xff;
    const sync = modeEnc(d,16,bf.enc,mode,'PKCS7',iv);
    const asyncR = await modeEncAsync(d,16,bf.enc,mode,'PKCS7',iv);
    ck(`${mode} 加密 ${n}B 同步==异步`, bytesToHex(sync)===bytesToHex(asyncR));
    const sd = modeDec(sync,16,bf.dec,mode,'PKCS7',iv,bf.enc);
    const ad = await modeDecAsync(asyncR,16,bf.dec,mode,'PKCS7',iv,bf.enc);
    ck(`${mode} 解密往返 ${n}B`, bytesToHex(sd)===bytesToHex(d));
    ck(`${mode} 解密 同步==异步 ${n}B`, bytesToHex(sd)===bytesToHex(ad));
  }
}
// 取消
JOB.running=true; JOB.cancel=false;
const big=new Uint8Array(700*1024);
try{
  JOB.cancel=true;
  await modeEncAsync(big,16,bf.enc,'CBC','PKCS7',new Uint8Array(16));
  ck("取消应抛错", false);
}catch(e){ ck("取消抛出 __CANCELLED__", e.message==='__CANCELLED__'); }
JOB.running=false;JOB.cancel=false;
// 进度回调
const seen=[];
JOB.running=true; JOB.cancel=false;
const orig=setProgress; global.setProgress=function(p){seen.push(p); orig(p,null);};
await modeEncAsync(new Uint8Array(700*1024),16,bf.enc,'CBC','PKCS7',new Uint8Array(16));
global.setProgress=orig; JOB.running=false;
console.log("  进度采样次数:",seen.length," 末值:",seen[seen.length-1]);
ck("有进度更新", seen.length>0);
console.log("分片异步: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
})();
