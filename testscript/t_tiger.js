var fs=require('fs'), REG=[];
global.oneway=function(o){REG.push(o);};
global.reg=function(){}; 
global.strToBytes=function(s){return new TextEncoder().encode(String(s));};
global.bytesOut=function(b,fmt){return Buffer.from(b).toString('hex');};
require('../CryptoJS/crypto_tiger.js');
console.log('registered:', REG.map(function(o){return o.id;}));
// parse botan vec (3-pass only)
var txt=fs.readFileSync('/data/workspace/dl3/botan-2.19.5/src/tests/data/hash/tiger.vec','utf8');
var cur=null,pass=3,cases=[],pend=null;
txt.split('\n').forEach(function(l){
  l=l.trim();
  var m=l.match(/^\[Tiger\((\d+),(\d+)\)\]/);
  if(m){cur=parseInt(m[1]);pass=parseInt(m[2]);return;}
  if(!l||l[0]==='#')return;
  if(l.indexOf('In =')===0){pend={n:cur,p:pass,in:l.slice(4).trim()};return;}
  if(l.indexOf('Out =')===0&&pend){pend.out=l.slice(5).trim().toUpperCase();cases.push(pend);pend=null;}
});
var byId={'tiger128':16,'tiger160':20,'tiger192':24};
var ok=0,bad=0,stats={};
REG.forEach(function(o){
  var n=byId[o.id];
  var sub=cases.filter(function(c){return c.n===n&&c.p===3;});
  var o2=0;
  sub.forEach(function(c){
    var inb=c.in?Buffer.from(c.in,'hex'):new Uint8Array(0);
    var got=o.enc(new Uint8Array(inb),'','' ,'hex');
    if(got.toLowerCase()===c.out.slice(0,n*2).toLowerCase()){o2++;}else{if(bad<3)console.log('FAIL',o.id,c.in.slice(0,30),'exp',c.out.slice(0,n*2),'got',got);bad++;}
  });
  stats[o.id]=o2+'/'+sub.length; ok+=o2;
});
console.log('per-entry:',JSON.stringify(stats),'total ok='+ok,'bad='+bad);
// entry sanity
console.log('tiger192("")=',REG.filter(function(o){return o.id==='tiger192';})[0].enc('','','','hex'));
console.log('tiger192("abc")=',REG.filter(function(o){return o.id==='tiger192';})[0].enc('abc','','','hex'));
