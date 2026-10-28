const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const V=JSON.parse(fs.readFileSync("testvectors/zuc_official.json","utf8"));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<5)console.log("  ✗ "+n);}};
const a=ALGOS.find(x=>x.id==='zuc');
ck("zuc 已注册", !!a);
// 1) 原始密钥流 vs 24 组（gmalg × C++ 双来源已一致的）向量
for(const t of V){
  const ks=zucKeystream(hexToBytes(t.key), hexToBytes(t.iv), 8);
  ck("密钥流 key="+t.key.slice(0,8), bytesToHex(ks)===t.out);
}
// 2) 官方向量：全零 key/IV 首字 = 27bede74
const z0=zucKeystream(new Uint8Array(16), new Uint8Array(16), 1);
ck("全零向量首字 27bede74", bytesToHex(z0)==="27bede74");
// 2b) GM/T 0001.1-2012 附录 C 的两组计算实例（国家密码管理局标准原文）
//     C.1: key=00×16 iv=00×16 -> z1=27bede74 z2=018082da
//     C.2: key=ff×16 iv=ff×16 -> z1=0657cfa0 z2=7096398b
const gmZ=(k,i)=>bytesToHex(zucKeystream(hexToBytes(k),hexToBytes(i),2));
ck("GM/T 附录C.1 z1z2", gmZ("00".repeat(16),"00".repeat(16))==="27bede74018082da");
ck("GM/T 附录C.2 z1z2", gmZ("ff".repeat(16),"ff".repeat(16))==="0657cfa07096398b");
// 2c) 附录 C 初始化首轮的中间值（t=0 的 X0 / R1 / R2，标准表逐位核对）
function gmTrace(keyhex,ivhex){
  const st=zucNew(hexToBytes(keyhex),hexToBytes(ivhex)),S=st.S;
  const X0=(((S[15]>>>15)<<16)|(S[14]&0xffff))>>>0;
  const X1=(((S[11]&0xffff)<<16)|(S[9]>>>15))>>>0;
  const X2=(((S[7]&0xffff)<<16)|(S[5]>>>15))>>>0;
  const W=zucF(st,X0,X1,X2)>>>0;
  return {X0:X0.toString(16),X1:X1.toString(16),X2:X2.toString(16),
          R1:st.R1.toString(16),R2:st.R2.toString(16),W:W.toString(16)};
}
const g1=gmTrace("00".repeat(16),"00".repeat(16));   // 标准: X0=008f9a00 X1=f100005e X2=af00006b R1=67822141 R2=62a3a55f
ck("GM/T C.1 首轮 X0", g1.X0==="8f9a00");
ck("GM/T C.1 首轮 X1", g1.X1==="f100005e");
ck("GM/T C.1 首轮 X2", g1.X2==="af00006b");
ck("GM/T C.1 首轮 R1", g1.R1==="67822141");
ck("GM/T C.1 首轮 R2", g1.R2==="62a3a55f");
const g2=gmTrace("ff".repeat(16),"ff".repeat(16));   // 标准: X0=ff8f9aff R1=b51c2110 R2=30a3629a
ck("GM/T C.2 首轮 X0", g2.X0==="ff8f9aff");
ck("GM/T C.2 首轮 R1", g2.R1==="b51c2110");
ck("GM/T C.2 首轮 R2", g2.R2==="30a3629a");
// 3) enc/dec 往返
const msgs=[new Uint8Array(0), strToBytes("a"), strToBytes("hello world"), strToBytes("中文测试"), crypto.getRandomValues(new Uint8Array(300))];
for(const m of msgs){
  const key="000102030405060708090a0b0c0d0e0f", iv="101112131415161718191a1b1c1d1e1f";
  const ct=a.enc(m, key, iv, "hex");
  const pt=a.dec(hexToBytes(ct), key, "", "hex");
  const pth=(pt instanceof Uint8Array||Array.isArray(pt))?bytesToHex(pt):String(pt);
  ck("往返 长度"+m.length, pth===bytesToHex(m));   /* dec 现按 fmt 输出（hex），与 enc 对称 */
}
// 4) IV 自动生成：两次加密同一明文结果不同
const c1=a.enc(strToBytes("same"),"000102030405060708090a0b0c0d0e0f","","hex");
const c2=a.enc(strToBytes("same"),"000102030405060708090a0b0c0d0e0f","","hex");
ck("IV 随机（两次不同）", c1!==c2);
ck("含 IV 前缀长度正确", hexToBytes(c1).length===16+4);
// 5) 自动 IV 也能解密
{ const _pt=a.dec(hexToBytes(c1),"000102030405060708090a0b0c0d0e0f","","hex");
  const _h=(_pt instanceof Uint8Array||Array.isArray(_pt))?bytesToHex(_pt):String(_pt);
  ck("自动IV可解密", _h===bytesToHex(strToBytes("same"))); }
// 6) 密钥/IV 长度校验
let t1=false,t2=false;
try{ a.enc(strToBytes("x"),"0001","","hex"); }catch(e){ t1=/16 字节/.test(e.message); }
try{ a.enc(strToBytes("x"),"00".repeat(16),"0001","hex"); }catch(e){ t2=/IV/.test(e.message); }
ck("密钥长度校验", t1); ck("IV长度校验", t2);
console.log("ZUC-128: 通过 "+pass+" / 失败 "+fail);
