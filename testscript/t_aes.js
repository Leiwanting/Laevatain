const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");
global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};
global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n);}};
// FIPS-197 向量
const pt=H("00112233445566778899aabbccddeeff");
const k128=H("000102030405060708090a0b0c0d0e0f");
const k192=H("000102030405060708090a0b0c0d0e0f1011121314151617");
const k256=H("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f");
const f128=aesMakeBlockFn(k128), f192=aesMakeBlockFn(k192), f256=aesMakeBlockFn(k256);
ck("AES-128 FIPS-197", bytesToHex(f128.enc(pt))==="69c4e0d86a7b0430d8cdb78070b4c55a");
ck("AES-192 FIPS-197", bytesToHex(f192.enc(pt))==="dda97ca4864cdfe06eaf70a0ec0d7191");
ck("AES-256 FIPS-197", bytesToHex(f256.enc(pt))==="8ea2b7ca516745bfeafc49904b496089");
ck("AES-128 解密往返", bytesToHex(f128.dec(f128.enc(pt)))==="00112233445566778899aabbccddeeff");
ck("AES-192 解密往返", bytesToHex(f192.dec(f192.enc(pt)))==="00112233445566778899aabbccddeeff");
ck("AES-256 解密往返", bytesToHex(f256.dec(f256.enc(pt)))==="00112233445566778899aabbccddeeff");
// 与 Node 原生 AES-256-ECB 随机比对
const gmulOk=(()=>{const t=AES_MUL[2];return t[1]===2&&t[128]===27&&t[3]===6;})();
ck("乘法表与 gmul 一致", gmulOk);
let ok=0;
for(let i=0;i<200;i++){
  const key=require("crypto").randomBytes(32), blk=require("crypto").randomBytes(16);
  const c=require("crypto").createCipheriv("aes-256-ecb",key,null); c.setAutoPadding(false);
  const want=Buffer.concat([c.update(Buffer.from(blk)),c.final()]).toString("hex");
  if(bytesToHex(aesMakeBlockFn(new Uint8Array(key)).enc(new Uint8Array(blk)))===want) ok++;
}
ck("200 组随机 vs Node 原生 AES-256-ECB: "+ok, ok===200);
// 性能
const data=new Uint8Array(65536); for(let i=0;i<data.length;i++)data[i]=i&0xff;
const bf=aesMakeBlockFn(k256); const blk=new Uint8Array(16);
let t0=Date.now();
for(let i=0;i<data.length;i+=16){blk.set(data.subarray(i,i+16));bf.enc(blk);}
const enc=Date.now()-t0;
t0=Date.now();
for(let i=0;i<data.length;i+=16){blk.set(data.subarray(i,i+16));bf.dec(blk);}
const dec=Date.now()-t0;
console.log("  64KB AES-256 加密: "+enc+" ms (原 37 ms)  "+(65536/enc/1024).toFixed(1)+" MB/s");
console.log("  64KB AES-256 解密: "+dec+" ms");
console.log("AES 正确性: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
