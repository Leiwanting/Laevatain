const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=5)console.log("  ✗ "+n);}};
const A=ALGOS.find(x=>x.id==='sm2-keyxchg');
ck("sm2-keyxchg 已注册", !!A);
const C=SM2KX_C, G={x:C.gx,y:C.gy};
const h=b=>bytesToHex(b);
const dA=BigInt("0x"+ "11".repeat(32))%(C.n-1n)+1n, dB=BigInt("0x"+"22".repeat(32))%(C.n-1n)+1n;
const rA=BigInt("0x"+"33".repeat(32))%(C.n-1n)+1n, rB=BigInt("0x"+"44".repeat(32))%(C.n-1n)+1n;
const pkA=C.mul(dA,G), pkB=C.mul(dB,G), RA=C.mul(rA,G), RB=C.mul(rB,G);
const pkAh=h(concatBytes(sm2kxToBytes(pkA.x,32),sm2kxToBytes(pkA.y,32)));
const pkBh=h(concatBytes(sm2kxToBytes(pkB.x,32),sm2kxToBytes(pkB.y,32)));
const RAh=h(concatBytes(sm2kxToBytes(RA.x,32),sm2kxToBytes(RA.y,32)));
const RBh=h(concatBytes(sm2kxToBytes(RB.x,32),sm2kxToBytes(RB.y,32)));
const pA=[dA.toString(16).padStart(64,"0"), rA.toString(16).padStart(64,"0"), pkBh, RBh, "Bob", "A"].join("|");
const pB=[dB.toString(16).padStart(64,"0"), rB.toString(16).padStart(64,"0"), pkAh, RAh, "Alice", "B"].join("|");
const kA=A.enc(new Uint8Array(0), "Alice", pA, "hex");
const kB=A.enc(new Uint8Array(0), "Bob", pB, "hex");
ck("双方协商结果一致", kA===kB);
ck("输出 32 字节", hexToBytes(kA).length===32);
// 与底层函数直接算的一致
const zA=sm2kxZ(pkA,"Alice"), zB=sm2kxZ(pkB,"Bob");
const direct=bytesToHex(sm2kxInitiator(dA,rA,RA,pkB,RB,zA,zB,32).key);
ck("与底层实现一致", kA===direct);
// 校验分支
let t1=false; try{ A.enc(new Uint8Array(0),"Alice","bad|params","hex"); }catch(e){ t1=/参数格式/.test(e.message); }
ck("参数格式校验", t1);
let t2=false; try{ A.enc(new Uint8Array(0),"Alice",["00".repeat(32),"01".repeat(32),pkBh,RBh,"Bob","A"].join("|"),"hex"); }catch(e){ t2=/范围/.test(e.message); }
ck("私钥范围校验", t2);
let t3=false; try{ A.enc(new Uint8Array(0),"Alice",[dA.toString(16).padStart(64,"0"),rA.toString(16).padStart(64,"0"),pkBh,RBh,"Bob","C"].join("|"),"hex"); }catch(e){ t3=/角色/.test(e.message); }
ck("角色校验", t3);
console.log("SM2 密钥协商界面: 通过 "+pass+" / 失败 "+fail);
