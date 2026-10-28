/* 界面入口测试：修完 key/param 开关后，X448 与 ed448 在 UI 层能否真正使用。
   注意：X448 的 enc/dec 是【同步】函数（不返回 Promise），别用 .then。 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return[];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
[...fs.readFileSync("index.html","utf8").matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1])
  .forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){console.log("加载失败 "+f+": "+e.message);}});
let pass=0,fail=0; const ck=(n,c)=>{ if(c){pass++;console.log("✓ "+n);} else {fail++;console.log("✗ "+n);} };
const A=id=>ALGOS.filter(x=>x.id===id)[0];

console.log("=== X448 界面入口 ===");
const x=A("x448");
ck("已注册",!!x);
ck("key 开关已开（私钥框会显示）", x.key===true);
ck("param 开关已开（公钥框会显示）", x.param===true);

/* RFC 7748 §5.2 X448 官方向量（若向量文件存在则对拍） */
let kat=0;
try{
  const V=JSON.parse(fs.readFileSync("_vec_new.json","utf8"));
  for(const t of (V.x448||[])){
    const got=bytesToHex(x448ScalarMult(H(t.a),H(t.pubB)));
    if(got===t.sh) kat++;
  }
  ck("RFC7748/cryptography 向量 "+kat+"/"+(V.x448||[]).length, kat===(V.x448||[]).length && kat>0);
}catch(e){ console.log("（无 _vec_new.json，跳过官方向量对拍）"); }
function H(h){return Uint8Array.from(Buffer.from(h,"hex"));}

/* 1. 留空私钥 → 生成密钥对 */
const out=x.enc(new Uint8Array(0),"",null,"hex");
const mP=out.match(/私钥（Hex，56 字节）：([0-9a-f]{112})/);
const mB=out.match(/公钥（Hex，56 字节）：([0-9a-f]{112})/);
ck("留空私钥能生成密钥对", !!(mP&&mB));
const skA=mP?mP[1]:"", pkA=mB?mB[1]:"";

/* 2. 填私钥 → 推导公钥，应与生成时一致 */
ck("私钥推导公钥 == 生成时的公钥", x.enc(new Uint8Array(0),skA,null,"hex")===pkA);

/* 3. 双向共享密钥 */
const out2=x.enc(new Uint8Array(0),"",null,"hex");
const skB=out2.match(/私钥（Hex，56 字节）：([0-9a-f]{112})/)[1];
const pkB=out2.match(/公钥（Hex，56 字节）：([0-9a-f]{112})/)[1];
const s1=x.dec(new Uint8Array(0),skA,pkB,"hex");
const s2=x.dec(new Uint8Array(0),skB,pkA,"hex");
ck("共享密钥双向一致（a·B == b·A）", s1===s2 && s1.length===112);
ck("共享密钥非退化（非全零）", s1!=="0".repeat(112));

/* 4. 错误输入必须有友好提示，不能崩 */
let e1,e2;
try{ x.dec(new Uint8Array(0),"",pkB,"hex"); }catch(e){ e1=e.message; }
ck("缺私钥 → 友好提示（不再是静默失败）", typeof e1==="string" && e1.length>0);
try{ x.dec(new Uint8Array(0),"abcd",pkB,"hex"); }catch(e){ e2=e.message; }
ck("私钥长度错 → 报错", typeof e2==="string" && e2.length>0);

console.log("\n=== Ed448 界面入口 ===");
const e=A("ed448");
ck("已注册",!!e);
ck("key 开关已开（私钥框会显示）", e.key===true);
ck("param 开关已开（公钥框会显示）", e.param===true);

console.log("\n通过 "+pass+" / 失败 "+fail);
