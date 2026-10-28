const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));


let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  X "+n);}};
const hx=s=>BigInt(s);
const f2h=a=>a.map(x=>x.toString(16));

/* ---------- G1 ---------- */
{
  const d=JSON.parse(fs.readFileSync("testvectors/BLS12377G1_XMD-SHA-256_SSWU_RO_.json","utf8"));
  ck("G1 DST 一致", d.dst==="QUUX-V01-CS02-with-BLS12377G1_XMD:SHA-256_SSWU_RO_");
  ck("G1 Z == -11", d.Z === "0x"+(B377_P-11n).toString(16));
  d.vectors.forEach((v,vi)=>{
    const mb=new TextEncoder().encode(v.msg);
    const R=b377HashToCurveG1(mb, d.dst);
    ck(`G1[${vi}] u0`, R.u[0]===hx(v.u[0]));
    ck(`G1[${vi}] u1`, R.u[1]===hx(v.u[1]));
    ck(`G1[${vi}] Q0.x`, R.Q0[0]===hx(v.Q0.x));
    ck(`G1[${vi}] Q0.y`, R.Q0[1]===hx(v.Q0.y));
    ck(`G1[${vi}] Q1.x`, R.Q1[0]===hx(v.Q1.x));
    ck(`G1[${vi}] Q1.y`, R.Q1[1]===hx(v.Q1.y));
    ck(`G1[${vi}] P.x`, R.P && R.P[0]===hx(v.P.x));
    ck(`G1[${vi}] P.y`, R.P && R.P[1]===hx(v.P.y));
    ck(`G1[${vi}] P 在曲线上`, R.P && b3g1IsOn(R.P));
    ck(`G1[${vi}] P 在 r 阶子群`, R.P && (b3g1Mul(R.P, B377_R)===null));
    ck(`G1[${vi}] Q0 在曲线上`, b3g1IsOn(R.Q0));
  });
}
/* ---------- G2 ---------- */
{
  const d=JSON.parse(fs.readFileSync("testvectors/BLS12377G2_XMD-SHA-256_SSWU_RO_.json","utf8"));
  ck("G2 DST 一致", d.dst==="QUUX-V01-CS02-with-BLS12377G2_XMD:SHA-256_SSWU_RO_");
  d.vectors.forEach((v,vi)=>{
    const mb=new TextEncoder().encode(v.msg);
    const R=b377HashToCurveG2(mb, d.dst);
    const dec=s=>s.split(",").map(t=>BigInt(t));
    ck(`G2[${vi}] u0`, f2eq(R.u[0], dec(v.u[0])));
    ck(`G2[${vi}] u1`, f2eq(R.u[1], dec(v.u[1])));
    ck(`G2[${vi}] Q0.x`, f2eq(R.Q0[0], dec(v.Q0.x)));
    ck(`G2[${vi}] Q0.y`, f2eq(R.Q0[1], dec(v.Q0.y)));
    ck(`G2[${vi}] Q1.x`, f2eq(R.Q1[0], dec(v.Q1.x)));
    ck(`G2[${vi}] Q1.y`, f2eq(R.Q1[1], dec(v.Q1.y)));
    ck(`G2[${vi}] P.x`, R.P && f2eq(R.P[0], dec(v.P.x)));
    ck(`G2[${vi}] P.y`, R.P && f2eq(R.P[1], dec(v.P.y)));
    ck(`G2[${vi}] P 在曲线上`, R.P && b3g2IsOn(R.P));
    ck(`G2[${vi}] P 在 r 阶子群`, R.P && (b3g2Mul(R.P, B377_R)===null));
  });
}
function f2eq(a,b){return a[0]===b[0]&&a[1]===b[1];}
console.log(`hash-to-curve: ${pass} pass, ${fail} fail`);
if(fail) process.exit(1);
