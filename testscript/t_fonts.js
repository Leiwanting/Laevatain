/**
 * t_fonts.js — 字体验收（HONOR Sans 版）
 *
 * 字体构成：
 *   HONORSansCN     汉字 / 日文假名（HONOR Sans 可变字体，wght 100-900）[HONOR Sans Copyright License Agreement]
 *   HONORSansLatin  拉丁 / 希腊 / 西里尔（同上，含 tnum 等宽数字）
 *   NotoKR          谚文 —— HONOR 两款均不含谚文，必须补 [SIL OFL 1.1]
 *   JBM             密文输出（JetBrains Mono 等宽）[SIL OFL 1.1]
 *
 * 协议红线（HONOR Sans Copyright License Agreement 原文）：
 *   1) 不得对 HONOR Sans 做任何修改 —— 故禁止子集化／裁剪字集／转 woff2，原样内嵌官方 TTF。
 *      本脚本第 D 段逐字节比对 fonts/ 下实际 .ttf 与官方 TTF，作为「未修改」的强证明。
 *      （v2.16 起字体由 CSS 内嵌改为外链文件，校验对象随之改为落盘文件本身。）
 *   2) 不得以 stand-alone 形式再分发 —— 内嵌于本工具箱（非单独字体产品）不违反。
 *   3) 必须保留版权声明与协议 —— LICENSE-HONOR-Sans.txt 随包。
 *   4) 必须在软件中做显著声明（prominent notice）—— index.html 页脚已加署名段。
 *
 * 历史教训（勿重犯）：
 *   - 曾用 MiSans 作正文：其授权禁止再分发字体文件，base64 内嵌即构成再分发，开源不可用。
 *   - 曾误信第三方站点「HONOR Sans 采用 OFL 1.1」的说法；官方 LICENSE.txt 实为自有协议，非 OFL。
 *     凡授权条款一律以官方包内 LICENSE 为准，不以二手站点介绍为准。
 *   - 本脚本曾出现 `b64s.slice(0, 8)` 硬编码，字体增至 11 个后静默少验 3 个仍报 PASS。
 *     故本版所有条目数断言一律用「实际解析出的总数」，不写死数字。
 */
'use strict';
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var pass = 0, fail = 0;
function ok(c, msg) { if (c) { pass++; console.log('  PASS ' + msg); }
  else { fail++; console.log('  FAIL ' + msg); } }

var ROOT = path.join(__dirname, '..');
var FONTDIR = path.join(ROOT, 'fonts');
function rd(p) { try { return fs.readFileSync(p); } catch (e) { return null; } }
function rdt(p) { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; } }

console.log('A) 字体表文件存在性');
var fontsCss = rdt(path.join(ROOT, 'fonts.css'));
ok(fontsCss.length > 1000, 'fonts.css 可读（' + fontsCss.length + ' 字节）');

console.log('B) @font-face 齐全');
['HONORSansCN', 'HONORSansLatin', 'NotoKR', 'JBM'].forEach(function (fam) {
  var re = new RegExp("@font-face\\{font-family:'" + fam + "'");
  ok(re.test(fontsCss), fam + ' 已声明 @font-face');
});
// HONOR 两款必须声明为可变字重区间，否则 500/600/700 会错误回退
ok(/font-family:'HONORSansCN'[^}]*font-weight:100 900/.test(fontsCss),
   "HONORSansCN 声明可变字重区间 100 900");
ok(/font-family:'HONORSansLatin'[^}]*font-weight:100 900/.test(fontsCss),
   "HONORSansLatin 声明可变字重区间 100 900");

