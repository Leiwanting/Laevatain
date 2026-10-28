const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e].type||[]).forEach&&0;(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
let nload=0,nfail=0;
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});nload++;}catch(e){nfail++;console.log("FAIL "+f+": "+e.message.slice(0,80));}});
console.log("scripts loaded="+nload+" fail="+nfail);
const H=h=>hexToBytes(h.replace(/\s/g,""));
const X=b=>bytesToHex(b);
let P=0,F=0;const ck=(n,c,extra)=>{if(c)P++;else{F++;console.log("  ✗ "+n+(extra?("  ["+extra+"]"):""));}};
function hexw(a){return a.map(v=>(v>>>0).toString(16).padStart(8,"0")).join("");}

console.log("\n=== SM3 GM/T 0004-2012 ===");
// 附录A.1: 'abc'
{
  const got=X(sm3Digest(H("616263")));
  const exp="66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0";
  ck("SM3('abc') = 官方标准值", got===exp, "got="+got);
}
// 空消息（无官方值，但与 Node 无关；改用填充块结构自检）
{
  const got=X(sm3Digest(new Uint8Array(0)));
  console.log("  SM3('') = "+got+" (无官方值，仅记录)");
}
// 附录A.2 示例2：512 位消息 'abcdabcd...' 64 次
{
  const msg=Buffer.from("abcd".repeat(16),"ascii");
  const got=X(sm3Digest(new Uint8Array(msg)));
  const exp="debe9ff92275b8a138604889c18e5a4d6fdb70e5387e5765293dcba39c0c5732";
  ck("SM3('abcd'x16) = 官方标准值(附录A.2)", got===exp, "got="+got);
}

console.log("\n=== SM4 GM/T 0002-2012 ===");
// 附录A.1 示例1：轮密钥 rk[0..31] 与每轮状态 X[4..35]
{
  const key=H("0123456789abcdeffedcba9876543210");
  const pt =H("0123456789abcdeffedcba9876543210");
  const rk=sm4ExpandKey(key);
  const rkExp=["f12186f9","41662b61","5a6ab19a","7ba92077","367360f4","776a0c61","b6bb89b3","24763151",
    "a520307c","b7584dbd","c30753ed","7ee55b57","6988608c","30d895b7","44ba14af","104495a1",
    "d120b428","73b55fa3","cc874966","92244439","e89e641f","98ca015a","c7159060","99e1fd2e",
    "b79bd80c","1d2115b0","0e228aeb","f1780c81","428d3654","62293496","01cf72e5","9124a012"];
  let ok=0;for(let i=0;i<32;i++){const g=(rk[i]>>>0).toString(16).padStart(8,"0");if(g===rkExp[i])ok++;else console.log("    rk["+i+"] got="+g+" exp="+rkExp[i]);}
  ck("SM4 轮密钥 rk[0..31] 全 32 个与官方一致", ok===32, "ok="+ok+"/32");
  const ct=X(sm4EncBlock(pt,rk));
  ck("SM4 加密输出 = 681edf34d206965e86b3e94f536e4246", ct==="681edf34d206965e86b3e94f536e4246", "got="+ct);
  const back=X(sm4DecBlock(H("681edf34d206965e86b3e94f536e4246"),rk));
  ck("SM4 解密还原明文", back==="0123456789abcdeffedcba9876543210", "got="+back);
}
// 附录A.2 示例2：同一密钥反复加密 1,000,000 次
{
  const key=H("0123456789abcdeffedcba9876543210");
  let b=H("0123456789abcdeffedcba9876543210");
  const rk=sm4ExpandKey(key);
  for(let i=0;i<1000000;i++) b=sm4EncBlock(b,rk);
  const got=X(b);
  /* 期望值由独立 C 参照实现（gmsm/sm4ref.c，CK 由标准公式生成、S 盒抄自正文）裁定：
   标准 PDF 该行 OCR 吞掉了开头 595298 三段 */
  ck("SM4 迭代 1,000,000 次 = 595298c7c6fd271f0402f804c33d3f66", got==="595298c7c6fd271f0402f804c33d3f66", "got="+got);
}
console.log("\n合计 PASS="+P+"  FAIL="+F);
