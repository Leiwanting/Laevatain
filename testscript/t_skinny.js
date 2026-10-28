// SKINNY 验收：官方公开向量 + 官方 C++ 参考实现编译出的差分向量
// 用法：cd 解压根目录 && node testscript/t_skinny.js
require('./_harness.js');
var fs=require('fs'), path=require('path');
function H2B(s){var o=new Uint8Array(s.length/2);for(var i=0;i<s.length;i+=2)o[i/2]=parseInt(s.substr(i,2),16);return o;}
function B2H(b){var o='';for(var i=0;i<b.length;i++)o+=('0'+(b[i]&0xff).toString(16)).slice(-2);return o;}
var P=0,F=0;
function chk(ok,name,extra){ if(ok)P++; else {F++; if(F<8) console.log('FAIL '+name+(extra?'  '+extra:''));} }
function run(file){
  var txt=fs.readFileSync(path.join(__dirname,'..','testvectors',file),'utf8').trim().split('\n');
  for(var i=0;i<txt.length;i++){
    var f=txt[i].split('|');
    var id=f[0],key=f[1],pt=f[2],ct=f[3];
    var it=null; for(var j=0;j<ALGOS.length;j++) if(ALGOS[j].id===id) it=ALGOS[j];
    if(!it){ console.log('未找到条目 '+id); F++; continue; }
    var bf=it.makeBlockFn(H2B(key));
    var e=B2H(bf.enc(H2B(pt)));
    chk(e===ct.toLowerCase(), id+' enc#'+i, '期望'+ct+' 实得'+e);
    var d=B2H(bf.dec(H2B(ct)));
    chk(d===pt.toLowerCase(), id+' dec#'+i, '实得'+d);
  }
}
run('skinny_official.vec');
run('skinny_diff.vec');
console.log('SKINNY 测试: 通过 '+P+' 失败 '+F);
process.exit(F?1:0);
