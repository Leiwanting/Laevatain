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
files.forEach(f=>{ try{ vm.runInThisContext(fs.readFileSync(path.join(ROOT,f),'utf8'),{filename:f}); }catch(e){} });

function myCtr(key, iv, outLen){
  var ks=aesExpandKey(key);
  var out=new Uint8Array(outLen),blk=new Uint8Array(16),i,n,e,ctr=0,off;
  for(i=0;i<12;i++)blk[i]=iv[i];
  for(off=0;off<outLen;off+=16){
    blk[12]=(ctr>>>24)&0xFF;blk[13]=(ctr>>>16)&0xFF;blk[14]=(ctr>>>8)&0xFF;blk[15]=ctr&0xFF;
    e=aesEncryptBlockJSRef(blk,ks);
    n=Math.min(16,outLen-off);
    for(i=0;i<n;i++)out[off+i]=e[i];
    ctr++;
  }
  return out;
}
var key=nc.randomBytes(32), iv=Buffer.alloc(16,0);
var mine=myCtr(key,iv,2612);
var c=nc.createCipheriv('aes-256-ctr',key,iv);
var ref=Buffer.concat([c.update(Buffer.alloc(2612)),c.final()]);
console.log('AES-256-CTR 与 Node 一致:', Buffer.from(mine).toString('hex')===ref.toString('hex'));
if(Buffer.from(mine).toString('hex')!==ref.toString('hex')){
  var a=Buffer.from(mine).toString('hex'),b=ref.toString('hex');
  for(var i=0;i<Math.min(a.length,b.length);i+=2){ if(a.substr(i,2)!==b.substr(i,2)){console.log('first diff at byte',i/2,a.substr(i,16),b.substr(i,16));break;} }
}
