/* theme.js — Travis Guardian shared UI (theme toggle + back to top) */
(function () {
  'use strict';

  var STORAGE_KEY = 'tg-theme-preference';
  var ROOT = document.documentElement;
  var SCROLL_THRESHOLD = 320;

  // ---------------------------------------------------------------
  // THEME ENGINE — writes to YOUR site's variables (not custom ones)
  // ---------------------------------------------------------------
  // These map 1:1 to the :root variables your pages already use.
  var PALETTES = {
    light: {
      // Your site's real variables:
      '--bg': '#FFFFFF',
      '--bg-alt': '#F6F8FB',
      '--text': '#0F172A',
      '--text-muted': '#5A6B85',
      '--border': '#E4E9F0',
      '--navy': '#0B1F3A',
      '--navy-soft': '#13294B',
      // Toggle's own colors:
      '--tg-toggle-bg': 'linear-gradient(135deg,#0B1F3A,#13355F)',
      '--tg-toggle-border': 'rgba(15,181,166,.35)',
      '--tg-toggle-icon': '#FFFFFF',
      '--tg-toggle-glow': 'rgba(11,31,58,.35)',
      '--tg-surface': '#FFFFFF',
      '--tg-header-bg': 'rgba(255,255,255,.92)',
      '--tg-shadow': 'rgba(15,23,42,.18)'
    },
    dark: {
      // Your site's real variables — dark palette:
      '--bg': '#0E1626',
      '--bg-alt': '#111C30',
      '--text': '#E6EDF7',
      '--text-muted': '#93A4BE',
      '--border': '#1E2C45',
      '--navy': '#E6EDF7',
      '--navy-soft': '#1B2A44',
      // Toggle's own colors:
      '--tg-toggle-bg': 'linear-gradient(135deg,#0FB5A6,#1FA971)',
      '--tg-toggle-border': 'rgba(255,255,255,.18)',
      '--tg-toggle-icon': '#FFFFFF',
      '--tg-toggle-glow': 'rgba(15,181,166,.55)',
      '--tg-surface': '#0E1626',
      '--tg-header-bg': 'rgba(14,22,38,.85)',
      '--tg-shadow': 'rgba(0,0,0,.55)'
    }
  };

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY) || 'auto'; }
    catch (e) { return 'auto'; }
  }
  function setStored(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
  }
  function systemDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function resolve(pref) {
    return pref === 'auto' ? (systemDark() ? 'dark' : 'light') : pref;
  }
  function applyTheme(mode) {
    var p = PALETTES[mode] || PALETTES.light;
    for (var k in p) if (p.hasOwnProperty(k)) ROOT.style.setProperty(k, p[k]);
    ROOT.setAttribute('data-tg-theme', mode);
    ROOT.style.colorScheme = mode;
  }
  function cycleTheme() {
    var order = ['light', 'dark', 'auto'];
    var next = order[(order.indexOf(getStored()) + 1) % order.length];
    setStored(next);
    applyTheme(resolve(next));
    return next;
  }

  // ---------------------------------------------------------------
  // HARD-OVERRIDE BODY BACKGROUND + TEXT so it can't stay white
  // ---------------------------------------------------------------
  // Some pages set background via body { background: var(--bg) } — good.
  // But a few set it inline or via html. Belt-and-suspenders:
  function paintDocument(mode) {
    var dark = mode === 'dark';
    // Set both html and body so nothing shows through
    document.documentElement.style.backgroundColor = dark ? '#0E1626' : '#FFFFFF';
    document.documentElement.style.color = dark ? '#E6EDF7' : '#0F172A';
    if (document.body) {
      document.body.style.backgroundColor = dark ? '#0E1626' : '#FFFFFF';
      document.body.style.color = dark ? '#E6EDF7' : '#0F172A';
    }
  }

  // ---------------------------------------------------------------
  // ICONS
  // ---------------------------------------------------------------
  var ICONS = {
    light: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    auto:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="3.5" width="19" height="13" rx="2"/><path d="M8 20h8M12 16.5V20"/></svg>',
    up:    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'
  };
  var LABELS = {
    light: 'Theme: Light — click for Dark',
    dark:  'Theme: Dark — click for Auto',
    auto:  'Theme: Auto — click for Light'
  };

  // ---------------------------------------------------------------
  // STYLES — with !important so nothing overrides them
  // ---------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('tg-ui-styles')) return;

    // Base position — top-right. On desktop, sits at top:14/right:14.
    // On small screens we drop it BELOW the header (top:76px) so it
    // never overlaps the hamburger.
    var css =
      '#tg-theme-toggle,#tg-back-to-top{box-sizing:border-box!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif!important;margin:0!important;padding:0!important;text-decoration:none!important;}' +
      '#tg-theme-toggle{' +
        'position:fixed!important;' +
        'top:max(14px,env(safe-area-inset-top))!important;' +
        'right:max(14px,env(safe-area-inset-right))!important;' +
        'left:auto!important;bottom:auto!important;' +
        'z-index:2147483647!important;' +
        'width:46px!important;height:46px!important;' +
        'display:grid!important;place-items:center!important;' +
        'border-radius:14px!important;' +
        'border:1.5px solid var(--tg-toggle-border,rgba(15,181,166,.35))!important;' +
        'background:var(--tg-toggle-bg,linear-gradient(135deg,#0B1F3A,#13355F))!important;' +
        'color:var(--tg-toggle-icon,#FFFFFF)!important;' +
        'cursor:pointer!important;' +
        'box-shadow:0 6px 20px var(--tg-toggle-glow,rgba(11,31,58,.35)),0 2px 6px rgba(0,0,0,.15)!important;' +
        'transition:transform .2s ease,box-shadow .2s ease,background .3s ease,top .3s ease!important;' +
        '-webkit-tap-highlight-color:transparent!important;' +
        'pointer-events:auto!important;' +
        'opacity:1!important;visibility:visible!important;' +
      '}' +
      '#tg-theme-toggle:hover{transform:translateY(-2px) scale(1.05)!important;}' +
      '#tg-theme-toggle:active{transform:scale(.94)!important;}' +
      '#tg-theme-toggle:focus-visible{outline:3px solid #F2B705!important;outline-offset:2px!important;}' +
      '#tg-theme-toggle svg{display:block!important;pointer-events:none!important;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))!important;}' +
      '#tg-theme-toggle::after{content:attr(data-theme-pref)!important;position:absolute!important;bottom:-6px!important;left:50%!important;transform:translateX(-50%)!important;font-size:8px!important;font-weight:800!important;letter-spacing:.1em!important;text-transform:uppercase!important;padding:1px 5px!important;border-radius:4px!important;background:#F2B705!important;color:#0B1F3A!important;pointer-events:none!important;}' +
      '#tg-back-to-top{' +
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
      '#tg-back-to-top.tg-visible{opacity:1!important;transform:translateY(0) scale(1)!important;pointer-events:auto!important;}' +
      '#tg-back-to-top:hover{box-shadow:0 14px 32px rgba(15,181,166,.65)!important;transform:translateY(-3px) scale(1.06)!important;}' +
      '#tg-back-to-top:active{transform:scale(.94)!important;}' +
      '#tg-back-to-top:focus-visible{outline:3px solid #F2B705!important;outline-offset:2px!important;}' +
      '#tg-back-to-top svg{display:block!important;pointer-events:none!important;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))!important;}' +

      // Below the header on phones/tablets so it clears the hamburger
      '@media (max-width:820px){' +
        '#tg-theme-toggle{top:78px!important;right:14px!important;width:42px!important;height:42px!important;border-radius:12px!important;}' +
        '#tg-theme-toggle::after{display:none!important;}' +
        '#tg-back-to-top{width:44px!important;height:44px!important;}' +
      '}' +
      '@media (max-width:480px){' +
        '#tg-theme-toggle{top:74px!important;right:10px!important;}' +
        '#tg-back-to-top{right:10px!important;bottom:max(14px,env(safe-area-inset-bottom))!important;}' +
      '}' +
      '@media (prefers-reduced-motion:reduce){#tg-theme-toggle,#tg-back-to-top{transition:none!important;}}' +
      '@media print{#tg-theme-toggle,#tg-back-to-top{display:none!important;}}';

    var s = document.createElement('style');
    s.id = 'tg-ui-styles';
    s.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(s);
  }

  // ---------------------------------------------------------------
  // BUTTONS
  // ---------------------------------------------------------------
  function buildThemeToggle() {
    var btn = document.createElement('button');
    btn.id = 'tg-theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle color theme');

    function render() {
      var pref = getStored();
      btn.innerHTML = ICONS[pref] || ICONS.auto;
      btn.title = LABELS[pref] || LABELS.auto;
      btn.setAttribute('data-theme-pref', pref);
      btn.setAttribute('data-theme-resolved', resolve(pref));
    }

    btn.addEventListener('click', function () {
      var next = cycleTheme();
      paintDocument(resolve(next));   // <-- force body/html colors
      render();
    });

    render();
    return btn;
  }

  function buildBackToTop() {
    var btn = document.createElement('button');
    btn.id = 'tg-back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.title = 'Back to top';
    btn.innerHTML = ICONS.up;

    btn.addEventListener('click', function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    var initial = resolve(getStored());
    applyTheme(initial);
    paintDocument(initial);

    if (!document.getElementById('tg-theme-toggle')) document.body.appendChild(buildThemeToggle());
    if (!document.getElementById('tg-back-to-top')) document.body.appendChild(buildBackToTop());

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if (getStored() === 'auto') {
          var m = resolve('auto');
          applyTheme(m);
          paintDocument(m);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
