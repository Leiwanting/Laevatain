/* MARS 回归测试
   官方向量：Crypto++ 8.9.0 TestVectors/mars.txt（10 组，含 16/24/32 字节密钥）
   扩展向量：从 Crypto++ mars.cpp 抽出的独立 C 参照实现产出（40/48/56 字节密钥） */
const fs=require('fs');
const H=require('./_harness.js');
const A=H.ALGOS;
function get(id){ for(const a of A) if(a.id===id) return a; throw new Error('missing '+id); }
let P=0,F=0;
function eq(g,e,l){ g=String(g).toLowerCase(); e=String(e).toLowerCase();
  if(g===e){P++;console.log('  PASS '+l);} else {F++;console.log('  FAIL '+l+'\n    got '+g+'\n    exp '+e);} }
function isT(c,l){ if(c){P++;console.log('  PASS '+l);} else {F++;console.log('  FAIL '+l);} }

const kat=JSON.parse(fs.readFileSync('testvectors/mars_kat.json','utf8'));

/* ---- 1. 官方向量（加解密双向）---- */
for(const tv of kat.official){
  const K=MARS.keySchedule(Uint8Array.from(Buffer.from(tv.key,'hex')));
  const pt=Uint8Array.from(Buffer.from(tv.pt,'hex'));
  const ct=Uint8Array.from(Buffer.from(tv.ct,'hex'));
  const tag='klen='+(tv.key.length/2);
  eq(bytesToHex(MARS.encryptBlock(pt,K)), tv.ct, 'enc '+tag);
  eq(bytesToHex(MARS.decryptBlock(ct,K)), tv.pt, 'dec '+tag);
}
/* ---- 2. C 参照扩展向量（40/48/56 字节密钥）---- */
for(const L of ['40','48','56']){
  const tv=kat.c_ref_extra[L];
  const K=MARS.keySchedule(Uint8Array.from(Buffer.from(tv.key,'hex')));
  const pt=Uint8Array.from(Buffer.from(tv.pt,'hex'));
  eq(bytesToHex(MARS.encryptBlock(pt,K)), tv.ct, 'C参照 enc klen='+L);
  eq(bytesToHex(MARS.decryptBlock(MARS.encryptBlock(pt,K),K)), tv.pt, '往返 klen='+L);
}
/* ---- 3. S 盒校验点 ---- */
isT(MARS.Sbox[0]===0x09d0c479 && MARS.Sbox[265]===0xa4a8d57b && MARS.Sbox[511]===0x19af70ee, 'S 盒校验点');

/* ---- 4. 走注册入口（模式层/格式层），不只测底层块函数 ---- */
(async function(){
  for(const id of ['mars128','mars192','mars256']){
    const a=get(id);
    const r=await symEncrypt(a, Uint8Array.from(Buffer.from('00112233445566778899aabbccddeeff0011','hex')),
      'abc', 'ECB', 'PKCS7', '', false, '', '', 16);
    const back=await symDecrypt(a, r.ciphertext, 'abc', 'ECB', 'PKCS7', r.iv||'', '', '', 16);
    eq(bytesToHex(back.plaintext||back), '00112233445566778899aabbccddeeff0011', id+' 入口往返 18 字节');
  }
  /* CBC 带 IV 往返 */
  const a=get('mars256');
  const r2=await symEncrypt(a, Uint8Array.from(Buffer.from('aabbccddeeff00112233','hex')),
    'k', 'CBC', 'PKCS7', '000102030405060708090a0b0c0d0e0f', true, '', '', 16);
  const b2=await symDecrypt(a, r2.ciphertext, 'k', 'CBC', 'PKCS7', '', '', '', 16);
  eq(bytesToHex(b2.plaintext||b2), 'aabbccddeeff00112233', 'mars256 CBC 往返');
  console.log('\nMARS: PASS '+P+'  FAIL '+F);
  process.exit(F?1:0);
})();
