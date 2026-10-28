const fs=require('fs'); const P='/data/workspace/dist/';
global.window=globalThis; global.ALGOS=[]; global.reg=function(o){ALGOS.push(o)};
global.bytesOut=function(b,f){return Buffer.from(b).toString('hex')};
global.strToBytes=function(s){return Array.from(Buffer.from(s,'utf8'))};
const ORDER=fs.readFileSync(P+'_order.txt','utf8').split('\n').filter(x=>x.trim());
ORDER.concat(['crypto_det_sig.js']).forEach(f=>{ try{ eval(fs.readFileSync(P+f,'utf8')); }catch(e){} });
['sha1Bytes','sha256Bytes','sha512Digest','hmacBytesSync','bigFromHex','bpow','bmod','binv','randBelow','CURVES','hexToBytes','bytesOut','strToBytes'].forEach(n=>{
  const v=(typeof window!=='undefined'?window:globalThis)[n];
  console.log(n, typeof v);
});
console.log('CURVES keys', Object.keys(global.CURVES||{}));
