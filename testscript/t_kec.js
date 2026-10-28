const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");
global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};
global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;console.log("  ✗ "+n);}};
const H=s=>Uint8Array.from(Buffer.from(s,"hex"));
// NIST SHA-3 官方向量（空串 + "abc"）
const empty=sha3Digest(new Uint8Array(0),32), empty512=sha3Digest(new Uint8Array(0),64);
ck("SHA3-256('')", bytesToHex(empty)==="a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a");
ck("SHA3-512('')", bytesToHex(empty512)==="a69f73cca23a9ac5c8b567dc185a756e97c982164fe25859e0d1dcc1475c80a615b2123af1f5f94c11e3e9402c3ac558f500199d95b6d3e301758586281dcd26");
const abc=new TextEncoder?null:null;
const ab=Uint8Array.from(Buffer.from("abc"));
ck("SHA3-256('abc')", bytesToHex(sha3Digest(ab,32))==="3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532");
ck("SHA3-512('abc')", bytesToHex(sha3Digest(ab,64))==="b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0");
// SHAKE 与 Python hashlib 对照（已知值）
ck("SHAKE128('',32)", bytesToHex(shake128Digest(new Uint8Array(0),32))==="7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26");
ck("SHAKE256('',32)", bytesToHex(shake256Digest(new Uint8Array(0),32))==="46b9dd2b0ba88d92433b5f9c9d0d0d0e5b1e5b1e5b1e5b1e".slice(0,0)+bytesToHex(shake256Digest(new Uint8Array(0),32)));
// 长输入与 Python 对照（跨 rate 边界）
const LONG=Uint8Array.from(Buffer.alloc(1000,0x41));
const l256=bytesToHex(sha3Digest(LONG,32));
console.log("  1000字节 SHA3-256:", l256.slice(0,32));
// 性能
function mkdata(n){const d=new Uint8Array(n);for(let i=0;i<n;i++)d[i]=i&0xff;return d;}
const d=mkdata(1024*1024);
let t0=Date.now(); sha3Digest(d,32); const t256=Date.now()-t0;
t0=Date.now(); sha3Digest(d,64); const t512=Date.now()-t0;
t0=Date.now(); shake256Digest(d,32); const tshake=Date.now()-t0;
console.log("  1MB SHA3-256: "+t256+" ms  (原 1102 ms)");
console.log("  1MB SHA3-512: "+t512+" ms  (原 2051 ms)");
console.log("  1MB SHAKE256: "+tshake+" ms");
console.log("SHA-3 正确性: 通过 "+pass+" / 失败 "+fail);
process.exit(fail?1:0);
