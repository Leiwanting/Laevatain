const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const A=ALGOS.filter(a=>a.id==='whirlpool')[0];
console.log("条目注册:", !!A, "| 名称:", A&&A.name, "| 分组:", A&&A.group);
if(A){
  const r1=A.enc("abc","","",'hex');
  const exp="4e2448a4c6f486bb16b6562c73b4020bf3043e3a731bce721ae1b303d97e6d4c7181eebdb6c57e277d0e34957114cbd6c797fc9d95d8b582d225292076d4eef5";
  console.log("  界面 enc('abc') ->", r1===exp ? "✓ 与官方向量一致" : "✗ "+r1.slice(0,32));
  const r2=A.enc(strToBytes("abc"),"","",'hex');
  console.log("  字节输入路径 ->", r2===exp ? "✓" : "✗");
  const r3=A.enc("","","",'hex');
  console.log("  空串 ->", r3.slice(0,16)+"...");
}
console.log("算法总数:", ALGOS.length);
