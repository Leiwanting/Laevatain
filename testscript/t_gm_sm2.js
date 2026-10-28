/* GM/T 0003.3-2012 密钥交换 + GM/T 0003.4-2012 公钥加密 官方示例验证
   曲线用示例给定的 Fp-256 参数（p=8542D69E…），EC 运算在脚本内独立用 BigInt 实现，
   不复用项目里的 CURVES/EC —— 目的就是独立裁定。SM3 复用项目实现（已过官方 abc 向量）。*/
const fs=require("fs"),vm=require("vm"),nc=require("crypto");
global.crypto=nc.webcrypto;global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
global.TextEncoder=require("util").TextEncoder;
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(e,f){(this._h[e]=this._h[e]||[]).push(f);},dispatchEvent(e){(this._h[e.type]||[]).forEach(f=>f.call(this,e));},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});

let P=0,F=0;const ck=(n,c,x)=>{if(c)P++;else{F++;console.log("  ✗ "+n+(x?("  ["+x+"]"):""));}};
const H=h=>{h=h.replace(/\s/g,"");const o=new Uint8Array(h.length/2);for(let i=0;i<o.length;i++)o[i]=parseInt(h.substr(i*2,2),16);return o;};
const X=b=>{let s="";for(const v of b)s+=v.toString(16).padStart(2,"0");return s;};
const cat=(...a)=>{const t=[];a.forEach(x=>x.forEach(v=>t.push(v)));return new Uint8Array(t);};
const B=h=>BigInt("0x"+h.replace(/\s/g,""));

/* ---- 独立 EC（仿射 + BigInt） ---- */
function egcd(a,b){if(b===0n)return[a,1n,0n];const[g,x,y]=egcd(b,a%b);return[g,y,x-(a/b)*y];}
function modinv(a,m){const[g,x]=egcd(((a%m)+m)%m,m);if(g!==1n)throw new Error("no inv");return((x%m)+m)%m;}
function mkEC(p,a,b,gx,gy,n){
  const O={x:null,y:null};
  function add(P1,P2){
    if(P1.x===null)return P2; if(P2.x===null)return P1;
    let l;
    if(P1.x===P2.x){ if((P1.y+P2.y)%p===0n) return O; l=(3n*P1.x*P1.x+a)*modinv(2n*P1.y,p)%p; }
    else l=(P2.y-P1.y)*modinv(P2.x-P1.x,p)%p;
    const x3=(l*l-P1.x-P2.x)%p, y3=(l*(P1.x-x3)-P1.y)%p;
    return {x:((x3%p)+p)%p, y:((y3%p)+p)%p};
  }
  function mul(k,P){let R=O,Q=P;if(k<0n)k=((k%n)+n)%n;while(k>0n){if(k&1n)R=add(R,Q);Q=add(Q,Q);k>>=1n;}return R;}
  function onCurve(P){return (P.y*P.y-(P.x*P.x*P.x+a*P.x+b))%p===0n;}
  return {p,a,b,gx,gy,n,G:{x:gx,y:gy},add,mul,onCurve,O};
}
const b32=v=>{let h=v.toString(16).padStart(64,"0");return H(h);};
function sm3kdf(z,klenBytes){const o=[];let ct=1;while(o.length<klenBytes){const h=sm3Digest(cat(z,H(ct.toString(16).padStart(8,"0"))));for(const v of h){o.push(v);if(o.length>=klenBytes)break;}ct++;}return new Uint8Array(o);}

