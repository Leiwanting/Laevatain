const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto; global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");
global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={}; global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q')},querySelectorAll(){return[]},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global; global.addEventListener=()=>{}; global.Event=function(t){this.type=t};
const html=fs.readFileSync("/data/workspace/dist/index.html","utf8");
for(const f of [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1])){
  vm.runInThisContext(fs.readFileSync("/data/workspace/dist/"+f,"utf8"),{filename:f});
}
let pass=0,fail=0;
function T(name,fn){ try{ fn(); console.log("PASS "+name); pass++; }catch(e){ console.log("FAIL "+name+" : "+e.message); fail++; } }

[1,3,5].forEach(function(L){
  var a=ALGOS.find(x=>x.id==='bike'+L);
  T("bike"+L+" 条目存在",function(){ if(!a) throw new Error("未注册"); });
  if(!a) return;
  var kp=a.gen();
  T("bike"+L+" gen→enc→dec 往返",function(){
    var out=a.enc("",kp.pub,"","hex");
    var parts=out.split("\n::K::");
    var ssEnc=parts[1].trim();
    var ssDec=a.dec(parts[0].trim(),kp.priv,"","hex");
    if(ssDec!==ssEnc) throw new Error("共享密钥不一致 "+ssEnc+" vs "+ssDec);
  });
  T("bike"+L+" 官方 KAT 对拍（SK+CT→SS）",function(){
    var d={};
    fs.readFileSync("/data/workspace/work/bike_kat/kat_l"+L+".txt","utf8").trim().split("\n").forEach(function(l){var i=l.indexOf("=");d[l.slice(0,i)]=l.slice(i+1);});
    var ss=a.dec(d.CT,d.SK,"","hex");
    if(ss!==d.SS) throw new Error("SS 不一致 exp="+d.SS.slice(0,16)+" got="+ss.slice(0,16));
  });
  T("bike"+L+" 篡改密文应失败",function(){
    var d={};
    fs.readFileSync("/data/workspace/work/bike_kat/kat_l"+L+".txt","utf8").trim().split("\n").forEach(function(l){var i=l.indexOf("=");d[l.slice(0,i)]=l.slice(i+1);});
    var ct=Buffer.from(d.CT,"hex"); ct[10]^=1;
    var threw=false;
    try{ a.dec(ct.toString("hex"),d.SK,"","hex"); }catch(e){ threw=true; }
    if(!threw) throw new Error("篡改后未拒绝");
  });
  T("bike"+L+" 私钥长度错应报错",function(){
    var threw=false;
    try{ a.dec("00","0011","","hex"); }catch(e){ threw=true; }
    if(!threw) throw new Error("未报错");
  });
});
console.log("\n界面入口 PASS "+pass+"  FAIL "+fail);
// 健康检查
var ids=ALGOS.map(a=>a.id); var dup=ids.filter((v,i)=>ids.indexOf(v)!==i);
console.log("ALGOS "+ids.length+"  重复 "+dup.length+(dup.length?" -> "+dup.slice(0,5):""));
var long=ALGOS.filter(a=>a.info&&a.info.length>200).length;
console.log("说明超 200 字: "+long);
