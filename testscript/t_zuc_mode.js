const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
let nl=0,nf=0;
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});nl++;}catch(e){nf++;console.log("FAIL "+f+": "+e.message.slice(0,60));}});
console.log("scripts="+nl+" fail="+nf+"  ALGOS="+(typeof ALGOS!=="undefined"?ALGOS.length:"?"));
const H=h=>{h=h.replace(/\s/g,"");const o=new Uint8Array(h.length/2);for(let i=0;i<o.length;i++)o[i]=parseInt(h.substr(i*2,2),16);return o;};
const X=b=>{let s="";for(const v of b)s+=v.toString(16).padStart(2,"0");return s;};
let P=0,F=0;const ck=(n,c,x)=>{if(c)P++;else{F++;console.log("  ✗ "+n+(x?"  ["+x+"]":""));}};
const V=JSON.parse(fs.readFileSync("testvectors/zuc_eea3_eia3.json","utf8"));
console.log("  注："+V._excluded);
console.log("\n=== ZUC-128-EEA3（GM/T 0001.2-2012 附录A）===");
for(const v of V.eea3){
  const prm=[v.count,v.bearer,v.direction,v.length].join(",");
  const got=X(zucEEA3(H(v.ibs),H(v.ck),parseInt(v.count,16)>>>0,parseInt(v.bearer,16),parseInt(v.direction,16),parseInt(v.length,16)));
  ck("加密 = 官方 OBS（"+v.name+"）", got===v.obs, "got="+got);
  const back=X(zucEEA3(H(v.obs),H(v.ck),parseInt(v.count,16)>>>0,parseInt(v.bearer,16),parseInt(v.direction,16),parseInt(v.length,16)));
  ck("解密还原 = 官方 IBS", back===v.ibs, "got="+back);
  /* 走注册入口（界面实际路径） */
  const A=ALGOS.find(a=>a.id==="zuc-eea3");
  const ui=A.enc(H(v.ibs), v.ck, prm, "hex");
  ck("经注册入口 enc 与官方一致", String(ui).toLowerCase()===v.obs, "got="+ui);
  const ui2=A.dec(H(v.obs), v.ck, prm, "hex");
  { const _n=(ui2 instanceof Uint8Array||Array.isArray(ui2))?Buffer.from(ui2).toString("hex"):String(ui2);
  ck("经注册入口 dec 还原明文", _n.toLowerCase()===String(v.ibs).toLowerCase()); }
}
console.log("\n=== ZUC-128-EIA3（GM/T 0001.3-2012 附录A）===");
for(const v of V.eia3){
  const prm=[v.count,v.bearer,v.direction,v.length].join(",");
  const got=X(zucEIA3(H(v.m),H(v.ik),parseInt(v.count,16)>>>0,parseInt(v.bearer,16),parseInt(v.direction,16),parseInt(v.length,16)));
  ck("MAC = 官方值（"+v.name+"）", got===v.mac, "got="+got);
  const A=ALGOS.find(a=>a.id==="zuc-eia3");
  ck("经注册入口 MAC 一致", String(A.enc(H(v.m), v.ik, prm, "hex")).toLowerCase()===v.mac);
}
/* EEA3/EIA3 配套往返 + 边界 */
console.log("\n=== 边界与自洽 ===");
{
  const key=H("00112233445566778899aabbccddeeff");
  for(const n of [0,1,7,8,31,32,100]){
    const msg=new Uint8Array(n);for(let i=0;i<n;i++)msg[i]=(i*37+11)&0xff;
    const ct=zucEEA3(msg,key,0x12345678,0x1f,1,n*8);
    const pt=zucEEA3(ct,key,0x12345678,0x1f,1,n*8);
    ck("EEA3 往返 "+n+" 字节", X(pt)===X(msg));
  }
  /* 不同 COUNT/BEARER/DIR 必须产出不同密钥流 */
  const m=H("aabbccdd");
  const s=new Set([X(zucEEA3(m,key,0,0,0,32)),X(zucEEA3(m,key,1,0,0,32)),
                   X(zucEEA3(m,key,0,1,0,32)),X(zucEEA3(m,key,0,0,1,32))]);
  ck("COUNT/BEARER/DIRECTION 各自影响输出", s.size===4, "distinct="+s.size);
  const s2=new Set([X(zucEIA3(m,key,0,0,0,32)),X(zucEIA3(m,key,1,0,0,32)),
                    X(zucEIA3(m,key,0,1,0,32)),X(zucEIA3(m,key,0,0,1,32))]);
  ck("EIA3 各参数各自影响 MAC", s2.size===4, "distinct="+s2.size);
}
console.log("\n合计 PASS="+P+"  FAIL="+F);
