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
const out=[];
[0,1,63,64,65,127,200,1000].forEach(n=>{
  const d=new Uint8Array(n); for(let i=0;i<n;i++)d[i]=(i*11+2)&0xff;
  out.push({n:n, s512:bytesToHex(streebogDigest(d,64)), s256:bytesToHex(streebogDigest(d,32))});
});
console.log("空串 Streebog-512:", bytesToHex(streebogDigest(new Uint8Array(0),64)));
fs.writeFileSync("_stree.json",JSON.stringify(out));
function mkd(n){const d=new Uint8Array(n);for(let i=0;i<n;i++)d[i]=i&0xff;return d;}
const d=mkd(256*1024);
let t0=Date.now(); streebogDigest(d,64); console.log("256KB Streebog-512: "+(Date.now()-t0)+" ms");
