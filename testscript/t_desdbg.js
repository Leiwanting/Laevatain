const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const R = 0x12345678 >>> 0;
const bits = desBits32(R);
const x = permuteBits(bits, DES_E);
const want=[];
for(let j=0;j<8;j++){ let g=0; for(let t=0;t<6;t++) g=(g<<1)|x[j*6+t]; want.push(g); }
const got=[
  (((R>>>27)&0x1f) | ((R&1)<<5)),
  (R>>>23)&0x3f, (R>>>19)&0x3f, (R>>>15)&0x3f,
  (R>>>11)&0x3f, (R>>>7)&0x3f, (R>>>3)&0x3f,
  (((R>>>1)&0x0f)<<2)|((R&1)<<1)|((R>>>31)&1))
];
console.log("R = "+R.toString(16));
for(let j=0;j<8;j++) console.log("  组"+j+"  期望 "+want[j].toString(2).padStart(6,'0')+" ("+want[j]+")   我的 "+got[j].toString(2).padStart(6,'0')+" ("+got[j]+")  "+(want[j]===got[j]?"✓":"✗"));

// 再验 SP 表：慢速一轮 vs 快速一轮
const k=new Uint8Array(8); for(let i=0;i<8;i++)k[i]=i*17+3;
const skFast=desSubkeysFast(k);
const skSlow=desSubkeys(k);
// 慢速 F
const fSlowBits = desFeistel(bits, skSlow[0]);
const fSlow = desWord32(fSlowBits);
// 快速 F (子密钥全 0 对比：先把 k 置零)
const zero=new Uint8Array(128);
const fFast0 = desF32(R, zero, 0);
// 慢速 F 子密钥置零
const zeroSlow=[]; for(let i=0;i<16;i++) zeroSlow.push(new Array(48).fill(0));
const fSlow0 = desWord32(desFeistel(bits, zeroSlow[0]));
console.log("\nF 函数（子密钥全 0）:");
console.log("  慢速 = "+fSlow0.toString(16).padStart(8,'0'));
console.log("  快速 = "+fFast0.toString(16).padStart(8,'0'));
console.log("  " + (fSlow0===fFast0 ? "✓ 一致" : "✗ 不一致 —— SP 表或取位有问题"));
