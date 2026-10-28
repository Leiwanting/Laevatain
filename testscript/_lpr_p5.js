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
var ORI='/data/workspace/ntruori/o_ntrulpr653';
function run(args){var r=cp.spawnSync(ORI,args,{encoding:'utf8',maxBuffer:64*1024*1024});if(r.status!==0)throw new Error('drv fail '+r.stderr);return r.stdout.trim().split('\n');}
function unhex(h){return new Uint8Array(Buffer.from(h,'hex'));}
function hex(b){return Buffer.from(b).toString('hex').toUpperCase();}
function mkRng(buf){var p=0;return function(n){var r=new Uint8Array(buf.subarray(p,p+n));p+=n;return r;};}
var seed=nc.randomBytes(K.FGBYTES+32).toString('hex').toUpperCase();
var o=run(['kg',seed]);
var pkOff=unhex(o[0]);
var rm=nc.randomBytes(32).toString('hex').toUpperCase();
var oe=run(['en',o[0],rm]);
var je=K.encaps(pkOff,mkRng(unhex(rm)));
console.log('encaps ct 一致:', hex(je.ct)===oe[0]);
console.log('encaps ss 一致:', hex(je.ss)===oe[1]);
if(hex(je.ct)!==oe[0]){
  var e=hex(je.ct),g=oe[0];
  for(var i=0;i<Math.min(e.length,g.length);i+=2){ if(e.substr(i,2)!==g.substr(i,2)){console.log('ct first diff byte',i/2,'(rounded段<865, top段<993, confirm 993+)');break;} }
}
// decaps
var jd=K.decaps(unhex(oe[0]),unhex(o[1]));
console.log('decaps 复现官方 ss:', hex(jd)===oe[1]);
