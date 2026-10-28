/* ui_toast.js —— 轻提示（Toast）
 *
 * 设计要点：
 * 1. 不依赖任何框架，纯 DOM；容器由本文件自建，index.html 不需要预埋节点。
 * 2. 同一时刻最多堆 3 条，超出先摘最旧的，避免刷屏。
 * 3. 错误类停留更久（4.2s），普通提示 2.6s；鼠标悬停暂停自动关闭。
 * 4. 自动桥接主逻辑的 #msg：短文本（≤60 字符）的成功/失败提示会顺带弹一次 Toast，
 *    长文本（自检报告等）不弹——那类信息该留在页面上慢慢看。
 *    桥接用 MutationObserver，因此不需要改动 Encryption_and_decryption_logic.js。
 * 5. 尊重系统「减少动态效果」设置：开启时不播放滑入动画。
 */
(function () {
  'use strict';

  var MAX_STACK = 3;
  var box = null;
  var seq = 0;

  function reduceMotion() {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }

  function ensureBox() {
    if (box && box.parentNode) return box;
    box = document.getElementById('toastBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toastBox';
      box.className = 'toast-box';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    return box;
  }

  function iconFor(type) {
    if (type === 'ok') return '✓';
    if (type === 'err') return '✕';
    if (type === 'warn') return '!';
    return 'i';
  }

  function show(msg, type, ms) {
    msg = (msg === undefined || msg === null) ? '' : String(msg);
    if (!msg) return null;
    if (!type) type = 'info';
    var b = ensureBox();

    while (b.children.length >= MAX_STACK) b.removeChild(b.firstChild);

    var el = document.createElement('div');
    el.className = 'toast toast--' + type + (reduceMotion() ? ' toast--nomotion' : '');
    el.setAttribute('data-toast-id', ++seq);

    var ic = document.createElement('span');
    ic.className = 'toast-ic';
    ic.textContent = iconFor(type);

    var tx = document.createElement('span');
    tx.className = 'toast-tx';
    tx.textContent = msg;      /* 用 textContent，绝不 innerHTML：杜绝消息内容注入 */

    el.appendChild(ic);
    el.appendChild(tx);

    var timer = null;
    var close = function () {
      if (!el.parentNode) return;
      if (timer) clearTimeout(timer);
      el.classList.add('toast--out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
    };

    el.addEventListener('click', close);
    b.appendChild(el);

    var life = (typeof ms === 'number') ? ms : (type === 'err' ? 4200 : 2600);
    if (life > 0) timer = setTimeout(close, life);
    /* 悬停暂停：鼠标移入取消计时，移出重新计时 */
    el.addEventListener('mouseenter', function () { if (timer) { clearTimeout(timer); timer = null; } });
    el.addEventListener('mouseleave', function () { if (!timer && life > 0) timer = setTimeout(close, 900); });

    return { close: close, el: el };
  }

  /* 桥接 #msg：把主逻辑的短提示也弹一次 Toast */
  function bridge() {
    var m = document.getElementById('msg');
    if (!m || typeof MutationObserver === 'undefined') return;
    var last = '';
    var ob = new MutationObserver(function () {
      var txt = (m.textContent || '').trim();
      if (!txt || txt === last) return;
      last = txt;
      if (txt.length > 60) return;                 /* 长报告不弹 */
      var cls = m.className || '';
      var type = /err|error/.test(cls) ? 'err' : (/ok|success/.test(cls) ? 'ok' : 'info');
      show(txt, type);
    });
    ob.observe(m, { childList: true, characterData: true, subtree: true });
  }

  function boot() {
    ensureBox();
    bridge();
  }

  window.Toast = { show: show, boot: boot };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
