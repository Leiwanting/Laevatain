/* AEGIS-128X / 256X / AEGISMAC 官方向量验收
   向量来源：CFRG draft-irtf-cfrg-aegis-aead（RFC 10032 的同一份文档）
   标签长度由 __AEGIS_TAG_B 覆盖（等价于界面「AEAD 标签长度」下拉） */
const fs=require('fs');
const H=require('./_harness.js');
const A=H.ALGOS;
const dir='/data/workspace/work/aegis/';
let P=0,F=0;
function get(id){ for(const a of A) if(a.id===id) return a; throw new Error('missing '+id); }
function norm(v){ if(v instanceof Uint8Array||Array.isArray(v)) return Buffer.from(v).toString('hex'); return String(v); }
function eq(g,e,l){ g=norm(g).toLowerCase(); e=String(e).toLowerCase();
  if(g===e){P++;console.log('  PASS '+l);} else {F++;console.log('  FAIL '+l+'\n    got '+g+'\n    exp '+e);} }
function setTagB(n){ globalThis.__AEGIS_TAG_B=n; }

const XS=[['aegis128x2','aegis-128x2-test-vectors.json'],['aegis128x4','aegis-128x4-test-vectors.json'],
          ['aegis256x2','aegis-256x2-test-vectors.json'],['aegis256x4','aegis-256x4-test-vectors.json']];
for(const [id,f] of XS){
  const tvs=JSON.parse(fs.readFileSync(dir+f)).filter(t=>/^Test Vector/.test(t.name));
  const e=get(id);
  for(const tv of tvs){
    console.log('['+id+' '+tv.name+']');
    setTagB(16); eq(e.enc(tv.ad+','+tv.msg, tv.key, tv.nonce, 'hex'), tv.ct+tv.tag128, 'enc tag128');
    setTagB(32); eq(e.enc(tv.ad+','+tv.msg, tv.key, tv.nonce, 'hex'), tv.ct+tv.tag256, 'enc tag256');
    setTagB(16); eq(e.dec(tv.ad+','+tv.ct+tv.tag256, tv.key, tv.nonce, 'hex'), tv.msg, 'dec 自动识别 256 位标签');
    setTagB(32); eq(e.dec(tv.ad+','+tv.ct+tv.tag128, tv.key, tv.nonce, 'hex'), tv.msg, 'dec 自动识别 128 位标签');
  }
}
const MS=[['aegismac128l','AEGISMAC-128L'],['aegismac256','AEGISMAC-256'],
          ['aegismac128x2','AEGISMAC-128X2'],['aegismac128x4','AEGISMAC-128X4'],
          ['aegismac256x2','AEGISMAC-256X2'],['aegismac256x4','AEGISMAC-256X4']];
const tvs=JSON.parse(fs.readFileSync(dir+'aegismac-test-vectors.json'));
for(const [id,nm] of MS){
  const tv=tvs.find(t=>t.name.indexOf(nm)===0); if(!tv){F++;console.log('  FAIL 缺向量 '+nm);continue;}
  const e=get(id);
  console.log('['+nm+']');
  setTagB(16); eq(e.enc(tv.data, tv.key, tv.nonce, 'hex'), tv.tag128, 'mac tag128');
  setTagB(32); eq(e.enc(tv.data, tv.key, tv.nonce, 'hex'), tv.tag256, 'mac tag256');
}
setTagB(16);
console.log('\nPASS '+P+'  FAIL '+F);
