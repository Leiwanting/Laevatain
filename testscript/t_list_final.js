const fs=require("fs"),vm=require("vm");
global.crypto=require("crypto").webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const sp=JSON.parse(fs.readFileSync('/tmp/speed.json','utf8'));
const ORDER=['编码','古典密码','单向哈希','对称加密','非对称加密','数字签名','密钥工具','校验和','后量子密码','椭圆曲线与高级代数','分布式与门限密码'];
const g={};
for(const a of ALGOS){ (g[a.group]=g[a.group]||[]).push(a); }
const keys=[...ORDER.filter(k=>g[k]), ...Object.keys(g).filter(k=>!ORDER.includes(k))];
let n=0;
for(const k of keys){
  console.log('\n【'+k+'】('+g[k].length+')');
  for(const a of g[k]){
    n++;
    const v=sp[a.id];
    let spd='';
    if(v&&v.kind==='block') spd='   ── '+v.enc.toFixed(2)+' ms 加密 / '+v.dec.toFixed(2)+' ms 解密';
    else if(v&&v.kind==='hash') spd='   ── '+v.enc.toFixed(2)+' ms';
    else if(v&&v.kind==='native') spd='   ── 浏览器原生';
    console.log('  '+a.name+'  【'+a.id+'】'+spd);
  }
}
console.log('\nTOTAL|'+n);
