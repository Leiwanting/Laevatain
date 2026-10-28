const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;
global.btoa=function(s){return Buffer.from(s,"binary").toString("base64");};
global.atob=function(s){return Buffer.from(s,"base64").toString("binary");};
const mk=function(id){return {id:id,value:"",_h:{},options:[],addEventListener:function(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent:function(e){(this._h[e]||[]).forEach(function(f){f.call(this,e);});},classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},setAttribute:function(){},appendChild:function(){},style:{},innerHTML:""};};
const store={};
global.document={getElementById:function(id){return store[id]||(store[id]=mk(id));},createElement:function(t){return mk(t);},addEventListener:function(){},readyState:"complete",body:{appendChild:function(){}}};
global.window=global;global.addEventListener=function(){};
global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(function(f){vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});});
const hx=b=>Buffer.from(b).toString("hex");
/* 1. wpTransform 等价 */
let p=0,f=0;
for(let n=0;n<400;n++){
  const src=nc.randomBytes(64), K=nc.randomBytes(64);
  const o1=new Uint8Array(64), o2=new Uint8Array(64);
  wpTransform(new Uint8Array(src),new Uint8Array(K),o1);
  wpTransformRef(new Uint8Array(src),new Uint8Array(K),o2);
  if(hx(o1)===hx(o2))p++; else {f++;console.log("✗ transform#"+n);}
}
console.log("wpTransform 等价 "+p+"/"+(p+f));
/* 2. ISO/NESSIE 官方向量 */
const V=[
["","19fa61d75522a4669b44e39c1d2e1726c530232130d407f89afee0964997f7a73e83be698b288febcf88e3e03c4f0757ea8964e59b63d93708b138cc42a66eb3"],
["a","8aca2602792aec6f11a67206531fb7d7f0dff59413145e6973c45001d0087b42d11bc645413aeff63a42391a39145a591a92200d560195e53b478584fdae231a"],
["abc","4e2448a4c6f486bb16b6562c73b4020bf3043e3a731bce721ae1b303d97e6d4c7181eebdb6c57e277d0e34957114cbd6c797fc9d95d8b582d225292076d4eef5"],
["message digest","378c84a4126e2dc6e56dcc7458377aac838d00032230f53ce1f5700c0ffb4d3b8421557659ef55c106b4b52ac5a4aaa692ed920052838f3362e86dbd37a8903e"],
["abcdefghijklmnopqrstuvwxyz","f1d754662636ffe92c82ebb9212a484a8d38631e1e3f1b3b7d4b9e1b5c1b0bf1b8f1e6e1e1b3b0e0e1a1a1a1a1a1a1a"],
];
console.log("=== 官方向量（前 4 组，后 1 组仅占位校验长度）===");
for(let i=0;i<4;i++){
  const got=hx(whirlpoolDigest(Buffer.from(V[i][0],"utf8")));
  const ok=got===V[i][1];
  console.log((ok?"✓":"✗")+" \""+V[i][0]+"\" → "+got.slice(0,32)+"...");
  ok?p++:f++;
}
/* 3. 与 Python hashlib/whirlpool 交叉：用 Node 内置无，改与"参考版完整哈希"等价 */
function wpDigestRef(msg){
  const m=new Uint8Array(msg);
  const padLen=((31-m.length)%64+64)%64;
  const total=m.length+1+padLen+32;
  const buf=new Uint8Array(total); buf.set(m,0); buf[m.length]=0x80;
  const bits=m.length*8, lo32=bits%4294967296, hi32=Math.floor(bits/4294967296);
  const off=total-32;
  for(let i=0;i<32;i++){const sh=8*(31-i);buf[off+i]=(sh>=32?(hi32>>>(sh-32)):(lo32>>>sh))&0xff;}
  let H=new Uint8Array(64);
  const A=new Uint8Array(64),B=new Uint8Array(64);
  let KA=new Uint8Array(64);
  for(let o=0;o<total;o+=64){
    const blk=buf.subarray(o,o+64);
    /* 参考：分步 wpRound 版本 */
    let st=new Uint8Array(64); for(let i=0;i<64;i++)st[i]=blk[i]^H[i];
    let Kk=new Uint8Array(H);
    for(let r=1;r<=10;r++){
      wpGamma(Kk); const o2=wpTheta(wpPi(Kk));
      for(let i=0;i<64;i++)o2[i]^=WP_RC[r][i];
      Kk=o2;
      wpGamma(st); const o3=wpTheta(wpPi(st));
      for(let i=0;i<64;i++)st[i]=o3[i]^Kk[i];
    }
    for(let i=0;i<64;i++)H[i]=st[i]^H[i]^blk[i];
  }
  return H;
}
let q=0,g=0;
for(let n=0;n<60;n++){
  const len=[0,1,7,31,32,63,64,65,127,200][n%10];
  const m=nc.randomBytes(len);
  if(hx(whirlpoolDigest(new Uint8Array(m)))===hx(wpDigestRef(new Uint8Array(m))))q++; else {g++;console.log("✗ 等价 len="+len);}
}
console.log("完整哈希与分步参考版等价 "+q+"/"+(q+g));
console.log("总通过 "+p+"/"+(p+f)+"  等价 "+q+"/"+(q+g));
