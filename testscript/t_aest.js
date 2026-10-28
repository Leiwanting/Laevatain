const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;
global.btoa=function(s){return Buffer.from(s,"binary").toString("base64");};
global.atob=function(s){return Buffer.from(s,"base64").toString("binary");};
const mk=function(id){return {id:id,value:"",_h:{},options:[],addEventListener:function(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent:function(e){(this._h[e]||[]).forEach(function(f){f.call(this,e);});},classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},setAttribute:function(){},appendChild:function(){},style:{},innerHTML:""};};
const store={};
global.document={getElementById:function(id){return store[id]||(store[id]=mk(id));},createElement:function(t){return mk(t);},addEventListener:function(){},readyState:"complete",body:{appendChild:function(){}}};
global.window=global;global.addEventListener=function(){};
global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(function(f){vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});});
const hx=b=>Buffer.from(b).toString("hex");
let pass=0,fail=0;
function eq(a,b,lbl){ if(hx(a)===hx(b)){pass++;} else {fail++; console.log("✗ "+lbl+"\n  new="+hx(a)+"\n  ref="+hx(b));} }
/* FIPS-197 三组官方向量 */
const FIPSV=[
 ["000102030405060708090a0b0c0d0e0f","00112233445566778899aabbccddeeff","69c4e0d86a7b0430d8cdb78070b4c55a"],
 ["000102030405060708090a0b0c0d0e0f1011121314151617","00112233445566778899aabbccddeeff","dda97ca4864cdfe06eaf70a0ec0d7191"],
 ["000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f","00112233445566778899aabbccddeeff","8ea2b7ca516745bfeafc49904b496089"],
];
console.log("=== FIPS-197 官方向量 ===");
for(const [k,p,c] of FIPSV){
  const ks=aesExpandKey(Uint8Array.from(Buffer.from(k,"hex")));
  const ct=aesEncryptBlockJS(Uint8Array.from(Buffer.from(p,"hex")),ks);
  const ok=hx(ct)===c; ok?pass++:fail++;
  console.log((ok?"✓":"✗")+" AES-"+(k.length*4)+" enc  "+hx(ct));
  const pt=aesDecryptBlockJS(Uint8Array.from(Buffer.from(c,"hex")),ks);
  const ok2=hx(pt)===p; ok2?pass++:fail++;
  console.log((ok2?"✓":"✗")+" AES-"+(k.length*4)+" dec  "+hx(pt));
}
/* 与参考实现（旧分步版）等价性：随机密钥+随机明文 */
console.log("=== 与旧分步实现等价性（200 组）===");
let n=0;
for(let i=0;i<200;i++){
  const kl=[16,24,32][i%3];
  const key=nc.randomBytes(kl), pt=nc.randomBytes(16);
  const ks=aesExpandKey(new Uint8Array(key));
  const pb=new Uint8Array(pt);
  eq(aesEncryptBlockJS(pb,ks), aesEncryptBlockJSRef(pb,ks), "enc#"+i+" (AES-"+(kl*8)+")");
  const ct=aesEncryptBlockJS(pb,ks);
  eq(aesDecryptBlockJS(ct,ks), aesDecryptBlockJSRef(ct,ks), "dec#"+i+" (AES-"+(kl*8)+")");
  n++;
}
console.log("等价组数 "+n);
/* 与 Node 原生对比 */
console.log("=== 与 Node 原生对比（60 组）===");
for(let i=0;i<60;i++){
  const kl=[16,24,32][i%3];
  const key=nc.randomBytes(kl), pt=nc.randomBytes(16);
  const ci=nc.createCipheriv("aes-"+(kl*8)+"-ecb",key,null); ci.setAutoPadding(false);
  const nat=Buffer.concat([ci.update(pt),ci.final()]);
  const ks=aesExpandKey(new Uint8Array(key));
  eq(aesEncryptBlockJS(new Uint8Array(pt),ks), new Uint8Array(nat), "native-enc#"+i);
}
console.log("通过 "+pass+" / 失败 "+fail);
