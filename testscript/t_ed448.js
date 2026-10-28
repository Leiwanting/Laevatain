/* Ed448 界面入口测试。新接口：
   签名 enc：输入区=消息，密钥栏=私钥 → 签名 Hex
   验签 dec：输入区=消息，参数栏="签名Hex,公钥Hex"（公钥可省）
   必测防假阳性：篡改消息必须失败，否则"验签通过"毫无意义。 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;global.TextDecoder=require("util").TextDecoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return[];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
[...fs.readFileSync("index.html","utf8").matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){console.log("加载失败 "+f);}});
let pass=0,fail=0;const ck=(n,c)=>{if(c){pass++;}else{fail++;console.log("✗ "+n);}};
const e=ALGOS.filter(a=>a.id==="ed448")[0];
const E=s=>new TextEncoder().encode(s);
ck("已注册",!!e); ck("key 开关",e.key===true); ck("param 开关",e.param===true);
const out=e.enc(E(""),"",null,"hex");
const sk=out.match(/私钥（Hex，57 字节）：([0-9a-f]{114})/)[1];
const pk=out.match(/公钥（Hex，57 字节）：([0-9a-f]{114})/)[1];
ck("留空生成密钥对", sk.length===114&&pk.length===114);
ck("公钥自洽", bytesToHex(ed448PublicFromPriv(Uint8Array.from(Buffer.from(sk,"hex"))))===pk);
const msg="hello Ed448";
const sig=e.enc(E(msg),sk,null,"hex");
ck("签名 114 字节", sig.length===228);
ck("验签（签名,公钥）通过", /通过/.test(e.dec(E(msg),sk,sig+","+pk,"hex")));
ck("验签（仅签名，公钥由私钥推导）通过", /通过/.test(e.dec(E(msg),sk,sig,"hex")));
ck("篡改消息 → 必须失败（防假阳性）", !/通过/.test(e.dec(E(msg+"x"),sk,sig+","+pk,"hex")));
/* 用另一把【合法】密钥的公钥——非法点会在内部抛错，测不出"验签判假"这条路径 */
const out2=e.enc(E(""),"",null,"hex");
const pk2=out2.match(/公钥（Hex，57 字节）：([0-9a-f]{114})/)[1];
ck("换他人合法公钥 → 必须失败", !/通过/.test(e.dec(E(msg),sk,sig+","+pk2,"hex")));
let threw=false; try{ e.dec(E(msg),sk,"deadbeef,"+pk,"hex"); }catch(err){ threw=true; }
ck("签名长度非法 → 报错而非静默通过", threw);
console.log("Ed448: 通过 "+pass+" / 失败 "+fail);
