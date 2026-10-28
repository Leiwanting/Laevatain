/* 扫描：定义了 keyLabel/paramLabel 但对应 key/param 开关没开的条目。
   后果：UI 里该输入框根本不显示（updateAlgoUI 用 !a.key 隐藏 keyField），
   用户看到说明里写着"填私钥"却找不到框——X448 就是这样暴露的。 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
const parsed=[...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
for(const f of parsed){ try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){} }
console.log("算法总数 "+ALGOS.length);
let n=0;
for(const a of ALGOS){
  const kl=a.keyLabel, pl=a.paramLabel;
  const kOn=!!a.key, pOn=!!a.param;
  if(kl && !kOn){ n++; console.log("✗ keyLabel 有但 key 未开: "+a.id+"  ["+kl+"]"); }
  if(pl && !pOn){ n++; console.log("✗ paramLabel 有但 param 未开: "+a.id+"  ["+pl+"]"); }
}
console.log("标签/开关不一致: "+n);
