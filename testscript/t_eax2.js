/* t_eax2.js —— EAX 官方向量验收（Botan 2.19.5 src/tests/data/aead/eax.vec）
 *
 * 修正记录（第九十四批）：
 *  1) 旧版 omacT 用「t 为 1 字节前缀」＝ CMAC(t ‖ M)，与 EAX 规范不符。
 *     规范是 OMAC^t(M) = CMAC( 0^(bs-1) ‖ t ‖ M )，t 占【一个完整块】的最后一字节。
 *     旧版因此 5/5 全错（PASS 0 / FAIL 5），并非实现有问题。
 *  2) 旧版解析器只在遇到 `Key` 时开新用例，但文件后半段（Wycheproof 部分，
 *     "# Following EAX tests from Wycheproof" 之后）字段顺序是 In → Key → Nonce
 *     → AD → Out，In 排在 Key 之前，导致 17 条字段错位、误报 18 个失败。
 *     现改为「字段名在本条内重复即开新条」，两种顺序都能正确切分。
 *  3) 结果：106/106 全过（AES-128/EAX(8) 2、AES-128/EAX 93、AES-192 5、AES-256 6），
 *     解密回程 106/106。实现本来就是对的，坏的是这个脚本。
 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const DIST=path.join(__dirname,'..','dist');
const ctx={console,setTimeout,TextEncoder,TextDecoder,Uint8Array,Int32Array,BigInt,Math,Date,JSON,crypto:require('crypto').webcrypto};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;
ctx.addEventListener=function(){};ctx.document={addEventListener:function(){},getElementById:function(){return null},querySelectorAll:function(){return []},createElement:function(){return {style:{},setAttribute:function(){},appendChild:function(){}}}};
vm.createContext(ctx);
const html=fs.readFileSync(path.join(DIST,'index.html'),'utf8');
[...html.matchAll(/src=['"]([^'"]+\.js)['"]/g)].map(m=>m[1]).forEach(f=>vm.runInContext(fs.readFileSync(path.join(DIST,f),'utf8'),ctx,{filename:f}));
function hex(b){return Buffer.from(b).toString('hex').toLowerCase();}
const B=path.join(DIST,'testvectors','eax_botan.vec');
let sec=null,cur=null,vs=[];
for(const raw of fs.readFileSync(B,'utf8').split('\n')){
  const t=raw.trim();
  if(t.startsWith('[')){sec=t.slice(1,-1);cur=null;continue;}
  if(!t||t.startsWith('#'))continue;
  const m=t.match(/^(\w+)\s*=\s*(.*)$/);
  if(!m)continue;
  const k=m[1],val=m[2].trim();
  if(!cur||cur[k]!==undefined){cur={_s:sec};vs.push(cur);}
  cur[k]=val;
}
let p=0,f=0,s=0,dec=0,decf=0;const bySec={};
for(const v of vs){
  const sm=(v._s||'').match(/^AES-(\d+)\/EAX(?:\((\d+)\))?$/);
  if(!sm){s++;continue;}
  const kl=parseInt(sm[1],10)/8, tagLen=sm[2]?parseInt(sm[2],10):16;
  const key=Uint8Array.from(Buffer.from(v.Key||'','hex'));
  if(key.length!==kl){s++;continue;}
  const nonce=Uint8Array.from(Buffer.from(v.Nonce||'','hex'));
  const inb=Uint8Array.from(Buffer.from(v.In||'','hex'));
  const ad=Uint8Array.from(Buffer.from(v.AD||'','hex'));
  const exp=(v.Out||'').toLowerCase();
  if(!exp){s++;continue;}
  const r=ctx._eaxEncrypt(inb,key,nonce,ad,tagLen);
  const got=hex(r.ciphertext)+hex(r.tag);
  const ok=(got===exp);
  bySec[v._s]=bySec[v._s]||{p:0,f:0};
  if(ok){p++;bySec[v._s].p++;}else{f++;bySec[v._s].f++;if(f<=3)console.log('FAIL',v._s,'In',inb.length,'AD',ad.length,'\n exp',exp,'\n got',got);}
  const raw=Uint8Array.from(Buffer.from(hex(nonce)+got,'hex'));
  try{const pt=ctx._eaxDecrypt(raw,key,nonce.length,ad,tagLen);if(hex(pt)===hex(inb))dec++;else decf++;}catch(e){decf++;}
}
for(const k in bySec)console.log(' ',k,'PASS',bySec[k].p,'FAIL',bySec[k].f);
console.log('EAX 加密 PASS',p,'FAIL',f,'SKIP',s);
console.log('EAX 解密回程 PASS',dec,'FAIL',decf);
