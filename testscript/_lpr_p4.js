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
var seed=nc.randomBytes(K.FGBYTES+32).toString('hex').toUpperCase();
var o=run(['kg',seed]);
var pkOff=unhex(o[0]), skOff=unhex(o[1]);
var sb=unhex(seed);
// a 取自官方 sk 的 Small 部分（保证与官方一致）
var D2=K._dbg;
var aBytes=skOff.subarray(0,164);
// 手工 2bit 解码
function smallDecode(s){var f=new Int8Array(653),k=0,x,n4=653>>2;
  for(var i=0;i<n4;i++){x=s[i];f[k++]=(x&3)-1;x>>=2;f[k++]=(x&3)-1;x>>=2;f[k++]=(x&3)-1;x>>=2;f[k++]=(x&3)-1;}
  f[4*n4]=(s[n4]&3)-1;return f;}
var a=smallDecode(aBytes);
var aG=new Int16Array(653);
var fake=new Uint8Array(897); fake.set(sb.subarray(0,32),0);
D.Generator(aG,fake);
D.Rq_mult_small(aG,a);
var enc=D.roundedEncode(aG);
console.log('roundedEncode(Generator*a) == 官方 pk[32..]:', hex(enc)===o[0].slice(64));
if(hex(enc)!==o[0].slice(64)){
  var e=hex(enc), g=o[0].slice(64);
  for(var i=0;i<Math.min(e.length,g.length);i+=2){ if(e.substr(i,2)!==g.substr(i,2)){console.log('first diff byte',i/2,'mine',e.substr(i,8),'off',g.substr(i,8));break;} }
}
// 看看 aG 值域
var mn=99999,mx=-99999; for(var i=0;i<653;i++){if(aG[i]<mn)mn=aG[i];if(aG[i]>mx)mx=aG[i];}
console.log('aG 值域',mn,mx);
