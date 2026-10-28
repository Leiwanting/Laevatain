/* 常驻回归：此前「零覆盖」的 18 个对称算法，经统一引擎做 enc→dec 真实往返。
   覆盖：twofish128/192/256, aria192/256, camellia192/256, tea, xtea,
        simon128, speck128, gift64, gift128, shacal2, noekeon, misty1,
        kasumi, skipjack
   ⚠ 这是「自洽往返」，不是官方向量：能证明 enc/dec 互逆，不能证明与标准一致。 */
require("./_harness.js");
const A = global.ALGOS;
const IDS = ["twofish128","twofish192","twofish256","aria192","aria256","camellia192","camellia256",
  "tea","xtea","simon128","speck128","gift64","gift128","shacal2","noekeon","misty1","kasumi","skipjack"];
const PT = Buffer.from("smoke test 冒烟 123 !@#","utf8");
const TMO = 8000;
async function tc(p){let t;const to=new Promise((_,rj)=>{t=setTimeout(()=>rj(new Error("TIMEOUT")),TMO)});
 try{return{ok:true,v:await Promise.race([p,to])}}catch(e){return{ok:false,m:String(e&&e.message||e).slice(0,80)}}finally{clearTimeout(t)}}
(async()=>{
 let pass=0,fail=0;
 for(const id of IDS){
  const a=A.find(x=>x.id===id);
  if(!a){console.log("  ✗ "+id+" 未注册");fail++;continue;}
  const bs=a.blockSize||0;
  const key=Buffer.alloc(a.keyLen||16,0x5a).toString("hex");
  const iv=(bs?Buffer.alloc(bs,0x11):Buffer.alloc(16,0x11)).toString("hex");
  const mode=bs?"CBC":"CTR";
  const r1=await tc(Promise.resolve(global.symEncrypt(a,PT,key,mode,"PKCS7",iv,false,"",null,null)));
  if(!r1.ok){console.log("  ✗ "+id+" 加密失败: "+r1.m);fail++;continue;}
  const ct=r1.v, cb=(ct&&ct.ciphertext)?ct.ciphertext:ct;
  const r2=await tc(Promise.resolve(global.symDecrypt(a,cb,key,mode,"PKCS7",iv,false,"",null,null)));
  if(!r2.ok){console.log("  ✗ "+id+" 解密失败: "+r2.m);fail++;continue;}
  const pt=r2.v,b=(pt&&pt.plaintext)?pt.plaintext:pt;
  const got=Buffer.isBuffer(b)?b.toString("hex"):(b?Buffer.from(b).toString("hex"):"");
  if(got===PT.toString("hex")){pass++;console.log("  ✓ "+id);}
  else{fail++;console.log("  ✗ "+id+" 往返不一致 got="+got.slice(0,40));}
 }
 console.log("对称零覆盖往返 "+pass+"/"+IDS.length+(fail?" 失败 "+fail:"  全部通过"));
 process.exit(fail?1:0);
})();
