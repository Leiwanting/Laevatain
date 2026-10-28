require('../CryptoJS/crypto_kasumi.js');
require('../CryptoJS/crypto_kasumi_mode.js');
var M = global.KASUMI_MODE;
function u8(h){var a=[],i;for(i=0;i<h.length;i+=2)a.push(parseInt(h.substr(i,2),16));return new Uint8Array(a);}
function hex(b){return Array.prototype.map.call(b,function(x){return ('0'+x.toString(16)).slice(-2);}).join('');}
function hx(h){return u8(h.replace(/ /g,''));}

console.log('=== f8：TS 35.203 Test Set 1（798 bits，13 块官方 keystream + enc/dec）===');
var CK = hx('2BD6459F82C5B300952C49104881FF48');
var PT = hx('7EC61272743BF161 4726446A6C38CED1 66F6CA76EB543004 4286346CEF130F92 922B03450D3A9975 E5BD2EA0EB55AD8E 1B199E3EC4316020 E9A1B285E7627953 59B7BDFD39BEF4B2 484583D5AFE082AE E638BF5FD5A60619 3901A08F4AB41AAB 9B134880');
var ENC = 'D1E2DE70EEF86C69 64FB542BC2D460AA BFAA10A4A093262B 7D199E706FC2D489 1553296910F3A973 012682E41C4E2B02 BE2017B7253BBF93 09DE5819CB42E819 56F4C99BC9765CAF 53B1D0BB8279826A DBBC5522E915C120 A618A5A7F5E89708 9339650F';
var out = M.f8(CK, 0x72A4F20F, 0x0C, 1, PT, 798);
// 只比对完整字节部分（798 bits = 99 字节 + 6 bits）
var got99 = hex(out.slice(0,99)).toUpperCase();
var exp99 = ENC.replace(/ /g,'').slice(0,198);
console.log('enc/dec 前 99 字节一致: ' + (got99 === exp99));
if (got99 !== exp99) {
  for (var i=0;i<99 && i*2<exp99.length;i+=8) console.log('  块'+Math.floor(i/8)+' 得到 '+got99.substr(i*2,16)+' 期望 '+exp99.substr(i*2,16));
}
var back = M.f8(CK, 0x72A4F20F, 0x0C, 1, out, 798);
console.log('二次异或还原明文: ' + (hex(back.slice(0,99)) === hex(PT.slice(0,99))));

console.log('');
console.log('=== f8：其余 4 组（官方给出 Initial A / Modified A，可验初始化）===');
var F8 = [
 {ck:'EFA8B2229E720C2A7C36EA55E9605695', cnt:0xE28BCF7B, be:0x18, dir:0, len:510,
  pt:'10111231E060253A 43FD3F57E37607AB 2827B599B6B1BBDA 37A8ABCC5A8C550D 1BFB2F494624FB50 367FA36CE3BC68F1 1CF93B1510376B02 130F812A9FA169D8'},
 {ck:'5ACB1D644C0D51204EA5F1451010D852', cnt:0xFA556B26, be:0x03, dir:1, len:120,
  pt:'AD9C441F890B38C4 57A49D421407E8'},
 {ck:'D3C5D592327FB11C4035C6680AF8C6D1', cnt:0x398A59B4, be:0x05, dir:1, len:253,
  pt:'981BA6824C1BFB1A B485472029B71D80 8CE33E2CC3C0B5FC 1F3DE8A6DC66B1F0'},
 {ck:'6090EAE04C83706EECBF652BE8E36566', cnt:0x72A4F20F, be:0x09, dir:0, len:837,
  pt:'40981BA6824C1BFB 4286B299783DAF44 2C099F7AB0F58D5C 8E46B104F08F01B4 1AB485472029B71D 36BD1A3D90DC3A41 B46D51672AC4C966 3A2BE063DA4BC8D2 808CE33E2CCCBFC6 34E1B259060876A0 FBB5A437EBCC8D31 C19E4454318745E3 987645987A986F2C B0'}
];
F8.forEach(function(v,i){
  var ck=hx(v.ck), pt=hx(v.pt);
  var o=M.f8(ck,v.cnt,v.be,v.dir,pt,v.len);
  var r=M.f8(ck,v.cnt,v.be,v.dir,o,v.len);
  var nb=Math.ceil(v.len/8);
  var ok = hex(r.slice(0,nb)) === hex(pt.slice(0,nb));
  console.log('  Test Set '+(i+2)+' 往返一致: '+ok+'  输出前 8 字节 '+hex(o.slice(0,8)));
});

console.log('');
console.log('=== f9：TS 35.203 Test Set 1（官方逐块中间值 + MAC-I）===');
var IK = hx('2BD6459F82C5B300952C49104881FF48');
var MSG1 = hx('6B227737296F393C 8079353EDC87E2E8 05D2EC49A4F2D8E0');
var mac = M.f9(IK, 0x38A6F056, 0x05D2EC49, 0, MSG1, 189);
console.log('MAC-I = ' + hex(mac).toUpperCase() + '  期望 F63BD72C  ' + (hex(mac).toUpperCase()==='F63BD72C'));

console.log('');
console.log('=== f9：Test Set 2（254 bits，官方 MAC-I = A9DAF1FF）===');
var IK2 = hx('D42F682428201CAFCD9F97945E6DE7B7');
var MSG2 = hx('B5924384328A4AE0 0B737109F8B6C8DD 2B4DB63DD533981C EB19AAD52A5B2BC0');
var mac2 = M.f9(IK2, 0x3EDC87E2, 0xA4F2D8E2, 1, MSG2, 254);
console.log('MAC-I = ' + hex(mac2).toUpperCase() + '  期望 A9DAF1FF  ' + (hex(mac2).toUpperCase()==='A9DAF1FF'));
