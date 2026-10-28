const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=(id)=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{_s:new Set(),add(c){this._s.add(c);},remove(c){this._s.delete(c);},toggle(c,v){if(v===undefined)this._s.has(c)?this._s.delete(c):this._s.add(c);else v?this._s.add(c):this._s.delete(c);},contains(c){return this._s.has(c);}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById(id){return store[id]||(store[id]=mk(id));},createElement(t){return mk(t);},querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=class{constructor(t){this.type=t;}};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const keyField=document.getElementById('keyField');
const label=document.getElementById('keyLabel');
const sel=document.getElementById('algo');
let pass=0,fail=0;
for(const id of ['cast5','rc2','gost28147','hctr2','aes-gcm-siv','ff3','salsa20','aes256','sm4']){
  sel.value=id;
  (sel._h['change']||[]).forEach(f=>f.call(sel,{type:'change'}));
  if(!keyField.classList.contains('hidden')) pass++;
  else {fail++;console.log("  ✗ "+id+" 密钥栏仍隐藏");}
}
console.log("密钥栏渲染: 通过 "+pass+" / 失败 "+fail);
console.log("当前标签:", label.textContent);
