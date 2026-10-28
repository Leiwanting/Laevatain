/* AES-XTS 回归：整块 + 密文窃取(CTS)，全部对 OpenSSL（Python cryptography 50.0.1） */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
[...fs.readFileSync("index.html","utf8").matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
let ok=0,bad=0;
function T(n,g,w){ if(g===w) ok++; else {bad++; console.log("✗ "+n+"\n  期望 "+w+"\n  实得 "+g);} }
const a128=ALGOS.find(x=>x.id==='aes-xts-128'), a256=ALGOS.find(x=>x.id==='aes-xts-256');
const k128="000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const k256=k128+"202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f";
const pt32="000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const pt64=pt32+"202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f";
/* OpenSSL 交叉向量（整块） */
T("128/32B/tw0", a128.enc(hexToBytes(pt32),k128,"0","hex"), "74a109aabf1937c022d19da4b96cbc40b8ddc9c0653a7fb0dc8425c7ef276dea");
T("256/32B/tw0", a256.enc(hexToBytes(pt32),k256,"0","hex"), "dc8c665b97cbc0246d4f1639a9678a3e2a2dcf4a3fbf1342ebbb771234f1a1c3");
T("128/64B/tw1", a128.enc(hexToBytes(pt64),k128,"1","hex"), "17913bf4f31362fa9006c28e815e22378625315641e4d199320895768226ff450820795d88bda967cd8bc347dc51e11fb14b9207b2ad6a5ac43b25a94b9666ca");
T("128 往返", bytesToHex(a128.dec("74a109aabf1937c022d19da4b96cbc40b8ddc9c0653a7fb0dc8425c7ef276dea",k128,"0","hex")), pt32);
/* 同明文不同扇区必须不同密文（XTS 防水印攻击的核心性质） */
const same=a128.enc(hexToBytes(pt32),k128,"0","hex"), other=a128.enc(hexToBytes(pt32),k128,"1","hex");
T("不同扇区密文不同", same!==other, true);
/* CTS：非 16 倍数长度 */
/* CTS 参照值：OpenSSL（Python cryptography）实取，非16倍数长度。
   此前依赖 /tmp/xts_cts.txt，该文件不存在时 CTS 循环为空——等于没交叉验证，只有往返自洽。 */
const CTS_REF=[
  "17 0 5aca41bb794a6510f2dcf5ffb55c92e3e9",
  "17 1 dad82433e19e0d7b1994a4abbd81fb1900",
  "24 0 5b524f31fc8e73819979cc44fad3f9a6e9e4c0294045c8e6",
  "24 1 7a2120076cff9a64e8369f0572de43f000b2a035f9a725bb",
  "31 0 05a1e907703ad318ce7b5a61ab3a3293e9e4c0294045c8e699038ed38c1492",
  "31 1 6bd8dcebe21b7fca281fa0b0006708b900b2a035f9a725bba988ac28607d0a",
  "33 0 e9e4c0294045c8e699038ed38c1492e8312f12e32341a14039ed747e40343f8a81",
  "33 1 00b2a035f9a725bba988ac28607d0a5c069148b005079ebeb9d22cb0399e5ed1e4",
  "48 0 e9e4c0294045c8e699038ed38c1492e8816242a7bbee575625e05b31cff60941df04be102fb03464907ac2688094baa8",
  "48 1 00b2a035f9a725bba988ac28607d0a5ce403c28ce11befd0874addd4ba08a21345e8d2410da14e96983dcdd1486d95f9",
];
for(const L of CTS_REF){
  const [len,tw,ct]=L.split(" ");
  const pt=new Uint8Array(+len); for(let i=0;i<+len;i++) pt[i]=(i*7+3)&0xff;
  T("CTS "+len+"B/tw"+tw, a128.enc(pt,k128,tw,"hex"), ct);
  T("CTS 往返 "+len+"B/tw"+tw, bytesToHex(a128.dec(ct,k128,tw,"hex")), bytesToHex(pt));
}
/* 长度保护 */
let threw=false; try{ a128.enc(new Uint8Array(5),k128,"0","hex"); }catch(e){ threw=true; }
T("不足16字节被拒", threw, true);
console.log("XTS 测试: 通过 "+ok+"  失败 "+bad);
