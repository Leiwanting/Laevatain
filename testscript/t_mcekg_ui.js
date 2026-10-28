/* 界面入口测试：走真实 ALGOS 注册路径调用 enc/dec */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
const parsed=[...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
for(const f of parsed){ vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}); }
const get=id=>ALGOS.find(a=>a.id===id);
let pass=0,fail=0;
function ck(name,cond,extra){ if(cond){pass++;console.log("✓ "+name);} else {fail++;console.log("✗ "+name+(extra?" :: "+extra:""));} }

/* 1) keygen 条目存在 */
const kg=get("mceliece348864-keygen");
ck("keygen 条目已注册", !!kg);
/* 2) 确定性种子生成 → 与官方 KAT 的 pk/sk 一致 */
const kat=fs.readFileSync("../deps/mce348864.kat","utf8").split("\n");
let katpk=null,katsk=null;
kat.forEach(l=>{ if(l.startsWith("pk = ")) katpk=l.slice(5).trim(); if(l.startsWith("sk = ")) katsk=l.slice(5).trim(); });
const seed="5B815C890117893D8BB8E886F63A78CE2D5F58342D703348CB95539E14B9A719";
const t0=Date.now();
const out=kg.enc("", null, seed, "hex");
const ms=Date.now()-t0;
const parts=out.split("::K::");
ck("输出为 pk::K::sk 两段", parts.length===2);
ck("pk 与官方 KAT 一致(261120B)", parts[0].trim().toUpperCase()===katpk, "len="+parts[0].trim().length);
ck("sk 与官方 KAT 一致(6492B)", parts[1].trim().toUpperCase()===katsk, "len="+parts[1].trim().length);
console.log("  keygen 耗时 "+ms+" ms");
/* 3) only-sk 模式 */
const out2=kg.enc("", null, "sk", "hex");
ck("填 sk 只输出私钥(12984 字符)", out2.trim().length===12984, "len="+out2.trim().length);
/* 4) 随机生成两次应不同 */
const r1=kg.enc("", null, "", "hex").split("::K::")[1].trim();
const r2=kg.enc("", null, "", "hex").split("::K::")[1].trim();
ck("随机生成两次结果不同", r1!==r2);
/* 5) 端到端：keygen 的 sk + KEM 条目的 ct → ss；再自己封装解封装 */
const kem=get("mceliece348864");
/* 注意：必须只生成一次，pk 与 sk 才配对 */
const pair=kg.enc("", null, "", "hex").split("::K::");
const pkHex2=pair[0].trim(), skHex2=pair[1].trim();
const encOut=kem.enc("", pkHex2, "", "hex");
const ctHex=encOut.split("::K::")[0].trim();
const ssEnc=encOut.split("::K::")[1].trim();
const ssDec=kem.dec(ctHex, skHex2, "", "hex").trim();
ck("新密钥对 封装→解封装 ss 一致", ssEnc===ssDec, "ct len="+ctHex.length);
/* 6) 官方 ct 解封装 */
let katct=null,katss=null;
kat.forEach(l=>{ if(l.startsWith("ct = ")) katct=l.slice(5).trim(); if(l.startsWith("ss = ")) katss=l.slice(5).trim(); });
const ref=fs.readFileSync("../mcekg/ref0.bin");
const refSk=Buffer.from(ref.subarray(261120)).toString("hex").toUpperCase();
ck("官方 ct + 官方 sk → 官方 ss", kem.dec(katct, refSk, "", "hex").trim().toUpperCase()===katss);
console.log("\n通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
