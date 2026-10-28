/* 双向交叉验证：JS 封装 → Python 解封装；Python 封装 → JS 解封装 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto"),cp=require("child_process");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=(id)=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
["Encryption_and_decryption_logic.js","crypto_tables.js","crypto_core.js","crypto_modes.js","pqc_core.js"].forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const KOFS={"ML-KEM-512":2,"ML-KEM-768":3,"ML-KEM-1024":4};
(async()=>{
let pass=0,fail=0;
// A. JS 自身往返：每个参数集 12 轮
for(const [name,k] of Object.entries(KOFS)){
  for(let i=0;i<12;i++){
    const kp=mlkemKeygen(k);
    const e=mlkemEncaps(k,kp.ek);
    const got=bytesToHex(mlkemDecaps(k,kp.dk,e.c));
    if(got===bytesToHex(e.K))pass++;else{fail++;if(fail<4)console.log(`  ✗ ${name} 第${i}轮 往返失败`);}
  }
}
console.log("A. JS 自身往返(3参数集×12轮): 通过 "+pass+" / 失败 "+fail);

// B. 参数集尺寸校验
const SZ={2:{ek:800,dk:1632,c:768},3:{ek:1184,dk:2400,c:1088},4:{ek:1568,dk:3168,c:1568}};
let sp=0,sf=0;
for(const [k,v] of Object.entries(SZ)){
  const kp=mlkemKeygen(Number(k)); const e=mlkemEncaps(Number(k),kp.ek);
  const ok=kp.ek.length===v.ek&&kp.dk.length===v.dk&&e.c.length===v.c;
  if(ok)sp++;else{sf++;console.log(`  ✗ k=${k} 尺寸 ek=${kp.ek.length}/${v.ek} dk=${kp.dk.length}/${v.dk} c=${e.c.length}/${v.c}`);}
}
console.log("B. 密钥/密文尺寸(标准值): 通过 "+sp+" / 失败 "+sf);

// C. 篡改密文 → 必须走隐式拒绝（得到伪随机值，而非原 ss）
let tp=0,tf=0;
for(const k of [2,3,4]){
  for(let i=0;i<4;i++){
    const kp=mlkemKeygen(k); const e=mlkemEncaps(k,kp.ek);
    const bad=new Uint8Array(e.c); bad[5]^=0x40;
    const got=bytesToHex(mlkemDecaps(k,kp.dk,bad));
    if(got!==bytesToHex(e.K))tp++;else{tf++;console.log(`  ✗ k=${k} 篡改未触发隐式拒绝`);}
  }
}
console.log("C. 篡改密文触发隐式拒绝: 通过 "+tp+" / 失败 "+tf);

// D. 与 Python 双向互通
const payload={};
for(const [name,k] of Object.entries(KOFS)){
  payload[name]={k:k,js:[]};
  for(let i=0;i<3;i++){
    const kp=mlkemKeygen(k); const e=mlkemEncaps(k,kp.ek);
    payload[name].js.push({ek:bytesToHex(kp.ek),dk:bytesToHex(kp.dk),c:bytesToHex(e.c),K:bytesToHex(e.K)});
  }
}
fs.writeFileSync("_js_to_py.json",JSON.stringify(payload));
const pyOut=cp.execSync(`python3 - <<'PY'
import json
from kyber_py.ml_kem import ML_KEM_512,ML_KEM_768,ML_KEM_1024
M={"ML-KEM-512":ML_KEM_512,"ML-KEM-768":ML_KEM_768,"ML-KEM-1024":ML_KEM_1024}
d=json.load(open("_js_to_py.json"))
r={}
for name,v in d.items():
    K=M[name]; r[name]=[]
    for x in v["js"]:
        # Python 解 JS 的密文
        ss=K.decaps(bytes.fromhex(x["dk"]), bytes.fromhex(x["c"]))
        r[name].append({"py_dec_js":ss.hex()==x["K"]})
        # Python 封装 → JS 解（把 ek 给 Python 封，返回密文与 ss）
        ss2,c2=K.encaps(bytes.fromhex(x["ek"]))
        r[name][-1]["py_c"]=c2.hex(); r[name][-1]["py_ss"]=ss2.hex()
print(json.dumps(r))
PY`,{encoding:"utf8"});
const R=JSON.parse(pyOut.trim().split("\n").pop());
let dp=0,df=0;
for(const [name,k] of Object.entries(KOFS)){
  R[name].forEach((x,i)=>{
    if(x.py_dec_js){dp++;}else{df++;console.log(`  ✗ ${name} Python 解不出 JS 的密文(第${i}组)`);}
    const got=bytesToHex(mlkemDecaps(k,hexToBytes(payload[name].js[i].dk),hexToBytes(x.py_c)));
    if(got===x.py_ss){dp++;}else{df++;console.log(`  ✗ ${name} JS 解不出 Python 的密文(第${i}组)`);}
  });
}
console.log("D. 与 kyber_py 双向互通: 通过 "+dp+" / 失败 "+df);
const total=pass+sp+tp+dp, tf2=fail+sf+tf+df;
console.log("\nML-KEM 总计: 通过 "+total+" / 失败 "+tf2);
process.exit(tf2?1:0);
})().catch(e=>{console.log("异常:",e.message);process.exit(1);});
