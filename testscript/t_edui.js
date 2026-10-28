const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=5)console.log("  ✗ "+n);}};
const sk="c5aa8df43f9f837bedb7442f31dcb7b166d38535076f094b85ce3a2e0b4458f7";
const msg=strToBytes("hello Ed25519 variants");
for(const v of ['ctx','ph']){
  const A=ALGOS.find(x=>x.id==='ed25519-'+v);
  ck("已注册 ed25519-"+v, !!A);
  const pk=bytesToHex(ed25519PubFromSk(hexToBytes(sk)));
  // 空 ctx
  const s1=A.enc(msg, sk, "", "hex");
  ck(v+" 签名 64 字节", hexToBytes(s1).length===64);
  ck(v+" 验签通过", /验签通过/.test(A.dec(msg, pk, s1, "hex")));
  let t1=false; try{A.dec(strToBytes("tampered"), pk, s1, "hex");}catch(e){t1=true;}
  ck(v+" 篡改被拒", t1);
  // 带 ctx
  const ctxHex="cafe0001";
  const s2=A.enc(msg, sk, ctxHex, "hex");
  ck(v+" 带ctx签名不同", s2!==s1);
  ck(v+" 带ctx验签通过", /验签通过/.test(A.dec(msg, pk, ctxHex+"|"+s2, "hex")));
  // ctx 不匹配应失败
  let t2=false; try{A.dec(msg, pk, "beef0001|"+s2, "hex");}catch(e){t2=true;}
  ck(v+" ctx不匹配被拒", t2);
  // 私钥格式校验
  let t3=false; try{A.enc(msg, "not-hex", "", "hex");}catch(e){t3=/64 位 Hex/.test(e.message);}
  ck(v+" 私钥格式校验", t3);
}
// ctx 与 ph 应产生不同签名
const Ac=ALGOS.find(x=>x.id==='ed25519-ctx'), Ap=ALGOS.find(x=>x.id==='ed25519-ph');
ck("ctx 与 ph 签名不同", Ac.enc(msg, sk, "", "hex")!==Ap.enc(msg, sk, "", "hex"));
console.log("Ed25519 变体界面: 通过 "+pass+" / 失败 "+fail);
