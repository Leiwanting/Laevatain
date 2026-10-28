/* ui_sidebar.js —— 左侧边栏：语言切换 + 页面导航
 *
 * 设计要点：
 * 1. 结构由本文件自建（不要求 index.html 预埋），只要求页面里有 <body>。
 * 2. 移动端：从左侧滑出 + 半透明遮罩；桌面端同样可用，不强行常驻，避免挤压内容区。
 * 3. 语言列表读 window.I18N.LANGS，不在这里硬编码语言名——加语言只改 i18n.js 一处。
 * 4. 关闭方式三种：关闭按钮、点遮罩、按 Esc；切换语言后自动收起并弹 Toast。
 * 5. 导航项是「滚动到 + 展开 <details>」，不是路由跳转——本页没有路由。
 *    目标元素不存在时静默跳过，不报错。
 */
(function () {
  'use strict';

  var refs = null;
  var fabIcon = null;

  function t(k) { return (window.I18N && window.I18N.t) ? window.I18N.t(k) : k; }

  var NAV = [
    { key: 'side.goTool',       target: 'algo',           scroll: true },
    { key: 'side.goVersion',    target: 'verCard',        open: true },
    { key: 'side.goFormat',     target: 'docFormat',      open: true },
    { key: 'side.goUsage',      target: 'docUsage',       open: true },
    { key: 'side.goDisclaimer', target: 'docDisclaimer',  scroll: true },
    /* 手动播放开屏：既是入口，也是排查手段——用户可主动触发，
       不必靠刷新碰运气，也能立刻确认开屏到底是"没触发"还是"闪太快没看见"。 */
    { key: 'side.playSplash',   splash: true }
  ];

  function build() {
    if (refs) return refs;

    var mask = document.createElement('div');
    mask.className = 'side-mask hidden';
    mask.id = 'sideMask';

    var bar = document.createElement('aside');
    bar.className = 'sidebar';
    bar.id = 'sidebar';
    bar.setAttribute('aria-hidden', 'true');

    /* --- 头部 --- */
    var head = document.createElement('div');
    head.className = 'side-head';
    var title = document.createElement('span');
    title.className = 'side-title';
    title.setAttribute('data-i18n', 'app.name');
    title.textContent = t('app.name');
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'side-close';
    close.id = 'sideClose';
    close.setAttribute('aria-label', 'close');
    close.setAttribute('data-i18n', 'side.close');
    close.textContent = t('side.close');
    head.appendChild(title);
    head.appendChild(close);

    /* --- 语言区 --- */
    var langWrap = document.createElement('div');
    langWrap.className = 'side-sec';
    var langT = document.createElement('div');
    langT.className = 'side-sec-t';
    langT.setAttribute('data-i18n', 'side.language');
    langT.textContent = t('side.language');
    langWrap.appendChild(langT);
    var grid = document.createElement('div');
    grid.className = 'lang-grid';
    grid.id = 'langGrid';
    langWrap.appendChild(grid);

    /* --- 导航区 --- */
    var navWrap = document.createElement('div');
    navWrap.className = 'side-sec';
    var navT = document.createElement('div');
    navT.className = 'side-sec-t';
    navT.setAttribute('data-i18n', 'side.nav');
    navT.textContent = t('side.nav');
    navWrap.appendChild(navT);
    var navList = document.createElement('div');
    navList.className = 'side-nav';
    navList.id = 'sideNav';
    navWrap.appendChild(navList);

    /* --- 说明 --- */
    var note = document.createElement('p');
    note.className = 'side-note';
    note.setAttribute('data-i18n', 'side.note');
    note.textContent = t('side.note');

    bar.appendChild(head);
    bar.appendChild(langWrap);
    bar.appendChild(navWrap);
    bar.appendChild(note);

    /* --- 打开按钮 --- */
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'side-fab';
    fab.id = 'sideFab';
    fab.setAttribute('aria-label', 'menu');
    /* 优先用可形变的 SVG 图标；Morph 不可用（或 mock DOM 环境）时退回原来的 CSS 竖条 */
    fabIcon = (window.Morph && window.Morph.mount) ? window.Morph.mount(fab, 'menu') : null;
    if (!fabIcon) fab.innerHTML = '<span class="side-fab-bars"></span>';
    var fabTx = document.createElement('span');
    fabTx.className = 'side-fab-tx';
    fabTx.setAttribute('data-i18n', 'side.open');
    fabTx.textContent = t('side.open');
    fab.appendChild(fabTx);

    document.body.appendChild(mask);
    document.body.appendChild(bar);
    /* 打开按钮的位置：优先放进顶栏预埋的 #sideFabHost（用户要求的顶栏最左位置）。
       找不到占位容器时退回挂在 body 上，保持旧行为，不报错。 */
    var host = document.getElementById('sideFabHost');
    if (host) {
      fab.classList.add('side-fab--inbar');
      host.appendChild(fab);
    } else {
      document.body.appendChild(fab);
    }

    refs = { mask: mask, bar: bar, grid: grid, nav: navList, fab: fab, close: close, fabIcon: fabIcon };
    return refs;
  }

  function renderLangs() {
    var r = refs || build();
    var cur = (window.I18N && window.I18N.get) ? window.I18N.get() : 'zh-CN';
    var langs = (window.I18N && window.I18N.LANGS) ? window.I18N.LANGS : [];
    r.grid.innerHTML = '';
    for (var i = 0; i < langs.length; i++) {
      (function (L) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'lang-btn' + (L.code === cur ? ' lang-btn--on' : '');
        b.setAttribute('data-lang', L.code);
        b.setAttribute('lang', L.code);
        if (L.code === cur) b.setAttribute('aria-current', 'true');
        var s = document.createElement('span');
        s.className = 'lang-btn-short';
        s.textContent = L.short;
        var n = document.createElement('span');
        n.className = 'lang-btn-name';
        n.textContent = L.native;
        b.appendChild(s);
        b.appendChild(n);
        b.addEventListener('click', function () {
          if (window.I18N) window.I18N.set(L.code);
          if (window.Toast) window.Toast.show(t('toast.langset'), 'ok');
          close();
        });
        r.grid.appendChild(b);
      })(langs[i]);
    }
  }

  function renderNav() {
    var r = refs || build();
    r.nav.innerHTML = '';
    for (var i = 0; i < NAV.length; i++) {
      (function (item) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'side-nav-btn';
        b.setAttribute('data-i18n', item.key);
        b.textContent = t(item.key);
        b.addEventListener('click', function () {
          if (item.splash) {
            try {
              if (window.Splash && typeof window.Splash.start === 'function') {
                window.Splash.start();
                /* 开屏"点了没反应"曾是最难排查的一类故障：内部异常被吞掉、
                   界面完全无感。现在播完立刻自检，失败就把原因显示出来。 */
                var d = (window.Splash._diag && window.Splash._diag()) || null;
                if (d && !d.ok) {
                  var why = d.err || (d.capable ? '未知' : '环境不支持');
                  try { if (window.Toast && window.Toast.show) window.Toast.show('开屏未显示：' + why, 'warn'); } catch (e2) {}
                }
              } else {
                try { if (window.Toast && window.Toast.show) window.Toast.show('开屏脚本未加载（ui_splash.js）', 'warn'); } catch (e3) {}
              }
            } catch (e) {}
          } else {
            go(item);
          }
          close();
        });
        r.nav.appendChild(b);
      })(NAV[i]);
    }
  }

  function go(item) {
    var el = document.getElementById(item.target);
    if (!el) return;                                  /* 目标不存在就静默跳过 */
    if (item.open && el.tagName === 'DETAILS') el.open = true;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      el.scrollIntoView();                            /* 老浏览器没有 smooth 选项 */
    }
  }

  function open() {
    var r = refs || build();
    r.mask.classList.remove('hidden');
    r.bar.classList.add('sidebar--on');
    r.bar.setAttribute('aria-hidden', 'false');
    r.fab.classList.add('side-fab--off');
    if (window.Morph && r.fabIcon) window.Morph.to(r.fabIcon, 'close');
  }

  function close() {
    var r = refs || build();
    r.mask.classList.add('hidden');
    r.bar.classList.remove('sidebar--on');
    r.bar.setAttribute('aria-hidden', 'true');
    r.fab.classList.remove('side-fab--off');
    if (window.Morph && r.fabIcon) window.Morph.to(r.fabIcon, 'menu');
  }

  function boot() {
    build();
    renderLangs();
    renderNav();

    refs.fab.addEventListener('click', open);
    refs.close.addEventListener('click', close);
    refs.mask.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) close();
    });

    /* 语言变化时重建语言按钮的高亮，并把侧边栏文案一起换掉 */
    if (window.I18N) {
      window.I18N.onChange(function () {
        renderLangs();
        renderNav();
        if (window.I18N.apply) window.I18N.apply(refs.bar);
      });
    }
  }

  window.Sidebar = { open: open, close: close, boot: boot };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
