const fs=require("fs"),vm=require("vm");
global.crypto=require("crypto").webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});

const IDS=['pbkdf2','scrypt','argon2id','hkdf','hmac','kmac128','poly1305',
'rsa','rsa-pss','ecdsa-p256','ed25519','ecdh-p256','dh-modp2','ecc-ecies','ecc-ecdh','elgamal','sm2-enc','sm2-keyxchg','sm9-sign',
'ecc-ecdsa','dsa','sm2-sign','keygen','key-export','x25519',
'mlkem512','mldsa44','sphincs',
'bls_sig','bls_pair','x448','ed448','schnorr','bip32','bn254-pairing','ristretto255','decaf448','kzg-commit','sm9-pairing','bulletproof-verify',
'vss','dkg','hpke','frost','gg20','spake2p-register','ristretto255-dh','decaf448-dh','ed25519-ctx','ed25519-ph','ecdsa-p384','mlkem768','mlkem1024','mldsa65','mldsa87','kzg-pairing','argon2i','argon2d','kmac256','cmac','sm2-enc'];

for(const id of IDS){
  const a=ALGOS.find(x=>x.id===id);
  if(!a){console.log(id+'|NOT_FOUND');continue;}
  console.log(id+'|grp='+a.group+'|oneway='+!!a.oneway+'|key='+!!a.key+'|param='+!!a.param+'|keyLen='+a.keyLen+'|encArity='+(typeof a.enc==='function'?a.enc.length:'-')+'|dec='+(typeof a.dec));
}
