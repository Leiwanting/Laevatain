const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
/* 旧实现重建（ariaXor/ariaSL/ariaA 仍在文件里，未被覆盖） */
function oldEnc(pt,ek){var n=ek.length-1,p=new Uint8Array(pt);
  for(var r=1;r<=n-1;r++) p=ariaA(ariaSL(ariaXor(p,ek[r-1]),(r%2===1)?1:2));
  return ariaXor(ariaSL(ariaXor(p,ek[n-1]),(n%2===1)?1:2),ek[n]);}
function oldDec(ct,ek){var n=ek.length-1;var p=ariaXor(ct,ek[n]);var slL=(n%2===1)?1:2;
  p=ariaXor(ariaSL(p,slL===1?2:1),ek[n-1]);
  for(var r=n-1;r>=1;r--){p=ariaA(p);var sl=(r%2===1)?1:2;p=ariaXor(ariaSL(p,sl===1?2:1),ek[r-1]);}
  return p;}
let ok=0,bad=0,first=null;
let s=555; const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return (s>>>16)&255;};
for(const kl of [16,24,32]){
  for(let n=0;n<20;n++){
    const k=new Uint8Array(kl),p=new Uint8Array(16);
    for(let i=0;i<kl;i++)k[i]=rnd(); for(let i=0;i<16;i++)p[i]=rnd();
    const f=ariaMakeBlockFn(k);
    const ne=bytesToHex(f.enc(p)), oe=bytesToHex(oldEnc(p,ariaRoundKeys(ariaKeySchedule(k),ariaNrounds(kl))));
    const nd=bytesToHex(f.dec(new Uint8Array(f.enc(p))));
    if(ne===oe && nd===bytesToHex(p)) ok++; else {bad++; if(!first)first={kl,n,p,ne,oe,nd};}
  }
}
console.log("ARIA 新旧等价(16/24/32 字节密钥): "+ok+"/60"+(bad?"  失败 "+bad:"  ✓"));
if(first) console.log("  首例 kl="+first.kl+"\n   新 "+first.ne+"\n   旧 "+first.oe+"\n   往返 "+first.nd);
