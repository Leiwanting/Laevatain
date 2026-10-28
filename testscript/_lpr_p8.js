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
var seed=nc.randomBytes(32), raw=nc.randomBytes(4*653);
var r=cp.spawnSync('/data/workspace/lprdbg/dbg3',[seed.toString('hex').toUpperCase(),raw.toString('hex').toUpperCase()],{encoding:'utf8'});
var lines=r.stdout.trim().split('\n');
var offG=lines[0].slice(lines[0].indexOf(":")+1).split(',').map(Number);
var offa=lines[1].slice(lines[1].indexOf(":")+1).split(',').map(Number);
var offGa=lines[2].slice(lines[2].indexOf(":")+1).split(',').map(Number);
var offR=lines[3].slice(lines[3].indexOf(":")+1);
// JS
var G=new Int16Array(653); var fake=new Uint8Array(897); fake.set(seed,0);
D.Generator(G,fake);
var L=new Uint32Array(653);
for(var i=0;i<653;i++) L[i]=(raw[4*i]|(raw[4*i+1]<<8)|(raw[4*i+2]<<16)|(raw[4*i+3]<<24))>>>0;
var a=D.Short_fromlist(L);
var G2=Int16Array.from(G);
D.Rq_mult_small(G2,a);
console.log('G  一致:', Array.from(G.slice(0,20)).join(',')===offG.join(','));
console.log('a  一致:', Array.from(a.slice(0,20)).join(',')===offa.join(','));
console.log('Ga 一致:', Array.from(G2.slice(0,20)).join(',')===offGa.join(','));
var enc=Buffer.from(D.roundedEncode(G2)).toString('hex').toUpperCase().slice(0,64);
console.log('Rounded 一致:', enc===offR);
if(Array.from(G.slice(0,20)).join(',')!==offG.join(',')){console.log('G mine',Array.from(G.slice(0,10)));console.log('G off ',offG.slice(0,10));}
if(Array.from(a.slice(0,20)).join(',')!==offa.join(',')){console.log('a mine',Array.from(a.slice(0,10)));console.log('a off ',offa.slice(0,10));}
if(Array.from(G2.slice(0,20)).join(',')!==offGa.join(',')){console.log('Ga mine',Array.from(G2.slice(0,10)));console.log('Ga off ',offGa.slice(0,10));}
if(enc!==offR){console.log('R mine',enc);console.log('R off ',offR);}
