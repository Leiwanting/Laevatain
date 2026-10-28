const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const V=JSON.parse(fs.readFileSync("_vec_sm9sig.json","utf8"));
const B=x=>BigInt(x);
const cv2=a=>[B(a[0]),B(a[1])];   // 生成脚本的 s2 已转成 [c0,c1]，此处不再交换
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=4)console.log("  ✗ "+n);}};
const hid=hexToBytes(V.hid_s);
for(const c of V.sign){
  const uid=hexToBytes(c.uid), msg=hexToBytes(c.msg);
  const mpk=[cv2(c.mpk[0]),cv2(c.mpk[1])];
  const msk=B(c.msk);
  // 1) KGC 生成的用户私钥与 gmalg 一致
  const sk=sm9GenSkSign(hid, msk, uid);
  ck("私钥 x", sk[0]===B(c.sk[0]));
  ck("私钥 y", sk[1]===B(c.sk[1]));
  // 2) 主公钥
  ck("主公钥", sm9f2eq(sm9g2Mul(SM9_G2,msk)[0], mpk[0]));
  // 3) 签名（固定 r）与 gmalg 一致
  const sig=sm9Sign(msg, mpk, sk, B(c.r));
  ck("签名 h", sig.h===B(c.h));
  ck("签名 S.x", sig.S[0]===B(c.S[0]));
  ck("签名 S.y", sig.S[1]===B(c.S[1]));
  // 4) 验签通过
  ck("验签通过", sm9Verify(msg, sig.h, sig.S, hid, mpk, uid)===true);
  // 5) 篡改消息被拒
  ck("篡改消息被拒", sm9Verify(strToBytes("tampered"), sig.h, sig.S, hid, mpk, uid)===false);
  // 6) 换 UID 被拒
  ck("换UID被拒", sm9Verify(msg, sig.h, sig.S, hid, mpk, strToBytes("other"))===false);
}
console.log("SM9 签名/验签: 通过 "+pass+" / 失败 "+fail);
