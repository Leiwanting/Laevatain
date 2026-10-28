const fs=require('fs'); const vm=require('vm'); const P='/data/workspace/dist/';
global.window=globalThis; global.ALGOS=[]; global.reg=function(o){ALGOS.push(o)};
global.bytesOut=function(b,f){return Buffer.from(b).toString('hex')};
global.strToBytes=function(s){return Array.from(Buffer.from(s,'utf8'))};
const ORDER=fs.readFileSync(P+'_order.txt','utf8').split('\n').filter(x=>x.trim());
ORDER.forEach(f=>{ try{ vm.runInThisContext(fs.readFileSync(P+f,'utf8'),{filename:f}); }catch(e){ console.log('ERR',f,e.message);} });
const names=Object.getOwnPropertyNames(globalThis).filter(n=>/sha|hash|hmac|digest|OTP|CURVES/i.test(n));
names.forEach(n=>console.log(n, typeof globalThis[n]));
console.log('OTP', typeof globalThis.OTP, globalThis.OTP?Object.keys(globalThis.OTP):'');
