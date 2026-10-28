const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){},dispatchEvent(e){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});

let pass=0, fail=0;
const chk=(name,got,want)=>{ if(got===want){pass++;} else {fail++;console.log(`FAIL ${name}: got ${got} want ${want}`);} };

/* 1. 官方检查值 "123456789" */
const probe=new TextEncoder().encode("123456789");
const h8=v=>v.toString(16).toUpperCase();
chk("crc8", h8(crcFast(probe,0x07,0,false,false,0,8)).toLowerCase(), "f4");
chk('crc16ccitt', h8(crcFast(probe,0x1021,0,false,false,0,16)).toLowerCase(), '31c3');
chk('crc16modbus',h8(crcFast(probe,0x8005,0xFFFF,true,true,0,16)).toLowerCase(), '4b37');
const u=p=>p[0].toString(16).padStart(8,'0')+p[1].toString(16).padStart(8,'0');
chk('crc64ecma', u(crcFast(probe,0x42F0E1EBA9EA3693n,0n,false,false,0n,64)), '6c40df5f0b497347');
chk('crc64xz',   u(crcFast(probe,0x42F0E1EBA9EA3693n,0xFFFFFFFFFFFFFFFFn,true,true,0xFFFFFFFFFFFFFFFFn,64)), '995dc9bbdf1939fa');
chk('fnv1a32',   h8(fnv1a32(new TextEncoder().encode("foobar"))).toLowerCase(), 'bf9cf968');

/* 2. 等价性：crcFast vs crcGen，随机数据 */
const cases=[
  ['crc8',       b=>[crcGen(b,0x07,0,false,false,0,8),        crcFast(b,0x07,0,false,false,0,8)]],
  ['crc16ccitt', b=>[crcGen(b,0x1021,0,false,false,0,16),     crcFast(b,0x1021,0,false,false,0,16)]],
  ['crc16modbus',b=>[crcGen(b,0x8005,0xFFFF,true,true,0,16),  crcFast(b,0x8005,0xFFFF,true,true,0,16)]],
  ['crc64ecma',  b=>[u(crcGen(b,0x42F0E1EBA9EA3693n,0n,false,false,0n,64)), u(crcFast(b,0x42F0E1EBA9EA3693n,0n,false,false,0n,64))]],
  ['crc64xz',    b=>[u(crcGen(b,0x42F0E1EBA9EA3693n,0xFFFFFFFFFFFFFFFFn,true,true,0xFFFFFFFFFFFFFFFFn,64)),
                     u(crcFast(b,0x42F0E1EBA9EA3693n,0xFFFFFFFFFFFFFFFFn,true,true,0xFFFFFFFFFFFFFFFFn,64))]],
];
let seed=12345; const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff; return seed;};
for(const [name,fn] of cases){
  let bad=0;
  for(let t=0;t<400;t++){
    const n=(rnd()%97)+1;
    const b=new Uint8Array(n);
    for(let i=0;i<n;i++)b[i]=rnd()&255;
    const [a,c]=fn(b);
    if(a!==c){ if(bad<3)console.log(`  ${name} 不等: len=${n} gen=${a} fast=${c}`); bad++; }
  }
  if(bad===0){pass++;console.log(`  ${name} 等价 400/400 ✓`);} else {fail++;console.log(`  ${name} 等价失败 ${bad}/400`);}
}
console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
process.exit(fail?1:0);
