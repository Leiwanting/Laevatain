const fs=require('fs'); const vm=require('vm'); const P='/data/workspace/dist/';
global.window=globalThis; global.ALGOS=[]; global.reg=function(o){ALGOS.push(o)};
const ORDER=fs.readFileSync(P+'_order.txt','utf8').split('\n').filter(x=>x.trim());
ORDER.concat(['crypto_det_sig.js']).forEach(f=>{ try{ vm.runInThisContext(fs.readFileSync(P+f,'utf8'),{filename:f}); }catch(e){} });
global.bytesOut=function(b){return Buffer.from(b).toString('hex')};
global.strToBytes=function(s){return Array.from(Buffer.from(s,'utf8'))};
const A={}; ALGOS.forEach(o=>A[o.id]=o);
let pass=0,fail=0,bad=[];
function chk(n,a,e){ if(a===e)pass++; else {fail++; bad.push(n+'\n   got '+a+'\n   exp '+e);} }
console.log('hash selftest bad:', global.__DETSIG_SELFTEST().length);
console.log('new algos:', ['kdf1-18033','hkdf-expand-label','dsa-det','ecdsa-det-p256','ecdsa-det-p384','gost3410-2001'].filter(x=>A[x]).length, '| total', ALGOS.length);
// KDF1-18033 官方三组
const s1='D6E168C5F256A2DCFF7EF12FACD390F393C7A88D';
chk('kdf1-18033 SHA-1 L=128', A['kdf1-18033'].enc(Buffer.from(s1,'hex'),'','SHA-1,128','hex'),
 'c325ebbb41a82551d5d0ad4834870a05ef3918c8caae38873f07dca43127a4dee36a6ca5970f6c06926037de7df79c4915d83ff705821d2c46a1fa7bb81b73e27176feb7fd3a45e40b843f1aaebccb1ef4fa7ee3b9b491a342f43eaaa435efded41e0a3a6ec2eff1f2ed95');
const s2='B711F58766B5D696513538F03036F30E0FC11CE1CAAE38873F07DCA43127A4DEE36A6CA5970F6C06926037DE7DF79C4915D83FF705821D2C46A1FA7BB81B73E27176FEB7FD3A45E40B843F1AAEBCCB1FD4AE168ACA94F8D062951EDEC1469BFEB97B79490FA58AD1D3CCB4';
chk('kdf1-18033 SHA-1 L=20', A['kdf1-18033'].enc(Buffer.from(s2,'hex'),'','SHA-1,20','hex'),'281d7cb2d7d5531ed1f9382152d9be9a89a1df09');
// HKDF-Expand-Label（分号分隔）
chk('hkdf-label #1', A['hkdf-expand-label'].enc('','fb8e20fc2e4c3f248c60c39bd652f3c1347298bb977b8b4d5903b85055620603',
 'TLS 1.3, something or other;e5007b1522d10013a1a7a32b3a6f82df1861074ba3d592abc9656cef425d1e9a;24;SHA-256','hex'),
 '531c0f2906532ece3c7c352b73885a87558d6b2f');
chk('hkdf-label #2', A['hkdf-expand-label'].enc('','4e26e6cc23cff7773690e838ed16648b4143d200b5835e6f38525055e0f71cb2',
 'TLS 1.3, something or other;16ff13612414de6dd55a976d355418756129a69eeaf116b807f6dd;20;SHA-256','hex'),
 '1f55b71137985032969620eb7f598694ae16f490');
// 确定性 DSA（RFC 6979 A.2.1 默认参数）
const X='411602CB19A6CCC34494D79D98EF1E7ED5AF25F7';
chk('dsa-det SHA-1 sample', A['dsa-det'].enc('sample',X,'SHA-1','hex'),'2e1a0c2562b2912caaf89186fb0f42001585da5529efb6b0aff2d7a68eb70ca313022253b9a88df5');
chk('dsa-det SHA-256 sample', A['dsa-det'].enc('sample',X,'SHA-256','hex'),'81f2f5850be5bc123c43f71a3033e9384611c5454cdd914b65eb6c66a8aaad27299bee6b035f5e89');
chk('dsa-det SHA-512 sample', A['dsa-det'].enc('sample',X,'SHA-512','hex'),'16c3491f9b8c3fbbdd5e7a7b667057f0d8ee8e1b02c36a127a7b89edbb72e4ffbc71dabc7d4fc69c');
chk('dsa-det SHA-1 test', A['dsa-det'].enc('test',X,'SHA-1','hex'),'42ab2052fd43e123f0607f115052a67dcd9c5c77183916b0230d45b9931491d4c6b0bd2fb4aaf088');
// GOST R 34.10-2001
chk('gost3410-2001', A['gost3410-2001'].enc('E53E042B67E6EC678E2E02B12A0352CE1FC6EEE0529CC088119AD872B3C1FB2D',
 '7A929ADE789BB9BE10ED359DD39A72C11B60961F49397EEE1D19CE9891EC3B28',
 '77105C9B20BCD3122823C8CF6FCC7B956DE33814E95B7FE64FED924594DCEAB3,raw','hex'),
 '01456c64ba4642a1653c235a98a60249bcd6d3f746b631df928014f6c5bf9c4041aa28d2f1ab148280cd9ed56feda41974053554a42767b83ad043fd39dc0493');
// 确定性 ECDSA：Node 验签
const crypto=require('crypto');
function derSig(r,s){const rb=bn(r),sb=bn(s);const body=Buffer.concat([Buffer.from([0x02,rb.length]),rb,Buffer.from([0x02,sb.length]),sb]);return Buffer.concat([Buffer.from([0x30,body.length]),body]);}
function bn(v){let h=v.toString(16);if(h.length%2)h='0'+h;let b=Buffer.from(h,'hex');let i=0;while(i<b.length-1&&b[i]===0)i++;b=b.slice(i);if(b[0]&0x80)b=Buffer.concat([Buffer.from([0]),b]);return b;}
[['p256','prime256v1','P-256'],['p384','secp384r1','P-384']].forEach(([cid,nc,nm])=>{
  const ec=crypto.generateKeyPairSync('ec',{namedCurve:nc});
  const d=Buffer.from(ec.privateKey.export({format:'jwk'}).d,'base64url').toString('hex');
  const sig=A['ecdsa-det-'+cid].enc('sample',d,'SHA-256','hex');
  const half=sig.length/2;
  let ok=false; try{ ok=crypto.verify('sha256',Buffer.from('sample'),{key:ec.publicKey,dsaEncoding:'der'},derSig(BigInt('0x'+sig.slice(0,half)),BigInt('0x'+sig.slice(half)))); }catch(e){ ok='err '+e.message; }
  chk('ecdsa-det-'+nm+' verify', ok, true);
  chk('ecdsa-det-'+nm+' deterministic', A['ecdsa-det-'+cid].enc('sample',d,'SHA-256','hex'), sig);
});
console.log('\nPASS',pass,'FAIL',fail); bad.forEach(b=>console.log('  '+b));
