const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
console.log("APP_NAME     =", APP_NAME);
console.log("APP_CODENAME =", APP_CODENAME);
console.log("APP_VERSION  =", APP_VERSION);
console.log("APP_TAGLINE  =", APP_TAGLINE);
console.log("BUILD_INFO   =", JSON.stringify(BUILD_INFO));
console.log("实际算法数   =", ALGOS.length);
console.log("\n--- 界面文本 ---");
console.log("徽章:", (html.match(/<span class="ver-badge"[^>]*>(.*?)<\/span>/)||[])[1]);
console.log("副题:", (html.match(/<span class="app-sub">(.*?)<\/span>/)||[])[1]);
console.log("版本卡代号:", (html.match(/<span class="ver-code">(.*?)<\/span>/)||[])[1],
            "|", (html.match(/<span class="ver-abbr-big">(.*?)<\/span>/)||[])[1]);
console.log("\n残留 ARGUS(对外):", /ver-badge|app-sub|ver-code/.test(html) ?
  (html.match(/<span class="ver-(?:badge|code)"[^>]*>[^<]*<b>(ARGUS)<\/b>/)? "有" : "无 ✓") : "无 ✓");
console.log("ARGUS 仅存于 CHANGELOG/注释:", /ARGUS/.test(html) ? (html.match(/class="ver-codenote">[^<]*ARGUS/)? "✓ 是" : "✗ 仍在其他位置") : "✓ 不在 html");
