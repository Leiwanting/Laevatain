const fs=require("fs"),vm=require("vm");
global.crypto=require("crypto").webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
vm.runInThisContext(fs.readFileSync("crypto_hqc.js","utf8"),{filename:"c"});
const H=b=>Buffer.from(b).toString("hex");
let pass=0,fail=0;
const ck=(ok,label)=>{ if(ok)pass++;else{fail++;console.log("  ✗ "+label);} };

/* 1) 官方 KAT：封装 + 解封装 */
function parse(path,n){const out=[];let ent={};
  for(const line of fs.readFileSync(path,"utf8").split("\n")){const s=line.trim();
    if(!s||s.startsWith("#")){if(ent.count!==undefined){out.push(ent);ent={};}if(out.length>=n)break;continue;}
    const i=s.indexOf("=");if(i>0){const k=s.slice(0,i).trim(),v=s.slice(i+1).trim();
      ent[k]=(k==="count")?parseInt(v):Buffer.from(v,"hex");}}
  if(ent.count!==undefined&&out.length<n)out.push(ent);return out;}
console.log("=== 官方 KAT (封装+解封装) ===");
for(const [sec,file,n] of [[128,"2321",20],[192,"4602",5],[256,"7333",2]]){
  const P=HQC.PARAMS[sec];
  const vs=parse("/tmp/hqc-py-master/assets/PQCkemKAT_"+file+".rsp",n);
  let ok=0;
  for(const v of vs){
    const prng=HQC.prngOf(new Uint8Array(v.seed));
    const sk2=prng.read(32), m=prng.read(P.sec), salt=prng.read(16);
    const kg=HQC.kemKeygen(P,new Uint8Array(sk2));
    const en=HQC.kemEncaps(P,new Uint8Array(v.pk),new Uint8Array(m),new Uint8Array(salt));
    const de=HQC.kemDecaps(P,new Uint8Array(v.sk),new Uint8Array(v.ct));
    if(H(kg.ek)===H(v.pk)&&H(kg.dk)===H(v.sk)&&H(en.ct)===H(v.ct)&&H(en.ss)===H(v.ss)&&H(de)===H(v.ss)) ok++;
  }
  console.log("  "+P.name+": "+ok+"/"+vs.length+" 组四项(pk/sk/ct/ss/decaps)全对");
  ck(ok===vs.length, P.name+" KAT");
}
/* 2) 自身往返 */
console.log("=== 自身往返（随机密钥） ===");
for(const sec of [128,192,256]){
  const P=HQC.PARAMS[sec]; let ok=0;
  for(let i=0;i<3;i++){
    const seed=crypto.getRandomValues(new Uint8Array(32));
    const kp=HQC.kemKeygen(P,seed);
    const m=crypto.getRandomValues(new Uint8Array(P.sec));
    const salt=crypto.getRandomValues(new Uint8Array(16));
    const e=HQC.kemEncaps(P,kp.ek,m,salt);
    const d=HQC.kemDecaps(P,kp.dk,e.ct);
    if(H(d)===H(e.ss)) ok++;
  }
  console.log("  "+P.name+": "+ok+"/3 共享密钥一致");
  ck(ok===3, P.name+" 往返");
}
/* 3) 篡改密文 -> 隐式拒绝（不抛错，且 ss 不同） */
console.log("=== 篡改密文 -> 隐式拒绝 ===");
{
  const P=HQC.PARAMS[128]; let ok=0;
  const kp=HQC.kemKeygen(P,crypto.getRandomValues(new Uint8Array(32)));
  const e=HQC.kemEncaps(P,kp.ek,crypto.getRandomValues(new Uint8Array(P.sec)),crypto.getRandomValues(new Uint8Array(16)));
  for(const pos of [0, 100, 2000, 4000, e.ct.length-1]){
    const bad=Uint8Array.from(e.ct); bad[pos]^=1;
    let d=null,threw=false;
    try{ d=HQC.kemDecaps(P,kp.dk,bad); }catch(err){ threw=true; }
    if(!threw && d && H(d)!==H(e.ss)) ok++;
  }
  console.log("  篡改 5 处: "+ok+"/5 均被拒（返回不同伪随机值，不报错）");
  ck(ok===5,"隐式拒绝");
}
/* 4) 尺寸校验 */
console.log("=== 尺寸校验 ===");
for(const sec of [128,192,256]){
  const P=HQC.PARAMS[sec];
  const kp=HQC.kemKeygen(P,crypto.getRandomValues(new Uint8Array(32)));
  const e=HQC.kemEncaps(P,kp.ek,crypto.getRandomValues(new Uint8Array(P.sec)),crypto.getRandomValues(new Uint8Array(16)));
  console.log("  "+P.name+": pk="+kp.ek.length+" sk="+kp.dk.length+" ct="+e.ct.length+" ss="+e.ss.length);
  ck(e.ss.length===32 && e.ct.length===((P.n+7)>>3)+((P.n1*P.n2+7)>>3)+16, P.name+" 尺寸");
}
console.log("\n合计: "+pass+" 通过 / "+fail+" 失败");
