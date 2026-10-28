const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const data=new Uint8Array(64*1024); for(let i=0;i<data.length;i++)data[i]=i&255;
/* BigInt 旧版 sha512Core（独立重建） */
const M64=0xFFFFFFFFFFFFFFFFn;
function rotr(x,n){n=BigInt(n);return ((x>>n)|(x<<(64n-n)))&M64;}
function old512(input,iv,outLen){
  var H=iv.slice();
  var padded=concatBytes(input,(function(){var rem=input.length%128;var padLen=(rem<112)?(112-rem):(128+112-rem);
    var o=new Uint8Array(padLen+16);o[0]=0x80;var bits=BigInt(input.length)*8n;
    for(var i=0;i<16;i++)o[padLen+i]=Number((bits>>BigInt(8*(15-i)))&0xffn);return o;})());
  var w=new Array(80);
  for(var off=0;off<padded.length;off+=128){
    for(var i=0;i<16;i++){var v=0n;for(var j=0;j<8;j++)v=(v<<8n)|BigInt(padded[off+i*8+j]);w[i]=v;}
    for(i=16;i<80;i++){var s0=rotr(w[i-15],1)^rotr(w[i-15],8)^(w[i-15]>>7n);
      var s1=rotr(w[i-2],19)^rotr(w[i-2],61)^(w[i-2]>>6n);
      w[i]=(w[i-16]+s0+w[i-7]+s1)&M64;}
    var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(i=0;i<80;i++){
      var S1=rotr(e,14)^rotr(e,18)^rotr(e,41);
      var ch=(e&f)^((~e&M64)&g);
      var t1=(h+S1+ch+SHA512_K[i]+w[i])&M64;
      var S0=rotr(a,28)^rotr(a,34)^rotr(a,39);
      var maj=(a&b)^(a&c)^(b&c);
      var t2=(S0+maj)&M64;
      h=g;g=f;f=e;e=(d+t1)&M64;d=c;c=b;b=a;a=(t1+t2)&M64;
    }
    H[0]=(H[0]+a)&M64;H[1]=(H[1]+b)&M64;H[2]=(H[2]+c)&M64;H[3]=(H[3]+d)&M64;
    H[4]=(H[4]+e)&M64;H[5]=(H[5]+f)&M64;H[6]=(H[6]+g)&M64;H[7]=(H[7]+h)&M64;
  }
  var out=new Uint8Array(outLen);
  for(var i=0;i<outLen;i++){var word=H[Math.floor(i/8)];out[i]=Number((word>>BigInt(8*(7-(i%8))))&0xffn);}
  return out;
}
console.log("旧 BigInt 版空串 SHA-512 = "+bytesToHex(old512(new Uint8Array(0),IV_512,64)).slice(0,32)+"  （应 cf83e135...）");
const best=(fn,n)=>{let t=Infinity;for(let r=0;r<n;r++){const t0=process.hrtime.bigint();fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6;if(ms<t)t=ms;}return t;};
const o1=best(()=>old512(data,IV_512,64),3), n1=best(()=>sha512Digest(data),3);
const o2=best(()=>old512(data,IV_512_224,28),3), n2=best(()=>sha512_224Digest(data),3);
const o3=best(()=>old512(data,IV_512_256,32),3), n3=best(()=>sha512_256Digest(data),3);
const row=(n,o,w)=>console.log("  "+n.padEnd(14)+o.toFixed(1).padStart(8)+" ms →"+w.toFixed(1).padStart(7)+" ms  "+(o/w).toFixed(1)+"×");
console.log("\nSHA-512 家族 64KB（BigInt → hi/lo）：");
row("SHA-512",o1,n1); row("SHA-512/224",o2,n2); row("SHA-512/256",o3,n3);
