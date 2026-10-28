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
const V=JSON.parse(fs.readFileSync("_desvec.json","utf8"));
const h2b=h=>Uint8Array.from(Buffer.from(h,"hex"));
const b2h=b=>Buffer.from(b).toString("hex");
const v=V.des3[0];
const k=h2b(v.k), p=h2b(v.p);
console.log("k =",v.k,"\np =",v.p,"\nref C =",v.c,"\nref D =",v.d);
const k1=k.subarray(0,8),k2=k.subarray(8,16),k3=k.subarray(16,24);
const s1=desSubkeysFast(k1),s2=desSubkeysFast(k2),s3=desSubkeysFast(k3);
const s1r=desRevRounds(s1),s2r=desRevRounds(s2),s3r=desRevRounds(s3);
// 参考：用完整单块 DES 组合（不合并 IP/FP）
const e1=desCryptBlock(p,s1), e1o=desCryptBlockOld(p,s1);
console.log("\nE1(新) =",b2h(e1));
console.log("E1(旧) =",b2h(e1o));
// 单密钥 DES 对照：用 k1 单独加密应等于 pycryptodome DES.new(k1)
{
  const vv=V.des[0];
  console.log("\n单 DES 对照: 用 k=k1 加密 p，与 py DES 比");
}
// 用 python 算：单独 k1/k2/k3 的 DES
const py=JSON.parse(fs.readFileSync("_des3parts.json","utf8"));
console.log("\npy: E1 =",py.e1," (我用 k1 算)");
console.log("我: E1 =",b2h(e1));
console.log("py: D2 =",py.d2);
console.log("我: D2 =",b2h(desCryptBlock(py.e1b?h2b(py.e1b):h2b(py.e1),s2r)));
console.log("py: E3 =",py.e3);
console.log("我: E3 =",b2h(desCryptBlock(h2b(py.d2),s3)));
