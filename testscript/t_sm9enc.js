const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;global.TextDecoder=require("util").TextDecoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n);}};
const V=JSON.parse(fs.readFileSync("testvectors/sm9enc_gmalg.json","utf8"));
const hex2b=h=>Uint8Array.from(h.match(/../g).map(x=>parseInt(x,16)));
const msk=BigInt("0x"+V.msk_e);
const uidB=new TextEncoder().encode("Bob"), uidA=new TextEncoder().encode("Alice");
const HID=new Uint8Array([0x03]);

// 1. 主公钥
const mpk=sm9GenMpkEnc(msk);
ck("mpk_e 与 gmalg 一致", sm9G1ToHex(mpk)===V.mpk_e.slice(2));
// 2. 用户私钥（两个 UID）
ck("de(Bob) 与 gmalg 一致", sm9G2ToHex(sm9GenSkEnc(HID,msk,uidB))===V.sk_bob.slice(2));
ck("de(Alice) 与 gmalg 一致", sm9G2ToHex(sm9GenSkEnc(HID,msk,uidA))===V.sk_alice.slice(2));
// DEBUG
{
  const mine=sm9GenSkEnc(HID,msk,uidB);
  const g=hex2b(V.sk_bob.slice(2));
  const gb=[];for(let i=0;i<4;i++){let x=0n;for(let j=0;j<32;j++)x=(x<<8n)|BigInt(g[i*32+j]);gb.push(x.toString(16));}
  const mb=[mine[0][0],mine[0][1],mine[1][0],mine[1][1]].map(x=>x.toString(16));
  console.log("gmalg de:",gb.map(x=>x.slice(-8)).join(" "));
  console.log("mine  de:",mb.map(x=>x.slice(-8)).join(" "));
  const t1=sm9ModN(sm9H1(concatBytes(uidB,HID))+msk);
  console.log("t1=",t1.toString(16));
  console.log("H1=",sm9H1(concatBytes(uidB,HID)).toString(16));
}
// 3~6. 官方向量：封装（用 gmalg 的 r）、解封装、DEM
const skB=sm9GenSkEnc(HID,msk,uidB), skA=sm9GenSkEnc(HID,msk,uidA);
for(let i=0;i<V.vecs.length;i++){
  const v=V.vecs[i]; const uid=new TextEncoder().encode(v.uid);
  const sk = v.uid==="Bob"?skB:skA;
  const r=BigInt(v.r);
  const kem=sm9KemEnc(mpk,uid,HID,r,v.klen);
  ck("vec"+i+" 封装 C1 一致","04"+sm9G1ToHex(kem.C)===v.C);
  ck("vec"+i+" 封装 K 一致", Buffer.from(kem.K).toString("hex")===v.K);
  const K2=sm9KemDec(sm9ParseG1Hex(v.C),sk,uid,v.klen);
  ck("vec"+i+" 解封装 K 一致", Buffer.from(K2).toString("hex")===v.K_dec);
  ck("vec"+i+" gmalg 自身 K==K_dec", v.K===v.K_dec);
  const pt=hex2b(v.pt);
  const enc=sm9EncryptBytes(mpk,uid,HID,BigInt(v.r_dem),pt);
  ck("vec"+i+" DEM 密文一致", Buffer.from(enc.ct).toString("hex")===v.ct);
  ck("vec"+i+" DEM 解密一致", Buffer.from(sm9DecryptBytes(hex2b(v.ct),sk,uid)).toString("hex")===v.pt);
}
// 7. 往返 + 篡改
for(let L=1;L<=64;L*=2){
  const pt=nc.randomBytes(L), r=sm9RandN();
  const ct=sm9EncryptBytes(mpk,uidB,HID,r,pt).ct;
  ck("往返 L="+L, Buffer.from(sm9DecryptBytes(ct,skB,uidB)).toString("hex")===pt.toString("hex"));
  const bad=ct.slice(); bad[bad.length-1]^=1;
  let threw=false; try{sm9DecryptBytes(bad,skB,uidB);}catch(e){threw=true;}
  ck("篡改必失败 L="+L, threw);
}
// 8. 错误私钥 / 错误标识
{
  const pt=nc.randomBytes(16), ct=sm9EncryptBytes(mpk,uidB,HID,sm9RandN(),pt).ct;
  let threw=false; try{sm9DecryptBytes(ct,skA,uidB);}catch(e){threw=true;}
  ck("用他人私钥必失败", threw);
  let threw2=false; try{sm9DecryptBytes(ct,skB,uidA);}catch(e){threw2=true;}
  ck("用错误标识必失败", threw2);
}
// 9. 入口可达
const find=id=>ALGOS.find(a=>a.id===id);
["sm9-keygen-enc","sm9-kem","sm9-enc"].forEach(id=>{ck("注册 "+id, !!find(id));});
{
  const a=find("sm9-keygen-enc");
  const out=a.enc(new Uint8Array(0), V.msk_e, "Bob", "text");
  ck("keygen 输出 msk", out.includes(V.msk_e));
  ck("keygen 输出 de", out.includes(V.sk_bob.slice(2)));
}
{
  const a=find("sm9-kem");
  const o1=a.enc(new Uint8Array(0), V.mpk_e, "Bob", "text");
  const C1=o1.split("C1 = ")[1].trim();
  const o2=a.dec(new Uint8Array(0), V.sk_bob, "Bob:"+C1, "text");
  ck("kem 入口往返一致", o1.split("\n")[0]===o2.trim());
}
{
  const a=find("sm9-enc");
  const ct=a.enc(new TextEncoder().encode("hi sm9"), V.mpk_e, "Bob", "hex");
  const back=a.dec(hex2b(ct), V.sk_bob, "Bob", "hex");
  ck("enc 入口往返", Buffer.from(hex2b(back)).toString()==="hi sm9");
}
console.log("SM9 标识加密: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
