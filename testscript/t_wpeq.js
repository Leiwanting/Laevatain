const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
/* 旧的慢速 W（wpGamma/wpPi/wpTheta/wpKeyRound 仍在文件里，未被覆盖） */
function wpBlockCipherSlow(K, M) {
  var st = new Uint8Array(64), i;
  for (i = 0; i < 64; i++) st[i] = M[i] ^ K[i];
  var Kr = new Uint8Array(K);
  for (var r = 1; r <= 10; r++) { Kr = wpKeyRound(Kr, r); wpRound(st, Kr); }
  return st;
}
function wpDigestSlow(msg){
  var m=new Uint8Array(msg),i;
  var padLen=((31-m.length)%64+64)%64;
  var total=m.length+1+padLen+32, buf=new Uint8Array(total);
  buf.set(m,0); buf[m.length]=0x80;
  var bits=m.length*8, lo32=bits%4294967296, hi32=Math.floor(bits/4294967296);
  for(i=0;i<32;i++){ var sh=8*(31-i); buf[total-32+i]=(sh>=32?(hi32>>>(sh-32)):(lo32>>>sh))&0xff; }
  var H=new Uint8Array(64);
  for(var off=0;off<total;off+=64){
    var blk=buf.subarray(off,off+64);
    var out=wpBlockCipherSlow(H,blk);
    for(i=0;i<64;i++) H[i]=out[i]^H[i]^blk[i];
  }
  return H;
}
const E=s=>new TextEncoder().encode(s);
let ok=0,bad=0;
const cases=["", "a","abc","message digest","abcdefghijklmnopqrstuvwxyz",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  "12345678901234567890123456789012345678901234567890123456789012345678901234567890",
  "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
  "The quick brown fox jumps over the lazy dog"];
for(const m of cases){
  const a=bytesToHex(whirlpoolDigest(E(m))), b=bytesToHex(wpDigestSlow(E(m)));
  if(a===b){ok++; console.log("  ✓ "+JSON.stringify(m.slice(0,40)));}
  else {bad++; console.log("  ✗ "+JSON.stringify(m.slice(0,40))+"\n     新 "+a+"\n     旧 "+b);}
}
/* 随机长度 */
let s=999; const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return (s>>>16)&255;};
let rok=0,rbad=0;
for(let n=0;n<30;n++){ const len=rnd()%200; const d=new Uint8Array(len);
  for(let i=0;i<len;i++)d[i]=rnd();
  if(bytesToHex(whirlpoolDigest(d))===bytesToHex(wpDigestSlow(d))) rok++; else rbad++; }
console.log("\n新旧等价: 固定用例 "+ok+"/"+cases.length+"  随机长度 "+rok+"/30  (失败 "+(bad+rbad)+")");
console.log("\nmessage digest  = "+bytesToHex(whirlpoolDigest(E("message digest"))));
console.log("a-z            = "+bytesToHex(whirlpoolDigest(E("abcdefghijklmnopqrstuvwxyz"))));
