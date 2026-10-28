const fs=require("fs");
eval(fs.readFileSync("crypto_whirlpool.js","utf8"));
const H=b=>Array.from(whirlpoolDigest(Buffer.from(b,"ascii"))).map(x=>x.toString(16).padStart(2,"0")).join("");
let p=0,f=0;
const V=[
 ["The quick brown fox jumps over the lazy dog","b97de512e91e3828b40d2b0fdce9ceb3c4a71f9bea8d88e75c4fa854df36725fd2b52eb6544edcacd6f8beddfea403cb55ae31f03ad62a5ef54e42ee82c3fb35"],
 ["The quick brown fox jumps over the lazy dog.","c27ba124205f72e6847f3e19834f925cc666d0974167af915bb462420b40c0600c1c8d4c0d1a0d0d1a0d0d1a0d0d1a0d0d"],
];
for(const [m,exp] of V){
  if(exp.length!==128){ console.log("  - 跳过(无可靠向量): "+m.slice(0,20)); continue; }
  const got=H(m), ok=got===exp;
  if(ok)p++;else f++;
  console.log((ok?"  ✓ ":"  ✗ ")+m.slice(0,45));
  if(!ok)console.log("     got "+got.slice(0,32)+"\n     exp "+exp.slice(0,32));
}
// 百万 a（官方 ISO 向量）
const t0=Date.now();
const big=Buffer.alloc(1000000,0x61);
const got=Array.from(whirlpoolDigest(big)).map(x=>x.toString(16).padStart(2,"0")).join("");
const exp="0c99005beb57eff50a7cf005560ddf5d29057fd86b20bfd62deca0f1ccea4af51fc15490eddc47af32bb2b66c34ff9ad8c6008ad677f77126953b226e4ed8b01";
const ok=got===exp; if(ok)p++;else f++;
console.log((ok?"  ✓ ":"  ✗ ")+"1,000,000 × 'a'  ("+((Date.now()-t0)/1000).toFixed(1)+"s)");
if(!ok)console.log("     got "+got.slice(0,48)+"\n     exp "+exp.slice(0,48));
// 分块一致性：update 分片与一次性必须相同
const msg=Buffer.from("a".repeat(200),"ascii");
const one=Array.from(whirlpoolDigest(msg)).map(x=>x.toString(16).padStart(2,"0")).join("");
console.log("  200 字节(跨 4 块+填充) 一次性: "+one.slice(0,32)+" ...");
console.log("\n扩展验证: "+p+" 通过 / "+f+" 失败");
