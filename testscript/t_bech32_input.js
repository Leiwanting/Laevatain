/* 常驻回归：Bech32/Bech32m 输入校验
   1) 合法 hex 输入：enc→dec 往返必须还原（8 组）
   2) 非 hex 输入：必须明确报错，不能静默产出无关结果
      （历史 bug：h2b 静默剥离非 hex 字符，"hello world" → 0xed） */
require("./_harness.js");
const A = global.ALGOS;
(async()=>{
 let pass=0,fail=0;
 const HEX=["00","68656c6c6f","68656c6c6f20776f726c64","ffffffffffffffffffffffffffffffffffffffff"];
 for(const id of ["bech32","bech32m"]){
  const a=A.find(x=>x.id===id);
  if(!a){console.log("  ✗ "+id+" 未注册");fail++;continue;}
  for(const hex of HEX){
   const ct=a.enc(Buffer.from(hex,"utf8"),"","bc","hex"); const ctv=(ct&&ct.text)?ct.text:ct;
   const d=a.dec(ctv,"","bc","hex"); const dv=(d&&d.text)?d.text:d;
   const back=String(dv).split("数据(Hex): ")[1]||"";
   if(back===hex){pass++;} else {fail++;console.log("  ✗ "+id+" hex="+hex+" back="+back);}
  }
  for(const badIn of ["hello world","hello","xyz"]){
   let threw=false,msg="";
   try{ a.enc(Buffer.from(badIn,"utf8"),"","bc","hex"); }
   catch(e){ threw=true; msg=String(e.message).split("\n")[0]; }
   if(threw){pass++;} else {fail++;console.log("  ✗ "+id+" 对 "+JSON.stringify(badIn)+" 未报错（静默错误）");}
  }
 }
 console.log("Bech32 输入校验 "+pass+"/14"+(fail?"  失败 "+fail:"  全部通过"));
 process.exit(fail?1:0);
})();
