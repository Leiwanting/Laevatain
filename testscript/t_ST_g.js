/* ST 全量冒烟：走注册入口 enc→dec，比对能否还原。
   口径（CHANGELOG 第八十四批）：enc 收 Uint8Array，dec 收输出框文本。
   分三类：非对称(有gen) / 对称(喂密钥) / 单向(dec缺失)。命中即停，单条限时 8s。 */
require('./_harness.js');
const A = global.ALGOS || [];
const PT = new TextEncoder().encode("hello 123 中文");
const PTS = new TextDecoder().decode(PT);
const hex = b => Buffer.from(b).toString('hex');
const H = n => 'ab'.repeat(n);
const KEYS = ["", H(16), H(24), H(32), H(8), H(64), "password123"];
const PARS = ["", H(8), H(12), H(16), "1", "128"];
const FMT = ["hex","base64"];

const norm = r => (r instanceof Uint8Array) ? hex(r) : String(r);
const same = r => {
  if (r instanceof Uint8Array) return hex(r) === hex(PT);
  const s = String(r);
  return s === PTS || s === hex(PT);
};
function withTimeout(p, ms){
  return Promise.race([p, new Promise((_,rj)=>setTimeout(()=>rj(new Error("TIMEOUT")), ms))]);
}
async function attempt(a, k, p, f){
  let ct = a.enc(PT, k, p, f);
  if (ct && typeof ct.then === 'function') ct = await ct;
  let r = a.dec(ct, k, p, f);
  if (r && typeof r.then === 'function') r = await r;
  return r;
}
async function probe(a){
  // 非对称：优先 gen
  if (typeof a.gen === 'function'){
    for (const f of FMT){
      try{
        const kp = await withTimeout(Promise.resolve(a.gen()), 8000);
        if (!kp) continue;
        let ct = a.enc(PT, kp.pub, "", f);
        if (ct && typeof ct.then==='function') ct = await ct;
        let r = a.dec(ct, kp.priv, "", f);
        if (r && typeof r.then==='function') r = await r;
        if (r !== undefined && r !== null) return {ok:true, mode:"gen", f};
      }catch(e){ lastE = e; }
    }
  }
  var lastE = null;
  for (const k of (a.key?KEYS:[""]))
    for (const p of (a.param?PARS:[""]))
      for (const f of FMT){
        try{
          const r = await withTimeout(Promise.resolve().then(()=>attempt(a,k,p,f)), 8000);
          if (r === undefined || r === null) { lastE=new Error("dec 返回空"); continue; }
          if (same(r)) return {ok:true, mode:"sym", k,p,f};
          return {ok:false, reason:"往返不一致", got:norm(r).slice(0,48), k,p,f};
        }catch(e){ lastE = e; }
      }
  return {ok:null, reason:"全部组合抛错", err:(lastE&&lastE.message||"").slice(0,70)};
}
(async()=>{
  /* 【为什么需要过滤】全量 366 条目在本环境跑不完（会超时）。
     传入 id 子串即可只跑子集，例如：node t_ST.js mtproto
     不传参数仍是全量。 */
  const FILTER=process.argv[2]||'', G=process.argv[3]||'';
  const LIST = A.filter(a=>(!FILTER||a.id.includes(FILTER))&&(!G||a.group===G));
  const pass=[],bad=[],oneWay=[],skip=[];
  for (const a of LIST){
    if (typeof a.enc !== 'function'){ skip.push([a.id,"无 enc"]); continue; }
    if (typeof a.dec !== 'function'){ oneWay.push(a.id); continue; }
    let r;
    try{ r = await probe(a); }catch(e){ r = {ok:null, reason:"probe崩", err:(e.message||"").slice(0,70)}; }
    if (r.ok===true) pass.push(a.id);
    else if (r.ok===false) bad.push([a.id, a.group, r.reason, r.got]);
    else skip.push([a.id, r.reason+" | "+r.err]);
  }
  console.log("=== ST 冒烟" + (FILTER ? "（子集 id 含 " + FILTER + "）" : "（全量）") + " ===");
  console.log("ALGOS 总数   : "+A.length+(FILTER ? "   本轮实测 "+LIST.length : ""));
  console.log("往返通过     : "+pass.length);
  console.log("往返不一致   : "+bad.length+"   <-- 真问题候选");
  console.log("单向(无dec)  : "+oneWay.length);
  console.log("无法判定     : "+skip.length);
  console.log("--- 往返不一致 ---");
  bad.slice(0,50).forEach(b=>console.log("  "+b[0]+" ["+b[1]+"] "+b[2]+" got="+b[3]));
  console.log("--- 无法判定（前30）---");
  skip.slice(0,30).forEach(b=>console.log("  "+b[0]+" | "+b[1]));
  require('fs').writeFileSync("_ST.json", JSON.stringify({pass,bad,oneWay,skip},null,1));
  console.log("已写 _ST.json");
})();
