/* 界面入口测试：第二密钥栏(key2) / 助记词 / 单侧操作友好报错 */
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
const parsed=[...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
for(const f of parsed){ vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f}); }
const get=id=>ALGOS.find(a=>a.id===id);
let pass=0,fail=0;
function ck(name,cond,extra){ if(cond){pass++;console.log("✓ "+name);} else {fail++;console.log("✗ "+name+(extra?" :: "+extra:""));} }

console.log("=== A. index.html 新增 key2 输入框 ===");
const htmlHasKey2 = /id="key2"/.test(html) && /id="key2Field"/.test(html) && /id="key2Label"/.test(html);
ck("index.html 含 key2Field/key2Label/key2", htmlHasKey2);
ck("主逻辑 els 已接 key2", typeof els.key2 === "object" && els.key2 !== null);

console.log("\n=== B. NaCl box：私钥(key) + 对方公钥(key2) 分离 ===");
const be=get("nacl-box-enc"), bd=get("nacl-box-dec");
ck("box-enc 声明 key2", be.key2===true);
ck("box-enc 有独立公钥标签", /对方公钥/.test(be.key2Label||"") && /自己的私钥/.test(be.keyLabel||""));
ck("box-dec 声明 key2", bd.key2===true);
ck("box-enc rawKey(隐藏口令KDF下拉)", be.rawKey===true && bd.rawKey===true);

