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
var ORI='/data/workspace/ntruori/o_ntrulpr653';
function run(args){var r=cp.spawnSync(ORI,args,{encoding:'utf8',maxBuffer:64*1024*1024});if(r.status!==0)throw new Error('drv fail '+r.stderr);return r.stdout.trim().split('\n');}
function unhex(h){return new Uint8Array(Buffer.from(h,'hex'));}
function hex(b){return Buffer.from(b).toString('hex').toUpperCase();}
function mkRng(buf){var p=0;return function(n){var r=new Uint8Array(buf.subarray(p,p+n));p+=n;return r;};}

var seed=nc.randomBytes(K.FGBYTES+32).toString('hex').toUpperCase();
var o=run(['kg',seed]);
var pkOff=unhex(o[0]);
var mySeed=unhex(seed).subarray(0,32);
var aG=new Int16Array(653);
D.Generator(aG,mySeed);
var aGoff=D.roundedDecode(pkOff.subarray(32));
// 对比 aG
var same=true,first=-1;
for(var i=0;i<653;i++) if(aG[i]!==aGoff[i]){ if(first<0)first=i; same=false; }
console.log('Generator aG vs 官方解码:',same?'一致':'不一致, first='+first, same?'':('  mine='+aG[first]+' off='+aGoff[first]));
// 编解码自洽
var re=D.roundedEncode(aGoff);
console.log('roundedEncode(官方解码) == 官方字节:', hex(re)===o[0].slice(64));
// 我的 aG 编码 vs 官方
var rem=D.roundedEncode(aG);
console.log('roundedEncode(我的 aG) == 官方字节:', hex(rem)===o[0].slice(64));
if(!same){
  console.log('aG[0..7] mine',Array.from(aG.slice(0,8)));
  console.log('aG[0..7] off ',Array.from(aGoff.slice(0,8)));
}
