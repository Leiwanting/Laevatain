const fs=require('fs'),vm=require('vm'),nc=require('crypto');
global.crypto=nc.webcrypto;global.TextEncoder=require('util').TextEncoder;
global.btoa=s=>Buffer.from(s,'binary').toString('base64');global.atob=s=>Buffer.from(s,'base64').toString('binary');
const mk=id=>({id,value:'',_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:'',textContent:''});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:'complete',body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync('index.html','utf8');
const files=[...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let load=0,fail=0;
for(const f of files){try{vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});load++;}catch(e){fail++;console.log('LOAD FAIL',f,e.message);}}
const ids=(typeof ALGOS!=='undefined')?ALGOS.map(a=>a.id):[];
const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
const long=(typeof ALGOS!=='undefined')?ALGOS.filter(a=>a.info&&a.info.length>200).length:0;
console.log('scripts 加载 '+load+' 失败 '+fail+' | ALGOS '+ids.length+' 唯一 '+new Set(ids).size+' 重复 '+dup.length+' | 说明>200字 '+long);
