/* t_morph.js —— SVG 图标形变引擎验收
 *
 * 重点不是「能跑通」，而是守住这几条不变量：
 *   1. 所有声明的形变配对结构性兼容 —— 否则运行时静默退化成硬切，
 *      没有任何报错，只有肉眼在真机上才发现「图标不动画了」。
 *   2. 弹簧是真的弹簧（有过冲），不是普通缓动。
 *   3. 数值格式化不能把 100 截成 1（尾零裁剪的经典陷阱）。
 *   4. 结构不符时退化，不崩。
 *   5. 汉堡 <-> 叉：中间那条要收拢且淡出，否则叉中间会留一个点。
 *
 * 运行：在解压后的根目录执行  node testscript/t_morph.js
 */
'use strict';

var M = require('../UI/ui_morph.js');

var pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.log('FAIL: ' + m); } }
function eq(a, b, m) {
  ok(a === b, m + '  (got ' + JSON.stringify(a) + ' want ' + JSON.stringify(b) + ')');
}

/* ---------- 1. path 解析 ---------- */
var p = M.parse('M4 7 L20 7');
eq(p.length, 2, 'parse 命令数');
eq(p[0].c, 'M', 'parse 首字母');
eq(JSON.stringify(p[0].v), '[4,7]', 'parse M 数值');
eq(JSON.stringify(p[1].v), '[20,7]', 'parse L 数值');
eq(M.parse('M4 7 L20 7 L4 7').length, 3, 'parse 三命令');
eq(M.parse('').length, 0, 'parse 空串');

/* ---------- 2. 结构兼容性判定 ---------- */
ok(M.compatible('M4 7 L20 7', 'M6 6 L18 18'), '兼容：同构');
ok(!M.compatible('M4 7 L20 7', 'M4 7 L20 7 L4 7'), '不兼容：命令数不同');
ok(!M.compatible('M4 7 L20 7', 'M4 7 H20'), '不兼容：命令字母不同');

/* ---------- 3. 插值 ---------- */
var A = 'M4 7 L20 7', B = 'M6 6 L18 18';
eq(M.lerp(A, B, 0), A, 'lerp t=0 等于起点');
eq(M.lerp(A, B, 1), B, 'lerp t=1 等于终点');
eq(M.lerp(A, B, 0.5), 'M5 6.5 L19 12.5', 'lerp t=0.5 中点');
ok(M.compatible(M.lerp(A, B, 0.37), A), '中间帧仍与端点同构');

/* ---------- 4. 数字格式化：尾零裁剪不能吃掉整数位的 0 ---------- */
eq(M.num(100), '100', 'num(100) 不能被截成 1');
eq(M.num(1000), '1000', 'num(1000)');
eq(M.num(10), '10', 'num(10)');
eq(M.num(0), '0', 'num(0)');
eq(M.num(0.5), '0.5', 'num(0.5)');
eq(M.num(-0.0001), '0', 'num(-0.0001) 归一为 0');
eq(M.num(12.75), '12.75', 'num(12.75)');

/* ---------- 5. 弹簧：必须有轻微过冲，且不过分 ---------- */
eq(M.spring(0), 0, 'spring(0)=0');
eq(M.spring(1), 1, 'spring(1)=1');
eq(M.spring(2), 1, 'spring(>1) 收敛到 1');
var mx = -Infinity, at = 0, i, u, v;
for (i = 1; i <= 1000; i++) {
  u = i / 1000; v = M.spring(u);
  if (v > mx) { mx = v; at = u; }
}
ok(mx > 1.03, '弹簧有过冲，不是普通缓动 (max=' + mx.toFixed(4) + ' @u=' + at + ')');
ok(mx < 1.30, '过冲幅度不过分 (max=' + mx.toFixed(4) + ')');
ok(at > 0.15 && at < 0.60, '过冲发生在动画前中段 (u=' + at + ')');
var mono = true;
for (i = 1; i <= Math.floor(at * 1000); i++) {
  if (M.spring(i / 1000) < M.spring((i - 1) / 1000) - 1e-12) mono = false;
}
ok(mono, '峰值之前单调递增');
eq(M.spring(0.4, 1, 12), 0.4, 'zeta>=1 时退化成线性（尊重无动画偏好）');

/* ---------- 6. 核心不变量：所有形变配对结构性兼容 ---------- */
ok(M.PAIRS && M.PAIRS.length > 0, 'PAIRS 非空');
for (i = 0; i < M.PAIRS.length; i++) {
  var a = M.PAIRS[i][0], b = M.PAIRS[i][1];
  ok(!!M.ICONS[a], '图标已定义: ' + a);
  ok(!!M.ICONS[b], '图标已定义: ' + b);
  if (!M.ICONS[a] || !M.ICONS[b]) continue;
  eq(M.ICONS[a].p.length, M.ICONS[b].p.length, a + ' <-> ' + b + ' 子路径数相同');
  for (var j = 0; j < M.ICONS[a].p.length; j++) {
    ok(M.compatible(M.ICONS[a].p[j].d, M.ICONS[b].p[j].d),
      a + ' <-> ' + b + ' 第 ' + j + ' 条子路径兼容');
  }
}

/* 每个图标自身的每条子路径都要能解析、不透明度合法 */
Object.keys(M.ICONS).forEach(function (k) {
  M.ICONS[k].p.forEach(function (sp, idx) {
    ok(M.parse(sp.d).length > 0, k + ' 第 ' + idx + ' 条可解析: ' + sp.d);
    ok(typeof sp.o === 'number' && sp.o >= 0 && sp.o <= 1, k + ' 第 ' + idx + ' 条不透明度合法');
  });
});

/* ---------- 7. 结构不符时退化，绝不崩 ---------- */
eq(M.lerp('M4 7 L20 7', 'M4 7 L20 7 L4 7', 0.3), 'M4 7 L20 7', '不兼容 t<0.5 取起点');
eq(M.lerp('M4 7 L20 7', 'M4 7 L20 7 L4 7', 0.8), 'M4 7 L20 7 L4 7', '不兼容 t>0.5 取终点');

/* ---------- 8. 汉堡 <-> 叉：中间那条必须收拢 + 淡出 ---------- */
ok(M.compatible(M.ICONS.menu.p[1].d, M.ICONS.close.p[1].d), '中间线两态兼容');
eq(M.ICONS.close.p[1].o, 0, '叉态：中间线不透明度 0（否则中心留一个圆点）');
eq(M.ICONS.menu.p[1].o, 1, '汉堡态：中间线不透明度 1');
eq(M.ICONS.close.p[1].d, 'M12 12 L12 12', '叉态：中间线收成一点');

/* ---------- 9. mock DOM 下不得抛错（保护所有走 harness 的测试） ---------- */
var threw = null;
try {
  global.document = { readyState: 'complete', addEventListener: function () { }, querySelectorAll: function () { return []; } };
  global.window = { matchMedia: function () { return { matches: false }; } };
  delete require.cache[require.resolve('../UI/ui_morph.js')];
  var M2 = require('../UI/ui_morph.js');
  ok(M2.mount(null, 'menu') === null, 'mock DOM 无 createElementNS 时 mount 返回 null（不抛错）');
  var r1 = M2.to(null, 'close');
  ok(r1 === undefined, 'to(null) 不抛错');
} catch (e) { threw = e; }
ok(threw === null, 'mock DOM 环境不抛错' + (threw ? ': ' + threw.message : ''));

console.log('PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
