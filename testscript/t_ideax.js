/* IDEA 端到端与 pycryptodome 交叉（验证无分支 ideaMul 未破坏算法） */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
for(const m of html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)) vm.runInThisContext(fs.readFileSync(m[1],"utf8"),{filename:m[1]});
const a=ALGOS.find(x=>x.id==='idea');
const f=a.makeBlockFn(new Uint8Array(Buffer.from("0123456789abcdef","utf8")));
const rnd=nc.createHash("sha256").update("idea-fixed-seed").digest(); const buf=Buffer.alloc(8*300); for(let i=0;i<300;i++){ const b=nc.createHash("sha256").update(Buffer.concat([rnd,Buffer.from([i&255,(i>>8)&255])])).digest(); b.copy(buf,i*8,0,8);} const out=[];
for(let i=0;i<300;i++){const pt=buf.subarray(i*8,i*8+8);out.push(Buffer.from(pt).toString('hex')+' '+Buffer.from(f.enc(pt)).toString('hex'));}
fs.writeFileSync("/tmp/idea_out.txt",out.join("\n"));
console.log("IDEA 已导出 300 组");
