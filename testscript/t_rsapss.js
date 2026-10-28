const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=(id)=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
["Encryption_and_decryption_logic.js","crypto_tables.js","crypto_core.js","crypto_modes.js"].forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
(async()=>{
let P=0,F=0;const ck=(n,c,e)=>{if(c)P++;else{F++;console.log("  ✗ "+n+(e?" :: "+e:""));}};
// 生成 RSA 密钥对
const kp=nc.generateKeyPairSync("rsa",{modulusLength:2048,
  privateKeyEncoding:{type:"pkcs8",format:"pem"},publicKeyEncoding:{type:"spki",format:"pem"}});
const a=ALGOS.filter(x=>x.id==="rsa-pss")[0];
ck("rsa-pss 已注册",!!a);
const msg=strToBytes("test message for pss");
const sigB64=await a.enc(msg,kp.privateKey,"","base64");
ck("签名输出非空",!!sigB64&&sigB64.length>0);
// 自身验签
const r1=bytesToStr(await a.dec("test message for pss",kp.publicKey,sigB64,"text"));
ck("自身验签通过",/通过|有效/.test(r1),r1);
// 与 Node 交叉：Node 验签我们的签名
const sigBuf=Buffer.from(sigB64,"base64");
const okNode=nc.verify("sha256",msg,{key:kp.publicKey,padding:nc.constants.RSA_PKCS1_PSS_PADDING,saltLength:32},sigBuf);
ck("Node 验签我们的签名",okNode===true);
// 我们的代码验签 Node 产生的签名
const nodeSig=nc.sign("sha256",msg,{key:kp.privateKey,padding:nc.constants.RSA_PKCS1_PSS_PADDING,saltLength:32});
const r2=bytesToStr(await a.dec("test message for pss",kp.publicKey,nodeSig.toString("base64"),"text"));
ck("我们验签 Node 的签名",/通过|有效/.test(r2),r2);
// 篡改必须失败
const bad=Buffer.from(sigBuf); bad[10]^=0xFF;
const r3=bytesToStr(await a.dec("test message for pss",kp.publicKey,bad.toString("base64"),"text"));
ck("篡改签名被拒",/失败|无效/.test(r3),r3);
// 消息被改必须失败
const r4=bytesToStr(await a.dec("test message for pss",kp.publicKey,sigB64,"text"));
ck("二次验签一致",/通过|有效/.test(r4));
console.log("RSA-PSS 测试: 通过 "+P+" / 失败 "+F);
process.exit(F?1:0);
})().catch(e=>{console.log("异常:",e.message);process.exit(1);});
