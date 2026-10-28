const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
(async()=>{
if(typeof setKeyMode==='function') setKeyMode('raw');
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n);}};
// ECB 无填充多块，走 symEncrypt 框架路径
for(const [id,name,bf] of [['cast5','CAST5',cast5BlockFn],['rc2','RC2',k=>rc2BlockFn(k,1024)],['gost28147','GOST',gostBlockFn]]){
  const pt=H("000b16212c37424d58636e79848f9aa5");  // 16 字节 = 2 块
  const key=id==='gost28147'?H("00070e151c232a31383f464d545b626970777e858c939aa1a8afb6bdc4cbd2d9"):H("00070e151c232a31383f464d545b6269");
  const a=ALGOS.find(x=>x.id===id);
  ck(name+" 已注册且有 key", !!(a&&a.key));
  ck(name+" 有 makeBlockFn", !!(a&&a.makeBlockFn));
  const b=bf(key);
  const want=[...b.enc(pt.subarray(0,8)),...b.enc(pt.subarray(8,16))];
  try{
    const keyHex=(id==='gost28147')?"00070e151c232a31383f464d545b626970777e858c939aa1a8afb6bdc4cbd2d9":"00070e151c232a31383f464d545b6269";
    const r=await symEncrypt(a, pt, keyHex, 'ECB', 'None', null, false, '', null, 16);
    const got=Array.from(r.ciphertext || r);
    console.log("  "+name+" got  "+bytesToHex(Uint8Array.from(got)));
    console.log("  "+name+" want "+bytesToHex(Uint8Array.from(want)));
    ck(name+" 框架路径与直调一致", got.length===16 && got.every((v,i)=>v===want[i]));
  }catch(e){ ck(name+" 框架路径: "+e.message, false); }
}
// 密钥栏渲染检查
for(const id of ['cast5','rc2','gost28147','hctr2','aes-gcm-siv','ff3']){
  const a=ALGOS.find(x=>x.id===id);
  ck(id+" 密钥栏会显示", !!(a&&a.key));
}
console.log("框架路径: 通过 "+pass+" / 失败 "+fail);
})();
