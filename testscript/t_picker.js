const {JSDOM}=require("jsdom"),fs=require("fs"),vm=require("vm");
const html=fs.readFileSync("index.html","utf8");
const dom=new JSDOM(html,{runScripts:"outside-only",pretendToBeVisual:true,url:"https://x/"});
const w=dom.window;
w.crypto=require("crypto").webcrypto;
w.btoa=s=>Buffer.from(s,"binary").toString("base64");
w.atob=s=>Buffer.from(s,"base64").toString("binary");
// 手动执行脚本（保持全局）
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{
  vm.runInContext(fs.readFileSync(f,"utf8"), dom.getInternalVMContext(), {filename:f});
});
// jsdom 下 DOMContentLoaded 已在脚本注入前触发，需显式初始化
try{ w.init(); }catch(e){ console.log("init:", e.message); }
try{ w.buildAlgoList(); }catch(e){ console.log("buildAlgoList:", e.message); }
try{ w.initAlgoPicker(); }catch(e){ console.log("initAlgoPicker:", e.message); }
const D=w.document;
const $=id=>D.getElementById(id);
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n);}};

ck("算法总数116", w.ALGOS.length===116);
ck("有按钮", !!$("algoBtn"));
ck("有面板", !!$("algoPanel"));
ck("搜索框在面板内", $("algoSearch") && $("algoPanel").contains($("algoSearch")));
ck("原生select保留", !!$("algo"));
ck("原生select有116项", $("algo").options.length===116);
// 面板初始隐藏
ck("面板初始隐藏", $("algoPanel").classList.contains("hidden"));
// 点击按钮展开
$("algoBtn").dispatchEvent(new w.Event("click",{bubbles:true}));
ck("点击后面板展开", !$("algoPanel").classList.contains("hidden"));
// 分类渲染
const cats=D.querySelectorAll(".algo-cat");
ck("渲染出分类", cats.length>0);
ck("分类数<=8", cats.length<=8);
console.log("  分类数:",cats.length);
const names=[...D.querySelectorAll(".algo-cat-name")].map(e=>e.textContent);
console.log("  分类:",names.join(" | "));
ck("含『编码与古典密码』", names.includes("编码与古典密码"));
ck("含『后量子密码』", names.includes("后量子密码"));
ck("含『分布式与门限密码』", names.includes("分布式与门限密码"));
ck("含『校验和与工具』", names.includes("校验和与工具"));
// 默认展开当前算法所属分类
const openCats=D.querySelectorAll(".algo-cat.is-open");
ck("默认展开1个分类", openCats.length>=1);
// 展开「编码与古典密码」看子分类
const encIdx=names.indexOf("编码与古典密码");
w.ALGO_PICK.open["c-enc"]=true;
w.ALGO_PICK.subOpen["c-enc-1"]=true; w.ALGO_PICK.subOpen["c-enc-2"]=true;
w.algoRenderPanel();
const subs=[...D.querySelectorAll(".algo-sub-name")].map(e=>e.textContent);
console.log("  子分类:",subs.join(" | "));
ck("有子分类『编码』", subs.includes("编码"));
ck("有子分类『古典密码』", subs.includes("古典密码"));
// 搜索
$("algoSearch").value="aes";
$("algoSearch").dispatchEvent(new w.Event("input",{bubbles:true}));
const hits=[...D.querySelectorAll(".algo-hit-name")].map(e=>e.textContent);
console.log("  搜 aes 命中:",hits.slice(0,5).join(", "),"共",hits.length);
ck("搜索有结果", hits.length>0);
ck("搜索命中AES", hits.some(n=>/AES/.test(n)));
// 模糊搜索
$("algoSearch").value="aes2";
$("algoSearch").dispatchEvent(new w.Event("input",{bubbles:true}));
const h2=[...D.querySelectorAll(".algo-hit-name")].map(e=>e.textContent);
console.log("  模糊 aes2 命中:",h2.slice(0,4).join(", "));
ck("模糊搜索命中", h2.some(n=>/AES-2/.test(n)));
// 中文搜索
$("algoSearch").value="门限";
$("algoSearch").dispatchEvent(new w.Event("input",{bubbles:true}));
const h3=[...D.querySelectorAll(".algo-hit-name")].map(e=>e.textContent);
console.log("  搜『门限』:",h3.join(", "));
ck("中文搜索命中门限", h3.length>=2);
// 无结果
$("algoSearch").value="zzzzzz";
$("algoSearch").dispatchEvent(new w.Event("input",{bubbles:true}));
ck("无结果显示空态", !!D.querySelector(".algo-empty"));
// 选中某个算法
$("algoSearch").value="frost";
$("algoSearch").dispatchEvent(new w.Event("input",{bubbles:true}));
const hit=D.querySelector(".algo-hit");
hit.dispatchEvent(new w.Event("click",{bubbles:true}));
ck("选中后select值变更", $("algo").value==="frost");
ck("选中后面板关闭", $("algoPanel").classList.contains("hidden"));
ck("按钮文字更新", $("algoBtnText").textContent.indexOf("FROST")>=0);
console.log("  按钮:",$("algoBtnText").textContent,"| 分类:",$("algoBtnCat").textContent);
// 历史
ck("历史已记录", w.ALGO_PICK.history.length>0);
console.log("  历史:",JSON.stringify(w.ALGO_PICK.history));
// 折叠交互：先清空搜索回到分类树
$("algoSearch").value="";
$("algoSearch").dispatchEvent(new w.Event("input",{bubbles:true}));
w.ALGO_PICK.open={}; w.ALGO_PICK.subOpen={}; w.algoRenderPanel();
ck("全收起时无子分类", D.querySelectorAll(".algo-sub").length===0);
const heads=[...D.querySelectorAll(".algo-cat-head")];
heads[0].dispatchEvent(new w.Event("click",{bubbles:true}));
ck("点击分类头展开", w.ALGO_PICK.open["c-enc"]===true);
ck("展开后出现子分类", D.querySelectorAll(".algo-sub").length>0);
const subHead=D.querySelector(".algo-sub-head");
subHead.dispatchEvent(new w.Event("click",{bubbles:true}));
ck("点击子分类展开", D.querySelectorAll(".algo-sub.is-open").length>0);
ck("子分类展开后列出算法", D.querySelectorAll(".algo-sub-body .algo-item").length>0);
console.log("  子分类『编码』条目:", D.querySelectorAll(".algo-sub-body .algo-item").length);
heads[0].dispatchEvent(new w.Event("click",{bubbles:true}));
ck("再次点击收起", w.ALGO_PICK.open["c-enc"]===false);
// 空子分类（其他）不应显示
const subNames=[...D.querySelectorAll(".algo-sub-name")].map(e=>e.textContent);
ck("空子分类『其他』不显示", subNames.indexOf("其他")<0 || D.querySelectorAll(".algo-sub").length===2);
// 历史 chip 可点击回填
$("algoBtn").dispatchEvent(new w.Event("click",{bubbles:true}));
const chip=D.querySelector(".algo-hist-chip");
if(chip){ chip.dispatchEvent(new w.Event("click",{bubbles:true})); ck("点击历史chip回填搜索框", $("algoSearch").value.length>0); }
else { console.log("  (无历史chip，跳过)"); }
console.log("算法选择器: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
