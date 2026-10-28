const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){return{};},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>({});global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){console.log("LOAD-ERR",f,e.message);}});

let tot=0,bad=0,fails=[];
function chk(name,got,exp){
  tot++;
  const g=String(got||"").toUpperCase(), e=String(exp||"").toUpperCase();
  if(g!==e){bad++; if(fails.length<5) fails.push({name,exp:e.slice(0,48),got:g.slice(0,48)});}
}
function get(id){return ALGOS.find(a=>a.id===id);}

/* ================= LION ================= */
{
  const f=get('lion');
  if(!f){console.log("LION 条目缺失");process.exit(1);}
  const txt=fs.readFileSync("testvectors/lion_xvec.txt","utf8");
  let recs=[],cur={};
  for(const line of txt.split("\n")){
    const L=line.trim();
    if(!L||L.startsWith("#"))continue;
    const m=L.match(/^([A-Z]+) = ([0-9A-Fa-f]+)$/);
    if(m){cur[m[1]]=m[2]; if(m[1]==='CT'){recs.push(cur);cur={};}}
  }
  console.log("LION 向量组数",recs.length);
  for(const r of recs){
    const pt=hexToBytes(r.PT), ct=r.CT;
    chk("lion/enc", f.enc(pt, r.KEY, "", "hex"), ct);
    chk("lion/dec", f.dec(ct, r.KEY, "decrypt", "hex"), r.PT);
  }
}

/* ================= ChaCha_RNG ================= */
{
  const f=get('chacha-rng');
  if(!f){console.log("ChaCha_RNG 条目缺失");process.exit(1);}
  const txt=fs.readFileSync("testvectors/chacha_rng.vec","utf8");
  let cur=null,recs=[];
  for(const line of txt.split("\n")){
    const L=line.trim();
    if(!L||L.startsWith("#")||L.startsWith("["))continue;
    const m=L.match(/^([A-Za-z0-9]+) = (.*)$/);
    if(m){ if(!cur)cur={}; cur[m[1]]=m[2].trim(); if(m[1]==='Out'){recs.push(cur);cur=null;} }
  }
  console.log("ChaCha_RNG 向量组数",recs.length);
  for(const r of recs){
    const len=(r.Out.length/2);
    const param=[r.EntropyInputReseed||"", len, r.AdditionalInput1||"", r.AdditionalInput2||""].join(",");
    chk("chacha-rng", f.enc(new Uint8Array(0), r.EntropyInput, param, "hex"), r.Out);
  }
}

/* ================= 健壮性 ================= */
{
  const f=get('lion'), g=get('chacha-rng');
  let thrown=0;
  try{ f.enc(hexToBytes("00".repeat(63)), "0011", "", "hex"); }catch(e){thrown++;}
  try{ g.enc(new Uint8Array(0), "", "", "hex"); }catch(e){thrown++;}
  try{ g.enc(new Uint8Array(0), "0000", ["","999999"].join(","), "hex"); }catch(e){thrown++;}
  console.log("健壮性：非法输入抛错", thrown, "/ 3");
}

console.log("TOTAL",tot,"FAIL",bad);
if(fails.length){console.log("前几条失败:");for(const x of fails)console.log("  ",x.name,"exp",x.exp,"got",x.got);}
