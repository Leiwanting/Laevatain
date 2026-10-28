const fs=require("fs");
global.reg = global.regSym = function(){};   /* 单文件测试：注册函数桩 */
eval(fs.readFileSync("crypto_sm9.js","utf8"));
const V=JSON.parse(fs.readFileSync("_vec_sm9.json","utf8"));
const B=x=>BigInt(x);
const cv2=a=>[B(a[0]),B(a[1])];
const cv4=a=>a.map(cv2);
const cv12=a=>a.map(cv4);
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=3)console.log("  ✗ "+n);}};
for(const t of V.f2){
  const a=cv2(t.a), b=cv2(t.b);
  ck("f2 mul", sm9f2eq(sm9f2mul(a,b), cv2(t.mul)));
  ck("f2 add", sm9f2eq(sm9f2add(a,b), cv2(t.add)));
  ck("f2 sub", sm9f2eq(sm9f2sub(a,b), cv2(t.sub)));
  ck("f2 inv", sm9f2eq(sm9f2inv(a), cv2(t.inv)));
}
for(const t of V.f4){
  const a=cv4(t.a), b=cv4(t.b);
  ck("f4 mul", sm9f4eq(sm9f4mul(a,b), cv4(t.mul)));
  ck("f4 add", sm9f4eq(sm9f4add(a,b), cv4(t.add)));
  ck("f4 sub", sm9f4eq(sm9f4sub(a,b), cv4(t.sub)));
  ck("f4 inv", sm9f4eq(sm9f4inv(a), cv4(t.inv)));
}
for(const t of V.f12){
  const a=cv12(t.a), b=cv12(t.b);
  ck("f12 mul", sm9f12eq(sm9f12mul(a,b), cv12(t.mul)));
  ck("f12 add", sm9f12eq(sm9f12add(a,b), cv12(t.add)));
  ck("f12 sub", sm9f12eq(sm9f12sub(a,b), cv12(t.sub)));
  ck("f12 inv", sm9f12eq(sm9f12inv(a), cv12(t.inv)));
}
console.log("SM9 塔域: 通过 "+pass+" / 失败 "+fail);
