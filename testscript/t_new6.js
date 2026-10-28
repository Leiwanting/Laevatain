const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");
global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};
global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n);}};
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
const V=JSON.parse(fs.readFileSync("_vec_new.json","utf8"));
// Salsa20 vs pycryptodome
let ok=0;
for(const t of V.salsa20){
  const got=salsa20Crypt(H(t.pt),H(t.key),H(t.nonce));
  if(bytesToHex(got)===t.ct) ok++;
}
ck("Salsa20 vs pycryptodome: "+ok+"/8", ok===8);
// 算法条目往返
const a=ALGOS.filter(x=>x.id==="salsa20")[0];
ck("salsa20 已注册", !!a);
if(a){
  const nonce=bytesToHex(H(V.salsa20[0].nonce));
  const ct=a.enc(H(V.salsa20[0].pt), V.salsa20[0].key, nonce, "hex");
  ck("salsa20 条目加密 == 参考密文(nonce+ct)", ct===nonce+V.salsa20[0].ct);
  const back=a.dec(H(ct), V.salsa20[0].key, nonce, "hex");
  ck("salsa20 往返", back===V.salsa20[0].pt);
}
// 输出格式往返
const data=H("000102030405060708090a0b0c0d0e0f");
for(const f of ["base45","z85"]){
  const enc=bytesOut(data,f);
  const dec=OUT_FORMATS[f].inFn(enc);
  ck(f+" 往返", bytesToHex(dec)===bytesToHex(data));
}
console.log("  base45 示例:", bytesOut(H("48656c6c6f"),"base45"));
console.log("  z85 示例:", bytesOut(H("0001020304050607"),"z85"));
console.log("  hexdump 首行:", bytesOut(H("48656c6c6f20776f726c6421"),"hexdump").split("\n")[0]);
console.log("  py:", bytesOut(H("00ff41"),"pyliteral"));
console.log("  go:", bytesOut(H("00ff41"),"goliteral"));
console.log("  rust:", bytesOut(H("00ff41"),"rustliteral"));
console.log("  uu 首行:", bytesOut(H("48656c6c6f"),"uuencode").split("\n")[1]);
console.log("新增功能: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
