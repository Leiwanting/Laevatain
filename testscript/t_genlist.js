const H=require('./_harness.js');
const A=H.ALGOS;
const g={};
for(const a of A){ (g[a.group||'其他']=g[a.group||'其他']||[]).push(a); }
let out='';
for(const k of Object.keys(g)){
  out+='【'+k+'】('+g[k].length+')\n';
  for(const a of g[k]) out+='  '+a.name+'  【'+a.id+'】\n';
}
out+='TOTAL|'+A.length+'\n';
require('fs').writeFileSync('算法清单.txt',out);
console.log('groups',Object.keys(g).length,'total',A.length);
for(const k of Object.keys(g)) console.log('  '+k+': '+g[k].length);
