/* 【测什么】界面密文格式默认 Base64。ST 的 probe 命中即停（先试 hex 成功就返回），
   所以 base64 路径从未被覆盖 —— MTProto「加密出 b64、解密只收 hex」就是这样逃过的。
   本脚本强制 fmt='base64' 走 enc→dec，专抓「自产自解走不通」。 */
require('./_harness.js');
const A = global.ALGOS || [];
const PT = new TextEncoder().encode("hello 123 中文");
const PTS = new TextDecoder().decode(PT);
const hex = b => Buffer.from(b).toString('hex');
const H = n => 'ab'.repeat(n);
const KEYS = ["", H(16), H(24), H(32), H(8), H(64), "password123"];
const PARS = ["", H(8), H(12), H(16), "1", "128"];
const same = r => (r instanceof Uint8Array) ? hex(r)===hex(PT)
  : (String(r)===PTS || String(r)===hex(PT));
function wt(p,ms){ return Promise.race([p,new Promise((_,rj)=>setTimeout(()=>rj(new Error("TIMEOUT")),ms))]); }

const pass=[],bad=[],skip=[];
(async()=>{
  const FILTER = process.argv[2]||'';
  const LIST = A.filter(a=>FILTER?a.id.includes(FILTER):true);
  for (const a of LIST){
    if (typeof a.enc!=='function' || typeof a.dec!=='function'){ skip.push([a.id,"无 enc/dec"]); continue; }
    let ok=false, lastE=null, got=null;
    outer:
    for (const k of (a.key?KEYS:[""])) for (const p of (a.param?PARS:[""])){
      try{
        let ct = a.enc(PT,k,p,"base64");
        if (ct && ct.then) ct = await ct;
        if (ct===undefined||ct===null) continue;
        let r = a.dec(ct,k,p,"base64");
        if (r && r.then) r = await r;
        if (r===undefined||r===null) continue;
        if (same(r)){ ok=true; break outer; }
        got = String(r instanceof Uint8Array?hex(r):r).slice(0,40);
      }catch(e){ lastE=e; }
    }
    if (ok) pass.push(a.id);
    else bad.push([a.id, a.group, lastE?(lastE.message||"").slice(0,60):("得到:"+got)]);
  }
  console.log("=== Base64 自产自解（界面默认格式）===");
  console.log("通过 : "+pass.length);
  console.log("失败 : "+bad.length+"   <-- 真问题候选");
  console.log("跳过 : "+skip.length);
  console.log("--- 失败明细 ---");
  bad.forEach(b=>console.log("  "+b[0]+" ["+b[1]+"] "+b[2]));
  require('fs').writeFileSync("_fmt64.json",JSON.stringify({pass,bad},null,1));
})();
