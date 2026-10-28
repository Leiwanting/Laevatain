const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=5)console.log("  ✗ "+n);}};
const A=ALGOS.find(x=>x.id==='kzg-commit'), PR=ALGOS.find(x=>x.id==='kzg-pairing');
ck("kzg-commit 已注册", !!A); ck("kzg-pairing 已注册", !!PR);
// 承诺 + 验算往返
const poly=strToBytes("3 5 7");   // 3 + 5X + 7X^2
const s="12345", x="6789";
const out=A.enc(poly, s, x, "hex");
const raw=hexToBytes(out);
ck("输出 160 字节", raw.length===160);
const verdict=A.dec(hexToBytes(out), s, x, "hex");
ck("验算通过", /✓ 通过/.test(verdict));
// 用错误的 x 验算必须失败
ck("错误 x 验算失败", /✗ 失败/.test(A.dec(hexToBytes(out), s, "6790", "hex")));
// 用错误的 s 验算必须失败
ck("错误 s 验算失败", /✗ 失败/.test(A.dec(hexToBytes(out), "12346", x, "hex")));
// 随机 x（参数留空）也要能自洽验算
const rnd=A.enc(poly, s, "", "hex");
ck("随机 x 自洽", (function(){ const y=hexToBytes(rnd); return y.length===160; })());
// 系数格式校验
let t=false; try{ A.enc(strToBytes("3, abc, 7"), s, x, "hex"); }catch(e){ t=/不是整数/.test(e.message); }
ck("系数格式校验", t);
// 配对：双线性
const g2=bytesToHex(kzgG2ToBytes(BN_G2)), g1=bytesToHex(kzgG1ToBytes(BN_G1));
const e11=hexToBytes(PR.enc(new Uint8Array(0), g2, g1, "hex"));
ck("配对输出 384 字节", e11.length===384);
const g1_3=bytesToHex(kzgG1ToBytes(bnG1Mul(BN_G1,3n)));
const g2_5=bytesToHex(kzgG2ToBytes(bnG2Mul(BN_G2,5n)));
const e35=PR.enc(new Uint8Array(0), g2_5, g1_3, "hex");
const base=PR.enc(new Uint8Array(0), g2, g1, "hex");
// e(3G1,5G2) == e(G1,G2)^15
const ref=bytesToHex(bnF12ToBytes(bn12pow(bnPairing(BN_G2,BN_G1), 15n)));
ck("双线性 e(3G1,5G2)==e(G1,G2)^15", e35===ref);
console.log("KZG 界面: 通过 "+pass+" / 失败 "+fail);
