const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=4)console.log("  ✗ "+n);}};
// 常量自证
ck("ONE_MINUS_D == 1-d", DC_ONE_MINUS_D===dcMod(1n-DC_D));
ck("ONE_MINUS_TWO_D == 1-2d", DC_ONE_MINUS_TWO_D===dcMod(1n-2n*DC_D));
ck("SQRT_MINUS_D^2 == -d", dcMod(DC_SQRT_MINUS_D*DC_SQRT_MINUS_D)===dcMod(-DC_D));
ck("INVSQRT_MINUS_D^2*(-d)==1", dcMod(DC_INVSQRT_MINUS_D*DC_INVSQRT_MINUS_D*dcMod(-DC_D))===1n);
const B=[["6666666666666666666666666666666666666666666666666666666633333333333333333333333333333333333333333333333333333333"],
["c898eb4f87f97c564c6fd61fc7e49689314a1f818ec85eeb3bd5514ac816d38778f69ef347a89fca817e66defdedce178c7cc709b2116e75"],
["a0c09bf2ba7208fda0f4bfe3d0f5b29a543012306d43831b5adc6fe7f8596fa308763db15468323b11cf6e4aeb8c18fe44678f44545a69bc"],
["b46f1836aa287c0a5a5653f0ec5ef9e903f436e21c1570c29ad9e5f596da97eeaf17150ae30bcb3174d04bc2d712c8c7789d7cb4fda138f4"],
["1c5bbecf4741dfaae79db72dface00eaaac502c2060934b6eaaeca6a20bd3da9e0be8777f7d02033d1b15884232281a41fc7f80eed04af5e"],
["86ff0182d40f7f9edb7862515821bd67bfd6165a3c44de95d7df79b8779ccf6460e3c68b70c16aaa280f2d7b3f22d745b97a89906cfc476c"],
["502bcb6842eb06f0e49032bae87c554c031d6d4d2d7694efbf9c468d48220c50f8ca28843364d70cee92d6fe246e61448f9db9808b3b2408"],
["0c9810f1e2ebd389caa789374d78007974ef4d17227316f40e578b336827da3f6b482a4794eb6a3975b971b5e1388f52e91ea2f1bcb0f912"],
["20d41d85a18d5657a29640321563bbd04c2ffbd0a37a7ba43a4f7d263ce26faf4e1f74f9f4b590c69229ae571fe37fa639b5b8eb48bd9a55"],
["e6b4b8f408c7010d0601e7eda0c309a1a42720d6d06b5759fdc4e1efe22d076d6c44d42f508d67be462914d28b8edce32e7094305164af17"],
["be88bbb86c59c13d8e9d09ab98105f69c2d1dd134dbcd3b0863658f53159db64c0e139d180f3c89b8296d0ae324419c06fa87fc7daaf34c1"],
["a456f9369769e8f08902124a0314c7a06537a06e32411f4f93415950a17badfa7442b6217434a3a05ef45be5f10bd7b2ef8ea00c431edec5"],
["186e452c4466aa4383b4c00210d52e7922dbf9771e8b47e229a9b7b73c8d10fd7ef0b6e41530f91f24a3ed9ab71fa38b98b2fe4746d51d68"],
["4ae7fdcae9453f195a8ead5cbe1a7b9699673b52c40ab27927464887be53237f7f3a21b938d40d0ec9e15b1d5130b13ffed81373a53e2b43"],
["841981c3bfeec3f60cfeca75d9d8dc17f46cf0106f2422b59aec580a58f342272e3a5e575a055ddb051390c54c24c6ecb1e0aceb075f6056"]];
const G=[ED448_BX, ED448_BY, 1n, dcMod(ED448_BX*ED448_BY)];
for(let k=1;k<=15;k++){
  const P=ed448Mul(BigInt(k)*2n, G);
  const got=bytesToHex(dcEncodeAffine(ed448Affine(P)));
  if(got!==B[k-1][0] && fail<3) console.log("  ✗ B["+k+"] 期望"+B[k-1][0].slice(0,16)+" 实得"+got.slice(0,16));
  ck("B["+k+"]", got===B[k-1][0]);
}
// 解码往返（等价类归一化）
for(let k=1;k<=6;k++){
  const enc=dcEncodeAffine(ed448Affine(ed448Mul(BigInt(k), G)));
  let ok=true; let rep=null; try{ rep=dcDecode(enc); }catch(e){ ok=false; }
  ck("解码 B["+k+"]", ok);
  if(ok) ck("编码幂等 B["+k+"]", bytesToHex(dcEncode(rep))===bytesToHex(enc));
}
console.log("Decaf448: 通过 "+pass+" / 失败 "+fail);
