const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
const V=[
 {n:"128",k:"EF4359D8D580AA4F7F036D6F04FC6A94",t:"D8E7920AFA330A73",pt:"890121234567890000",ct:"750918814058654607"},
 {n:"192",k:"EF4359D8D580AA4F7F036D6F04FC6A942B7E151628AED2A6",t:"D8E7920AFA330A73",pt:"890121234567890000",ct:"646965393875028755"},
 {n:"256",k:"EF4359D8D580AA4F7F036D6F04FC6A942B7E151628AED2A6ABF7158809CF4F3C",t:"D8E7920AFA330A73",pt:"890121234567890000",ct:"922011205562777495"},
];
let pass=0,fail=0;
for(const v of V){
  try{
    const K=H(v.k),T=H(v.t),PT=v.pt.split("").map(Number);
    const got=ff3Core(K,T,PT,10,true).join("");
    const eok=got===v.ct;
    const back=ff3Core(K,T,v.ct.split("").map(Number),10,false).join("");
    const dok=back===v.pt;
    console.log("  "+v.n+": 加密 "+(eok?"✓":"✗ got="+got+" want="+v.ct)+" | 解密 "+(dok?"✓":"✗ got="+back));
    if(eok)pass++; else fail++;
    if(dok)pass++; else fail++;
  }catch(e){ console.log("  "+v.n+": 抛错 "+e.message); fail++; }
}
console.log("FF3: 通过 "+pass+" / 失败 "+fail);
