const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n);}};
// FF3 官方样本（多密钥长度）
const V=[
 {k:"EF4359D8D580AA4F7F036D6F04FC6A94",t:"D8E7920AFA330A73",pt:"890121234567890000",ct:"750918814058654607"},
 {k:"EF4359D8D580AA4F7F036D6F04FC6A942B7E151628AED2",t:"D8E7920AFA330A73",pt:"890121234567890000",ct:"646965393875028755"},
 {k:"EF4359D8D580AA4F7F036D6F04FC6A942B7E151628AED2A6ABF7158809CF4F3C",t:"D8E7920AFA330A73",pt:"890121234567890000",ct:"922011205562777495"},
];
for(const v of V){
  const K=H(v.k),T=H(v.t),PT=v.pt.split("").map(Number);
  const got=ff3Core(K,T,PT,10,true).join("");
  ck("FF3 加密 "+v.k.length*4+"位", got===v.ct);
  if(got!==v.ct) console.log("    got "+got+" want "+v.ct);
  const back=ff3Core(K,T,v.ct.split("").map(Number),10,false).join("");
  ck("FF3 解密 "+v.k.length*4+"位", back===v.pt);
}
console.log("FF3: 通过 "+pass+" / 失败 "+fail);
