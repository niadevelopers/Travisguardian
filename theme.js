/* theme.js — Travis Guardian (back-to-top only) */
(function () {
  'use strict';

  var SCROLL_THRESHOLD = 320;

  // ---------------------------------------------------------------
  // STYLES
  // ---------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('tg-ui-styles')) return;

    var css =
      '#tg-back-to-top{' +
        'box-sizing:border-box!important;' +
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif!important;' +
        'margin:0!important;padding:0!important;' +
        'position:fixed!important;' +
        'bottom:max(20px,env(safe-area-inset-bottom))!important;' +
        'right:max(14px,env(safe-area-inset-right))!important;' +
        'left:auto!important;top:auto!important;' +
        'z-index:2147483646!important;' +
        'width:48px!important;height:48px!important;' +
        'display:grid!important;place-items:center!important;' +
        'border-radius:14px!important;' +
        'border:1.5px solid rgba(255,255,255,.25)!important;' +
        'background:linear-gradient(135deg,#0FB5A6,#1FA971)!important;' +
        'color:#fff!important;' +
        'cursor:pointer!important;' +
        'box-shadow:0 8px 24px rgba(15,181,166,.5),0 2px 6px rgba(0,0,0,.15)!important;' +
        'opacity:0!important;' +
        'transform:translateY(16px) scale(.85)!important;' +
        'pointer-events:none!important;' +
        'transition:opacity .3s ease,transform .35s cubic-bezier(.34,1.56,.64,1),box-shadow .2s ease!important;' +
        '-webkit-tap-highlight-color:transparent!important;' +
      '}' +
      '#tg-back-to-top.tg-visible{' +
        'opacity:1!important;' +
        'transform:translateY(0) scale(1)!important;' +
        'pointer-events:auto!important;' +
      '}' +
      '#tg-back-to-top:hover{' +
        'box-shadow:0 14px 32px rgba(15,181,166,.65)!important;' +
        'transform:translateY(-3px) scale(1.06)!important;' +
      '}' +
      '#tg-back-to-top:active{transform:scale(.94)!important;}' +
      '#tg-back-to-top:focus-visible{outline:3px solid #F2B705!important;outline-offset:2px!important;}' +
      '#tg-back-to-top svg{' +
        'display:block!important;' +
        'pointer-events:none!important;' +
        'filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))!important;' +
      '}' +
      '@media (max-width:820px){' +
        '#tg-back-to-top{width:44px!important;height:44px!important;}' +
      '}' +
      '@media (max-width:480px){' +
        '#tg-back-to-top{right:10px!important;bottom:max(14px,env(safe-area-inset-bottom))!important;}' +
      '}' +
      '@media (prefers-reduced-motion:reduce){' +
        '#tg-back-to-top{transition:none!important;}' +
      '}' +
      '@media print{' +
        '#tg-back-to-top{display:none!important;}' +
      '}';

    var s = document.createElement('style');
    s.id = 'tg-ui-styles';
    s.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(s);
  }

  // ---------------------------------------------------------------
  // BACK-TO-TOP BUTTON
  // ---------------------------------------------------------------
  function buildBackToTop() {
    var btn = document.createElement('button');
    btn.id = 'tg-back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.title = 'Back to top';
    btn.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2.6" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 19V5M5 12l7-7 7 7"/></svg>';

    btn.addEventListener('click', function () {
      var reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        btn.classList.toggle('tg-visible', window.scrollY > SCROLL_THRESHOLD);
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return btn;
  }

  // ---------------------------------------------------------------
  // BOOT
  // ---------------------------------------------------------------
  function mount() {
    injectStyles();
    if (!document.getElementById('tg-back-to-top')) {
      document.body.appendChild(buildBackToTop());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
