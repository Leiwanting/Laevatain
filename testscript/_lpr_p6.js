var fs=require('fs'),path=require('path'),vm=require('vm'),nc=require('crypto'),cp=require('child_process');
global.crypto=nc.webcrypto;global.TextEncoder=require('util').TextEncoder;global.TextDecoder=require('util').TextDecoder;
global.btoa=s=>Buffer.from(s,'binary').toString('base64');global.atob=s=>Buffer.from(s,'base64').toString('binary');
var mk=id=>({id,value:'',_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},appendChild(){},style:{},innerHTML:'',textContent:''});
var store={};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q')},querySelectorAll(){return[]},addEventListener(){},readyState:'complete',body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t};
var ROOT=path.resolve(__dirname,'..');
var html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
var files=[...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
files.push('CryptoJS/crypto_ntrulpr.js');
files.forEach(f=>{ try{ vm.runInThisContext(fs.readFileSync(path.join(ROOT,f),'utf8'),{filename:f}); }catch(e){} });
var K=globalThis.__ntrulprKat['ntrulpr653'];
var D=K._dbg;
function hex(b){return Buffer.from(b).toString('hex').toUpperCase();}
// 随机 h（Fq 值域）与 g（small）
var h=new Int16Array(653);
for(var i=0;i<653;i++) h[i]=((Math.random()*4621)|0)-2310;
var g=new Int8Array(653);
for(i=0;i<653;i++) g[i]=((Math.random()*3)|0)-1;
// 编码成字节
function pxenc(f){var b=new Uint8Array(1306);for(var i=0;i<653;i++){var u=f[i]&0xFFFF;b[2*i]=u&0xFF;b[2*i+1]=(u>>8)&0xFF;}return b;}
var hb=pxenc(h);
var gb=new Uint8Array(653); for(i=0;i<653;i++) gb[i]=g[i]&0xFF;
var r=cp.spawnSync('/data/workspace/lprdbg/dbg',['mult',hex(hb),hex(gb)],{encoding:'utf8'});
var offOut=r.stdout.trim();
// 我的实现
var h2=Int16Array.from(h);
D.Rq_mult_small(h2,g);
var mine=hex(pxenc(h2));
console.log('core_mult 与官方 C 一致:', mine===offOut);
if(mine!==offOut){
  for(var i=0;i<Math.min(mine.length,offOut.length);i+=2){ if(mine.substr(i,2)!==offOut.substr(i,2)){ console.log('first diff byte',i/2,'idx',i/4,'mine',mine.substr(i,8),'off',offOut.substr(i,8)); break; } }
}
