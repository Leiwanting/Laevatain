const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));

let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  X "+n);}};
const H=(s)=>BigInt(s);

/* ---- 1) expand_message_xmd 对官方 u（G1 / G2 各 5 组）---- */
function xmdSha256(msgHex, dstStr, lenBytes){
  const dst=Buffer.from(dstStr,"utf8");
  const bLen=32, ell=Math.ceil(lenBytes/bLen);
  const dstPrime=Buffer.concat([dst, Buffer.from([dst.length])]);
  const zpad=Buffer.alloc(64);
  const li=Buffer.alloc(2); li.writeUInt16BE(lenBytes);
  const mp=Buffer.concat([zpad, Buffer.from(msgHex,"utf8"), li, Buffer.from([0]), dstPrime]);
  const b0=nc.createHash("sha256").update(mp).digest();
  let out=Buffer.alloc(0), bPrev=Buffer.alloc(32);
  for(let i=1;i<=ell;i++){
    const inp = (i===1)? Buffer.concat([b0,Buffer.from([1]),dstPrime])
                       : Buffer.concat([Buffer.from(b0.map((v,j)=>v^bPrev[j])),Buffer.from([i]),dstPrime]);
    bPrev=nc.createHash("sha256").update(inp).digest();
    out=Buffer.concat([out,bPrev]);
  }
  return out.subarray(0,lenBytes);
}
const BE=b=>{let t=0n;for(const x of b)t=(t<<8n)|BigInt(x);return t%B377_P;};
/* G1: m=1，每个 u 是 1 个 FQ（64 字节）。G2: m=2，每个 u 是 1 个 FQ2（c0,c1 各 64 字节）。 */
for (const [fn, m] of [["BLS12377G1_XMD-SHA-256_SSWU_RO_.json",1],["BLS12377G2_XMD-SHA-256_SSWU_RO_.json",2]]){
  const d=JSON.parse(fs.readFileSync("testvectors/"+fn,"utf8"));
  const L=64, cnt=2;
  d.vectors.forEach((v,vi)=>{
    const e=xmdSha256(v.msg, d.dst, L*cnt*m);
    for(let k=0;k<cnt;k++){
      const base=k*L*m;
      if(m===1){
        ck(fn.slice(0,12)+" v"+vi+" u["+k+"]", BE(e.subarray(base,base+L))===H(v.u[k])%B377_P);
      }else{
        const a=v.u[k].split(",");
        ck(fn.slice(0,12)+" v"+vi+" u["+k+"].c0", BE(e.subarray(base,base+L))===H(a[0].trim())%B377_P);
        ck(fn.slice(0,12)+" v"+vi+" u["+k+"].c1", BE(e.subarray(base+L,base+2*L))===H(a[1].trim())%B377_P);
      }
    }
  });
}

/* ---- 2) 官方 Q0/Q1 在本实现的曲线上；P 落在 r 阶子群 ---- */
const g1=JSON.parse(fs.readFileSync("testvectors/BLS12377G1_XMD-SHA-256_SSWU_RO_.json","utf8"));
g1.vectors.forEach((v,vi)=>{
  const Q0=[H(v.Q0.x)%B377_P, H(v.Q0.y)%B377_P];
  const Q1=[H(v.Q1.x)%B377_P, H(v.Q1.y)%B377_P];
  const P =[H(v.P.x)%B377_P,  H(v.P.y)%B377_P];
  ck("G1 v"+vi+" Q0 在曲线上", b3g1IsOn(Q0));
  ck("G1 v"+vi+" Q1 在曲线上", b3g1IsOn(Q1));
  ck("G1 v"+vi+" P 在曲线上",  b3g1IsOn(P));
  ck("G1 v"+vi+" P 在 r 阶子群 (r*P=O)", b3g1Mul(P,B377_R)===null);
});
const g2=JSON.parse(fs.readFileSync("testvectors/BLS12377G2_XMD-SHA-256_SSWU_RO_.json","utf8"));
g2.vectors.forEach((v,vi)=>{
  /* G2 坐标在 JSON 里的两种写法都兼容："c0,c1" 字符串 / {c0,c1} 对象 */
  const rd=v=>{ if(typeof v==="string"&&v.includes(",")){const a=v.split(",");return [H(a[0].trim())%B377_P,H(a[1].trim())%B377_P];}
                return [H(v.c0)%B377_P,H(v.c1)%B377_P]; };
  const pt=o=>[rd(o.x),rd(o.y)];
  const Q0=pt(v.Q0), Q1=pt(v.Q1), P=pt(v.P);
  ck("G2 v"+vi+" Q0 在曲线上", b3g2IsOn(Q0));
  ck("G2 v"+vi+" Q1 在曲线上", b3g2IsOn(Q1));
  ck("G2 v"+vi+" P 在曲线上",  b3g2IsOn(P));
  ck("G2 v"+vi+" P 在 r 阶子群 (r*P=O)", b3g2Mul(P,B377_R)===null);
});

/* ---- 3) 配对性质（与官方 G1/G2 点联动）---- */
const P1=[H(g1.vectors[0].P.x)%B377_P,H(g1.vectors[0].P.y)%B377_P];
const _rd=v=>{const a=v.split(",");return [H(a[0].trim())%B377_P,H(a[1].trim())%B377_P];};
const Q2=[_rd(g2.vectors[0].P.x),_rd(g2.vectors[0].P.y)];
const e1=b3Pairing(Q2,P1);
ck("官方点配对非平凡", !b3f12eq(e1,b3f12one()));
ck("官方点配对 e^r=1", b3f12eq(b3f12pow(e1,B377_R),b3f12one()));
ck("官方点双线性 e(2P,3Q)", b3f12eq(b3Pairing(b3g2Mul(Q2,3n),b3g1Mul(P1,2n)), b3f12pow(e1,6n)));
console.log("BLS12-377 官方向量: 通过 "+pass+" / 失败 "+fail);
