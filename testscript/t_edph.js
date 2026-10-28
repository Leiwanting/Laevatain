const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const V=JSON.parse(fs.readFileSync("_vec_edph.json","utf8"));
const H=h=>hexToBytes(h);
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=4)console.log("  ✗ "+n);}};
for(const t of V.ph){
  const seed=H(t.seed), pk=H(t.pk), msg=H(t.msg), want=t.sig;
  ck("ph 公钥", bytesToHex(ed25519PubFromSk(seed))===t.pk);
  const got=bytesToHex(ed25519SignCore(msg, seed, new Uint8Array(0), "ph"));
  ck("ph 签名 "+t.msg.slice(0,8), got===want);
  ck("ph 验签", ed25519VerifyCore(msg, H(want), pk, new Uint8Array(0), "ph")===true);
  ck("ph 篡改被拒", ed25519VerifyCore(strToBytes("x"+t.msg), H(want), pk, new Uint8Array(0), "ph")===false);
}
console.log("Ed25519ph（libsodium 交叉）: 通过 "+pass+" / 失败 "+fail);
