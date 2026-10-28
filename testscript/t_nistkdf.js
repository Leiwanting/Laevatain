const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){return{};},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>({});global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
vm.runInThisContext(fs.readFileSync("crypto_nistkdf.js","utf8"),{filename:"crypto_nistkdf.js"});
const INPKG=fs.existsSync("testvectors/hmac_drbg.vec");
/* 包内自带向量（解压后可独立复算）；开发期回退到 Botan 源码树 */
const B=INPKG?"testvectors/":"/data/workspace/dl3/botan-2.19.5/src/tests/data/";
const P=n=>B+n;
const A=ALGOS.find(a=>a.id==='gmac')?1:0;
function get(id){return ALGOS.find(a=>a.id===id);}
function parseVec(path,onHeader,onOut){
  const txt=fs.readFileSync(path,"utf8");let cur=null,recs=[];
  for(const line of txt.split("\n")){const L=line.trim();
    if(!L||L.startsWith("#"))continue;
    const h=L.match(/^\[(.+)\]$/);
    if(h){cur={hdr:h[1],o:{}};continue;}
    const m=L.match(/^([A-Za-z0-9]+) = (.*)$/);
    if(m&&cur){cur.o[m[1]]=m[2].trim();if(m[1]==='Out'||m[1]==='Output'){recs.push(cur);}}
  }
  return recs;
}
let tot=0,bad=0;
function chk(name,got,exp){tot++;if(got.toUpperCase()!==exp.toUpperCase()){bad++;if(bad<=3)console.log("  FAIL",name,"exp",exp.slice(0,40),"got",got.slice(0,40));}}
// ---- GMAC ----
{
 const recs=parseVec(P("gmac.vec"));
 console.log("GMAC 组数",recs.length);
 for(const r of recs){
   const f=get('gmac');
   const out=f.enc(hexToBytes(r.o.In||''), r.o.Key, r.o.IV, 'hex');
   chk("gmac",out,r.o.Out);
 }
}
// ---- SP800-108 ----
for(const [file,mode] of [["sp800_108_ctr.vec","ctr"],["sp800_108_fb.vec","fb"],["sp800_108_pipe.vec","pipe"]]){
 const recs=parseVec(P(file));
 let n=0;
 for(const r of recs){
   const hm=r.hdr.match(/HMAC\(([^)]+)\)/); if(!hm)continue;
   const hn={'SHA-160':'SHA-1','SHA-256':'SHA-256','SHA-384':'SHA-384','SHA-512':'SHA-512'}[hm[1]];
   if(!hn)continue;
   const outHex=(r.o.Output||'');
   const len=outHex.length/2;
   const f=get('sp800-108-'+mode);
   const out=f.enc(new Uint8Array(0), r.o.Secret, [r.o.Label||'', r.o.Salt||'', len, hn].join(','), 'hex');
   chk(mode+"/"+hn,out,outHex); n++;
 }
 console.log("SP800-108",mode,"组数",n);
}
// ---- PGP S2K ----
{
 const recs=parseVec(P("pgp_s2k.vec"));
 let n=0;
 for(const r of recs){
   const hm=r.hdr.match(/OpenPGP-S2K\(([^)]+)\)/); if(!hm)continue;
   const hn={'SHA-160':'SHA-1','SHA-256':'SHA-256','SHA-384':'SHA-384','SHA-512':'SHA-512'}[hm[1]];
   if(!hn)continue;
   const outHex=r.o.Output||'';
   const len=outHex.length/2;
   const f=get('pgp-s2k');
   const pass=(r.o.Passphrase||'');
   const out=f.enc(strToBytes(pass), r.o.Salt||'', [r.o.Iterations||'1', len, hn].join(','), 'hex');
   chk("pgps2k/"+hn,out,outHex); n++;
 }
 console.log("PGP-S2K 组数",n);
}
// ---- HMAC-DRBG ----
{
 const txt=fs.readFileSync(P("hmac_drbg.vec"),"utf8");
 let cur=null,recs=[];
 for(const line of txt.split("\n")){const L=line.trim();
   if(!L||L.startsWith("#"))continue;
   const h=L.match(/^\[([^\]]+)\]$/);
   if(h){cur={hdr:h[1],o:{}};continue;}
   const m=L.match(/^([A-Za-z0-9]+) = (.*)$/);
   if(m&&cur){cur.o[m[1]]=m[2].trim();if(m[1]==='Out'){recs.push(cur);}}
 }
 console.log("HMAC-DRBG 组数",recs.length);
 for(const r of recs){
   const hn={'SHA-1':'SHA-1','SHA-224':'SHA-224','SHA-256':'SHA-256','SHA-384':'SHA-384','SHA-512':'SHA-512','SHA-512-224':'SHA-512-224','SHA-512-256':'SHA-512-256'}[r.hdr];
   if(!hn)continue;
   const outHex=r.o.Out||'';
   const len=outHex.length/2;
   const f=get('hmac-drbg');
   const out=f.enc(new Uint8Array(0), r.o.EntropyInput, [r.o.EntropyInputReseed||'', len, hn, r.o.AdditionalInput1||'', r.o.AdditionalInput2||''].join(','), 'hex');
   chk("drbg/"+hn,out,outHex);
 }
}
console.log("TOTAL",tot,"FAIL",bad);
