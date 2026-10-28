const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");
global.atob=s=>Buffer.from(s,"base64").toString("binary");
// 刻意【不提供 document】，模拟 Worker 环境
global.window=global; global.addEventListener=function(){};
global.Event=function(t){this.type=t;};
global.self=global;
const html=fs.readFileSync("index.html","utf8");
const files=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
let firstErr=null;
for(const f of files){
  try{ vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}); }
  catch(e){ if(!firstErr) firstErr=f+": "+e.message; }
}
console.log("首个加载错误:", firstErr||"无（全部可加载）");
console.log("ALGOS:", typeof ALGOS!=="undefined"?ALGOS.length:"未定义");
