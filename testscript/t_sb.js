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
let p=0,f=0;
const EMPTY512="8e945da209aa869f0455928529bcae4679e9873ab707b55315f56ceb98bef0a7362f715528356ee83cbab62c521d0b1b6b6b6b6b6b6b6b";
const EMPTY256="3f539a213e97c802cc229d474c6aa32a825a360b2a933a949fd925208d9ce1bb";
const M1="323130393837363534333231303938373635343332313039383736353433323130393837363534333231303938373635343332313039383736353433323130";
const H512_1="1b54d01a4af5b9d5cc3d86d68d285462b19abc2475222f35c085122be4ba1ffa00ad30f8767b3a82384c6574f024c311e2a481332b08ef7f41797891e1647bd";
console.log("=== 官方向量 ===");
let g5=hx(streebogDigest(new Uint8Array(0),64)), g2=hx(streebogDigest(new Uint8Array(0),32));
let m1=new Uint8Array(Buffer.from(M1,"hex"));
let h1=hx(streebogDigest(m1,64));
console.log((g5===EMPTY512?"✓":"✗")+" Streebog-512 空串");
console.log((g2===EMPTY256?"✓":"✗")+" Streebog-256 空串");
console.log((h1===H512_1?"✓":"✗")+" Streebog-512 官方 M1");
g5===EMPTY512?p++:f++; g2===EMPTY256?p++:f++; h1===H512_1?p++:f++;
/* LPS 等价：lps32 vs 旧 lpsInto（大端回退路径，保证通用） */
let q=0,g=0;
for(let n=0;n<600;n++){
  const d=nc.randomBytes(64);
  const o1=new Uint8Array(64), o2=new Uint8Array(64);
  streebogLpsInto(new Uint8Array(d),o1);
  const v=new Uint32Array(16); streebogLps32(new Uint8Array(d),v);
  const o2b=Buffer.from(v.buffer.slice(0)); o2.set(new Uint8Array(o2b));
  if(hx(o1)===hx(o2))q++; else {g++;console.log("✗ LPS#"+n);}
}
console.log("LPS 等价 "+q+"/"+(q+g));
/* 与已保存的 gostcrypto 交叉向量比对（若存在） */
const fsx=require("fs");
for(const fn of ["_sb_vec.json","sb_vec.json","_streebog_vec.json"]){
  if(fsx.existsSync(fn)){
    const V=JSON.parse(fsx.readFileSync(fn,"utf8"));
    let a=0,b=0;
    for(const v of (Array.isArray(V)?V:[V])){
      const msg=v.msg!==undefined?Buffer.from(v.msg,"hex"):new Uint8Array(0);
      if(v.d512){ if(hx(streebogDigest(new Uint8Array(msg),64))===v.d512)a++;else b++; }
      if(v.d256){ if(hx(streebogDigest(new Uint8Array(msg),32))===v.d256)a++;else b++; }
    }
    console.log(fn+" 交叉向量 "+a+"/"+(a+b));
    p+=a;f+=b;
  }
}
console.log("总 通过 "+p+" 失败 "+f);