console.log('C) 外链字体文件存在且为合法字体');
// 性能红线：字体不得再以 base64 内嵌进 CSS。v2.15.0 曾内嵌导致 fonts.css 达 37,339,280 字节，
// 而 <link rel=stylesheet> 是渲染阻塞资源 —— 首屏必须等这 37MB 下载解析完才渲染，实测启动掉到 1~5s。
// 改为外链 + font-display:swap 后，页面立即以系统字体渲染，字体后台加载再替换。
// 注意 fonts.css 注释中含「base64」字样，故只匹配真实数据 url(data:font/...) ，避免误判。
var b64data = fontsCss.match(/url\(['"]?data:font\//g) || [];
ok(b64data.length === 0,
   'fonts.css 不得再内嵌 base64 字体数据（当前 ' + b64data.length + ' 处）—— 内嵌会使 CSS 阻塞首屏渲染');
ok(fontsCss.length < 8192,
   'fonts.css 必须保持轻量（当前 ' + fontsCss.length + ' 字节，阈值 8192）');

var faces = fontsCss.match(/@font-face\{[^}]*\}/g) || [];
ok(faces.length >= 7, '@font-face 声明 ' + faces.length + ' 条');
// 每条都必须有 font-display:swap —— 缺失时字体加载期文字不可见（FOIT），表现为「白屏等字体」
var noSwap = faces.filter(function (f) { return !/font-display:\s*(swap|fallback|optional)/.test(f); });
ok(noSwap.length === 0, '全部 @font-face 均有 font-display:swap（缺失 ' + noSwap.length + ' 条）');

var urls = [];
fontsCss.replace(/url\('([^']+)'\)/g, function (_m, u) { urls.push(u); return _m; });
ok(urls.length === faces.length,
   'url() 引用数 ' + urls.length + ' 与 @font-face 数 ' + faces.length + ' 一致');
var fontOk = 0;
urls.forEach(function (u) {
  var p = path.join(ROOT, u);
  var b = rd(p);
  if (!b) { ok(false, '字体文件缺失: ' + u); return; }
  var h = b.slice(0, 4).toString('hex');
  var legal = (h === '00010000' || h === '74727565' || h === '774f4632' || h === '774f4646');
  ok(legal, u + ' 是合法字体（头 ' + h + '，' + b.length + ' 字节）');
  if (legal) fontOk++;
});
ok(fontOk === urls.length, '全部字体文件合法（' + fontOk + '/' + urls.length + '）');

console.log('D) 未修改性：字体文件字节的 SHA-256 须与官方 TTF 一致');
// 协议红线 1)：不得修改。任何裁剪／子集化／转格式都会让 SHA-256 对不上。
// 校验值随包（fonts/HONOR-Sans-original-sha256.txt），故解压后亦可自证，不依赖外部参照目录。
var shaFile = rdt(path.join(FONTDIR, 'HONOR-Sans-original-sha256.txt'));
ok(shaFile.length > 0, '官方 SHA-256 校验文件随包');
var refs = {};
shaFile.split('\n').forEach(function (ln) {
  var m = ln.match(/^([0-9a-f]{64})\s+(\S+)\s+(\d+)$/);
  if (m) refs[m[2]] = { sha: m[1], size: parseInt(m[3], 10) };
});
ok(!!refs['HONORSansVFCN.ttf'] && !!refs['HONORSansVFNormal.ttf'], '两款官方 TTF 的校验值齐备');

[['HONORSansCN', 'HONORSansVFCN.ttf'], ['HONORSansLatin', 'HONORSansVFNormal.ttf']].forEach(function (pair) {
  var fam = pair[0], fn = pair[1];
  // 字体现为外链文件（非内嵌），直接读落盘的 .ttf —— 这才是「未修改」的真实载体。
  var buf = rd(path.join(FONTDIR, fn));
  ok(!!buf, fam + ' 的字体文件可读: ' + fn);
  if (!buf) return;
  var head = buf.slice(0, 4).toString('hex');
  ok(head === '00010000' || head === '74727565', fam + ' 是合法 TTF（头 ' + head + '）');
  var r = refs[fn];
  if (!r) return;
  ok(buf.length === r.size, fam + ' 字节数与官方一致（' + buf.length + '/' + r.size + '）');
  ok(crypto.createHash('sha256').update(buf).digest('hex') === r.sha,
     fam + ' SHA-256 与官方一致 —— 未修改、未裁剪、未转格式');
});

console.log('E) 引用与字体栈');
var styleCss = rdt(path.join(ROOT, 'style.css'));
var html = rdt(path.join(ROOT, 'index.html'));
ok(/href="fonts\.css"/.test(html), 'index.html 已引入 fonts.css');
ok(/font-family:\s*'HONORSansLatin','HONORSansCN','NotoKR'/.test(styleCss),
   '字体栈以 HONORSansLatin → HONORSansCN → NotoKR 为序');
ok(/'JBM'/.test(styleCss), '密文输出仍为 JBM 等宽');
ok(!/LXGWWenKai|NotoSCfb|'Inter'/.test(styleCss), '已移除旧字体（Inter/LXGW/NotoSCfb）引用');

console.log('F) 协议合规：署名与许可随包');
ok(/HONOR Sans/.test(html), 'index.html 含 HONOR Sans 显著声明（prominent notice）');
ok(/Honor Device Co\., Ltd\.|HONOR DEVICE/.test(html), '声明中含版权主体');
var lic = rdt(path.join(ROOT, 'LICENSE-HONOR-Sans.txt'));
ok(lic.length > 2000, 'LICENSE-HONOR-Sans.txt 随包（' + lic.length + ' 字节）');
ok(/HONOR Sans Copyright License Agreement/.test(lic), '协议为官方 HONOR Sans Copyright License Agreement');
ok(/may not make any modifications/i.test(lic), '协议含「不得修改」条款');
ok(/stand-alone/i.test(lic), '协议含「不得单独分发」条款');
// 反向：不得把 HONOR Sans 标成 OFL（官方协议不是 OFL）
var tpn = rdt(path.join(ROOT, 'THIRD_PARTY_NOTICES.md'));
var iH = tpn.indexOf('HONOR Sans');
var hSec = iH >= 0 ? tpn.slice(iH, iH + 1200) : '';
ok(hSec.length > 0, 'THIRD_PARTY_NOTICES 含 HONOR Sans 章节');
ok(/非 OFL/.test(hSec), 'HONOR Sans 章节明确声明其协议非 OFL（官方协议为自有协议，非 OFL）');
ok(!/SIL Open Font License|OFL 1\.1/.test(hSec), 'HONOR Sans 章节未把自身误标为 OFL 1.1');

console.log('G) 残留清理');
var allRefs = styleCss + fontsCss + html;
ok(!/MiSans/i.test(allRefs), '无 MiSans 残留（授权禁止再分发，不可内嵌）');
ok(!/LXGWWenKai/.test(fontsCss), 'fonts.css 无霞鹜文楷残留');

console.log('H) 字重层次（整体加粗后层次不得塌陷）');
var bodyM = styleCss.match(/html,\s*body\s*\{[\s\S]*?\}/);
var bw = bodyM ? ((bodyM[0].match(/font-weight:\s*(\d+)/) || [])[1] || null) : null;
ok(bw === '500', '正文基础字重为 500（非默认 400，实得 ' + bw + '）');
var wSet = Object.keys((styleCss.match(/font-weight:\s*\d+/g) || []).reduce(function (a, x) {
  a[x.replace(/\D/g, '')] = 1; return a; }, {})).sort();
ok(wSet.length >= 4, '字重 >= 4 档，层次保留（实得 ' + wSet.join('/') + '）');
ok(wSet.indexOf('800') >= 0 && wSet.indexOf('700') >= 0, '含 700/800（标题强于正文）');
ok(Math.max.apply(null, wSet.map(Number)) <= 900,
   '最重档 ' + Math.max.apply(null, wSet.map(Number)) + ' 落在 HONOR VF 轴 100-900 内（真实渲染非合成）');
ok(/font-family:\s*'JBM'[^;}]*;\s*font-weight:\s*700/.test(styleCss),
   '密文区 JBM 显式 700（其真实 Bold 档，等宽对齐不变）');

console.log('\n字体测试: 通过 ' + pass + '  失败 ' + fail);
process.exit(fail === 0 ? 0 : 1);
