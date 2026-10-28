/* XMSS 签名抽样验证：每种 h=10 参数集取 1 组（4 组）
 * 全量 12 组已由 Python 参考实现（work/xmss_ref.py）12/12 通过；
 * JS 侧只需确认四条哈希路径（SHA-256/512、SHAKE-128/256）移植无误。
 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("/data/workspace/dist/index.html","utf8");
for(const m of html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g))
  vm.runInThisContext(fs.readFileSync("/data/workspace/dist/"+m[1],"utf8"),{filename:m[1]});
function parse(path){const out=[];let cur={};
  for(const line of fs.readFileSync(path,"utf8").split(/\r?\n/)){const s=line.trim();if(!s)continue;
    const i=s.indexOf("=");if(i<0)continue;cur[s.slice(0,i).trim()]=s.slice(i+1).trim();
    if(cur.Signature&&(cur.PrivateKey||cur.PublicKey)){out.push(cur);cur={};}}
  return out;}
const V="/data/workspace/dl/botan-2.19.5/src/tests/data/pubkey/";
const want=process.argv.slice(2);
(async()=>{
  const al=ALGOS.find(a=>a.id==="xmss-sign");
  const sv=parse(V+"xmss_sig.vec");
  const seen={};const pick=[];
  for(const g of sv){ if(!seen[g.Params]){seen[g.Params]=1; if(!want.length||want.includes(g.Params)) pick.push(g);} }
  let p=0,b=0;
  for(const g of pick){
    const msg=Uint8Array.from(Buffer.from(g.Msg,"hex"));const t0=Date.now();
    const out=await al.enc(msg,g.PrivateKey,g.Params,"text");
    const hex=out.text.split("\n")[1]||"";const good=hex===g.Signature;p+=good;b+=!good;
    console.log((good?"MATCH":"DIFF "),g.Params,"msglen",msg.length,((Date.now()-t0)/1000).toFixed(1)+"s",flush=true);
    if(!good)console.log("  got "+hex.slice(0,64)+"\n  exp "+g.Signature.slice(0,64));}
  console.log("SIGN SAMPLE PASS "+p+" FAIL "+b);
})();
