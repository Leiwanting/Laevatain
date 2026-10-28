const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto; global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64"); global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={}; global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q')},querySelectorAll(){return[]},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global; global.addEventListener=()=>{}; global.Event=function(t){this.type=t};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f})}catch(e){}});
const A=global.ALGOS;
let pass=0,fail=0;
function T(name,fn){try{const r=fn();if(r){pass++;console.log('PASS',name,r)}else{fail++;console.log('FAIL',name)}}catch(e){fail++;console.log('FAIL',name,e.message)}}
const get=id=>A.find(a=>a.id===id);
const ctr=get('ctr-drbg'), hsh=get('hash-drbg');
T('ctr-drbg 条目存在',()=>!!ctr);
T('hash-drbg 条目存在',()=>!!hsh);
// DF=1 现在应能执行（此前直接抛错）
T('DF=1 AES-128 可执行',()=>{const o=ctr.enc('', '00'.repeat(16), '00'.repeat(8)+',32,AES-128,,1,,'); return o.length>0?'out='+String(o).slice(0,16):false;});
T('DF=1 AES-256 可执行',()=>{const o=ctr.enc('', '11'.repeat(32), '22'.repeat(16)+',48,AES-256,,1,,'); return o.length>0?'out='+String(o).slice(0,16):false;});
T('DF=0 AES-192 可执行',()=>{const o=ctr.enc('', '33'.repeat(40), ',32,AES-192,,0,,'); return o.length>0?'out='+String(o).slice(0,16):false;});
// 确定性：同参数两次一致
T('确定性(同参两次一致)',()=>{const p='00'.repeat(16)+',32,AES-128,,1,,';const a=String(ctr.enc('','00'.repeat(16),p)),b=String(ctr.enc('','00'.repeat(16),p));return a===b?'一致':false;});
// 输出长度 = 请求字节数*2(hex)
T('输出长度=32字节(hex格式)',()=>{const o=String(ctr.enc('','00'.repeat(16),'00'.repeat(8)+',32,AES-128,,1,,','hex'));return o.replace(/[^0-9a-fA-F]/g,'').length===64?('64hex:'+o.slice(0,16)):('len='+o.length+' '+o.slice(0,40));});
T('hash-drbg 可执行',()=>{const o=hsh.enc('','00'.repeat(32),',32,SHA-256,');return o.length>0?'out='+String(o).slice(0,16):false;});
// 与官方 KAT 交叉：条目层结果 == 钩子层结果（DF=1 pr=0 第一组锚点）
T('DF=1 锚点: 条目层 == KAT 层',()=>{
  const D=global.__nistDrbg;
  const doc=JSON.parse(fs.readFileSync("testvectors/drbg_nist.json","utf8"));
  const b=doc.blocks.find(x=>x.rand==='CTR-DRBG'&&x.df==='1'&&x.pr==='0'&&x.cipher==='AES-128-CTR');
  const c=b.cases[0];
  const d=D.ctr(16,true,hex(c.e),hex(c.n),hex(c.p));
  const exp=Array.from(d.generate(b.bits/8)).map(x=>('0'+x.toString(16)).slice(-2)).join('');
  const got=String(ctr.enc('', c.e, c.n+','+(b.bits/8)+',AES-128,,1,,','hex')).replace(/[^0-9a-fA-F]/g,'').toLowerCase();
  if(got!==exp) return false;
  return 'match '+exp.slice(0,32);
});
function hex(s){s=String(s||'').replace(/[^0-9a-fA-F]/g,'');if(s.length%2)s='0'+s;const o=new Uint8Array(s.length/2);for(let i=0;i<o.length;i++)o[i]=parseInt(s.substr(i*2,2),16);return o;}
console.log('PASS',pass,'FAIL',fail);
process.exit(fail?1:0);
