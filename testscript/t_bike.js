const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto; global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");
global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={}; global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q')},querySelectorAll(){return[]},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global; global.addEventListener=()=>{}; global.Event=function(t){this.type=t};
const html=fs.readFileSync("/data/workspace/dist/index.html","utf8");
for(const f of [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1])){
  vm.runInThisContext(fs.readFileSync("/data/workspace/dist/"+f,"utf8"),{filename:f});
}
vm.runInThisContext(fs.readFileSync("/data/workspace/dist/CryptoJS/crypto_bike.js","utf8"),{filename:"crypto_bike.js"});

function splitmixBytes(n){
  var out=new Uint8Array(n),i=0;
  var s=0x1234567890abcdefn; var M=(1n<<64n)-1n;
  while(i<n){ s=(s+0x9E3779B97F4A7C15n)&M; var z=s;
    z=((z^(z>>30n))*0xBF58476D1CE4E5B9n)&M;
    z=((z^(z>>27n))*0x94D049BB133111EBn)&M;
    var r=z^(z>>31n);
    for(var b=0;b<8&&i<n;b++) out[i++]=Number((r>>BigInt(8*b))&0xffn);
  }
  return out;
}
let pass=0,fail=0;
function cmp(t,g,e){ const ok=Buffer.from(g).equals(Buffer.from(e)); if(ok)pass++;else fail++;
  console.log((ok?'PASS ':'FAIL ')+t); if(!ok){console.log('  exp',Buffer.from(e).slice(0,24).toString('hex'));console.log('  got',Buffer.from(g).slice(0,24).toString('hex'));} return ok;}

[1,3,5].forEach(function(L){
  var d={};
  fs.readFileSync("/data/workspace/work/bike_kat/kat_l"+L+".txt","utf8").trim().split("\n").forEach(function(l){
    var i=l.indexOf("="); d[l.slice(0,i)]=l.slice(i+1);
  });
  console.log("===== LEVEL "+L+"  R_BITS="+d.R_BITS+" =====");
  var seedsKg=splitmixBytes(64);
  var t0=Date.now();
  var kg=globalThis.bikeKeygen(L,seedsKg);
  var ms=Date.now()-t0;
  console.log("keygen "+ms+" ms");
  cmp("L"+L+" SK",Buffer.from(kg.sk),Buffer.from(d.SK,"hex"));
  cmp("L"+L+" PK",Buffer.from(kg.pk),Buffer.from(d.PK,"hex"));
  // encaps 用接下来的 64 字节
  var seedsEn=splitmixBytes(128).subarray(64,128);
  var t1=Date.now();
  var en=globalThis.bikeEncaps(kg.pk,L,seedsEn);
  console.log("encaps "+(Date.now()-t1)+" ms");
  cmp("L"+L+" CT",Buffer.from(en.ct),Buffer.from(d.CT,"hex"));
  cmp("L"+L+" SS",Buffer.from(en.ss),Buffer.from(d.SS,"hex"));
});
console.log("\nPASS "+pass+"  FAIL "+fail);

console.log("\n===== DECAPS =====");
[1,3,5].forEach(function(L){
  var d={};
  fs.readFileSync("/data/workspace/work/bike_kat/kat_l"+L+".txt","utf8").trim().split("\n").forEach(function(l){
    var i=l.indexOf("="); d[l.slice(0,i)]=l.slice(i+1);
  });
  var t0=Date.now();
  try{
    var r=globalThis.bikeDecaps(Buffer.from(d.SK,"hex"),Buffer.from(d.CT,"hex"),L);
    console.log("L"+L+" decaps "+(Date.now()-t0)+" ms  ok="+r.ok);
    cmp("L"+L+" decaps SS",Buffer.from(r.ss),Buffer.from(d.SS,"hex"));
  }catch(e){ console.log("L"+L+" decaps ERROR: "+e.message); fail++; }
});
console.log("\nTOTAL PASS "+pass+"  FAIL "+fail);
