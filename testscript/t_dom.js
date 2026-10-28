const {JSDOM}=require("jsdom"),fs=require("fs"),nc=require("crypto");
(async()=>{
const dom=await JSDOM.fromFile("index.html",{runScripts:"dangerously",resources:"usable",pretendToBeVisual:true});
const w=dom.window;
// Web Crypto 注入
Object.defineProperty(w,"crypto",{value:nc.webcrypto,configurable:true});
await new Promise(r=>setTimeout(r,1500));
const d=w.document; const $=id=>d.getElementById(id);
let pass=0,fail=0;const ck=(n,c,e)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n+(e?" :: "+e:""));}};
console.log("=== 结构 ===");
const field=$("input") && $("input").closest(".field");
ck("input 存在",!!$("input"));
if(field){
  const head=field.querySelector(".field-head");
  ck("field-head 存在",!!head);
  ck("label 在 head 内",!!(head&&head.querySelector('label[for="input"]')));
  const order=[...field.children].map(e=>e.id||e.className||e.tagName.toLowerCase());
  console.log("  field 子元素:",order.join(" > "));
  ck("textarea 在按钮之后（不再被隔断）",order.indexOf("input")>order.findIndex(x=>x.includes("field-head")));
}
console.log("=== 重复 id ===");
const ids=[...d.querySelectorAll("[id]")].map(e=>e.id);
const dup=[...new Set(ids.filter((v,i)=>ids.indexOf(v)!==i))];
ck("无重复 id",dup.length===0,"重复: "+dup.join(","));
console.log("=== 关键控件 ===");
["input","output","algo","mode","key","fileIn","btnImportKey","btnDownload","btnEnc","btnDec"].forEach(id=>ck(id,!!$(id)));
console.log("=== 默认算法 ===");
ck("默认 aes256",$("algo")&&$("algo").value==="aes256","当前="+($("algo")?$("algo").value:"(无)"));
console.log("=== 页面可交互 ===");
ck("算法数 >90",w.ALGOS&&w.ALGOS.length>90,"实际="+(w.ALGOS?w.ALGOS.length:"?"));
console.log("\nDOM 检查：通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
})().catch(e=>{console.log("异常:",e.message);process.exit(1);});
