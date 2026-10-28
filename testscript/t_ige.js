const fs=require('fs'), vm=require('vm');
const P='/data/workspace/dist/';
global.window=globalThis;
global.ALGOS=[]; global.reg=function(o){ALGOS.push(o)};
global.document={getElementById:()=>null, createElement:()=>({}), addEventListener:()=>{}};
global.crypto=require('crypto').webcrypto;
global.addEventListener=()=>{}; global.removeEventListener=()=>{}; global.location={href:''};
global.strToBytes=s=>new Uint8Array(Buffer.from(String(s),'utf8'));
global.hexToBytes=h=>new Uint8Array(Buffer.from(String(h).replace(/\s/g,''),'hex'));
global.bytesToHex=b=>Buffer.from(b).toString('hex');
global.bytesOut=(b)=>Buffer.from(b).toString('hex');
fs.readFileSync(P+'_order.txt','utf8').split('\n').filter(x=>x.trim()&&!x.startsWith('t_')).forEach(f=>{
  try{ vm.runInThisContext(fs.readFileSync(P+f,'utf8'),{filename:f}); }catch(e){ console.log('LOAD-FAIL',f,e.message.slice(0,150)); }
});
console.log('typeof igeEnc:', typeof globalThis.igeEnc, '| applyPad:', typeof globalThis.applyPad, '| applyUnpad:', typeof globalThis.applyUnpad);
const A={}; ALGOS.forEach(o=>A[o.id]=o);
const key='000102030405060708090a0b0c0d0e0f';
const iv ='101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f';
const EXP={16:'8771ea006282679ef689a2e7a22dd919fbddaa9075af21e5fef03d10f388d936',
32:'8771ea006282679ef689a2e7a22dd919a88b55134d0bc6da2a37d5cd852b83a6e3ce1b7f911164587970e9f142fae162',
48:'8771ea006282679ef689a2e7a22dd919a88b55134d0bc6da2a37d5cd852b83a64b02dc8ac6c400d8b4153c1925a5349919fef2d1873bd480a2c4da61ffb09ba9',
17:'8771ea006282679ef689a2e7a22dd91994347023bc42364ecff396ba36974dd0',
1:'8f92e07e7ddd986ae5d711872e92213d'};
let pass=0,fail=0,bad=[];
const bf=A.aes128.makeBlockFn(hexToBytes(key));
Object.keys(EXP).forEach(n=>{
  n=+n;
  const pt=new Uint8Array(n); for(let i=0;i<n;i++) pt[i]=(i*7+3)&0xff;
  const got=bytesToHex(globalThis.igeEnc(pt,16,bf.enc,'PKCS7',hexToBytes(iv)));
  if(got===EXP[n]) pass++; else {fail++;bad.push('enc n='+n+'\n got '+got+'\n exp '+EXP[n]);}
  const dec=globalThis.igeDec(hexToBytes(got),16,bf.dec,'PKCS7',hexToBytes(iv));
  if(bytesToHex(dec)===bytesToHex(pt)) pass++; else {fail++;bad.push('dec n='+n+' got '+bytesToHex(dec));}
});
console.log('IGE PASS',pass,'FAIL',fail); bad.forEach(b=>console.log(b));
