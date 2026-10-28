const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}));
let pass=0,fail=0;const ck=(n,c)=>{if(c)pass++;else{fail++;if(fail<=6)console.log("  ✗ "+n);}};
const H=h=>hexToBytes(h);
// RFC 8032 §7.1 TEST 1 — pure Ed25519
{ const sk=H("9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60");
  const pk=H("d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a");
  const want="e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b";
  ck("TEST1 公钥", bytesToHex(ed25519PubFromSk(sk)) === bytesToHex(pk));
  const sig=ed25519SignCore(new Uint8Array(0), sk, new Uint8Array(0), "pure");
  ck("TEST1 签名", bytesToHex(sig)===want);
  ck("TEST1 验签", ed25519VerifyCore(new Uint8Array(0), H(want), pk, new Uint8Array(0), "pure"));
}
// RFC 8032 §7.2 TEST 2 — Ed25519ctx
{ const sk=H("4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb");
  const pk=H("3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c");
  const want="92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00";
  ck("TEST2 公钥", bytesToHex(ed25519PubFromSk(sk)) === bytesToHex(pk));
  const sig=ed25519SignCore(H("72"), sk, new Uint8Array(0), "pure");
  ck("TEST2 签名", bytesToHex(sig)===want);
  ck("TEST2 验签", ed25519VerifyCore(H("72"), H(want), pk, new Uint8Array(0), "pure"));
}
// RFC 8032 §7.1 TEST 3 — 注意：RFC 8032 §7 只有 pure Ed25519 的三组向量，
// 没有 ctx / ph 的官方向量（TEST 3 一度被我误当成 ph，签名对不上才发现的）
{ const sk=H("c5aa8df43f9f837bedb7442f31dcb7b166d38535076f094b85ce3a2e0b4458f7");
  const pk=H("fc51cd8e6218a1a38da47ed00230f0580816ed13ba3303ac5deb911548908025");
  const want="6291d657deec24024827e69c3abe01a30ce548a284743a445e3680d7db5ac3ac18ff9b538d16f290ae67f760984dc6594a7c15e9716ed28dc027beceea1ec40a";
  ck("TEST3 公钥", bytesToHex(ed25519PubFromSk(sk)) === bytesToHex(pk));
  const sig=ed25519SignCore(H("af82"), sk, new Uint8Array(0), "pure");
  ck("TEST3 签名", bytesToHex(sig)===want);
  ck("TEST3 验签", ed25519VerifyCore(H("af82"), H(want), pk, new Uint8Array(0), "pure"));
}
console.log("RFC 8032 三变体: 通过 "+pass+" / 失败 "+fail);
