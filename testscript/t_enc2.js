const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
[...fs.readFileSync("index.html","utf8").matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
function get(id){const a=ALGOS.find(x=>x.id===id); if(!a) throw new Error("未注册 "+id); return a;}
let ok=0,bad=0;
function T(name,cond,detail){ if(cond){ok++;} else {bad++;console.log("✗ "+name+(detail?"  "+detail:""));} }
function rt(id,input,fmt){
  const a=get(id);
  const enc=a.enc(typeof input==="string"?strToBytes(input):input,"","","hex");
  const dec=a.dec(enc,"","", "hex");
  const back=bytesToStr(dec);
  return {enc,back};
}
/* Base45 官方（draft-faltstrom-base45） */
const b45=get('base45');
T("b45 AB→BB8", b45.enc(strToBytes("AB"),"","","hex")==="BB8", b45.enc(strToBytes("AB")));
T("b45 Hello!!→%69 VD92EX0", b45.enc(strToBytes("Hello!!"),"","","hex")==="%69 VD92EX0", b45.enc(strToBytes("Hello!!")));
T("b45 base-45→UJCLQE7W581", b45.enc(strToBytes("base-45"),"","","hex")==="UJCLQE7W581", b45.enc(strToBytes("base-45")));
T("b45 ietf!→QED8WEX0", b45.enc(strToBytes("ietf!"),"","","hex")==="QED8WEX0", b45.enc(strToBytes("ietf!")));
T("b45 往返", bytesToStr(b45.dec("BB8"))==="AB");
/* basE91 官方 */
const b91=get('base91');
T("b91 Hello World!", b91.enc(strToBytes("Hello World!"),"","","hex")===">OwJh>Io0Tv!8PE", b91.enc(strToBytes("Hello World!")));
T("b91 往返 Hello World!", bytesToStr(b91.dec(">OwJh>Io0Tv!8PE"))==="Hello World!");
/* ROT47 官方 */
const r47=get('rot47');
T("ROT47 官方", r47.enc(strToBytes("Hello, World!"),"","","hex")==="w6==@[ (@C=5P", r47.enc(strToBytes("Hello, World!")));
T("ROT47 往返", bytesToStr(r47.dec("w6==@[ (@C=5P"))==="Hello, World!");
/* Punycode RFC 3492 官方向量 */
const pc=get('punycode');
const pv=[["Bücher","Bcher-kva"],["日本語","wgv71a119e"],["bücher","bcher-kva"]];
for(const [u,p] of pv){
  const got=pc.enc(strToBytes(u),"","","hex");
  T("puny "+u, got===p, "期望 "+p+" 实得 "+got);
  const back=bytesToStr(pc.dec(p));
  T("puny 回 "+p, back===u, "实得 "+back);
}
/* Base64url RFC 4648 §10 */
const bu=get('base64url');
T("b64url vec1", bu.enc(new Uint8Array([0xff]),"","","hex")==="_w", bu.enc(new Uint8Array([0xff])));
T("b64url vec2", bu.enc(new Uint8Array([0xff,0xff]),"","","hex")==="__8", bu.enc(new Uint8Array([0xff,0xff])));
T("b64url 往返", bytesToHex(bu.dec("__8"))==="ffff");
/* Quoted-printable 往返（含行末空格转义） */
const qp=get('quoted-printable');
const qsrc="Hello  \nWorld é中";
const qe=qp.enc(strToBytes(qsrc),"","","hex");
T("qp 往返", bytesToStr(qp.dec(qe))===qsrc, JSON.stringify(qe));
T("qp 行末空格已转义", /=\d?[0-9A-F]{2}|=20/.test(qe), qe);
/* UUEncode 往返 */
const uu=get('uuencode');
const usrc="Hello UUEncode world! 中文测试";
T("uu 往返", bytesToStr(uu.dec(uu.enc(strToBytes(usrc))))===usrc);
T("uu 有 begin/end", /^begin 644 /.test(uu.enc(strToBytes(usrc))));
/* Base62 往返 */
const b62=get('base62');
for(const t of ["a","ab","Hello","0123456789","\x00\x01"]){
  try{ T("b62 往返 "+JSON.stringify(t), bytesToStr(b62.dec(b62.enc(strToBytes(t))))===t); }
  catch(e){ T("b62 往返 "+JSON.stringify(t), false, e.message); }
}
console.log("编码补充测试: 通过 "+ok+"  失败 "+bad);
