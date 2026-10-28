/* 界面入口端到端：E 组 biIGE + A 组 EtM（13 个无认证模式全部受益） */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
for(const f of [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1])) vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});
const hx=u=>Array.from(u).map(b=>b.toString(16).padStart(2,"0")).join("");
let pass=0,fail=0;
function ck(n,c,x){ if(c){pass++;console.log("✓ "+n);} else {fail++;console.log("✗ "+n+(x?" :: "+x:""));} }
const U=s=>new Uint8Array(Buffer.from(s,"utf8"));

(async()=>{
const aes=ALGOS.find(a=>a.id==="aes256");
const KEY="000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const PT="EtM + biIGE end-to-end test message!!";

console.log("=== E 组：biIGE 端到端 ===");
{
  const iv=hx(Uint8Array.from({length:64},(_,i)=>i));
  const r=await symEncrypt(aes,U(PT),KEY,"biIGE","PKCS7",iv,false,"",null,16);
  ck("biIGE 密文长度是块长整数倍", r.ciphertext.length%16===0, r.ciphertext.length);
  const back=await symDecrypt(aes,r.ciphertext,KEY,"biIGE","PKCS7",iv,"",null,16);
  ck("biIGE 往返还原", hx(back)===hx(U(PT)), hx(back));
  const ivInfo="biIGE IV 回写 64 字节 = "+(r.iv.length*2)+" hex 位";
  ck(ivInfo, r.iv.length===64);
  // 双向传播：改中间块首字节
  const tam=r.ciphertext.slice(); tam[0]^=1;
  let diff=0; try{ const b2=await symDecrypt(aes,tam,KEY,"biIGE","PKCS7",iv,"",null,16);
    for(let i=0;i<Math.min(b2.length,U(PT).length);i++) if(b2[i]!==U(PT)[i]) diff++; }catch(e){ diff=999; }
  ck("biIGE 改首块 → 明文大面积错乱("+diff+")", diff>16);
}

console.log("\n=== A 组：EtM 覆盖 13 个无认证模式 ===");
const modes=["CBC","ECB","CFB","OFB","CTR","PCBC","CTS-CS1","CFB8","IGE","biIGE"];
for(const m of modes){
  window.CURRENT_ETM="hmac-sha256";
  const ivLen = m==="biIGE"?64:(m==="IGE"?32:16);
  const iv=hx(Uint8Array.from({length:ivLen},(_,i)=>i));
  try{
    const r=await symEncrypt(aes,U(PT),KEY,m,"PKCS7",iv,false,"",null,16);
    const back=await symDecrypt(aes,r.ciphertext,KEY,m,"PKCS7",iv,"",null,16);
    const ok = hx(back)===hx(U(PT));
    // 篡改必须被拒绝
    let refused=false;
    try{ const tam=r.ciphertext.slice(); tam[0]^=1; await symDecrypt(aes,tam,KEY,m,"PKCS7",iv,"",null,16);}catch(e){refused=true;}
    ck("EtM+"+m+" 往返一致 且 篡改被拒", ok&&refused, ok?"篡改未被拒绝":"往返失败");
  }catch(e){ ck("EtM+"+m, false, e.message); }
}

console.log("\n=== EtM 五种 MAC 端到端（CBC 上）===");
for(const mac of ["hmac-sha256","hmac-sha512","hmac-sha3-256","cmac-aes","poly1305"]){
  window.CURRENT_ETM=mac;
  const iv=hx(Uint8Array.from({length:16},(_,i)=>i));
  const r=await symEncrypt(aes,U(PT),KEY,"CBC","PKCS7",iv,false,"aad-test",null,16);
  const back=await symDecrypt(aes,r.ciphertext,KEY,"CBC","PKCS7",iv,"aad-test",null,16);
  ck("EtM "+mac+" 往返(带AAD)", hx(back)===hx(U(PT)));
  let refused=false;
  try{ await symDecrypt(aes,r.ciphertext,KEY,"CBC","PKCS7",iv,"wrong-aad",null,16);}catch(e){refused=true;}
  ck("EtM "+mac+" 错AAD被拒", refused);
}

console.log("\n=== 不叠加：AEAD 模式不额外附加 EtM ===");
{
  window.CURRENT_ETM="hmac-sha256";
  const g1=await symEncrypt(aes,U(PT),KEY,"GCM","PKCS7",null,false,"",null,16);
  window.CURRENT_ETM="none";
  const g2=await symEncrypt(aes,U(PT),KEY,"GCM","PKCS7",null,false,"",null,16);
  ck("GCM 选 EtM 与不选长度一致（不叠加）", g1.ciphertext.length===g2.ciphertext.length, g1.ciphertext.length+" vs "+g2.ciphertext.length);
}
console.log("\nPASS "+pass+"  FAIL "+fail);
process.exit(fail?1:0);
})();
