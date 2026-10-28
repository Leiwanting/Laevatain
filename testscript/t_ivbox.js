const {ALGOS}=require('./_harness.js');
const hex=b=>Buffer.from(b).toString('hex');
/* 有的 dec 返回字节、有的返回按格式编码后的字符串，统一成 hex 串再比 */
const norm=r=>(r instanceof Uint8Array||ArrayBuffer.isView(r))?hex(r):String(r);
let P=0,F=0;
const t=async(n,c)=>{ try{ (await c())?P++:(F++,console.log('FAIL',n)); }catch(e){ F++; console.log('ERR',n,'|',e.message);} };
const pt=new Uint8Array([0x11,0x22,0x33,0x44,0x55,0x66,0x77,0x88]);
(async()=>{
  // ---- ZUC-EEA3 / EIA3：IV 框与 COUNT 构造等价 ----
  const z=ALGOS.find(a=>a.id==='zuc-eea3'), zi=ALGOS.find(a=>a.id==='zuc-eia3');
  const key='3d4c4be96a82fdaeb58f641db17b455b';
  const cnt=0x66035492, be=0x0f, dir=1;
  const iv=new Uint8Array(16);
  iv[0]=(cnt>>>24)&255;iv[1]=(cnt>>>16)&255;iv[2]=(cnt>>>8)&255;iv[3]=cnt&255;
  iv[4]=((be&0x1f)<<3)|((dir&1)<<2);
  for(let i=8;i<16;i++) iv[i]=iv[i-8];
  const ivH=hex(iv);
  await t('EEA3 IV框==COUNT构造', async()=>
    (await z.enc(pt,key,`${cnt.toString(16)},${be.toString(16)},${dir}`,'hex'))===(await z.enc(pt,key,'','hex','',ivH)));
  await t('EEA3 填IV可解密回原文', async()=>
    hex(await z.dec(await z.enc(pt,key,'','hex','',ivH),key,'','hex','',ivH))===hex(pt));
  await t('EEA3 IV非16字节被拒', async()=>{try{await z.enc(pt,key,'','hex','','0011');return false;}catch(e){return /16 字节/.test(e.message);}});

  // ---- ChaCha20：此前无任何填写框 ----
  const cc=ALGOS.find(a=>a.id==='chacha20');
  await t('ChaCha20 声明了IV框', async()=>cc.ivNeed===true);
  const ccN='000102030405060708090a0b';
  const c1=await cc.enc(pt,'pw','','hex','',ccN);
  const c2=await cc.enc(pt,'pw','','hex','',ccN);
  await t('ChaCha20 同nonce结果确定', async()=>c1===c2);
  await t('ChaCha20 nonce已前置', async()=>c1.startsWith(ccN));
  await t('ChaCha20 填nonce可解密', async()=>norm(await cc.dec(c1,'pw','','hex','',ccN))===hex(pt));
  await t('ChaCha20 不填nonce也能自解', async()=>{
    const c=await cc.enc(pt,'pw','','hex'); return norm(await cc.dec(c,'pw','','hex'))===hex(pt);});
  await t('ChaCha20 nonce长度错被拒', async()=>{try{await cc.enc(pt,'pw','','hex','','0011');return false;}catch(e){return /12 字节/.test(e.message);}});
  await t('ChaCha20 密文格式选Hex也能自解', async()=>{
    const c=await cc.enc(pt,'pw','','hex','',ccN); return norm(await cc.dec(c,'pw','','hex','',ccN))===hex(pt);});

  // ---- Salsa20 ----
  const sa=ALGOS.find(a=>a.id==='salsa20');
  const sk='000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
  const sn='0001020304050607';
  await t('Salsa20 声明了IV框', async()=>sa.ivNeed===true);
  const s1=await sa.enc(pt,sk,'','hex','',sn);
  await t('Salsa20 IV框==参数栏', async()=>s1===(await sa.enc(pt,sk,sn,'hex')));
  await t('Salsa20 填nonce可解密', async()=>norm(await sa.dec(s1,sk,'','hex','',sn))===hex(pt));

  // ---- XChaCha12 / 8 ----
  for(const [id,nb] of [['xchacha12',24],['xchacha8',24]]){
    const a=ALGOS.find(x=>x.id===id);
    await t(id+' 声明了IV框', async()=>a.ivNeed===true);
    const n='00'.repeat(nb);
    const kk='00'.repeat(32);
    const e1=await a.enc(pt,kk,'','hex','',n);
    await t(id+' IV框==参数栏', async()=>e1===(await a.enc(pt,kk,n,'hex')));
    await t(id+' 填nonce可解密', async()=>norm(await a.dec(e1,kk,'','hex','',n))===hex(pt));
  }

  // ---- ZUC-128 原始 ----
  const zu=ALGOS.find(a=>a.id==='zuc');
  await t('ZUC-128 声明了IV框', async()=>zu.ivNeed===true);
  const zk='00'.repeat(16), zv='11'.repeat(16);
  const z1=await zu.enc(pt,zk,'','hex','',zv);
  await t('ZUC-128 IV框==参数栏', async()=>z1===(await zu.enc(pt,zk,zv,'hex')));
  await t('ZUC-128 填IV可解密', async()=>norm(await zu.dec(z1,zk,'','hex','',zv))===hex(pt));

  console.log(`\nIV框专项 PASS=${P} FAIL=${F}`);
  process.exit(F?1:0);
})();
