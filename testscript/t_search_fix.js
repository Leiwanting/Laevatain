const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
[...fs.readFileSync("index.html","utf8").matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
function search(q){
  let hits=[];
  for(const a of ALGOS){const s=algoMatchScore(q,a); if(s>0) hits.push({a,s});}
  hits.sort((x,y)=>y.s-x.s);
  if(hits.length){const top=hits[0].s; hits=hits.filter(h=>h.s>=top*0.2||h.s>=900);}
  return hits;
}
/* 每个关键词必须能找到目标算法，且不出现"完全无关"的条目 */
const cases=[
  ["xcb","xcb"],["eme2","eme2"],["essiv","cbc-essiv"],["aes","aes128"],
  ["sm2","sm2-sign"],["sm9","sm9-sign"],["哈希","md5"],["门限","vss"],
  ["后量子","mlkem512"],["verkle","verkle-root"],["blake","blake2b"],
  ["rsa","rsa"],["crc","crc32"],["sphincs","sphincs"],["argon2","argon2id"],
  ["gost","gost28147"],["国密","sm4"],["配对","bls_pair"],["hqc","hqc128"],
];
let ok=0,bad=0;
for(const [q,want] of cases){
  const h=search(q);
  const ids=h.map(x=>x.a.id);
  const hit=ids.indexOf(want);
  if(hit>=0){ok++;}
  else{bad++;console.log("未找到 ["+q+"] → 期望 "+want+"，实得 "+ids.slice(0,5).join(","));}
}
console.log("关键词可找到目标: "+ok+"/"+cases.length+"  失败 "+bad);
/* 关键回归：xcb 不得再混入 SPAKE2+/CRC64 */
const x=search("xcb").map(h=>h.a.id);
console.log("搜 xcb 结果: "+JSON.stringify(x));
console.log("无关项已剔除: "+((!x.includes("spake2p-prover")&&!x.includes("crc64ecma"))?"✓":"✗"));
const e=search("eme2").map(h=>h.a.id);
console.log("搜 eme2 结果: "+JSON.stringify(e));
console.log("搜 essiv: "+JSON.stringify(search("essiv").map(h=>h.a.id)));
