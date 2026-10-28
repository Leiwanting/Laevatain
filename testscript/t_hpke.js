const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
(async()=>{
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n);}};
const a=ALGOS.find(x=>x.id==='hpke');
ck("hpke 已注册", !!a);
// 1) 往返：生成接收方密钥对，加密后解密
const recv=hpkeGen();
const msgs=[new Uint8Array(0), new Uint8Array([1]), strToBytes("hello"), strToBytes("中文测试"), crypto.getRandomValues(new Uint8Array(1000))];
for(const m of msgs){
  const ct=await a.enc(m, "", bytesToHex(recv.pk), "hex");
  const pt=await a.dec(H(ct), bytesToHex(recv.sk), "", "hex");
  ck("往返 长度"+m.length, bytesToHex(pt)===bytesToHex(m));
}
// 2) 错误私钥应认证失败
const wrong=hpkeGen();
const ct2=await a.enc(strToBytes("secret"), "", bytesToHex(recv.pk), "hex");
let threw=false;
try{ await a.dec(H(ct2), bytesToHex(wrong.sk), "", "hex"); }catch(e){ threw=/认证失败|失败/.test(e.message); }
ck("错误私钥被拒绝", threw);
// 3) 篡改密文应被拒绝
const d=H(ct2); const tampered=Uint8Array.from(d); tampered[tampered.length-1]^=0xff;
let threw2=false;
try{ await a.dec(tampered, bytesToHex(recv.sk), "", "hex"); }catch(e){ threw2=true; }
ck("篡改密文被拒绝", threw2);
// 4) 临时公钥随机：两次加密同一明文结果不同
const c1=await a.enc(strToBytes("same"), "", bytesToHex(recv.pk), "hex");
const c2=await a.enc(strToBytes("same"), "", bytesToHex(recv.pk), "hex");
ck("nonce/临时密钥随机", c1!==c2);
// 5) 长度结构
const c3=H(await a.enc(strToBytes("x"), "", bytesToHex(recv.pk), "hex"));
ck("结构=32+12+ct", c3.length===32+12+1+16);
console.log("HPKE: 通过 "+pass+" / 失败 "+fail);
})();
