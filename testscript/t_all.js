/* 全量健康检查：脚本加载 / 算法数 / 重复 / tag 结构 / 每个条目 enc 或 dec 可用 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
const declared=(html.match(/<script\s+src=/g)||[]).length;
const parsed=[...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
console.log("script src 声明 "+declared+" / 解析 "+parsed.length+(declared===parsed.length?" ✓":" ✗"));
let bad=0;
for(const m of html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)) if(m[2].trim()) {bad++;console.log("✗ 标签内被吞正文: "+m[1]);}
let ok=0,fail=0;
for(const f of parsed){ try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});ok++;}catch(e){fail++;console.log("✗ "+f+": "+e.message);} }
console.log("脚本加载 "+ok+"/"+parsed.length+"  失败 "+fail);
const ids=ALGOS.map(a=>a.id), dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
console.log("算法总数 "+ids.length+"  重复: "+(dup.length?dup.join(","):"无"));
/* 分组密码走主逻辑的 symEncrypt/symDecrypt 统一路径，注册时不带 enc/dec，
   靠 blockSize 标识——把它们当"缺函数"是误报（本项目第一次跑这个检查就报了 29 个）。 */
let noFn=0;
for(const a of ALGOS){
  const hasFn = typeof a.enc==="function" || typeof a.dec==="function";
  const isBlock = a.blockSize || a.block || (a.modes && typeof a.encBlock==="function");
  if(!hasFn && !isBlock){ noFn++; console.log("✗ 无 enc/dec 也非分组密码: "+a.id); }
}
console.log("既无 enc/dec 也不是分组密码的条目: "+noFn);
let longInfo=ALGOS.filter(a=>(a.info||"").length>200);
console.log("说明超 200 字: "+longInfo.length+(longInfo.length?" → "+longInfo.slice(0,3).map(a=>a.id).join(","):""));
