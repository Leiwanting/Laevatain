const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){console.log("FAIL "+f+": "+e.message.slice(0,60));}});
const V=JSON.parse(fs.readFileSync("_vec_kzg.json","utf8"));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=6)console.log("  ✗ "+n);}};
const H=h=>kzgH2B(h);
const P1=h=>[H(h[0]),H(h[1])];
const P2=h=>[[H(h[0][0]),H(h[0][1])],[H(h[1][0]),H(h[1][1])]];
for(const v of V){
  const srs={g1:v.g1_srs.map(P1), g2_1:P2(v.g2_1), g2_s:P2(v.g2_s), n:v.deg};
  const f=v.f.map(H);
  // 承诺：与 py_ecc 的 C 逐字节一致
  const C=kzgCommit(srs,f);
  ck("承诺一致 deg="+v.deg, bytesToHex(kzgG1ToBytes(C))===v.C[0]+v.C[1]);
  // 求值
  const y=kzgEval(f,H(v.x));
  ck("f(x) 一致 deg="+v.deg, y===H(v.y));
  // 商多项式
  const q=kzgQuotient(f,y,H(v.x));
  ck("商多项式一致 deg="+v.deg, q && q.every((c,i)=>c===H(v.q[i])));
  // 证明
  const pr=kzgProve(srs,f,H(v.x));
  ck("证明一致 deg="+v.deg, bytesToHex(kzgG1ToBytes(pr.pi))===v.pi[0]+v.pi[1]);
  // 验证通过
  ck("验证通过 deg="+v.deg, kzgVerify(srs,C,H(v.x),y,pr.pi));
  // 用 py_ecc 给的 pi 也要能验过（双向）
  ck("py_ecc 的证明可验 deg="+v.deg, kzgVerify(srs,C,H(v.x),y,P1(v.pi)));
  // 篡改 y 必须被拒
  ck("篡改 y 被拒 deg="+v.deg, !kzgVerify(srs,C,H(v.x),(y+1n)%KZG_R,pr.pi));
  // 篡改 x 必须被拒
  ck("篡改 x 被拒 deg="+v.deg, !kzgVerify(srs,C,(H(v.x)+1n)%KZG_R,y,pr.pi));
  // 篡改承诺必须被拒
  /* ⚠ 篡改 C 不能靠改 y 坐标：那样得到的点不在曲线上，bnPairing 会直接抛异常，
     测不到"验证逻辑拒绝"这件事。正确的篡改方式是用一个【合法但错误】的点，
     例如 C + G1（改变承诺值但仍在群内）。 */
  ck("篡改 C 被拒 deg="+v.deg, !kzgVerify(srs, bnG1Add(C, BN_G1), H(v.x), y, pr.pi));
  /* 篡改证明同理：用一个合法的错点 */
  ck("篡改证明被拒 deg="+v.deg, !kzgVerify(srs, C, H(v.x), y, bnG1Add(pr.pi, BN_G1)));
}
console.log("KZG（py_ecc 交叉 + 篡改拒绝）: 通过 "+pass+" / 失败 "+fail);
