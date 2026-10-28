const fs=require("fs"),vm=require("vm"),nc=require("crypto"),cp=require("child_process");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=(id)=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
["Encryption_and_decryption_logic.js","crypto_tables.js","crypto_core.js","crypto_modes.js","pqc_core.js","pqc_dsa.js"].forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const LV={44:{k:4,l:4,pk:1312,sk:2560,sig:2420},65:{k:6,l:5,pk:1952,sk:4032,sig:3309},87:{k:8,l:7,pk:2592,sk:4896,sig:4627}};
let pass=0,fail=0;const ck=(n,c,e)=>{if(c)pass++;else{fail++;if(fail<6)console.log("  ✗ "+n+(e?" :: "+e:""));}};
(async()=>{
// A. 自身往返 + 尺寸
for(const lv of [44,65,87]){
  for(let i=0;i<3;i++){
    const kp=mldsaKeygen(lv);
    ck(`A${lv} pk尺寸`,kp.pk.length===LV[lv].pk,"得"+kp.pk.length+" 应"+LV[lv].pk);
    ck(`A${lv} sk尺寸`,kp.sk.length===LV[lv].sk,"得"+kp.sk.length+" 应"+LV[lv].sk);
    const msg=strToBytes("mldsa test "+lv+" "+i);
    const rnd=new Uint8Array(32);
    const msg2=strToBytes("mldsa test");
    const tr=shake256Digest(kp.pk,64);
    const sig=mldsaSign(lv,kp.sk,msg,rnd);
    ck(`A${lv} sig尺寸`,sig.length===LV[lv].sig,"得"+sig.length+" 应"+LV[lv].sig);
    ck(`A${lv} 自身验签`,mldsaVerify(lv,kp.pk,msg,sig)===true);
    ck(`A${lv} 篡改消息`,mldsaVerify(lv,kp.pk,msg2,sig)===false);
  }
}
console.log("A. 自身往返/尺寸/篡改: 通过 "+pass+" / 失败 "+fail);

// B. 与 dilithium_py 双向互通
const payload={};
for(const lv of [44,65,87]){
  payload[lv]=[];
  for(let i=0;i<2;i++){
    const kp=mldsaKeygen(lv);
    const msg=strToBytes("cross test "+lv);
    const sig=mldsaSign(lv,kp.sk,msg,new Uint8Array(32));
    payload[lv].push({pk:bytesToHex(kp.pk),sk:bytesToHex(kp.sk),sig:bytesToHex(sig),msg:bytesToHex(msg)});
  }
}
fs.writeFileSync("_js_dsa.json",JSON.stringify(payload));
let out;
try{
  out=cp.execSync(`python3 - <<'PY'
import json
from dilithium_py.ml_dsa import ML_DSA_44,ML_DSA_65,ML_DSA_87
M={44:ML_DSA_44,65:ML_DSA_65,87:ML_DSA_87}
d=json.load(open("_js_dsa.json"))
r={}
for lv,v in d.items():
    D=M[int(lv)]; r[lv]=[]
    for x in v:
        pk=bytes.fromhex(x["pk"]); sk=bytes.fromhex(x["sk"]); sig=bytes.fromhex(x["sig"]); msg=bytes.fromhex(x["msg"])
        # Python 验我们的签名
        r[lv].append({"py_verify_js": bool(D.verify(pk,msg,sig))})
        # Python 用自己的 sk 签，让 JS 验
        s2=D.sign(sk,msg)
        r[lv][-1]["py_sig"]=s2.hex()
        # Python 用自己的 keygen 签 msg2，让 JS 验
        pk2,sk2=D.keygen()
        s3=D.sign(sk2,msg)
        r[lv][-1]["pk2"]=pk2.hex(); r[lv][-1]["sig2"]=s3.hex()
print(json.dumps(r))
PY`,{encoding:"utf8"});
}catch(e){console.log("Python 端失败:",String(e.message).slice(0,300));out=null;}
if(out){
  const R=JSON.parse(out.trim().split("\n").pop());
  let bp=0,bf=0;
  for(const lv of [44,65,87]){
    R[String(lv)].forEach((x,i)=>{
      if(x.py_verify_js){bp++;}else{bf++;console.log(`  ✗ ${lv} Python 验不出我们的签名(${i})`);}
      const okJs=mldsaVerify(lv,hexToBytes(x.pk2),strToBytes("cross test "+lv),hexToBytes(x.sig2));
      if(okJs){bp++;}else{bf++;console.log(`  ✗ ${lv} JS 验不出 Python 的签名(${i})`);}
    });
  }
  console.log("B. 与 dilithium_py 双向互通: 通过 "+bp+" / 失败 "+bf);
  pass+=bp;fail+=bf;
}
console.log("\nML-DSA 总计: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
})().catch(e=>{console.log("异常:",e.message);console.log(e.stack.split("\n")[1]);process.exit(1);});
