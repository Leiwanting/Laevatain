const {ALGOS}=require('/data/workspace/dist/testscript/_harness.js');
const hex=b=>Buffer.from(b).toString('hex');
(async()=>{
  const bad=[]; let n=0;
  for(const a of ALGOS){
    if(!a.isSym||typeof a.makeBlockFn!=='function') continue;
    const bs=a.blockSize||16;
    if(!bs||bs>64) continue;
    const key=new Uint8Array(a.keyLen||16).fill(0x5a);
    const blk=new Uint8Array(bs); for(let i=0;i<bs;i++)blk[i]=(i*11+1)&0xff;
    let rs=[];
    try{
      for(let k=0;k<3;k++){ const bf=a.makeBlockFn(key); rs.push(hex(bf.enc(blk))); }
    }catch(e){ continue; }
    n++;
    if(!(rs[0]===rs[1]&&rs[1]===rs[2])) bad.push({id:a.id,bs,rs});
  }
  console.log('已探测分组密码条目:',n);
  console.log('幂等性不一致(状态污染):',bad.length);
  bad.forEach(b=>console.log('  ✗',b.id,'bs='+b.bs,'\n      #1',b.rs[0],'\n      #2',b.rs[1],'\n      #3',b.rs[2]));
})();
