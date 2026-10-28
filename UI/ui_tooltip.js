/* ui_tooltip.js —— 气泡提示（Tooltip）
 *
 * 设计要点：
 * 1. 触发方式：给任意元素加 data-tip="提示文字" 即可，不需要预先注册。
 * 2. 桌面用 hover（延迟 320ms 防抖），键盘用 focus，触摸设备用点击（再点别处关闭）。
 *    触摸端没有 hover，只做 hover 会让手机用户完全看不到提示。
 * 3. 全局只有一个气泡节点，复用，不每次新建。
 * 4. 定位优先放上方，顶部空间不够放下方；左右会被夹在视口内，不会溢出屏幕。
 * 5. 内容走 textContent，不解析 HTML。
 */
(function () {
  'use strict';

  var tip = null;
  var timer = null;
  var current = null;
  var DELAY = 320;

  function isTouch() {
    try {
      return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    } catch (e) { return false; }
  }

  function ensure() {
    if (tip && tip.parentNode) return tip;
    tip = document.createElement('div');
    tip.className = 'tooltip hidden';
    tip.id = 'tooltip';
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
    return tip;
  }

  function place(el) {
    var t = ensure();
    var r = el.getBoundingClientRect();
    t.classList.remove('hidden');
    /* 先显示再量：隐藏状态下 offsetWidth 为 0，算不出位置 */
    var tw = t.offsetWidth, th = t.offsetHeight;
    var pad = 8;
    var left = r.left + r.width / 2 - tw / 2;
    var top = r.top - th - pad;

    if (top < pad) top = r.bottom + pad;             /* 上方放不下就翻到下方 */
    if (left < pad) left = pad;
    var maxLeft = window.innerWidth - tw - pad;
    if (left > maxLeft) left = Math.max(pad, maxLeft);

    t.style.left = left + 'px';
    t.style.top = top + 'px';
    t.classList.add('tooltip--on');
  }

  function show(el) {
    var txt = el.getAttribute('data-tip');
    if (!txt) return;
    var t = ensure();
    if (current === el && !t.classList.contains('hidden')) return;
    current = el;
    t.textContent = txt;
    place(el);
  }

  function hide() {
    if (timer) { clearTimeout(timer); timer = null; }
    var t = ensure();
    t.classList.remove('tooltip--on');
    t.classList.add('hidden');
    current = null;
  }

  function schedule(el) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { show(el); }, DELAY);
  }

  function closestTip(node) {
    while (node && node !== document) {
      if (node.getAttribute && node.getAttribute('data-tip')) return node;
      node = node.parentNode;
    }
    return null;
  }

  function boot() {
    ensure();
    var touch = isTouch();

    document.addEventListener('mouseover', function (e) {
      if (touch) return;                              /* 触摸端交给 click 处理 */
      var el = closestTip(e.target);
      if (el) schedule(el);
    });

    document.addEventListener('mouseout', function (e) {
      if (touch) return;
      var el = closestTip(e.target);
      if (el) { if (timer) { clearTimeout(timer); timer = null; } hide(); }
    });

    document.addEventListener('focusin', function (e) {
      var el = closestTip(e.target);
      if (el) show(el);
    });
    document.addEventListener('focusout', function () { hide(); });

    if (touch) {
      document.addEventListener('click', function (e) {
        var el = closestTip(e.target);
        if (el) { show(el); return; }
        hide();                                       /* 点空白收起 */
      }, true);
    }

    window.addEventListener('scroll', function () { if (current) hide(); }, true);
    window.addEventListener('resize', function () { if (current) hide(); });
  }

  window.Tooltip = { show: show, hide: hide, boot: boot };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