/* ========== GM/T 0003.4-2012 附录A 示例2：SM2 公钥加密（Fp-256） ========== */
console.log("\n=== GM/T 0003.4-2012 附录A 示例2：SM2 公钥加密 ===");
{
const p=B("8542D69E4C044F18E8B92435BF6FF7DE457283915C45517D722EDB8B08F1DFC3");
const a=B("787968B4FA32C3FD2417842E73BBFEFF2F3C848B6831D7E0EC65228B3937E498");
const b=B("63E4C6D3B23B0C849CF84241484BFE48F61D59A5B16BA06E6E12D1DA27C5249A");
const gx=B("421DEBD61B62EAB6746434EBC3CC315E32220B3BADD50BDC4C4E6C147FEDD43D");
const gy=B("0680512BCBB42C07D47349D2153B70C4E5D7FDFCBFA36EA1A85841B9E46E09A2");
const n=B("8542D69E4C044F18E8B92435BF6FF7DD297720630485628D5AE74EE7C32E79B7");
const E=mkEC(p,a,b,gx,gy,n);
ck("基点 G 在曲线上", E.onCurve(E.G));
const dB=B("1649AB77A00637BD5E2EFE283FBF353534AA7F7CB89463F208DDBC2920BB0DA0");
const PB={x:B("435B39CCA8F3B508C1488AFC67BE491A0F7BA07E581A0E4849A5CF70628A7E0A"),
          y:B("75DDBA78F15FEECB4C7895E2C1CDF5FE01DEBB2CDBADF45399CCF77BBA076A42")};
ck("官方公钥 PB 在曲线上", E.onCurve(PB));
ck("官方公钥 = [dB]G", E.mul(dB,E.G).x===PB.x && E.mul(dB,E.G).y===PB.y,
   "got x="+E.mul(dB,E.G).x.toString(16));
const k=B("4C62EEFD6ECFC2B95B92FD6C3D9575148AFA17425546D49018E5388D49DD7B4F");
const C1=E.mul(k,E.G);
ck("C1=[k]G 与官方 x1 一致", C1.x===B("245C26FB68B1DDDDB12C4B6BF9F2B6D5FE60A383B0D18D1C4144ABF17F6252E7"), "got="+C1.x.toString(16));
ck("C1=[k]G 与官方 y1 一致", C1.y===B("76CB9264C2A7E88E52B19903FDC47378F605E36811F5C07423A24B84400F01B8"));
const S=E.mul(k,PB);
ck("[k]PB 的 x2 与官方一致", S.x===B("64D20D27D0632957F8028C1E024F6B02EDF23102A566C932AE8BD613A8E865FE"), "got="+S.x.toString(16));
ck("[k]PB 的 y2 与官方一致", S.y===B("58D225ECA784AE300A81A2D48281A828E1CEDF11C4219099840265375077BF78"));
const M=H("656E6372797074696F6E207374616E64617264");
ck("M 解出即 'encryption standard'", Buffer.from(M).toString("ascii")==="encryption standard");
const t=sm3kdf(cat(b32(S.x),b32(S.y)),19);
ck("t=KDF(x2||y2,152bit) 与官方一致", X(t)==="006e30dae231b071dfad8aa379e90264491603", "got="+X(t));
const C2=new Uint8Array(M.length);for(let i=0;i<M.length;i++)C2[i]=M[i]^t[i];
ck("C2=M⊕t 与官方一致", X(C2)==="650053a89b41c418b0c3aad00d886c00286467", "got="+X(C2));
const C3=sm3Digest(cat(b32(S.x),M,b32(S.y)));
ck("C3=Hash(x2||M||y2) 与官方一致", X(C3)==="9c3d7360c30156fab7c80a0276712da9d8094a634b766d3a285e07480653426d", "got="+X(C3));
/* 解密侧：[dB]C1 应还原同一点 */
const S2=E.mul(dB,C1);
ck("解密 [dB]C1 == 加密 [k]PB", S2.x===S.x&&S2.y===S.y);
}

