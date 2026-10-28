const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
for(const f of [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1])) vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});
/* 关键：必须设为 raw（原始 hex 密钥），否则走口令派生，与 Python 参照用的原始密钥不同 */
KEY_MODE="raw";
/* 对拍需要复用同一 nonce，临时关掉 nonce 复用拦截（该保护本身在最后单独验证） */
NONCE_GUARD_MODE="warn";
const hx=u=>Array.from(u).map(b=>b.toString(16).padStart(2,"0")).join("");
const ref=JSON.parse(fs.readFileSync("/data/workspace/work/b78/ccm_ref.json","utf8"));
let pass=0,fail=0;
function ck(n,c,x){ if(c){pass++;console.log("✓ "+n);} else {fail++;console.log("✗ "+n+(x?" :: "+x:""));} }
const U=s=>new Uint8Array(Buffer.from(s,"utf8"));
(async()=>{
const aes=ALGOS.find(a=>a.id==="aes128");
const key=Buffer.from(ref.key,"hex").toString("hex");
const nonce=ref.nonce, aad="header", ptHex=ref.pt;
console.log("=== B 组：CCM 可变标签长度（对拍 Python cryptography）===");
for(const M of [4,6,8,10,12,14,16]){
  const r=await symEncrypt(aes,Buffer.from(ptHex,"hex"),key,"CCM","PKCS7",nonce,false,aad,null,M);
  var _body=hx(r.ciphertext.subarray(13));  /* 跳过 13 字节 nonce 前缀 */
  ck("CCM M="+M+" 密文+tag == Python", _body===ref[String(M)], "js="+_body+"\n      py="+ref[String(M)]);
  const back=await symDecrypt(aes,r.ciphertext,key,"CCM","PKCS7",nonce,aad,null,M);
  ck("CCM M="+M+" 解密还原", hx(back)===ptHex);
}
console.log("\n=== 非法标签长度必须拒绝（RFC 3610 只允许偶数）===");
for(const bad of [13,15,5,7,1,32]){
  let threw=false,msg="";
  try{ await symEncrypt(aes,U("test"),key,"CCM","PKCS7",nonce,false,aad,null,bad);}catch(e){threw=true;msg=e.message;}
  ck("CCM 拒绝 M="+bad, threw, msg);
}
console.log("\n=== 默认 16 字节未回归 ===");
{
  const r=await symEncrypt(aes,Buffer.from(ptHex,"hex"),key,"CCM","PKCS7",nonce,false,aad,null,16);
  ck("M=16 仍与参照一致", hx(r.ciphertext.subarray(13))===ref["16"]);
}
console.log("\n=== 篡改检测（M=8 短标签）===");
{
  const r=await symEncrypt(aes,Buffer.from(ptHex,"hex"),key,"CCM","PKCS7",nonce,false,aad,null,8);
  let refused=false; try{ const t=r.ciphertext.slice(); t[13]^=1; await symDecrypt(aes,t,key,"CCM","PKCS7",nonce,aad,null,8);}catch(e){refused=true;}
  ck("M=8 篡改被拒", refused);
}
console.log("\n=== nonce 复用保护（CCM 短标签下同样生效）===");
{
  NONCE_GUARD_MODE="block";
  var freshNonce="aa0011223344556677889900bb";   /* 13 字节，全新未用过 */
  await symEncrypt(aes,Buffer.from(ptHex,"hex"),key,"CCM","PKCS7",freshNonce,false,aad,null,8);
  let blocked=false,msg2="";
  try{ await symEncrypt(aes,U("another"),key,"CCM","PKCS7",freshNonce,false,aad,null,8);}catch(e){blocked=true;msg2=e.message;}
  ck("同一密钥+nonce 第二次加密被阻止", blocked && /nonce/i.test(msg2), msg2.slice(0,40));
  NONCE_GUARD_MODE="warn";
}
console.log("\nPASS "+pass+"  FAIL "+fail);
process.exit(fail?1:0);
})();
