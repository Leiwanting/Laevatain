const fs=require("fs"),vm=require("vm");
global.crypto=require("crypto").webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
vm.runInThisContext(fs.readFileSync("crypto_hqc.js","utf8"),{filename:"c"});
function parse(path,n){const out=[];let ent={};
  for(const line of fs.readFileSync(path,"utf8").split("\n")){const s=line.trim();
    if(!s||s.startsWith("#")){if(ent.count!==undefined){out.push(ent);ent={};}if(out.length>=n)break;continue;}
    const i=s.indexOf("=");if(i>0){const k=s.slice(0,i).trim(),v=s.slice(i+1).trim();
      ent[k]=(k==="count")?parseInt(v):Buffer.from(v,"hex");}}
  if(ent.count!==undefined&&out.length<n)out.push(ent);return out;}
const H=b=>Buffer.from(b).toString("hex");
let pass=0,fail=0;
function run(sec,file,n){
  const P=HQC.PARAMS[sec];
  const vs=parse(file,n);
  console.log("\n=== "+P.name+" 解封装 ("+vs.length+" 组) ===");
  for(const v of vs){
    let ss,err="";
    const t0=process.hrtime.bigint();
    try{ ss=HQC.kemDecaps(P,new Uint8Array(v.sk),new Uint8Array(v.ct)); }
    catch(e){ err=e.message.slice(0,60); }
    const ms=(Number(process.hrtime.bigint()-t0)/1e6).toFixed(0);
    const ok = ss && H(ss)===H(v.ss);
    if(ok)pass++;else{fail++;console.log("  count="+v.count+" ✗ "+err+" "+ms+"ms");}
  }
  console.log("  -> "+(vs.length)+" 组中通过 "+(vs.length-fail));
}
run(128,"/tmp/hqc-py-master/assets/PQCkemKAT_2321.rsp",5);
run(192,"/tmp/hqc-py-master/assets/PQCkemKAT_4602.rsp",2);
run(256,"/tmp/hqc-py-master/assets/PQCkemKAT_7333.rsp",1);
console.log("\n解封装合计: "+pass+" 通过 / "+fail+" 失败");
