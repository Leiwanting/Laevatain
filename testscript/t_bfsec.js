/* Blowfish 常量硬编码回归：与 pycryptodome 交叉 + 常量自检 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
for(const m of html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\s]*?)<\/script>/g)) vm.runInThisContext(fs.readFileSync(m[1],"utf8"),{filename:m[1]});
const bf=ALGOS.find(a=>a.id==='blowfish');
console.log("blowfish 条目: "+(bf?"存在 ✓":"缺失 ✗"));
/* 常量自检（initBlowfish 内部已抛错即失败） */
const c=globalThis.blowfishFreshConstants();
console.log("P[0]=0x"+(c.P[0]>>>0).toString(16)+" P[17]=0x"+(c.P[17]>>>0).toString(16));
console.log("S[0]=0x"+(c.S[0]>>>0).toString(16)+" S[1023]=0x"+(c.S[1023]>>>0).toString(16));
/* 单块 ECB 加密，输出给 python 对拍 */
const f=bf.makeBlockFn(new Uint8Array(Buffer.from("0123456789abcdef","utf8")));
const out=[];
const rnd=nc.randomBytes(8*200);
for(let i=0;i<200;i++){
  const pt=rnd.subarray(i*8,i*8+8);
  out.push([Buffer.from(pt).toString('hex'), Buffer.from(f.enc(pt)).toString('hex')].join(' '));
}
fs.writeFileSync("/tmp/bf_out.txt", out.join("\n"));
console.log("已导出 200 组:"+"/tmp/bf_out.txt");
