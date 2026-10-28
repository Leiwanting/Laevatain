// 用 NIST 标准 DRBG 驱动的官方 KAT 对拍 JS 实现
const fs = require('fs');
require('./_harness.js');   // cwd 必须是 dist

const A = global.ALGOS;
const entry = A.find(x => x.id === 'falcon-keygen');
if (!entry) { console.log('未找到 falcon-keygen'); process.exit(1); }

const seed0 = 'd81c4d8d734fcbfbeade3d3f8a039faa2a2c9957e835ad55b22e75bf57bb556ac81adde6aeeb4a5a875c3bfcadfa958f';
const kat = fs.readFileSync('/data/workspace/work/falcon512_nistkat.txt', 'utf8').split('\n');
const offPk = kat.find(l => l.startsWith('pk = ')).slice(5).toLowerCase();
const offSk = kat.find(l => l.startsWith('sk = ')).slice(5).toLowerCase();

(async () => {
  const out = await entry.enc(null, seed0, '512');
  const jsPk = out.text.match(/公钥 pk（\d+ 字节）=\n([0-9a-f]+)/)[2];
  const jsSk = out.text.match(/私钥 sk（\d+ 字节）=\n([0-9a-f]+)/)[2];
  console.log('KAT pk 长度:', offPk.length / 2, '| JS pk 长度:', jsPk.length / 2);
  console.log('KAT pk[:40]:', offPk.slice(0, 40));
  console.log('JS  pk[:40]:', jsPk.slice(0, 40));
  console.log('pk 逐字节一致:', jsPk === offPk);
  let d = 0;
  for (let i = 0; i < Math.min(jsSk.length, offSk.length); i += 2)
    if (jsSk.substr(i, 2) !== offSk.substr(i, 2)) d++;
  console.log('sk 长度 JS/KAT:', jsSk.length / 2, '/', offSk.length / 2, '| 不同字节:', d);
})().catch(e => console.log('ERR:', e.message));
