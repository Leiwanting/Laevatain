/* 本轮把 9 个条目的 key/param 开关打开后，必须确认：
   (1) 留空该参数时仍照常工作（paramOptional/keyOptional 真的生效，UI 不会强制要求）
   (2) 填上该参数时行为正确（这正是以前做不到的事） */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;global.TextDecoder=require("util").TextDecoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return[];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
[...fs.readFileSync("index.html","utf8").matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("✗ "+n);}};
const A=id=>ALGOS.filter(a=>a.id===id)[0];
const E=s=>new TextEncoder().encode(s);
const rnd=n=>nc.randomBytes(n);

/* eme2 / xcb：明文需 16 的倍数且 ≥32 */
for(const id of ["eme2","xcb"]){
  const a=A(id); if(!a){console.log("✗ 未注册 "+id);fail++;continue;}
  ck(id+" param 开关已开", a.param===true);
  ck(id+" paramOptional 生效（可留空）", a.paramOptional===true);
  const key=id==="eme2"?rnd(48):rnd(16), pt=rnd(64);
  let ct,rt;
  try{ ct=a.enc(pt,key.toString("hex"),"","hex"); }catch(e){ console.log("✗ "+id+" 留空AD加密抛错: "+e.message); fail++; continue; }
  try{ rt=a.dec(Uint8Array.from(Buffer.from(ct,"hex")),key.toString("hex"),"","hex"); }catch(e){ console.log("✗ "+id+" 留空AD解密抛错: "+e.message); fail++; continue; }
  ck(id+" 留空 AD 往返成功", Buffer.from(rt,"hex").toString("hex")===pt.toString("hex"));
  const ad=rnd(16).toString("hex");
  const ct2=a.enc(pt,key.toString("hex"),ad,"hex");
  ck(id+" 填 AD 后密文改变", ct2!==ct);
  const rt2=a.dec(Uint8Array.from(Buffer.from(ct2,"hex")),key.toString("hex"),ad,"hex");
  ck(id+" 填 AD 往返成功", Buffer.from(rt2,"hex").toString("hex")===pt.toString("hex"));
}
/* cbc-essiv：LBA 参数 */
{
  const a=A("cbc-essiv"); ck("cbc-essiv param 开关已开", a.param===true);
  const key=rnd(16), pt=rnd(32);
  const c0=a.enc(pt,key.toString("hex"),"","hex");
  const c1=a.enc(pt,key.toString("hex"),"5","hex");
  ck("cbc-essiv 填 LBA 后密文改变（ESSIV 的意义所在）", c0!==c1);
  const r1=a.dec(Uint8Array.from(Buffer.from(c1,"hex")),key.toString("hex"),"5","hex");
  ck("cbc-essiv 填 LBA 往返成功", Buffer.from(r1,"hex").toString("hex")===pt.toString("hex"));
}
/* hctr2：tweak */
{
  const a=A("hctr2"); ck("hctr2 param 开关已开", a.param===true);
  const key=rnd(16), pt=rnd(32);
  const c0=a.enc(pt,key.toString("hex"),"","hex");
  const c1=a.enc(pt,key.toString("hex"),"aabb","hex");
  ck("hctr2 填 tweak 后密文改变", c0!==c1);
  ck("hctr2 密文长度 == 明文长度（长度保持）", Buffer.from(c1,"hex").length===32);
}
/* cshake：定制串 S */
for(const id of ["cshake128","cshake256"]){
  const a=A(id); if(!a){console.log("✗ 未注册 "+id);fail++;continue;}
  ck(id+" key 开关已开", a.key===true);
  const h0=a.enc(E("abc"),"","32","hex");
  const h1=a.enc(E("abc"),"MyS","32","hex");
  ck(id+" 填定制串 S 后摘要改变", h0!==h1 && typeof h0==="string");
  ck(id+" 输出长度为 32 字节", h0.length===64);
}
console.log("开关回归: 通过 "+pass+" / 失败 "+fail);
