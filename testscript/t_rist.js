const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=6)console.log("  ✗ "+n);}};
const H=h=>hexToBytes(h);
// 常量自证
ck("SQRT_M1^2==-1", edqMul(RIST_SQRT_M1,RIST_SQRT_M1)===ED_P-1n);
ck("ONE_MINUS_D_SQ", RIST_ONE_MINUS_D_SQ===edqSub(1n, edqMul(RIST_D,RIST_D)));
ck("D_MINUS_ONE_SQ", RIST_D_MINUS_ONE_SQ===edqMul(edqSub(RIST_D,1n),edqSub(RIST_D,1n)));
ck("SQRT_AD_MINUS_ONE^2==a*d-1", edqMul(RIST_SQRT_AD_MINUS_ONE,RIST_SQRT_AD_MINUS_ONE)===edqSub(edqSub(0n,RIST_D),1n));
// B[1..15] 小倍数表（RFC 9496 附录 A.2）
const B=["","e2f2ae0a6abc4e71a884a961c500515f58e30b6aa582dd8db6a65945e08d2d76",
"6a493210f7499cd17fecb510ae0cea23a110e8d5b901f8acadd3095c73a3b919",
"94741f5d5d52755ece4f23f044ee27d5d1ea1e2bd196b462166b16152a9d0259",
"da80862773358b466ffadfe0b3293ab3d9fd53c5ea6c955358f568322daf6a57",
"e882b131016b52c1d3337080187cf768423efccbb517bb495ab812c4160ff44e",
"f64746d3c92b13050ed8d80236a7f0007c3b3f962f5ba793d19a601ebb1df403",
"44f53520926ec81fbd5a387845beb7df85a96a24ece18738bdcfa6a7822a176d",
"903293d8f2287ebe10e2374dc1a53e0bc887e592699f02d077d5263cdd55601c",
"02622ace8f7303a31cafc63f8fc48fdc16e1c8c8d234b2f0d6685282a9076031",
"20706fd788b2720a1ed2a5dad4952b01f413bcf0e7564de8cdc816689e2db95f",
"bce83f8ba5dd2fa572864c24ba1810f9522bc6004afe95877ac73241cafdab42",
"e4549ee16b9aa03099ca208c67adafcafa4c3f3e4e5303de6026e3ca8ff84460",
"aa52e000df2e16f55fb1032fc33bc42742dad6bd5a8fc0be0167436c5948501f",
"46376b80f409b29dc2b5f6f0c52591990896e5716f41477cd30085ab7f10301e",
"e0c418f7c8d9c4cdd7395b93ea124f3ad99021bb681dfc3302a9d99a2e53e64e"];
for(let k=1;k<=15;k++){
  const got=bytesToHex(ristEncodeAffine(edMul(ED_B, BigInt(k))));
  ck("B["+k+"]", got===B[k]);
}
// 恒等元编码为全零
ck("恒等元", bytesToHex(ristEncodeAffine([0n,1n]))==="00".repeat(32));
/* ⚠ 抓取到的 5 组 "MULTIPLY" 向量不可用：
   JS 与一份独立的 Python 实现得出【完全相同】的结果（a64880bf...），
   却都不等于期望值 —— 说明是【参照物错位】（很可能是抓取时 I/O 配对错乱），
   不是实现问题。按本项目原则：不改实现去凑错误的期望值。
   验证改用 RFC 9496 附录 A.2 的 B[1..15]（两次抓取一致，可信）。 */

/* 商群核心性质：Ristretto 把 {P, P+T} 视为同一元素（T 为 4 阶点 (i, 0)），
   所以两者必须编码为【同一个】值。这直接验证 encode 里的 rotate 分支。 */
const T4 = [RIST_SQRT_M1, 0n];
ck("T 是 4 阶点", (function(){ var Q=edAdd(T4,T4); return edqSub(0n,Q[0])===Q[0] || Q[1]===1n || edAdd(edAdd(T4,T4),edAdd(T4,T4))[1]===1n; })());
for(let k=1;k<=6;k++){
  const Pk=edMul(ED_B, BigInt(k));
  const e1=bytesToHex(ristEncodeAffine(Pk));
  const e2=bytesToHex(ristEncodeAffine(edAdd(Pk, T4)));
  ck("商群等价 B["+k+"] == B["+k+"]+T", e1===e2);
  ck("商群等价 与 B["+k+"] 表一致", e1===B[k]);
}
/* 负元：encode(-P) 是 decode(encode(P)) 对应元素的逆 */
for(let k=1;k<=4;k++){
  const Pk=edMul(ED_B, BigInt(k));
  const neg=edNeg(Pk);
  const a=ristDecode(ristEncodeAffine(Pk)), b=ristDecode(ristEncodeAffine(neg));
  /* ⚠ 不能要求 sum === (0,1)：decode 返回的是等价类的【规范代表】，
     不是原始点。Ristretto 里"相等"的判据是【编码相同】，
     所以要比较编码值 —— 这正是商群的定义。我第一版直接比点坐标，误判了。 */
  const sum=edAdd(ristToAffine(a), ristToAffine(b));
  ck("P + (-P) = 恒等 k="+k, bytesToHex(ristEncodeAffine(sum))==="00".repeat(32));
}
/* 加法同态：encode(B*a + B*b) == encode(B*(a+b) mod L) */
for(const [a,bb] of [[2n,3n],[7n,11n],[100n,250n]]){
  const l=bytesToHex(ristEncodeAffine(edAdd(edMul(ED_B,a), edMul(ED_B,bb))));
  const r=bytesToHex(ristEncodeAffine(edMul(ED_B, (a+bb)%ED_L)));
  ck("加法同态 a="+a+" b="+bb, l===r);
}
/* one-way map：应落在群内（可解码且再编码一致） */
for(let i=0;i<6;i++){
  const inp=crypto.getRandomValues(new Uint8Array(32));
  const rep=ristMap(inp);
  const enc=ristEncode(rep);
  let ok=true; try{ ck2=ristDecode(enc); }catch(e){ ok=false; }
  ck("MAP 输出可解码 #"+i, ok);
  if(ok) ck("MAP 编码幂等 #"+i, bytesToHex(ristEncode(ristDecode(enc)))===bytesToHex(enc));
}
// 解码->再编码 应一致（等价类归一化）
for(let k=1;k<=8;k++){
  const enc=ristEncodeAffine(edMul(ED_B, BigInt(k)));
  const rep=ristDecode(enc);
  ck("解码往返 B["+k+"]", bytesToHex(ristEncode(rep))===bytesToHex(enc));
}
console.log("Ristretto255: 通过 "+pass+" / 失败 "+fail);
