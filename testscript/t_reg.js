/* 按 index.html 的真实加载顺序验证（含 BLS 两个新条目） */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=(id)=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
const html=fs.readFileSync("index.html","utf8");
const files=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
console.log("index.html 加载:",files.join(", "));
files.forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
console.log("算法总数:",ALGOS.length);
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<6)console.log("  ✗ "+n);}};
(async()=>{
// ML-KEM 三个参数集
for(const id of ["mlkem512","mlkem768","mlkem1024"]){
  const a=ALGOS.filter(x=>x.id===id)[0]; const kp=a.gen();
  const out=a.enc(strToBytes(""),kp.pub,"","base64");
  const c=out.split("::K::")[0].trim(), K=out.split("::K::")[1].trim();
  ck(id+" 往返", a.dec(c,kp.priv,"","base64")===K);
}
// ML-DSA 三个参数集
for(const id of ["mldsa44","mldsa65","mldsa87"]){
  const a=ALGOS.filter(x=>x.id===id)[0]; const kp=a.gen();
  const sig=a.enc(strToBytes("pqc"),kp.priv,"","base64");
  ck(id+" 验签", /通过/.test(bytesToStr(a.dec("pqc",kp.pub,sig,"base64"))));
  ck(id+" 篡改", /失败/.test(bytesToStr(a.dec("pqc!",kp.pub,sig,"base64"))));
}
// BLS 签名
{
  const a=ALGOS.filter(x=>x.id==="bls_sig")[0]; const kp=a.gen();
  ck("bls 私钥长32", kp.priv.length===64);
  ck("bls 公钥长192", kp.pub.length===384);
  const sig=a.enc(strToBytes("hello bls"),kp.priv,"","hex");
  ck("bls 签名长96", sig.length===192);
  ck("bls 验签", /通过/.test(bytesToStr(a.dec("hello bls",kp.pub,sig,"hex"))));
  ck("bls 篡改拒绝", /失败/.test(bytesToStr(a.dec("hello bls!",kp.pub,sig,"hex"))));
}
// BLS 配对：双线性抽查
{
  const a=ALGOS.filter(x=>x.id==="bls_pair")[0];
  const P1=bytesToHex(blsG1ToBytes(BLS_G1)), Q1=bytesToHex(blsG2ToBytes(BLS_G2));
  const e11=a.enc(strToBytes(""),Q1,P1,"hex");
  ck("e(G1,G2) 长576", e11.length===1152);
  const e22=a.enc(strToBytes(""),bytesToHex(blsG2ToBytes(g2Mul(BLS_G2,2n))),bytesToHex(blsG1ToBytes(g1Mul(BLS_G1,3n))),"hex");
  const want=bytesToHex((function(){const p=blsPairing(BLS_G2,BLS_G1);const q=f12pow(p,6n);const o=[];for(let i=0;i<12;i++)o.push(blsFqToBytes(q[i]));return blsCat(o);})());
  ck("双线性 e(3G1,2G2)==e(G1,G2)^6", e22===want);
}
console.log("\n端到端注册验证: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
})().catch(e=>{console.log("异常:",e.message);process.exit(1);});
