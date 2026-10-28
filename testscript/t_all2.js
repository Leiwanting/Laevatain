const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
const files=[...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let ok=0,fail=0;
for(const f of files){ try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});ok++;}catch(e){fail++;console.log("ERR "+f+": "+e.message);} }
console.log("脚本加载: "+ok+"/"+files.length+"  失败 "+fail);
const ids=ALGOS.map(a=>a.id), dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
console.log("算法总数: "+ids.length+"  重复: "+(dup.length?dup.join(","):"无"));
for(const k of ["hqc128","hqc192","hqc256","xcb","eme2","cbc-essiv"])
  console.log("  "+k+": "+(ids.includes(k)?"✓ 已注册":"✗ 缺失"));
function search(q){
  let hits=[];
  for(const a of ALGOS){const s=algoMatchScore(q,a); if(s>0) hits.push({a,s});}
  hits.sort((x,y)=>y.s-x.s);
  if(hits.length){const top=hits[0].s; hits=hits.filter(h=>h.s>=top*0.2||h.s>=900);}
  return hits.map(h=>h.a.id);
}
console.log("搜 xcb: "+JSON.stringify(search("xcb")));
console.log("搜 hqc: "+JSON.stringify(search("hqc")));
console.log("搜 eme2: "+JSON.stringify(search("eme2")));
console.log("搜 后量子: "+JSON.stringify(search("后量子")));
