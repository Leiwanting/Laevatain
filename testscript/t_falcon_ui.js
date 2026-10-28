/* Falcon 验签 —— 走 reg 注册的界面入口（覆盖「解析 → 条目 → 输出」整条链路）
 * 向量：PQClean falcon-{512,1024}/clean + NIST AES256-CTR-DRBG 自行产出
 *   falcon/kat512.txt  5 组，falcon/kat1024.txt 3 组
 */
const fs = require("fs"), vm = require("vm"), nc = require("crypto");
global.crypto = nc.webcrypto; global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
global.btoa = s => Buffer.from(s, "binary").toString("base64");
global.atob = s => Buffer.from(s, "base64").toString("binary");
const mk = id => ({ id, value: "", _h: {}, options: [], addEventListener() {}, dispatchEvent() {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, setAttribute() {}, appendChild() {}, style: {}, innerHTML: "", textContent: "" });
const store = {}; global.document = { getElementById: id => store[id] || (store[id] = mk(id)), createElement: t => mk(t), querySelector() { return mk('q'); }, querySelectorAll() { return []; }, addEventListener() {}, readyState: "complete", body: { appendChild() {} } };
global.window = global; global.addEventListener = () => {}; global.Event = function (t) { this.type = t; };
const html = fs.readFileSync("/data/workspace/dist/index.html", "utf8");
const parsed = [...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let ok = 0, fail = 0;
for (const f of parsed) { try { vm.runInThisContext(fs.readFileSync("/data/workspace/dist/" + f, "utf8"), { filename: f }); ok++; } catch (e) { fail++; console.log("✗ " + f + ": " + e.message); } }
console.log("脚本加载 " + ok + "/" + parsed.length + "  失败 " + fail);

const AL = globalThis.ALGOS;
console.log("ALGOS 总数 = " + AL.length + "  唯一 id = " + new Set(AL.map(a => a.id)).size);
const long = AL.filter(a => a.info && a.info.length > 200);
console.log("说明超 200 字 = " + long.length + (long.length ? " -> " + long.slice(0, 3).map(a => a.id + ':' + a.info.length).join(', ') : ""));

function parseKat(file) {
  const txt = fs.readFileSync(file, "utf8");
  return txt.split(/^=== \d+ ===$/m).slice(1).map(b => {
    const g = k => { const m = b.match(new RegExp('^' + k + ' = (.*)$', 'm')); return m ? m[1] : null; };
    return { msg: g('msg'), pk: g('pk'), sig: g('sig'), verify: g('verify') };
  });
}

(async () => {
  const al = ALGOS.find(a => a.id === 'falcon-verify');
  if (!al) { console.log('✗ 未找到 falcon-verify 条目'); process.exit(1); }
  console.log('条目名 = ' + al.name + '  分组 = ' + al.group);
  let P = 0, F = 0;
  for (const [file, label] of [['/data/workspace/falcon/kat512.txt', 'Falcon-512'],
  ['/data/workspace/falcon/kat1024.txt', 'Falcon-1024']]) {
    const sets = parseKat(file);
    for (let i = 0; i < sets.length; i++) {
      const s = sets[i];
      try {
        const r = await al.enc(s.msg, s.pk, s.sig);
        const good = r.text.indexOf('验签结果 = VALID') >= 0;
        const exp = s.verify === 'VALID';
        if (good === exp) { P++; console.log('PASS ' + label + ' #' + i); }
        else { F++; console.log('FAIL ' + label + ' #' + i + '  got=' + good + ' exp=' + exp + '  ' + r.text.replace(/\n/g, ' | ')); }
      } catch (e) { F++; console.log('FAIL ' + label + ' #' + i + ' 抛错: ' + e.message); }
    }
  }
  /* 篡改：走入口应报 INVALID */
  const s0 = parseKat('/data/workspace/falcon/kat512.txt')[0];
  try {
    const r = await al.enc(s0.msg + 'x', s0.pk, s0.sig);
    const good = r.text.indexOf('验签结果 = VALID') >= 0;
    if (!good) { P++; console.log('PASS 界面入口 篡改消息'); } else { F++; console.log('FAIL 篡改消息仍判有效'); }
  } catch (e) { F++; console.log('FAIL 篡改: ' + e.message); }
  /* 错误头字节应抛错而非崩溃 */
  try {
    await al.enc(s0.msg, s0.pk, '11' + s0.sig.slice(2));
    F++; console.log('FAIL 非法头字节未拒绝');
  } catch (e) { P++; console.log('PASS 非法头字节被拒绝: ' + e.message.slice(0, 40)); }

  console.log('\nPASS ' + P + '  FAIL ' + F);
  process.exit(F ? 1 : 0);
})();
