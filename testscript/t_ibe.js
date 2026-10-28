/* Boneh-Franklin IBE 回归：H1 确定性 + 多身份 + 多长度 + 错误身份必乱码 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
[...fs.readFileSync("index.html","utf8").matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const g=id=>ALGOS.find(x=>x.id===id);
const setup=g('ibe-setup'), ex=g('ibe-extract'), enc=g('ibe-encrypt'), dec=g('ibe-decrypt');
let ok=0,bad=0;
function T(n,c){ if(c) ok++; else {bad++; console.log("✗ "+n);} }
const out=setup.enc(new Uint8Array(0),"","","hex");
const s=out.match(/: ([0-9a-f]{64})/)[1];
const Ppub=out.match(/Ppub（公开参数，128 字节 G2 点）: ([0-9a-f]+)/)[1];
/* 1. H1 确定性 */
const I=IBE;
const q1=I.hashToG1(strToBytes("alice@example.com"));
const q2=I.hashToG1(strToBytes("alice@example.com"));
T("H1 确定性", q1[0]===q2[0] && q1[1]===q2[1]);
T("H1 结果在曲线上", bnG1IsOn(q1));
T("H1 不同身份不同点", I.hashToG1(strToBytes("bob"))[0]!==q1[0]);
/* 2. Ppub = s·P2 */
T("Ppub 自证", bytesToHex(I.g2ToBytes(bnG2Mul(BN_G2, BigInt("0x"+s))))===Ppub);
/* 3. 多身份 × 多长度往返 */
const ids=["alice@example.com","bob","13800138000","张三"];
for(const id of ids){
  const d=ex.enc(null,s,id,"hex");
  for(const len of [1,16,32,100]){
    const m=new Uint8Array(len); crypto.getRandomValues(m);
    const ct=enc.enc(m,Ppub,id,"hex");
    const _r=dec.dec(ct,d,"","hex"); const pt=(_r instanceof Uint8Array||Array.isArray(_r))?_r:hexToBytes(_r);
    T("往返 id="+id+" len="+len, bytesToHex(pt)===bytesToHex(m));
  }
}
/* 4. 错误身份必须解出乱码（IBE 不报错，靠校验判断） */
{
  const dA=ex.enc(null,s,"alice","hex"), dB=ex.enc(null,s,"bob","hex");
  const m=new Uint8Array(32); for(let i=0;i<32;i++) m[i]=i;
  const ct=enc.enc(m,Ppub,"alice","hex");
  const _w=dec.dec(ct,dB,"","hex"); const wrong=(_w instanceof Uint8Array||Array.isArray(_w))?_w:hexToBytes(_w);
  T("错误身份解出乱码", bytesToHex(wrong)!==bytesToHex(m));
  const _g=dec.dec(ct,dA,"","hex"); const right=(_g instanceof Uint8Array||Array.isArray(_g))?_g:hexToBytes(_g);
  T("正确身份还原", bytesToHex(right)===bytesToHex(m));
}
/* 5. 空消息边界 */
{
  const d=ex.enc(null,s,"x","hex");
  const ct=enc.enc(new Uint8Array(0),Ppub,"x","hex");
  T("空消息密文=128字节", ct.length/2===128);
  T("空消息解密为空", hexToBytes(dec.dec(ct,d,"","hex")).length===0);
}
/* 6. 私钥长度校验 */
let threw=false; try{ ex.enc(null,"abcd","x","hex"); }catch(e){ threw=true; }
T("非法主私钥被拒", threw);
console.log("IBE 测试: 通过 "+ok+"  失败 "+bad);
