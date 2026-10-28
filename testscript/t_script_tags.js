/* 防线：index.html 里 <script src=> 的出现次数，必须等于按标准解析得到的脚本数。
   上一版写成
       <script src="crypto_hqc.js">
       <script src="crypto_wideblock.js"></script></script>
   浏览器解析时把第二行前半段当作脚本文本吞掉，导致 crypto_wideblock.js 根本不加载
   （EME2/XCB/CBC-ESSIV 三个条目在界面上完全不存在），而只数"引用数"的检查看不出来。 */
const fs=require("fs");
const html=fs.readFileSync("index.html","utf8");
const declared=(html.match(/<script\s+src=/g)||[]).length;
const parsed=[...html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
console.log("声明的 script src: "+declared+"   标准解析得到: "+parsed.length);
if(declared!==parsed.length){ console.log("✗ 数量不符，存在标签嵌套/缺失"); process.exitCode=1; }
/* 解析出的内容必须是空或纯空白——非空说明有脚本正文被吞掉 */
let bad=0;
for(const m of html.matchAll(/<script\s+src="([^"]+)"\s*>([\s\S]*?)<\/script>/g)){
  if(m[2].trim()){ bad++; console.log("✗ "+m[1]+" 标签内含非空白正文: "+JSON.stringify(m[2].slice(0,60))); }
}
console.log("正文被吞的脚本: "+bad);
const files=[...new Set(parsed)];
console.log("唯一脚本文件: "+files.length);
for(const f of files) if(!fs.existsSync(f)){ console.log("✗ 文件不存在: "+f); process.exitCode=1; }
console.log("文件全部存在: "+(files.every(f=>fs.existsSync(f))?"✓":"✗"));
