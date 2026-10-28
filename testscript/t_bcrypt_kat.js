/* bcrypt 官方向量 —— 与 Python bcrypt 5.0（绑定 OpenBSD 官方实现）交叉 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
for(const m of html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)) vm.runInThisContext(fs.readFileSync(m[1],"utf8"),{filename:m[1]});
const bc=ALGOS.find(a=>a.id==='bcrypt');
/* 参数格式是 "cost,salt22"，不是完整 $2a$ 串 —— 第一次按后者传导致盐被忽略 */
const cases=[
 ["password","06,DCq7YPn5Rq63x1Lad4cll.",'$2a$06$DCq7YPn5Rq63x1Lad4cll.'],
 ["password","08,HqWuK6/Ng6sg9gQzbLrgb.",'$2a$08$HqWuK6/Ng6sg9gQzbLrgb.'],
 ["1234567890","08, aqePzTkTSCFRZ3jHFGEUSe".trim(),'$2a$08\$aqePzTkTSCFRZ3jHFGEUSe'],
 ["abcdefghijklmnopqrstuvwxyz","10,fPIsHmgjOKsLnfCFhQyGOu",'$2a$10$fPIsHmgjOKsLnfCFhQyGOu'],
 ["U*U","05,CCCCCCCCCCCCCCCCCCCCC.",'$2a$05$CCCCCCCCCCCCCCCCCCCCC.'],
 ["U*U*","05,CCCCCCCCCCCCCCCCCCCCC.",'$2a$05$CCCCCCCCCCCCCCCCCCCCC.'],
 ["~!@#$%^&*()      ~!@#$%^&*()PNBFRD","08,abcdefghijklmnopqrstuu",'$2a$08$abcdefghijklmnopqrstuu'],
];
(async()=>{
 const out=[];
 for(const [pw,salt,prefix] of cases){
   try{ const r=await bc.enc(null,pw,salt); out.push([pw,salt,prefix+String(r).slice(-31)].join(" | ")); }
   catch(e){ out.push([pw,salt,"ERROR:"+e.message].join(" | ")); }
 }
 fs.writeFileSync("/tmp/bcrypt_out.txt", out.join("\n"));
 console.log("bcrypt 已导出 "+cases.length+" 组");
})();
