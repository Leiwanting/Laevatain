const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
/* 旧解密（优化前的通用实现，逐字重建） */
function oldDec(ct,ek){var n=ek.length-1;var p=ariaXor(ct,ek[n]);var slL=(n%2===1)?1:2;
  p=ariaXor(ariaSL(p,slL===1?2:1),ek[n-1]);
  for(var r=n-1;r>=1;r--){p=ariaA(p);var sl=(r%2===1)?1:2;p=ariaXor(ariaSL(p,sl===1?2:1),ek[r-1]);}
  return p;}
let ok=0,bad=0,first=null;
let s=20241016; const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return (s>>>16)&255;};
for(const kl of [16,24,32]){
  for(let n=0;n<100;n++){
    const k=new Uint8Array(kl),p=new Uint8Array(16);
    for(let i=0;i<kl;i++)k[i]=rnd(); for(let i=0;i<16;i++)p[i]=rnd();
    const ek=ariaRoundKeys(ariaKeySchedule(k),ariaNrounds(kl));
    const f=ariaMakeBlockFn(k);
    const ct=f.enc(p);
    const nd=bytesToHex(f.dec(ct)), od=bytesToHex(oldDec(ct,ek));
    if(nd===od && nd===bytesToHex(p)) ok++; else {bad++; if(!first)first={kl,nd,od,want:bytesToHex(p)};}
  }
}
console.log('ARIA 解密 新旧逐字节等价(3 种密钥×100): '+ok+'/300'+(bad?'  ✗':'  ✓'));
if(first) console.log('  首例 kl='+first.kl+'\n   新 '+first.nd+'\n   旧 '+first.od+'\n   应 '+first.want);
/* 全 0 / 全 FF 边界 */
let z=0,zn=0;
for(const kl of [16,24,32]){
  for(const fill of [0,255]){
    const k=new Uint8Array(kl).fill(fill),p=new Uint8Array(16).fill(fill^255);
    const ek=ariaRoundKeys(ariaKeySchedule(k),ariaNrounds(kl));
    const f=ariaMakeBlockFn(k); const ct=f.enc(p);
    if(bytesToHex(f.dec(ct))===bytesToHex(oldDec(ct,ek)) && bytesToHex(f.dec(ct))===bytesToHex(p)) z++; else zn++;
  }
}
console.log('ARIA 解密 边界(全0/全FF, 6 组): '+z+'/6'+(zn?'  ✗':'  ✓'));
