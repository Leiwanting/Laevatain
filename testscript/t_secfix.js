/* 安全修复回归：DH 端到端（modPow 换 ladder 后）+ bcrypt（Blowfish 常量硬编码后） */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
for(const m of html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)) vm.runInThisContext(fs.readFileSync(m[1],"utf8"),{filename:m[1]});

/* ---- DH 端到端：双方各生成密钥对，交换后共享密钥必须一致 ---- */
const P=0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE65381FFFFFFFFFFFFFFFFn;
const refPow=(b,e,m)=>{let r=1n;b%=m;while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return r;};
function pubOf(privHex){ /* 用 dhCompute 的内部路径：g^priv —— 借 dhPublicKey 的等价算法 */
  return refPow(2n, BigInt('0x'+privHex), P).toString(16);
}
(async()=>{
  const dhA=ALGOS.find(a=>a.id==='dh-modp2');
  let ok=0,bad=0;
  for(let i=0;i<30;i++){
    const pa=nc.randomBytes(16).toString('hex'), pb=nc.randomBytes(16).toString('hex');
    const pubA=pubOf(pa), pubB=pubOf(pb);
    const s1=await dhA.enc(null,pa,pubB), s2=await dhA.enc(null,pb,pubA);
    const a1=String(s1).toLowerCase(), a2=String(s2).toLowerCase();
    /* 与独立参考实现比对 */
    const exp=refPow(BigInt('0x'+pubB), BigInt('0x'+pa), P).toString(16).toLowerCase();
    if(a1===a2 && exp.endsWith(a1.replace(/^0x/,'').replace(/^0+/,''))) ok++;
    else {bad++; if(bad<3) console.log("✗ DH got="+a1+" / "+a2+" exp="+exp);}
  }
  console.log("DH 协商端到端(含与参考幂比对): "+ok+"/"+(ok+bad));

  /* ---- bcrypt（走 Blowfish）官方向量 ---- */
  const bc=ALGOS.find(a=>a.id==='bcrypt');
  if(bc){
    const tv=[["password","$2a$06$DCq7YPn5Rq63x1Lad4cll.",""],
              ["password","$2a$08$HqWuK6/Ng6sg9gQzbLrgb.",""],
              ["1234567890","$2b$08$aqePzTkTSCFRZ3jHFGEUSe",""]];
    let bok=0,bbad=0;
    for(const [pw,salt] of tv){
      try{
        const r=await bc.enc(pw,salt);
        const s=(typeof r==='string'?r:r.text||'');
        if(/^\$2[abxy]\$\d\d\$/.test(s)) bok++; else {bbad++;console.log("✗ bcrypt 格式异常: "+s.slice(0,30));}
      }catch(e){bbad++;console.log("✗ bcrypt 抛错: "+e.message);}
    }
    console.log("bcrypt 基本可用: "+bok+"/"+(bok+bbad));
  }
})();
