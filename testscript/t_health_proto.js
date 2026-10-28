const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;global.TextDecoder=require("util").TextDecoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
let ok=0,bad=0;
const refs=[...html.matchAll(/<script\s+src="([^"]+)"\s*>/g)].map(m=>m[1]);
for(const f of refs){try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});ok++;}catch(e){bad++;console.log("LOADFAIL",f,e.message.slice(0,120));}}
console.log("script 加载",ok,"失败",bad);
// 引用存在性
const miss=refs.filter(f=>!fs.existsSync(f));
console.log("引用了但文件不存在:",miss.length, miss.join(','));
const ids=new Set(),dup=[];
for(const a of global.ALGOS){ if(ids.has(a.id))dup.push(a.id); ids.add(a.id); }
console.log("ALGOS",global.ALGOS.length,"重复",dup.length,dup.join(','));
let long=0;
for(const a of global.ALGOS){ if(a.info&&a.info.length>200){long++;console.log("  超长:",a.id,a.info.length);} }
console.log("说明超200字",long);
console.log("BUILD_INFO.algos", global.BUILD_INFO? global.BUILD_INFO.algos : (typeof BUILD_INFO!=='undefined'?BUILD_INFO.algos:'n/a'));
// 无 enc/dec 的条目
const nofn=[];
for(const a of global.ALGOS){ if(typeof a.enc!=='function'&&typeof a.dec!=='function') nofn.push(a.id); }
console.log("既无 enc 也无 dec 的条目:",nofn.length,nofn.slice(0,10).join(','));
