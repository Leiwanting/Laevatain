const fs=require('fs'),vm=require('vm'),path=require('path');
const DIST=path.join(__dirname,'..','dist');
const ctx={console,setTimeout,TextEncoder,TextDecoder,Uint8Array,Int32Array,BigInt,Math,Date,JSON,crypto:require('crypto').webcrypto};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;
ctx.addEventListener=function(){};ctx.document={addEventListener:function(){},getElementById:function(){return null},querySelectorAll:function(){return []},createElement:function(){return {style:{},setAttribute:function(){},appendChild:function(){}}}};
vm.createContext(ctx);
const html=fs.readFileSync(path.join(DIST,'index.html'),'utf8');
[...html.matchAll(/src=['"]([^'"]+\.js)['"]/g)].map(m=>m[1]).forEach(f=>vm.runInContext(fs.readFileSync(path.join(DIST,f),'utf8'),ctx,{filename:f}));
vm.runInContext(`
function omac(keyBytes,msg,t,mode){
  var f=aesMakeBlockFn(keyBytes);var bs=16;
  function dbl(b){var o=new Uint8Array(bs),carry=0;for(var i=bs-1;i>=0;i--){var c=(b[i]<<1)&0xff;o[i]=c|carry;carry=(b[i]>>7)&1;}if(carry)o[bs-1]^=0x87;return o;}
  var L=f.enc(new Uint8Array(bs));var K1=dbl(L),K2=dbl(K1);
  var m;
  if(mode==='blk'){var pre=new Uint8Array(bs);pre[bs-1]=t&0xff;m=new Uint8Array(bs+msg.length);m.set(pre,0);m.set(msg,bs);}
  else{m=new Uint8Array(1+msg.length);m[0]=t&0xff;m.set(msg,1);}
  var x=new Uint8Array(bs);
  var full=Math.floor(m.length/bs),rem=m.length%bs;
  var lastComplete=(rem===0&&m.length>0);
  var nB=lastComplete?full:full+1;
  for(var b=0;b<nB-1;b++){var blk=m.subarray(b*bs,(b+1)*bs);for(var i=0;i<bs;i++)x[i]^=blk[i];x=f.enc(x);}
  var last=new Uint8Array(bs);
  if(lastComplete)last.set(m.subarray((nB-1)*bs,nB*bs));
  else{if(rem>0)last.set(m.subarray(full*bs),0);last[rem]=0x80;}
  for(var i=0;i<bs;i++)last[i]^=(lastComplete?K1[i]:K2[i]);
  for(var i=0;i<bs;i++)x[i]^=last[i];
  return f.enc(x);
}
`,ctx);
function hex(b){return Buffer.from(b).toString('hex').toLowerCase();}
const key=Uint8Array.from(Buffer.from('000102030405060708090a0b0c0d0e0f','hex'));
const nonce=Uint8Array.from(Buffer.from('b37087680f0edd5a52228b8c7aaea664','hex'));
const inb=Uint8Array.from(Buffer.from('00000000000000000000000000000000111111111111111111111111111111112222222222222222222222222222222233333333333333333333333333333333','hex'));
const ad=Uint8Array.from(Buffer.from('b6b29c2fbe29dcd2','hex'));
const expCT='3bb6173e3772d4b62eef37f9ef0781f360b6c74be3bf6b371067bc1b090d9d6622a1fbec6ac471b3349cd4277a101d40890fbf27dfdcd0b4e3781f9806daabb6';
const expTag='a0498745e59999ddc32d5b140241124e';
// 用原实现得到 ct（已知正确）
const r0=ctx.aesEaxEncrypt(inb,key,nonce,ad);
console.log('ct 匹配官方:', hex(r0.ciphertext)===expCT);
const ct=r0.ciphertext;
for(const mN of ['blk','b1'])for(const mC of ['blk','b1'])for(const mH of ['blk','b1']){
  const N=ctx.omac(key,nonce,0,mN), tc=ctx.omac(key,ct,2,mC), th=ctx.omac(key,ad,1,mH);
  const tag=new Uint8Array(16);
  for(let i=0;i<16;i++)tag[i]=tc[i]^th[i]^N[i];
  console.log('N='+mN,'C='+mC,'H='+mH,hex(tag)===expTag?'*** MATCH ***':'no','|',hex(tag));
}
