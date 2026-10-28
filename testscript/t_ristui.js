const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=5)console.log("  ✗ "+n);}};
const H=h=>hexToBytes(h);
const A=ALGOS.find(x=>x.id==='ristretto255'), DH=ALGOS.find(x=>x.id==='ristretto255-dh');
ck("ristretto255 已注册", !!A); ck("ristretto255-dh 已注册", !!DH);
// 标量乘：k=1 应等于 B[1]
const B1="e2f2ae0a6abc4e71a884a961c500515f58e30b6aa582dd8db6a65945e08d2d76";
ck("标量 k=1 -> B[1]", A.enc(new Uint8Array(0), "01", "", "hex")===B1);
// 口令派生确定性
ck("口令派生确定性", A.enc(new Uint8Array(0), "pass", "", "hex")===A.enc(new Uint8Array(0), "pass", "", "hex"));
ck("不同口令不同结果", A.enc(new Uint8Array(0), "pass1", "", "hex")!==A.enc(new Uint8Array(0), "pass2", "", "hex"));
// 点加法
const P7=A.enc(new Uint8Array(0), "07", "", "hex"), P11=A.enc(new Uint8Array(0), "0b", "", "hex");
ck("点加法 7+11 == 18", A.enc(new Uint8Array(0), "07", P11, "hex")===A.enc(new Uint8Array(0), "12", "", "hex"));
ck("点加法交换律", A.enc(new Uint8Array(0), "07", P11, "hex")===A.enc(new Uint8Array(0), "0b", P7, "hex"));
// 校验分支
const ok=A.dec(H(B1), "", "", "hex");
ck("合法点校验通过", /合法且规范/.test(ok));
let t=false; try{ A.dec(H("01".repeat(32)), "", "", "hex"); }catch(e){ t=true; }
ck("非法点被拒", t);
// DH 双方一致
const a="aaaa", b="bbbb";
const pubA=A.enc(new Uint8Array(0), a, "", "hex"), pubB=A.enc(new Uint8Array(0), b, "", "hex");
ck("DH 双方一致", DH.enc(new Uint8Array(0), a, pubB, "hex")===DH.enc(new Uint8Array(0), b, pubA, "hex"));
ck("DH 输出 32 字节", H(DH.enc(new Uint8Array(0), a, pubB, "hex")).length===32);
let t2=false; try{ DH.enc(new Uint8Array(0), a, "", "hex"); }catch(e){ t2=/对方公钥/.test(e.message); }
ck("DH 缺对方公钥报错", t2);
console.log("Ristretto255 界面: 通过 "+pass+" / 失败 "+fail);
