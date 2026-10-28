const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
const H=h=>Uint8Array.from(Buffer.from(h,"hex"));
const out=[];
for(const [nm,f] of [["AES128","hctr2_aes128.json"],["AES256","hctr2_aes256.json"],["AES192","hctr2_aes192.json"]]){
  if(!fs.existsSync(f)) { out.push(nm+": 无向量文件"); continue; }
  const V=JSON.parse(fs.readFileSync(f,"utf8"));
  let oe=0,od=0,tot=0;
  for(const t of V){
    tot++;
    const K=H(t.input.key_hex), TW=H(t.input.tweak_hex||""), pt=H(t.plaintext_hex), want=t.ciphertext_hex;
    try{ if(bytesToHex(hctr2Crypt(K,TW,pt,true))===want) oe++; }catch(e){}
    try{ if(bytesToHex(hctr2Crypt(K,TW,H(want),false))===t.plaintext_hex) od++; }catch(e){}
  }
  out.push(nm+": 加密 "+oe+"/"+tot+"  解密 "+od+"/"+tot);
}
process.stdout.write(out.join("\n")+"\n");
