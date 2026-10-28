const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=5)console.log("  ✗ "+n);}};
// 1) 双线性：e(aG1, bG2) == e(G1,G2)^(ab)
const base=sm9Pairing(SM9_G1, SM9_G2);
ck("e(G1,G2) != 1", !sm9f12eq(base, sm9f12one()));
ck("e(G1,G2)^n == 1", sm9f12eq(sm9f12pow(base, SM9_N), sm9f12one()));
for(const [a,b] of [[2n,3n],[7n,11n],[987654321n,123456789n]]){
  const l=sm9Pairing(sm9g1Mul(SM9_G1,a), sm9g2Mul(SM9_G2,b));
  const r=sm9f12pow(base, a*b);
  ck("双线性 a="+a+" b="+b, sm9f12eq(l,r));
}
ck("e(kG1,G2)==e(G1,kG2)", sm9f12eq(sm9Pairing(sm9g1Mul(SM9_G1,7n),SM9_G2), sm9Pairing(SM9_G1,sm9g2Mul(SM9_G2,7n))));
// 2) 界面：签名 -> 验签
const A=ALGOS.find(x=>x.id==='sm9-sign');
ck("sm9-sign 已注册", !!A);
const msk = 30517578125n;  // 固定主私钥
const uid = "alice@example.com";
const msg = strToBytes("hello SM9");
const sigHex = A.enc(msg, msk.toString(16), uid, "hex");
ck("签名输出 96 字节", hexToBytes(sigHex).length === 96);
const r1 = A.dec(msg, msk.toString(16), uid+"|"+sigHex, "hex");
ck("验签通过", /验签通过/.test(r1));
// 3) 篡改消息应失败
let threw=false;
try{ A.dec(strToBytes("tampered"), msk.toString(16), uid+"|"+sigHex, "hex"); }catch(e){ threw=true; }
ck("篡改消息被拒", threw);
// 4) 换 UID 应失败
let threw2=false;
try{ A.dec(msg, msk.toString(16), "bob@example.com|"+sigHex, "hex"); }catch(e){ threw2=true; }
ck("换UID被拒", threw2);
// 5) 换主私钥应失败
let threw3=false;
try{ A.dec(msg, (msk+1n).toString(16), uid+"|"+sigHex, "hex"); }catch(e){ threw3=true; }
ck("换主私钥被拒", threw3);
// 6) 签名随机性：两次签名不同
const s2=A.enc(msg, msk.toString(16), uid, "hex");
ck("签名 nonce 随机", s2!==sigHex);
ck("第二次签名也能验过", /验签通过/.test(A.dec(msg, msk.toString(16), uid+"|"+s2, "hex")));
// 7) 配对条目
const AP=ALGOS.find(x=>x.id==='sm9-pairing');
ck("sm9-pairing 已注册", !!AP);
const qh = sm9G2ToHex(SM9_G2);
ck("G2 hex 长度 256", qh.length===256);
const po = AP.enc(new Uint8Array(0), qh, "", "hex");
ck("配对输出 384 字节", hexToBytes(po).length===384);
console.log("SM9 界面与双线性: 通过 "+pass+" / 失败 "+fail);
