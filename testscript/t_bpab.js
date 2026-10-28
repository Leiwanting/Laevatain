const fs=require("fs"),vm=require("vm");
global.crypto=require("crypto").webcrypto;global.TextEncoder=require("util").TextEncoder;
global.btoa=s=>Buffer.from(s,"binary").toString("base64");global.atob=s=>Buffer.from(s,"base64").toString("binary");
const mk=id=>({id,value:"",_h:{},options:[],addEventListener(){},dispatchEvent(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},appendChild(){},style:{},innerHTML:"",textContent:""});
const store={};global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:t=>mk(t),querySelector(){return mk('q');},querySelectorAll(){return [];},addEventListener(){},readyState:"complete",body:{appendChild(){}}};
global.window=global;global.addEventListener=()=>{};global.Event=function(t){this.type=t;};
const html=fs.readFileSync("index.html","utf8");
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(f=>{try{vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}catch(e){}});
vm.runInThisContext(fs.readFileSync("bp_vectors.js","utf8"));
console.log('edMultiScalarMul 可覆盖:', typeof global.edMultiScalarMul);
const NEW=global.edMultiScalarMul;
const OLD=function(points,scalars){
  var R=null;
  for(var i=0;i<scalars.length;i++){
    if(scalars[i]===0n)continue;
    var Pi=points[i]; if(Pi===null)return null;
    R=edAdd(R,edMul(Pi,scalars[i]));
  }
  return R;
};
const cases=[[0,0],[1,0],[2,0]];
function run(fn,label){
  global.edMultiScalarMul=fn;
  const res={};
  for(const [i,j] of cases){
    const n=8<<i,m=1<<j;
    const raw=hexToBytes(BP_TESTVECTORS.proofs[i][j]);
    const vcs=BP_TESTVECTORS.vc.slice(0,m).map(hexToBytes);
    bpVerifyRangeProof(raw,vcs,n,1n);            /* 预热 */
    let best=Infinity;
    for(let r=0;r<2;r++){const t0=process.hrtime.bigint();const ok=bpVerifyRangeProof(raw,vcs,n,1n);
      const ms=Number(process.hrtime.bigint()-t0)/1e6;if(ms<best)best=ms;res['n='+n]=[best,ok];}
  }
  console.log(label+': '+Object.entries(res).map(([k,v])=>k+' '+v[0].toFixed(0)+'ms'+(v[1]?'✓':'✗')).join(' | '));
  return res;
}
const o=run(OLD,'旧(edAdd+edMul)');
const nw=run(NEW,'新(扩展坐标 MSM)');
for(const k of Object.keys(nw)) console.log('  '+k+': '+o[k][0].toFixed(0)+' -> '+nw[k][0].toFixed(0)+' ms  ('+(o[k][0]/nw[k][0]).toFixed(1)+'×)');
