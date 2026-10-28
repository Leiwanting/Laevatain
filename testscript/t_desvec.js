const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
/* 公开的标准 DES 单块向量（FIPS 46-3 / 教科书通用） */
const V=[
 {k:"133457799bbcdff1",p:"0123456789abcdef",c:"85e813540f0ab405"},
 {k:"0000000000000000",p:"0000000000000000",c:"8ca64de9c1b123a7"},
 {k:"ffffffffffffffff",p:"ffffffffffffffff",c:"7359b2163e4edc58"},
 {k:"0123456789abcdef",p:"0123456789abcdef",c:"56cc09e7cfdc4cef"}
];
let ok=0,bad=0;
V.forEach(v=>{ const f=desMakeBlockFn(H(v.k)); const g=bytesToHex(f.enc(H(v.p)));
  const good = g===v.c; good?ok++:bad++;
  console.log((good?"  ✓ ":"  ✗ ")+v.k+" -> "+g+(good?"":"  期望 "+v.c)); });
console.log("官方 DES 向量: "+ok+" 通过 / "+bad+" 失败");
