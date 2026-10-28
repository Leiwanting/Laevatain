/* IDEA 官方向量（ETH 参考实现）验证 + 固化 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
for(const m of html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)) vm.runInThisContext(fs.readFileSync(m[1],"utf8"),{filename:m[1]});
const a=ALGOS.find(x=>x.id==='idea');
const h2b=s=>new Uint8Array(Buffer.from(s,'hex'));
const b2h=u=>Buffer.from(u).toString('hex').toUpperCase();
let ok=0,bad=0,rok=0;
for(const line of fs.readFileSync("testvectors/idea_eth.txt","utf8").split("\n")){
  const t=line.trim(); if(!t||t.startsWith("#")) continue;
  const [K,P,C]=t.split(/\s+/);
  const f=a.makeBlockFn(h2b(K));
  const ct=b2h(f.enc(h2b(P)));
  const pt=b2h(f.dec(h2b(C)));
  if(ct===C.toUpperCase()) ok++; else {bad++;console.log("✗ 加密 K="+K+" P="+P+" got="+ct+" exp="+C);}
  if(pt===P.toUpperCase()) rok++; else console.log("✗ 解密 K="+K+" C="+C+" got="+pt);
}
console.log("IDEA 官方 KAT 加密: "+ok+"/"+(ok+bad)+"  解密往返: "+rok+"/"+(ok+bad));
