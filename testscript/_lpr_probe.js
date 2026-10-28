var fs=require('fs'),path=require('path'),cp=require('child_process'),vm=require('vm'),nc=require('crypto');
global.crypto=nc.webcrypto;global.TextEncoder=require('util').TextEncoder;global.TextDecoder=require('util').TextDecoder;
global.btoa=s=>Buffer.from(s,'binary').toString('base64');global.atob=s=>Buffer.from(s,'base64').toString('binary');
var mk=id=>({id,value:'',_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},appendChild(){},style:{},innerHTML:'',textContent:''});
var store={};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q')},querySelectorAll(){return[]},addEventListener(){},readyState:'complete',body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t};
var ROOT=path.resolve(__dirname,'..');
var html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
var files=[...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
// 临时把新文件加进去
files.push('CryptoJS/crypto_ntrulpr.js');
files.forEach(f=>{ try{ vm.runInThisContext(fs.readFileSync(path.join(ROOT,f),'utf8'),{filename:f}); }catch(e){ console.log('LOAD ERR',f,e.message.split('\n')[0]); } });
var K=globalThis.__ntrulprKat;
if(!K){console.log('FATAL __ntrulprKat 未导出');process.exit(1);}
K=K['ntrulpr653'];
console.log('PKB',K.PKBYTES,'SKB',K.SKBYTES,'CTB',K.CTBYTES,'FG',K.FGBYTES,'RM',K.RMBYTES);
var ORI='/data/workspace/ntruori/o_ntrulpr653';
function run(args){var r=cp.spawnSync(ORI,args,{encoding:'utf8',maxBuffer:64*1024*1024});if(r.status!==0)throw new Error('drv fail '+r.stderr);return r.stdout.trim().split('\n');}
function hex(b){return Buffer.from(b).toString('hex').toUpperCase();}
function unhex(h){return new Uint8Array(Buffer.from(h,'hex'));}
function mkRng(buf){var p=0;return function(n){var r=new Uint8Array(buf.subarray(p,p+n));p+=n;return r;};}
var seed=nc.randomBytes(K.FGBYTES+32).toString('hex').toUpperCase();
var o=run(['kg',seed]);
console.log('official pk len',o[0].length/2,'sk len',o[1].length/2);
var jp=K.keypair(mkRng(unhex(seed)));
console.log('js pk len',jp.pk.length,'sk len',jp.sk.length);
console.log('pk match:', hex(jp.pk)===o[0]);
console.log('sk match:', hex(jp.sk)===o[1]);
if(hex(jp.pk)!==o[0]){ console.log('off first diff at', (()=>{var a=hex(jp.pk),b=o[0];for(var i=0;i<Math.min(a.length,b.length);i+=2)if(a.substr(i,2)!==b.substr(i,2))return i/2;return -1;})()); }
if(hex(jp.sk)!==o[1]){ console.log('sk first diff at', (()=>{var a=hex(jp.sk),b=o[1];for(var i=0;i<Math.min(a.length,b.length);i+=2)if(a.substr(i,2)!==b.substr(i,2))return i/2;return -1;})()); }
