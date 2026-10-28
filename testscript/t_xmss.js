/* XMSS 官方向量验证 —— 走 reg 注册的界面入口（覆盖「解析 → 条目 → 输出」整条链路）
 * 向量：Botan 2.19.5 src/tests/data/pubkey/
 *   xmss_verify.vec 36 组（12 参数集 × 消息长 0/4/1000）
 *   xmss_sig.vec    12 组（4 个 h=10 参数集 × 同上）
 * 加载方式：仿 t_all.js，用 DOM stub 按 index.html 顺序加载全部脚本
 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("/data/workspace/dist/index.html","utf8");
const parsed=[...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let ok=0,fail=0;
for(const f of parsed){ try{vm.runInThisContext(fs.readFileSync("/data/workspace/dist/"+f,"utf8"),{filename:f});ok++;}catch(e){fail++;console.log("✗ "+f+": "+e.message);} }
console.log("脚本加载 "+ok+"/"+parsed.length+"  失败 "+fail);
if(!globalThis.XMSS){console.log("✗ XMSS 未加载");process.exit(1);}

function parse(path){const out=[];let cur={};
  for(const line of fs.readFileSync(path,"utf8").split(/\r?\n/)){const s=line.trim();if(!s)continue;
    const i=s.indexOf("=");if(i<0)continue;cur[s.slice(0,i).trim()]=s.slice(i+1).trim();
    if(cur.Signature&&(cur.PrivateKey||cur.PublicKey)){out.push(cur);cur={};}}
  return out;}
const V="/data/workspace/dl/botan-2.19.5/src/tests/data/pubkey/";
const only=process.argv[2]||"all";
(async()=>{
  if(only==="all"||only==="verify"){
    const vv=parse(V+"xmss_verify.vec");const al=ALGOS.find(a=>a.id==="xmss-verify");
    let p=0,b=0;for(const g of vv){
      const msg=Uint8Array.from(Buffer.from(g.Msg,"hex"));const t0=Date.now();
      const out=await al.enc(msg,g.PublicKey,g.Signature+","+g.Params,"text");
      const good=out.text.indexOf("有效")>=0;p+=good;b+=!good;
      console.log((good?"PASS":"FAIL"),g.Params,"msglen",msg.length,Date.now()-t0+"ms");}
    console.log("VERIFY PASS "+p+" FAIL "+b);}
  if(only==="all"||only==="sign"){
    const sv=parse(V+"xmss_sig.vec");const al=ALGOS.find(a=>a.id==="xmss-sign");
    let p=0,b=0;for(const g of sv){
      const msg=Uint8Array.from(Buffer.from(g.Msg,"hex"));const t0=Date.now();
      const out=await al.enc(msg,g.PrivateKey,g.Params,"text");
      const hex=out.text.split("\n")[1]||"";const good=hex===g.Signature;p+=good;b+=!good;
      console.log((good?"MATCH":"DIFF "),g.Params,"msglen",msg.length,Date.now()-t0+"ms");
      if(!good)console.log("  got "+hex.slice(0,64)+"\n  exp "+g.Signature.slice(0,64));}
    console.log("SIGN PASS "+p+" FAIL "+b);}
})();