/* 生成两对 X25519 密钥：用界面 nacl-box 的前置函数不可得，直接调用内部 pubFromSk */
function rnd32(){ return new Uint8Array(nc.randomBytes(32)); }
/* X25519 密钥对用 Node 生成（独立参照），避免依赖文件内局部变量 */
function xkp(){
  const kp=nc.generateKeyPairSync('x25519');
  return {
    sk: new Uint8Array(kp.privateKey.export({format:'der',type:'pkcs8'}).slice(-32)),
    pk: new Uint8Array(kp.publicKey.export({format:'der',type:'spki'}).slice(-32))
  };
}
function x25519Pub(rawSk){
  const der=Buffer.concat([Buffer.from("302e020100300506032b656e04220420","hex"), Buffer.from(rawSk)]);
  const ko=nc.createPrivateKey({key:der,format:'der',type:'pkcs8'});
  return new Uint8Array(nc.createPublicKey(ko).export({format:'der',type:'spki'}).slice(-32));
}
const A=xkp(), B=xkp();
const aliceSk=A.sk, alicePk=A.pk, bobSk=B.sk, bobPk=B.pk;
const msg=new TextEncoder().encode("hello NaCl box 中文测试");
(async function(){
  const ct = await be.enc(msg, bytesToHex(aliceSk), "", "hex", bytesToHex(bobPk));
  ck("box-enc 走 key2 公钥可封装", typeof ct==="string" && ct.length>0, ct);
  const pt = await bd.dec(hexToBytes(ct), bytesToHex(bobSk), "", "hex", bytesToHex(alicePk));
  ck("box-dec 走 key2 公钥可解封", String(pt).trim()===bytesToHex(msg), "got="+String(pt).trim());

  console.log("\n=== C. sealed box：封装可指定临时私钥，解封默认从密文取 ===");
  const se=get("nacl-sealedbox-enc"), sd=get("nacl-sealedbox-dec");
  ck("sealed-enc 有 key2(临时私钥,可选)", se.key2===true && se.key2Optional===true);
  ck("sealed-dec 有 key2(对方公钥,可选)", sd.key2===true && sd.key2Optional===true);
  const ct2 = await se.enc(msg, bytesToHex(bobPk), "", "hex", "");
  const pt2 = await sd.dec(hexToBytes(ct2), bytesToHex(bobSk), "", "hex", "");
  ck("sealed 封装→解封往返一致(key2 均留空)", String(pt2).trim()===bytesToHex(msg), "got="+String(pt2).trim());
  /* 指定临时私钥可复现 */
  const esk = xkp().sk;
  const ct3 = await se.enc(msg, bytesToHex(bobPk), "", "hex", bytesToHex(esk));
  const ct4 = await se.enc(msg, bytesToHex(bobPk), "", "hex", bytesToHex(esk));
  ck("指定临时私钥后密文可复现(确定性)", ct3===ct4);
  /* 密文被剥掉临时公钥时，用 key2 补回 */
  const stripped = hexToBytes(ct3).subarray(32);
  const pt3 = await sd.dec(stripped, bytesToHex(bobSk), "", "hex", bytesToHex(x25519Pub(esk)));
  ck("密文剥离临时公钥后用 key2 仍能解封", String(pt3).trim()===bytesToHex(msg), "got="+String(pt3).trim());

  console.log("\n=== D. BIP-32：直接填助记词 ===");
  const b32=get("bip32");
  ck("bip32 声明 key2(BIP-39 口令)", b32.key2===true && b32.key2Optional===true);
  ck("bip32 keyLabel 提示可填助记词", /助记词/.test(b32.keyLabel||""));
  const MN="abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  /* 参照物：Node 独立 PBKDF2，不凭记忆 */
  const refSeed = nc.pbkdf2Sync(Buffer.from(MN,"utf8"), Buffer.from("mnemonicTREZOR","utf8"), 2048, 64, "sha512");
  ck("bip39ToSeedSync 与 Node PBKDF2 一致(TREZOR 口令)",
     bytesToHex(bip39ToSeedSync(MN,"TREZOR"))===refSeed.toString("hex"),
     "got="+bytesToHex(bip39ToSeedSync(MN,"TREZOR")).slice(0,32)+" exp="+refSeed.toString("hex").slice(0,32));
  const refSeed2 = nc.pbkdf2Sync(Buffer.from(MN,"utf8"), Buffer.from("mnemonic","utf8"), 2048, 64, "sha512");
  ck("bip39ToSeedSync 空口令一致", bytesToHex(bip39ToSeedSync(MN,""))===refSeed2.toString("hex"));
  const o1 = await b32.enc("", MN, "m/0'", "hex", "TREZOR");
  const o2 = await b32.enc("", refSeed.toString("hex"), "m/0'", "hex", "");
  ck("助记词路径 == 直接填种子路径", o1===o2, "\n"+o1+"\n"+o2);
  ck("输出含 xprv/xpub", /xprv: xprv/.test(o1) && /xpub: xpub/.test(o1));
  let threw=false; try{ await b32.enc("","abandon abandon","","hex",""); }catch(e){ threw=/12\/15\/18\/21\/24/.test(e.message); }
  ck("词数不对时给出明确提示", threw);

  console.log("\n=== E. 单侧操作的友好报错（不再 a.enc is not a function）===");
  ck("sealedbox-dec 确实只有 dec", typeof sd.enc!=="function" && typeof sd.dec==="function");
  const logic=fs.readFileSync("Encryption_and_decryption_logic.js","utf8");
  ck("runEnc 有 enc 缺失保护", /typeof a\.enc !== 'function'/.test(logic));
  ck("runDec 有 dec 缺失保护", /typeof a\.dec !== 'function'/.test(logic));
  ck("报错文案指明点哪个按钮", /只有解密操作，请点「解密」按钮/.test(logic) && /只有加密操作，请点「加密」按钮/.test(logic));
  ck("runEnc/runDec 均向 enc/dec 传 key2", (logic.match(/a\.enc\(bytes, key, param, fmt, key2, ivUser\)/g)||[]).length===1 && (logic.match(/a\.dec\(text, key, param, fmt, key2, ivUser2\)/g)||[]).length===1);

  console.log("\n=== F. rawKey 隐藏口令 KDF 下拉 ===");
  ck("updateAlgoUI 按 rawKey 隐藏 keyMode", /els\.keyMode\.classList\.toggle\('hidden', !!a\.rawKey\)/.test(logic));
  const nonSym=get("aes-256-cbc")||ALGOS.find(a=>a.isSym);
  ck("对称条目不受影响(keyMode 仍显示)", !nonSym.rawKey);

  console.log("\n=== G. 回归：原 param 传公钥的条目未破坏 ===");
  ck("ALGOS 总数不变(366 为第106批快照)", ALGOS.length===366, "len="+ALGOS.length);
  const ids=new Set(ALGOS.map(a=>a.id));
  ck("算法 id 无重复", ids.size===ALGOS.length);

  console.log("\n=== H. 兼容回退：旧脚本用 param 传公钥仍可用 ===");
  async function p256(){
    const kp=nc.generateKeyPairSync('ec',{namedCurve:'P-256'});
    const j=kp.privateKey.export({format:'jwk'});
    const raw=Buffer.from(j.d,'base64url');
    const spki=Buffer.from(kp.publicKey.export({format:'der',type:'spki'}));
    return { sk: raw.toString('hex'), pk: spki.subarray(spki.length-65).toString('hex') };
  }
  const C1=await p256(), C2=await p256();
  const ecdh=get('ecc-ecdh');
  const r_old = await ecdh.enc(new Uint8Array(1), C1.sk, C2.pk, 'hex');
  const r_new = await ecdh.enc(new Uint8Array(1), C1.sk, '', 'hex', C2.pk);
  ck("ECDH 旧 param 路径仍可用", /^[0-9a-f]{64}$/.test(String(r_old).trim()), String(r_old).trim());
  ck("ECDH 新 key2 路径与旧路径等价", String(r_old).trim()===String(r_new).trim());
  const r_rev = await ecdh.enc(new Uint8Array(1), C2.sk, '', 'hex', C1.pk);
  ck("ECDH 双方共享密钥一致", String(r_new).trim()===String(r_rev).trim());

  console.log("\n通过 "+pass+" / 失败 "+fail);
  process.exit(fail?1:0);
})();
