const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n);}};
const C=vssC();
// 1) 基本：固定秘密，t=2 n=5，任意 3 份都能重构
const secret=123456789n;
const r=vssShare(secret,2,5);
ck("份额数=5", r.shares.length===5);
ck("承诺数=t+1=3", r.commits.length===3);
ck("份额编号从1开始", r.shares[0].index===1);
let allOk=true;
for(const s of r.shares) if(!vssVerifyShare(s,r.commits)) allOk=false;
ck("全部份额验证通过", allOk);
// 任意 C(5,3)=10 组都能重构
let combos=0,okC=0;
for(let a=0;a<5;a++)for(let b=a+1;b<5;b++)for(let c=b+1;c<5;c++){
  combos++;
  try{ if(vssRecover([r.shares[a],r.shares[b],r.shares[c]],2)===secret) okC++; }catch(e){}
}
ck("所有3份组合都能重构 ("+okC+"/"+combos+")", okC===combos);
// 2) 少于 t+1 份应抛错
let threw=false;
try{ vssRecover([r.shares[0],r.shares[1]],2); }catch(e){ threw=true; }
ck("2份(<t+1)拒绝重构", threw);
// 3) 篡改份额应验证失败
const bad={index:r.shares[0].index, value:r.shares[0].value+1n};
ck("篡改份额验证失败", !vssVerifyShare(bad,r.commits));
// 4) 多种 (t,n)
for(const [t,n] of [[1,3],[2,5],[3,7],[4,10]]){
  const rr=vssShare(secret,t,n);
  let v=true; for(const s of rr.shares) if(!vssVerifyShare(s,rr.commits)) v=false;
  ck("t="+t+" n="+n+" 份额验证", v);
  ck("t="+t+" n="+n+" 重构正确", vssRecover(rr.shares.slice(0,t+1),t)===secret);
}
// 5) DKG
for(const [t,n] of [[1,3],[2,5],[3,6]]){
  const d=vssDkg(t,n);
  let v=true; for(const s of d.shares) if(!vssVerifyShare(s,d.commits)) v=false;
  ck("DKG t="+t+" n="+n+" 份额验证", v);
  ck("DKG t="+t+" n="+n+" 重构=群秘密", vssRecover(d.shares.slice(0,t+1),t)===d.groupSecret);
  ck("DKG t="+t+" n="+n+" 群公钥=秘密·G", vssPointToHex(d.groupPub)===vssPointToHex(C.mul(d.groupSecret,vssG())));
}
console.log("VSS/DKG: 通过 "+pass+" / 失败 "+fail);
