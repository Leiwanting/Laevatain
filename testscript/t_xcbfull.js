const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
let loadOK=0,loadFail=0;
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});loadOK++;}catch(e){loadFail++;console.log("LOAD FAIL "+f+": "+e.message);}});
console.log("脚本加载: "+loadOK+"/"+(loadOK+loadFail));
const V=require("../Json/xcb_vectors.json");
const A=ALGOS.find(a=>a.id==="xcb");
if(!A){console.log("未找到 xcb 条目");process.exit(1);}
let ok=0,bad=0,rt=0,rtbad=0;
const dist={};
for(const v of V){
  try{
    const res=A.enc(hexToBytes(v.pt),v.key,v.ad,"hex");
    const got=(typeof res==="string")?res:(res&&res.text)||"";
    if(got.toLowerCase()===v.ct.toLowerCase()){ok++;dist[v.adlen]=(dist[v.adlen]||0)+1;}
    else{bad++;if(bad<=2)console.log("MISMATCH t="+v.t+" ptlen="+v.ptlen+" adlen="+v.adlen+"\n  exp="+v.ct.slice(0,64)+"\n  got="+got.slice(0,64));}
    const back=A.dec(hexToBytes(v.ct),v.key,v.ad,"hex");
    const bt=(typeof back==="string")?back:(back&&back.text)||"";
    if(bt.toLowerCase()===v.pt.toLowerCase())rt++;else {rtbad++;if(rtbad<=2)console.log("RT FAIL t="+v.t);}
  }catch(e){bad++;if(bad<=3)console.log("ERR t="+v.t+" adlen="+v.adlen+": "+e.message);}
}
console.log("XCB 加密对 C 参考: "+ok+"/"+V.length+"  失败 "+bad);
console.log("XCB 解密往返: "+rt+"/"+V.length+"  失败 "+rtbad);
console.log("按 AD 长度命中: "+JSON.stringify(dist));
