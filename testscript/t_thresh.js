const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;
global.btoa=function(s){return Buffer.from(s,"binary").toString("base64");};
global.atob=function(s){return Buffer.from(s,"base64").toString("binary");};
const mk=function(id){return {id:id,value:"",_h:{},options:[],addEventListener:function(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent:function(e){(this._h[e.type]||[]).forEach(function(f){f.call(this,e);});},classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},setAttribute:function(){},appendChild:function(){},style:{},innerHTML:""};};
const store={};
global.document={getElementById:function(id){return store[id]||(store[id]=mk(id));},createElement:function(t){return mk(t);},addEventListener:function(){},readyState:"complete",body:{appendChild:function(){}}};
global.window=global;global.addEventListener=function(){};
global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(function(f){vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});});
console.log("算法总数:",ALGOS.length);
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<6)console.log("  ✗ "+n);}};
// FROST
const F=ALGOS.filter(x=>x.id==="frost")[0];
const fk=F.gen();
ck("FROST 有份额包", /shares/.test(fk.priv));
const fsig=F.enc(strToBytes("hello frost"),fk.priv,"1,3","hex");
ck("FROST 签名64字节", fsig.length===128);
ck("FROST 验签通过", /通过/.test(bytesToStr(F.dec("hello frost",fk.pub,fsig,"hex"))));
ck("FROST 篡改拒绝", /失败/.test(bytesToStr(F.dec("hello frost!",fk.pub,fsig,"hex"))));
// 少于阈值
try{ F.enc(strToBytes("x"),fk.priv,"1","hex"); ck("少于阈值应报错",false);}catch(e){ck("少于阈值报错",true);}
// GG20
const G=ALGOS.filter(x=>x.id==="gg20")[0];
const gk=G.gen();
const t0=Date.now();
const gsig=bytesToStr(G.enc(strToBytes("hello gg20"),gk.priv,"1,3","hex"));
console.log("  GG20 签名耗时",Date.now()-t0,"ms");
ck("GG20 签名格式 r,s", /^\d+,\d+$/.test(gsig));
ck("GG20 验签通过", /通过/.test(bytesToStr(G.dec("hello gg20",gk.pub,gsig,"hex"))));
ck("GG20 篡改拒绝", /失败/.test(bytesToStr(G.dec("hello gg20!",gk.pub,gsig,"hex"))));
// 安全提示
const w1=securityAudit({algoId:'gg20',mode:''});
ck("GG20 有严重提示", w1.some(x=>x.level==='danger'&&/Alpha-Rays/.test(x.title)));
const w2=securityAudit({algoId:'frost',mode:''});
ck("FROST 有说明提示", w2.some(x=>x.level==='info'));
console.log("阈值签名端到端: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
