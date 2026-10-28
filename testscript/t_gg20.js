const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;
global.btoa=function(s){return Buffer.from(s,"binary").toString("base64");};
global.atob=function(s){return Buffer.from(s,"base64").toString("binary");};
const mk=function(id){return {id:id,value:"",_h:{},options:[],addEventListener:function(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent:function(e){(this._h[e.type]||[]).forEach(function(f){f.call(this,e);});},classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},setAttribute:function(){},appendChild:function(){},style:{},innerHTML:""};};
const store={};
global.document={getElementById:function(id){return store[id]||(store[id]=mk(id));},createElement:function(t){return mk(t);},addEventListener:function(){},readyState:"complete",body:{appendChild:function(){}}};
global.window=global;global.addEventListener=function(){};
global.Event=function(t){this.type=t;};
["Encryption_and_decryption_logic.js","crypto_tables.js","crypto_core.js","crypto_modes.js","pqc_core.js","pqc_dsa.js","bls_const.js","pqc_bls.js","crypto_sphincs+.js","gg20_core.js"].forEach(function(f){vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});});
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<5)console.log("  ✗ "+n);}};
const curve=CURVES[GG20_CURVE], q=curve.n, G={x:curve.gx,y:curve.gy};
// Paillier 正确性
const pk=gg20PaillierKey(1024);
for(const m of [0n,1n,12345n, 2n**100n]){
  const c=gg20Enc(pk,m); ck("Paillier dec m="+m.toString().slice(0,10), gg20Dec(pk,c)===m);
}
const c1=gg20Enc(pk,10n), c2=gg20Enc(pk,20n);
ck("Paillier 同态加", gg20Dec(pk,gg20AddEnc(pk,c1,c2))===30n);
ck("Paillier 同态乘", gg20Dec(pk,gg20MulEnc(pk,c1,3n))===30n);
// MtA
const pkA=gg20PaillierKey(1024);
const a=123456789n, b=987654321n;
const mt=gg20MtA(pkA,a,null,b,q);
ck("MtA α+β = a*b", (mt.alpha+mt.beta)%q === (a*b)%q);
// 端到端 2-of-3
function mh(s){const d=nc.createHash("sha256").update(s).digest();let v=0n;for(const b of d)v=(v<<8n)|BigInt(b);return v%q;}
const t0=Date.now();
const sk=1n+(gg20RandBits(256)%(q-1n));
const Q=curve.mul(sk,G);
const sp=gg20ShamirSplit(sk,2,3,q);
const msg="test gg20";
const H=mh(msg);
const sig=gg20Sign(H,[sp.shares[0],sp.shares[2]],[1,3],2,3,1024);
console.log("  签名耗时",Date.now()-t0,"ms");
ck("r 非零且在范围内", sig.r>0n&&sig.r<q);
ck("s 非零且在范围内", sig.s>0n&&sig.s<q);
ck("GG20 签名通过标准 ECDSA 验证", gg20Verify(H,sig,Q)===true);
ck("错误消息拒绝", gg20Verify(mh("other"),sig,Q)===false);
// 3-of-3
const sig2=gg20Sign(H,[sp.shares[0],sp.shares[1],sp.shares[2]],[1,2,3],3,3,1024);
ck("3-of-3 签名验证", gg20Verify(H,sig2,Q)===true);
console.log("GG20 阈值 ECDSA: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
