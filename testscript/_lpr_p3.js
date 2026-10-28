var fs=require('fs'),path=require('path'),vm=require('vm'),nc=require('crypto');
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
var key=Buffer.alloc(32,0x11);
var c=nc.createCipheriv('aes-256-ctr',key,Buffer.alloc(16,0));
var buf=Buffer.concat([c.update(Buffer.alloc(4*653)),c.final()]);
var L=[]; for(var i=0;i<653;i++) L.push(buf.readUInt32LE(4*i));
var mine=[],ref=[];
var aG=new Int16Array(653);
var fake=new Uint8Array(897); fake.set(key,0);
D.Generator(aG,fake);
for(i=0;i<5;i++){
  var bf=D.Fq_bigfreeze(L[i]);
  console.log('L=%d  bigfreeze=%d  标准mod q=%d  G(mine)=%d  G标准-2310=%d',
    L[i], bf, L[i]%4621, aG[i], (L[i]%4621)-2310);
}
