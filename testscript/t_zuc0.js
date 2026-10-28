const fs=require("fs");
eval(fs.readFileSync("zuc_gen.js","utf8"));
const V=JSON.parse(fs.readFileSync("_vec_zuc.json","utf8"));
let pass=0,fail=0;
for(const t of V){
  const ks=zucKeystream(Uint8Array.from(Buffer.from(t.key,"hex")), Uint8Array.from(Buffer.from(t.iv,"hex")), 8);
  const got=Buffer.from(ks).toString("hex");
  // 注意：gmalg/C++ 的向量是「未丢弃首字」的原始密钥流前 8 字
  if(got===t.out){pass++;}else{fail++; if(fail<3)console.log("  ✗ key="+t.key.slice(0,8)+"\n    got  "+got.slice(0,16)+"\n    want "+t.out.slice(0,16));}
}
console.log("ZUC 密钥流(原始8字): 通过 "+pass+" / 失败 "+fail);
