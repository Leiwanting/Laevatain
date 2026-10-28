const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const V=JSON.parse(fs.readFileSync("_vec_edctx.json","utf8"));
const H=h=>hexToBytes(h);
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=4)console.log("  ✗ "+n);}};
for(const t of V.ctx){
  const sk=H(t.sk), pk=H(t.pk), ctx=H(t.ctx), msg=H(t.msg);
  ck("ctx 公钥", bytesToHex(ed25519PubFromSk(sk))===t.pk);
  ck("ctx 签名", bytesToHex(ed25519SignCore(msg, sk, ctx, "ctx"))===t.sig);
  ck("ctx 验签", ed25519VerifyCore(msg, H(t.sig), pk, ctx, "ctx")===true);
  ck("ctx 篡改被拒", ed25519VerifyCore(strToBytes("z"+t.msg), H(t.sig), pk, ctx, "ctx")===false);
  if(ctx.length){
    const other=new Uint8Array(ctx.length); other[0]=ctx[0]^1;
    ck("ctx 换上下文被拒", ed25519VerifyCore(msg, H(t.sig), pk, other, "ctx")===false);
  }
}
console.log("Ed25519ctx（独立 Python 实现交叉）: 通过 "+pass+" / 失败 "+fail);
