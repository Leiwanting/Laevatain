const fs=require("fs");
global.reg = global.regSym = function(){};   /* 单文件测试：注册函数桩 */
eval(fs.readFileSync("crypto_sm9.js","utf8"));
const V=JSON.parse(fs.readFileSync("_vec_sm9.json","utf8"));
const B=x=>BigInt(x);
const cv2=a=>[B(a[0]),B(a[1])], cv4=a=>a.map(cv2), cv12=a=>a.map(cv4);
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=4)console.log("  ✗ "+n);}};
// phi
const Q=[cv2(V.Q[0]),cv2(V.Q[1])];
ck("phi(Q)", sm9f12eq(sm9phi(Q)[0], cv12(V.phiQ[0])) && sm9f12eq(sm9phi(Q)[1], cv12(V.phiQ[1])));
// phi_inv ∘ phi == id
for(const t of V.phiinv){
  const q=[cv2(t.q[0]),cv2(t.q[1])];
  const back=sm9phiInv(sm9phi(q));
  ck("phiInv(phi(Q))==Q", sm9f2eq(back[0],cv2(t.back[0])) && sm9f2eq(back[1],cv2(t.back[1])));
}
// frob
const x=cv12(V.frob.x);
ck("frob1", sm9f12eq(sm9frob1(x), cv12(V.frob.f1)));
ck("frob2", sm9f12eq(sm9frob2(x), cv12(V.frob.f2)));
ck("frob3", sm9f12eq(sm9frob3(x), cv12(V.frob.f3)));
ck("frob6", sm9f12eq(sm9frob6(x), cv12(V.frob.f6)));
// finalexp
ck("finalexp", sm9f12eq(sm9FinalExp(cv12(V.finalexp.x)), cv12(V.finalexp.out)));
// 配对
for(const t of V.pair.concat(V.pair2)){
  const P=[B(t.P[0]),B(t.P[1])];
  /* gmalg 存的 F_p2 是 (c1, c0)，本文件统一 [c0, c1]，需交换 */
  const Qq=[[B(t.Q[0][1]),B(t.Q[0][0])],[B(t.Q[1][1]),B(t.Q[1][0])]];
  const got=sm9Pairing(P,Qq);
  ck("配对 k1="+t.k1, sm9f12eq(got, cv12(t.e)));
}
console.log("SM9 配对层: 通过 "+pass+" / 失败 "+fail);
