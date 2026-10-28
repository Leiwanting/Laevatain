const fs=require('fs');
const H=require('./_harness.js');
const A=H.ALGOS;
function get(id){ for(const a of A) if(a.id===id) return a; throw new Error('missing '+id); }
let P=0,F=0;
function norm(v){ if(v instanceof Uint8Array||Array.isArray(v)) return Buffer.from(v).toString('hex'); return String(v); }
function eq(g,e,l){ g=norm(g).toLowerCase(); e=String(e).toLowerCase();
  if(g===e){P++;console.log('  PASS '+l);} else {F++;console.log('  FAIL '+l+'\n    got '+g+'\n    exp '+e);} }
function isT(c,l){ if(c){P++;console.log('  PASS '+l);} else {F++;console.log('  FAIL '+l);} }
function throws(fn,l){ let t=false; try{fn();}catch(e){t=true;}
  if(t){P++;console.log('  PASS '+l);} else {F++;console.log('  FAIL '+l+' (应抛异常但没抛)');} }

const dir='/data/workspace/work/aegis/';
/* 标签长度不再由条目区分，而是界面下拉（此处用 __AEGIS_TAG_B 覆盖模拟）。 */
function setTagB(n){ globalThis.__AEGIS_TAG_B = n; }
for(const [variant,f,id] of [['L','aegis-128l-test-vectors.json','aegis128l'],
                             ['P','aegis-256-test-vectors.json','aegis256aead']]){
  const tvs=JSON.parse(fs.readFileSync(dir+f));
  for(const tv of tvs){
    if(!tv.key) continue;
    console.log('['+variant+' '+tv.name+']');
    const key=tv.key, nonce=tv.nonce, ad=tv.ad||'', ct=tv.ct||'', t128=tv.tag128, t256=tv.tag256;
    const e=get(id);
    if(tv.error){
      setTagB(16); throws(()=>e.dec(ad+','+ct+t128, key, nonce, 'hex'), '128tag reject');
      setTagB(32); throws(()=>e.dec(ad+','+ct+t256, key, nonce, 'hex'), '256tag reject');
    } else {
      setTagB(16); eq(e.enc(ad+','+(tv.msg||''), key, nonce, 'hex'), ct+t128, 'enc tag128');
      setTagB(32); eq(e.enc(ad+','+(tv.msg||''), key, nonce, 'hex'), ct+t256, 'enc tag256');
      /* 解密不指定长度：应自动识别（下拉默认 16，输入实为 32 标签也要能解开） */
      setTagB(16); eq(e.dec(ad+','+ct+t256, key, nonce, 'hex'), tv.msg||'', 'dec 自动识别 256 位标签');
      setTagB(32); eq(e.dec(ad+','+ct+t128, key, nonce, 'hex'), tv.msg||'', 'dec 自动识别 128 位标签');
      setTagB(16); eq(e.dec(ad+','+ct+t128, key, nonce, 'hex'), tv.msg||'', 'dec tag128');
      setTagB(32); eq(e.dec(ad+','+ct+t256, key, nonce, 'hex'), tv.msg||'', 'dec tag256');
    }
  }
}
setTagB(16);
// 长度校验
const e=get('aegis128l');
throws(()=>e.enc('', '0011', '00112233445566778899aabbccddeeff','hex'), 'bad keylen');
throws(()=>e.enc('', '10010000000000000000000000000000', '0011','hex'), 'bad noncelen');
throws(()=>e.dec(',00112233445566778899aabbccddeeff'.slice(1), '10010000000000000000000000000000','10000200000000000000000000000000','hex'), 'too short');
console.log('\nPASS '+P+'  FAIL '+F);
