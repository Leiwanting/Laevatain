const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto; global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");
global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q')},querySelectorAll(){return[]},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global; global.addEventListener=()=>{}; global.Event=function(t){this.type=t};
function reg(a){ (global.ALGOS=global.ALGOS||[]).push(a); }
global.reg=reg;
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){console.log("  加载失败 "+f+": "+e.message);}});

const KAT=fs.readFileSync("testvectors/mceliece348864.kat","utf8");
const g={};
for(const l of KAT.split("\n")){const m=l.match(/^(\w+)\s*=\s*([0-9A-Fa-f]+)\s*$/); if(m)g[m[1]]=m[2].toLowerCase();}
console.log("KAT 字段:",Object.keys(g).join(","));
console.log("  seed",g.seed.length/2,"B  pk",g.pk.length/2,"B  sk",g.sk.length/2,"B  ct",g.ct.length/2,"B  ss",g.ss.length/2,"B");

/* NIST PQC KAT 的 48 字节 seed 需先过 AES256-CTR-DRBG 才是 PQClean 用的 32 字节种子 */
function drbg32(seed48){
  const A=(k,b)=>{const c=nc.createCipheriv("aes-256-ecb",Buffer.from(k),null);c.setAutoPadding(false);return Buffer.concat([c.update(Buffer.from(b)),c.final()]);};
  const inc=v=>{const a=Buffer.from(v);for(let j=15;j>=0;j--){if(a[j]===0xff)a[j]=0;else{a[j]++;break;}}return a;};
  const upd=(prov,Key,V)=>{let t=Buffer.alloc(0);for(let i=0;i<3;i++){V=inc(V);t=Buffer.concat([t,A(Key,V)]);}
    if(prov)for(let i=0;i<48;i++)t[i]^=prov[i];return[Buffer.from(t.subarray(0,32)),Buffer.from(t.subarray(32,48))];};
  let Key=Buffer.alloc(32),V=Buffer.alloc(16);
  [Key,V]=upd(Buffer.from(seed48,"hex"),Key,V);
  let out=Buffer.alloc(0);
  for(let left=32;left>0;){V=inc(V);const b=A(Key,V);const n=Math.min(left,16);out=Buffer.concat([out,b.subarray(0,n)]);left-=n;}
  return out.toString("hex");
}

const byId=id=>global.ALGOS.find(a=>a.id===id);
const kg=byId("mceliece348864-keygen"), kem=byId("mceliece348864");
let P=0,F=0;
const ck=(n,ok,d)=>{ if(ok){P++;console.log("  ✓ "+n);} else {F++;console.log("  ✗ "+n+(d?"  "+String(d).slice(0,80):""));} };

console.log("\n=== A. 确定性密钥生成：官方 seed → 官方 pk/sk ===");
const t0=Date.now();
// 48 字节 seed → DRBG → 32 字节种子（PQClean keypair 的 randombytes(seed+1,32)）
console.log("  48字节seed 直接喂? 先测是否确定性:");
{
  const a=kg.enc(Buffer.from(""),"",g.seed,"hex"), b=kg.enc(Buffer.from(""),"",g.seed,"hex");
  console.log("    两次一致="+(a===b)+"  （false=长度不符走了随机，符合预期：条目只收 64 hex）");
}
const seed32=drbg32(g.seed);
console.log("  NIST DRBG 派生出的 32 字节种子: "+seed32);
const tK=Date.now();
const out=kg.enc(Buffer.from(""),"",seed32,"hex");
console.log("  耗时 "+(Date.now()-tK)+" ms，输出 "+out.length+" 字符");
const parts=out.split("\n::K::");
const pkMine=parts[0].trim().toLowerCase(), skMine=(parts[1]||"").trim().toLowerCase();
ck("pk 逐字节 == 官方", pkMine===g.pk, "mine len="+pkMine.length+" 官方 len="+g.pk.length);
ck("sk 逐字节 == 官方", skMine===g.sk, "mine len="+skMine.length+" 官方 len="+g.sk.length);

console.log("\n=== B. 解封装：官方 sk + 官方 ct → 官方 ss ===");
const ssMine=kem.dec(g.ct, g.sk, "", "hex");
ck("ss 逐字节 == 官方", String(ssMine).trim().toLowerCase()===g.ss, "mine="+String(ssMine).trim().slice(0,64));

console.log("\n=== C. 往返：随机封装 → 解封装还原同一 ss ===");
const encOut=kem.enc(Buffer.from(""), g.pk, "", "hex");
const [ct2, ss2]=(typeof encOut==="string"?encOut.split("\n::K::"):[encOut.ct,encOut.ss]);
const ssBack=kem.dec(String(ct2).trim(), g.sk, "", "hex");
ck("解封装 ss == 封装 ss", String(ssBack).trim().toLowerCase()===String(ss2).trim().toLowerCase(),
   "enc="+String(ss2).trim().slice(0,32)+"  dec="+String(ssBack).trim().slice(0,32));
ck("ct 长度 96 字节", String(ct2).trim().length===192, "len="+String(ct2).trim().length);

console.log("\n=== D. 负向：错误长度必须报错 ===");
let threw=false; try{ kem.enc(Buffer.from(""), "00", "", "hex"); }catch(e){threw=true;}
ck("公钥长度不符时报错", threw);
threw=false; try{ kem.dec("00", g.sk, "", "hex"); }catch(e){threw=true;}
ck("密文长度不符时报错", threw);

console.log("\nPASS "+P+"  FAIL "+F);
process.exit(F?1:0);
