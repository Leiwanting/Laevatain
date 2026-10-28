const {JSDOM}=require("jsdom"),fs=require("fs"),vm=require("vm");
const html=fs.readFileSync("index.html","utf8");
const errs=[];
const vc=new (require("jsdom").VirtualConsole)();
vc.on("jsdomError",e=>errs.push("jsdomError: "+e.message));
vc.on("error",(...a)=>errs.push("error: "+a.join(" ")));
vc.on("warn",(...a)=>errs.push("warn: "+a.join(" ")));
const dom=new JSDOM(html,{runScripts:"outside-only",pretendToBeVisual:true,url:"https://x/",virtualConsole:vc});
const w=dom.window;
w.crypto=require("crypto").webcrypto;
w.btoa=s=>Buffer.from(s,"binary").toString("base64");
w.atob=s=>Buffer.from(s,"base64").toString("binary");
w.addEventListener("error",e=>errs.push("window error: "+e.message));
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{
  try{ vm.runInContext(fs.readFileSync(f,"utf8"), dom.getInternalVMContext(), {filename:f}); }
  catch(e){ errs.push(f+" -> "+e.message); }
});
try{ w.init(); }catch(e){ errs.push("init: "+e.message); }
const D=w.document,$=id=>D.getElementById(id);
console.log("算法数:",w.ALGOS.length);
console.log("按钮文字:",$("algoBtnText")?$("algoBtnText").textContent:"(无)");
console.log("按钮分类:",$("algoBtnCat")?$("algoBtnCat").textContent:"(无)");
console.log("select 值:",$("algo").value);
console.log("分类数:",D.querySelectorAll(".algo-cat").length);
console.log("默认展开分类:",[...D.querySelectorAll(".algo-cat.is-open .algo-cat-name")].map(e=>e.textContent).join(","));
console.log("控制台问题:",errs.length?errs.join(" | "):"无");
process.exit(errs.length?1:0);
