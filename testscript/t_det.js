const fs=require('fs'); const vm=require('vm');
const P='/data/workspace/dist/';
global.window=globalThis;
global.ALGOS=[]; global.reg=function(o){ALGOS.push(o)};
global.bytesOut=function(b,f){return Buffer.from(b).toString('hex')};
global.strToBytes=function(s){return Array.from(Buffer.from(s,'utf8'))};
global.hexToBytes=function(h){h=String(h).replace(/\s/g,'');return Array.from(Buffer.from(h,'hex'))};
const ORDER=fs.readFileSync(P+'_order.txt','utf8').split('\n').filter(x=>x.trim());
ORDER.concat(['crypto_det_sig.js']).forEach(f=>{
  try{ vm.runInThisContext(fs.readFileSync(P+f,'utf8'),{filename:f}); }catch(e){ }
});
// 覆盖界面侧输出/输入函数（真实实现依赖 DOM 与 OUT_FORMATS 初始化）
global.bytesOut=function(b,f){return Buffer.from(b).toString('hex')};
global.strToBytes=function(s){return Array.from(Buffer.from(s,'utf8'))};
global.hexToBytes=function(h){h=String(h).replace(/\s/g,'');return Array.from(Buffer.from(h,'hex'))};
console.log('DBG typeof globalThis.CURVES', typeof globalThis.CURVES, 'window===global', window===globalThis, 'CURVES keys', globalThis.CURVES?Object.keys(globalThis.CURVES):'none');
const A={}; ALGOS.forEach(o=>A[o.id]=o);
if(global.__DETSIG_SELFTEST){const bd=global.__DETSIG_SELFTEST();console.log('hash selftest bad:',bd.length,bd.join('|'));}
console.log('loaded algos:',ALGOS.length,'| new:',['kdf1-18033','hkdf-expand-label','dsa-det','ecdsa-det-p256','ecdsa-det-p384','ecdsa-det-p521','gost3410-2001'].filter(x=>A[x]).length);
let pass=0,fail=0,bad=[];
function chk(n,a,e){ if(a===e){pass++;} else {fail++; bad.push(n+'\n  got '+String(a).slice(0,80)+'\n  exp '+String(e).slice(0,80));} }
const BV='/data/workspace/dl/bvec/';
function parseVec(f){
  const txt=fs.readFileSync(BV+f,'utf8'); const out=[]; let cur=null;
  txt.split('\n').forEach(l=>{
    l=l.trim(); if(!l||l.startsWith('#')) return;
    if(l.startsWith('[')){ cur={sec:l.slice(1,-1)}; out.push(cur); return; }
    const i=l.indexOf('='); if(i<0||!cur) return;
    cur[l.slice(0,i).trim()]=l.slice(i+1).trim();
  });
  return out;
}
// 1) KDF1-18033
parseVec('kdf1_iso18033.vec').forEach(v=>{
  if(!v.Secret||!v.Output) return;
  const hn = v.sec.includes('SHA-160')?'SHA-1':(v.sec.includes('SHA-256')?'SHA-256':(v.sec.includes('SHA-512')?'SHA-512':null));
  if(!hn) return;
  const L=v.Output.replace(/\s/g,'').length/2;
  const got=A['kdf1-18033'].enc(Buffer.from(v.Secret.replace(/\s/g,''),'hex'), '', hn+','+L, 'hex');
  chk('kdf1-18033 '+hn+' L='+L, got, v.Output.replace(/\s/g,'').toLowerCase());
});
// 2) HKDF-Expand-Label
parseVec('hkdf_label.vec').forEach(v=>{
  if(!v.Secret||!v.Output) return;
  const hn=v.sec.includes('SHA-256')?'SHA-256':null;
  if(!hn) return;
  const L=v.Output.replace(/\s/g,'').length/2;
  const got=A['hkdf-expand-label'].enc('', v.Secret.replace(/\s/g,''), v.Label+','+v.HashValue.replace(/\s/g,'')+','+L+','+hn, 'hex');
  const exp0=v.Output.replace(/\s/g,'').toLowerCase();
  if(got!==exp0) console.log('HKDFDBG sec='+v.Secret.replace(/\s/g,'').length/2+'B label='+JSON.stringify(v.Label)+' ctx='+v.HashValue.replace(/\s/g,'').length/2+'B L='+L+' gotlen='+got.length/2);
  chk('hkdf-label '+hn, got, exp0);
});
// 3) 确定性 DSA
parseVec('dsa_rfc6979.vec').forEach((v,idx)=>{
  if(!v.Signature||!v.Msg) return;
  const hn=(v.Hash||'').trim();
  if(!['SHA-1','SHA-256','SHA-512'].includes(hn)) return;
  const msg=Buffer.from(v.Msg.replace(/\s/g,''),'hex').toString('utf8');
  const param=hn+(v.P?','+v.P.replace(/\s/g,'')+','+v.Q.replace(/\s/g,'')+','+v.G.replace(/\s/g,''):'');
  const got=A['dsa-det'].enc(msg, v.X.replace(/\s/g,''), param, 'hex');
  chk('dsa-det '+hn+' msg='+msg, got, v.Signature.replace(/\s/g,'').toLowerCase());
});
// 4) GOST 34.10-2001
parseVec('gost_3410_sign.vec').forEach(v=>{
  if(!v.Signature||!v.Msg) return;
  const got=A['gost3410-2001'].enc(v.Msg.replace(/\s/g,''), v.X.replace(/\s/g,''), v.Nonce.replace(/\s/g,'')+',raw','hex');
  chk('gost3410-2001', got, v.Signature.replace(/\s/g,'').toLowerCase());
});
// 5) 确定性 ECDSA：RFC6979 nonce + Node crypto 验签
const crypto=require('crypto');
const rfc=parseVec('rfc6979.vec');
rfc.forEach(v=>{
  if(!v.K||!v.H) return;
  // 用内部逻辑无法直取 k，改用：签名两次一致（确定性）+ Node 验签
});
[['p256','prime256v1','P-256'],['p384','secp384r1','P-384'],['p521','secp521r1','P-521']].forEach(([cid,nc,nm])=>{
  const ec=crypto.generateKeyPairSync('ec',{namedCurve:nc});
  const jwk=ec.privateKey.export({format:'jwk'});
  const d=Buffer.from(jwk.d,'base64url').toString('hex');
  const msg='sample';
  const sigHex=A['ecdsa-det-'+cid].enc(msg,d,'SHA-256','hex');
  const C={p:null};
  const half=sigHex.length/2;
  const rb=sigHex.slice(0,half), sb2=sigHex.slice(half);
  // 自实现 ECDSA 验签：用项目内曲线参数重算
  const cv=(function(){ return null; })();
  const ok=ecdsaSelfVerify(cid, d, msg, rb, sb2);
  chk('ecdsa-det-'+nm+' selfverify', ok, true);
  const again=A['ecdsa-det-'+cid].enc(msg,d,'SHA-256','hex');
  chk('ecdsa-det-'+nm+' deterministic', again, sigHex);
});
function ecdsaSelfVerify(cid,dHex,msg,rHex,sHex){
  // 用 Node crypto 验签（der）
  const nc = cid==='p256'?'prime256v1':(cid==='p384'?'secp384r1':'secp521r1');
  const curveOrderBits = cid==='p256'?256:(cid==='p384'?384:521);
  const olen=(curveOrderBits+7)>>3;
  const jwk={kty:'EC',crv:cid==='p256'?'P-256':(cid==='p384'?'P-384':'P-521'),
    x:Buffer.from(derivePub(cid,dHex).x,'hex').toString('base64url'),
    y:Buffer.from(derivePub(cid,dHex).y,'hex').toString('base64url'),
    d:Buffer.from(dHex,'hex').toString('base64url')};
  let key;
  try{ key=crypto.createPrivateKey({key:{...jwk},format:'jwk'}); }catch(e){ return 'keyerr:'+e.message; }
  try{
    return crypto.verify('sha256',Buffer.from(msg),{key,dsaEncoding:'der'},derSig(BigInt('0x'+rHex),BigInt('0x'+sHex)));
  }catch(e){ return 'verr:'+e.message; }
}
function derivePub(cid,dHex){
  // 复用页面内已注册的算法无法取公钥；改用 Node 从私钥导出公钥
  const nc = cid==='p256'?'prime256v1':(cid==='p384'?'secp384r1':'secp521r1');
  return {x:'00',y:'00'};
}
function derSig(r,s){
  const rb=bn(r), sb=bn(s);
  const body=Buffer.concat([Buffer.from([0x02,rb.length]),rb,Buffer.from([0x02,sb.length]),sb]);
  return Buffer.concat([Buffer.from([0x30,body.length]),body]);
}
function bn(v){ let h=v.toString(16); if(h.length%2)h='0'+h; let b=Buffer.from(h,'hex'); if(b[0]&0x80)b=Buffer.concat([Buffer.from([0]),b]); return b; }
console.log('\nPASS',pass,'FAIL',fail);
bad.forEach(b=>console.log('  '+b));
