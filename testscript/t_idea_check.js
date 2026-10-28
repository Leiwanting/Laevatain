const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
const hx=s=>Uint8Array.from(s.match(/../g).map(x=>parseInt(x,16)));
const toHex=u=>Array.from(u).map(b=>b.toString(16).padStart(2,'0')).join('');
const vecs=JSON.parse(fs.readFileSync('_idea_vec.json','utf8'));
let ok=0,bad=0;
for(const v of vecs){
  const f=ALGOS.find(a=>a.id==='idea').makeBlockFn(hx(v.key));
  const c=toHex(f.enc(hx(v.pt)));
  if(c===v.ct) ok++; else {bad++; if(bad<4) console.log('  MISMATCH got',c,'want',v.ct);}
}
console.log('独立 Python 参考实现向量: '+ok+'/'+(ok+bad)+(bad?'  ✗':'  ✓'));