/* ========== GM/T 0003.3-2012 附录A 示例1：SM2 密钥交换（Fp-256） ========== */
console.log("\n=== GM/T 0003.3-2012 附录A 示例1：SM2 密钥交换 ===");
{
const p=B("8542D69E4C044F18E8B92435BF6FF7DE457283915C45517D722EDB8B08F1DFC3");
const a=B("787968B4FA32C3FD2417842E73BBFEFF2F3C848B6831D7E0EC65228B3937E498");
const b=B("63E4C6D3B23B0C849CF84241484BFE48F61D59A5B16BA06E6E12D1DA27C5249A");
const gx=B("421DEBD61B62EAB6746434EBC3CC315E32220B3BADD50BDC4C4E6C147FEDD43D");
const gy=B("0680512BCBB42C07D47349D2153B70C4E5D7FDFCBFA36EA1A85841B9E46E09A2");
const n=B("8542D69E4C044F18E8B92435BF6FF7DD297720630485628D5AE74EE7C32E79B7");
const E=mkEC(p,a,b,gx,gy,n);
const dA=B("6FCBA2EF9AE0AB902BC3BDE3FF915D44BA4CC78F88E2F8E7F8996D3B8CCEEDEE");
const dB=B("5E35D7D3F3C54DBAC72E61819E730B019A84208CA3A35E4C2E353DFCCB2A3B53");
/* PDF 里 PA 的 y 坐标 OCR 只有 63 个十六进制字符（缺 1 位），不可用。
   改由官方私钥 dA 反推：PA=[dA]G。x 坐标仍与官方逐字比对，作为反推正确性的判据。*/
const PA=E.mul(dA,E.G);
ck("反推 PA 的 x 与官方 xA 逐字一致", PA.x===B("3099093BF3C137D8FCBBCDF4A2AE50F3B0F216C3122D79425FE03A45DBFE1655"),"got="+PA.x.toString(16));
console.log("  PDF 缺字的 PA.y 反推值 = "+PA.y.toString(16).padStart(64,"0"));
const PB={x:B("245493D446C38D8CC0F118374690E7DF633A8A4BFB3329B5ECE604B2B4F37F43"),
          y:B("53C0869F4B9E17773DE68FEC45E14904E0DEA45BF6CECF9918C85EA047C60A4C")};

ck("官方 PB=[dB]G", E.mul(dB,E.G).x===PB.x&&E.mul(dB,E.G).y===PB.y);
const rA=B("83A2C9C8B96E5AF70BD480B472409A9A327257F1EBB73F5B073354B248668563");
const rB=B("33FE21940342161C55619C4A0C060293D543C80AF19748CE176D83477DE71C80");
const RA=E.mul(rA,E.G), RB=E.mul(rB,E.G);
ck("RA=[rA]G 与官方 x1 一致", RA.x===B("6CB5633816F4DD560B1DEC458310CBCC6856C09505324A6D23150C408F162BF0"),"got="+RA.x.toString(16));
ck("RB=[rB]G 与官方 x2 一致", RB.x===B("1799B2A2C778295300D9A2325C686129B8F2B5337B3DCF4514E8BBC19D900EE5"));
/* Z = SM3(ENTL||ID||a||b||xG||yG||xA||yA) */
const idA=H("414C494345313233405941484F4F2E434F4D"), idB=H("42494C4C343536405941484F4F2E434F4D");
ck("ID_A 解码 = ALICE123@YAHOO.COM", Buffer.from(idA).toString("ascii")==="ALICE123@YAHOO.COM");
ck("ID_B 解码 = BILL456@YAHOO.COM",  Buffer.from(idB).toString("ascii")==="BILL456@YAHOO.COM");
const Zof=(P,id)=>sm3Digest(cat(H(((id.length*8)>>8&0xff).toString(16).padStart(2,"0")+((id.length*8)&0xff).toString(16).padStart(2,"0")),
  id, b32(a), b32(b), b32(gx), b32(gy), b32(P.x), b32(P.y)));
const ZA=Zof(PA,idA), ZB=Zof(PB,idB);
ck("ZA 与官方一致", X(ZA)==="e4d1d0c3ca4c7f11bc8ff8cb3f4c02a78f108fa098e51a668487240f75e20f31","got="+X(ZA));
ck("ZB 与官方一致", X(ZB)==="6b4b6d0e276691bd4a11bf72f4fb501ae309fdacb72fa6cc336e6656119abd67","got="+X(ZB));
/* w = ceil(log2(n))/2 - 1 = 127 ；x̄ = 2^w + (x & (2^w - 1)) */
const W=127n, twoW=1n<<127n, mask=(1n<<127n)-1n;
const bar=x=>twoW+(x&mask);
const x1b=bar(RA.x), x2b=bar(RB.x);
ck("x̄1 与官方一致", x1b===B("E856C09505324A6D23150C408F162BF0"), "got="+x1b.toString(16));
ck("x̄2 与官方一致", x2b===B("B8F2B5337B3DCF4514E8BBC19D900EE5"), "got="+x2b.toString(16));
const tB=((dB+x2b*rB)%n+n)%n;
ck("tB=(dB+x̄2·rB) mod n 与官方一致", tB===B("2B2E11CBF03641FC3D939262FC0B652A70ACAA25B5369AD38B375C0265490C9F"),"got="+tB.toString(16));
const tA=((dA+x1b*rA)%n+n)%n;
/* B 侧：V = [h·tB](PA + [x̄1]RA) */
const x1RA=E.mul(x1b,RA);
ck("[x̄1]RA 与官方中间点一致", x1RA.x===B("2079015F1A2A3C132B67CA9075BB28031D6F22398DD8331E72529555204B495B"),"got="+x1RA.x.toString(16));
const sumB=E.add(PA,x1RA);
ck("PA+[x̄1]RA 与官方一致", sumB.x===B("1C006A3BFF97C651B7F70D0DE0FC09D23AA2BE7A8E9FF7DAF32673B416349B92"),"got="+sumB.x.toString(16));
const V=E.mul(tB,sumB); // h=1
ck("V=[tB](PA+[x̄1]RA) 的 xV 与官方一致", V.x===B("47C826534DC2F6F1FBF28728DD658F21E174F48179ACEF2900F8B7F566E40905"),"got="+V.x.toString(16));
ck("V 的 yV 与官方一致", V.y===B("2AF86EFE732CF12AD0E09A1F2556CC650D9CCCE3E249866BBB5C6846A4C4A295"));
/* A 侧：U = [h·tA](PB + [x̄2]RB) */
const U=E.mul(tA,E.add(PB,E.mul(x2b,RB)));
ck("U == V（双方共享点相同）", U.x===V.x&&U.y===V.y, "U.x="+U.x.toString(16));
const KB=sm3kdf(cat(b32(V.x),b32(V.y),ZA,ZB),16), KA=sm3kdf(cat(b32(U.x),b32(U.y),ZA,ZB),16);
ck("KB=KDF(xV||yV||ZA||ZB) 与官方一致", X(KB)==="55b0ac62a6b927ba23703832c853ded4","got="+X(KB));
ck("KA == KB", X(KA)===X(KB));
/* 密钥确认：SB = Hash(0x02||yV||Hash(xV||ZA||ZB||x1||y1||x2||y2)) */
const inner=sm3Digest(cat(b32(V.x),ZA,ZB,b32(RA.x),b32(RA.y),b32(RB.x),b32(RB.y)));
ck("内层 Hash 与官方一致", X(inner)==="ff49d95bd45fce99ed54a8ad7a7091109f51394442916bd154d1de4379d97647","got="+X(inner));
const SB=sm3Digest(cat(H("02"),b32(V.y),inner));
ck("0x02||yV 前缀与官方片段一致", X(cat(H("02"),b32(V.y))).startsWith("022af86efe732cf12ad0e09a1f2556cc650d9ccce3e249866bbb5c"),"got="+X(cat(H("02"),b32(V.y))).slice(0,40));
console.log("  SB = "+X(SB)+"（官方 PDF 该值被截断，仅核对到前缀与内层 Hash）");
}
/* 项目默认曲线 sm2p256v1 参数核对 */
console.log("\n=== 项目 CURVES.sm2 参数是否等于 sm2p256v1 官方参数 ===");
{
const c=CURVES.sm2, h=v=>v.toString(16).padStart(64,"0");
ck("p", h(c.p)==="fffffffeffffffffffffffffffffffffffffffff00000000ffffffffffffffff","got="+h(c.p));
ck("a", h(c.a)==="fffffffeffffffffffffffffffffffffffffffff00000000fffffffffffffffc","got="+h(c.a));
ck("b", h(c.b)==="28e9fa9e9d9f5e344d5a9e4bcf6509a7f39789f515ab8f92ddbcbd414d940e93","got="+h(c.b));
ck("n", h(c.n)==="fffffffeffffffffffffffffffffffff7203df6b21c6052b53bbf40939d54123","got="+h(c.n));
ck("gx",h(c.gx)==="32c4ae2c1f1981195f9904466a39c9948fe30bbff2660be1715a4589334c74c7","got="+h(c.gx));
ck("gy",h(c.gy)==="bc3736a2f4f6779c59bdcee36b692153d0a9877cc62a474002df32e52139f0a0","got="+h(c.gy));
const G={x:c.gx,y:c.gy}, d=0x12345678n;
const Q=c.mul(d,G);
const E=mkEC(c.p,c.a,c.b,c.gx,c.gy,c.n);
const Q2=E.mul(d,G);
ck("项目 EC.mul 与独立实现在标准曲线上一致", Q.x===Q2.x&&Q.y===Q2.y, "proj="+Q.x.toString(16)+" indep="+Q2.x.toString(16));
}
console.log("\n合计 PASS="+P+"  FAIL="+F);
