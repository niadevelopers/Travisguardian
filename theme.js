/* ==========================================================================
   travis-ui.js — Shared UI enhancements for Travis Guardian
   --------------------------------------------------------------------------
   Injects:
     1. Theme toggle (light / dark / auto) — top corner, responsive
     2. "Back to top" button — bottom corner, appears on scroll
   Both are non-blocking, respect safe areas, and persist user preference.
   ========================================================================== */

(function () {
  'use strict';

  // ----------------------------------------------------------------------
  // CONFIG
  // ----------------------------------------------------------------------
  const STORAGE_KEY = 'tg-theme-preference'; // 'light' | 'dark' | 'auto'
  const ROOT = document.documentElement;
  const SCROLL_THRESHOLD = 320; // px before back-to-top appears

  // ----------------------------------------------------------------------
  // THEME ENGINE
  // ----------------------------------------------------------------------
  const ThemeEngine = {
    // Palette — mirrors your site's CSS variables
    light: {
      '--tg-surface': '#FFFFFF',
      '--tg-surface-alt': '#F6F8FB',
      '--tg-text': '#0F172A',
      '--tg-text-muted': '#5A6B85',
      '--tg-border': '#E4E9F0',
      '--tg-navy': '#0B1F3A',
      '--tg-header-bg': 'rgba(255,255,255,.92)',
      '--tg-shadow': 'rgba(15,23,42,.08)',
      '--tg-toggle-bg': 'rgba(255,255,255,.85)',
      '--tg-toggle-border': 'rgba(15,23,42,.10)',
      '--tg-toggle-icon': '#0B1F3A',
    },
    dark: {
      '--tg-surface': '#0E1626',
      '--tg-surface-alt': '#111C30',
      '--tg-text': '#E6EDF7',
      '--tg-text-muted': '#93A4BE',
      '--tg-border': '#1E2C45',
      '--tg-navy': '#E6EDF7',
      '--tg-header-bg': 'rgba(14,22,38,.85)',
      '--tg-shadow': 'rgba(0,0,0,.45)',
      '--tg-toggle-bg': 'rgba(22,32,52,.85)',
      '--tg-toggle-border': 'rgba(255,255,255,.12)',
      '--tg-toggle-icon': '#F2B705',
    },

    getStored() {
      try { return localStorage.getItem(STORAGE_KEY) || 'auto'; }
      catch (e) { return 'auto'; }
    },

    setStored(value) {
      try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
    },

    systemPrefersDark() {
      return window.matchMedia &&
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    },

    /** Resolve 'auto' → 'light' | 'dark' */
    resolve(pref) {
      if (pref === 'auto') return this.systemPrefersDark() ? 'dark' : 'light';
      return pref;
    },

    /** Apply a palette to the document root */
    apply(mode) {
      const palette = this[mode] || this.light;
      Object.entries(palette).forEach(([key, val]) => {
        ROOT.style.setProperty(key, val);
      });
      ROOT.setAttribute('data-tg-theme', mode);
      ROOT.style.colorScheme = mode; // native form controls / scrollbars
    },

    /** Full cycle: light → dark → auto → light ... */
    cycle() {
      const order = ['light', 'dark', 'auto'];
      const current = this.getStored();
      const next = order[(order.indexOf(current) + 1) % order.length];
      this.setStored(next);
      this.apply(this.resolve(next));
      return next;
    },

    init() {
      this.apply(this.resolve(this.getStored()));

      // React to OS-level theme changes when in 'auto'
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)')
          .addEventListener('change', () => {
            if (this.getStored() === 'auto') {
              this.apply(this.resolve('auto'));
            }
          });
      }
    },
  };

  // ----------------------------------------------------------------------
  // STYLE INJECTION (scoped to our components only)
  // ----------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('tg-ui-styles')) return;

    const css = `
      /* ---- Theme toggle ---- */
      #tg-theme-toggle {
        position: fixed;
        top: max(14px, env(safe-area-inset-top));
        right: max(14px, env(safe-area-inset-right));
        z-index: 9999;
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        border: 1px solid var(--tg-toggle-border, rgba(15,23,42,.10));
        background: var(--tg-toggle-bg, rgba(255,255,255,.85));
        -webkit-backdrop-filter: saturate(180%) blur(12px);
        backdrop-filter: saturate(180%) blur(12px);
        color: var(--tg-toggle-icon, #0B1F3A);
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        padding: 0;
        box-shadow: 0 4px 14px var(--tg-shadow, rgba(15,23,42,.08));
        transition: transform .18s ease, box-shadow .18s ease,
                    background .25s ease, border-color .25s ease, color .25s ease;
        -webkit-tap-highlight-color: transparent;
      }
      #tg-theme-toggle:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 20px var(--tg-shadow, rgba(15,23,42,.12));
      }
      #tg-theme-toggle:active { transform: translateY(0) scale(.96); }
      #tg-theme-toggle:focus-visible {
        outline: 2px solid #0FB5A6;
        outline-offset: 2px;
      }
      #tg-theme-toggle .tg-icon {
        display: block;
        transition: transform .35s cubic-bezier(.34,1.56,.64,1), opacity .25s ease;
      }
      #tg-theme-toggle.tg-spin .tg-icon { transform: rotate(180deg) scale(.85); }

      /* ---- Back to top ---- */
      #tg-back-to-top {
        position: fixed;
        bottom: max(20px, env(safe-area-inset-bottom));
        right: max(14px, env(safe-area-inset-right));
        z-index: 9998;
        width: 46px;
        height: 46px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        border: none;
        background: linear-gradient(135deg, #0FB5A6, #1FA971);
        color: #fff;
        cursor: pointer;
        font-size: 20px;
        padding: 0;
        box-shadow: 0 8px 22px rgba(15,181,166,.35);
        opacity: 0;
        transform: translateY(14px) scale(.9);
        pointer-events: none;
        transition: opacity .3s ease, transform .3s cubic-bezier(.34,1.56,.64,1),
                    box-shadow .2s ease;
        -webkit-tap-highlight-color: transparent;
      }
      #tg-back-to-top.tg-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      #tg-back-to-top:hover {
        box-shadow: 0 12px 28px rgba(15,181,166,.5);
        transform: translateY(-2px) scale(1.04);
      }
      #tg-back-to-top:active { transform: translateY(0) scale(.95); }
      #tg-back-to-top:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
      }
      #tg-back-to-top svg { display: block; }

      /* ---- Responsive tweaks ---- */
      @media (max-width: 820px) {
        #tg-theme-toggle { width: 40px; height: 40px; font-size: 16px; }
        #tg-back-to-top  { width: 42px; height: 42px; font-size: 18px; }
      }
      @media (max-width: 480px) {
        #tg-theme-toggle { top: max(10px, env(safe-area-inset-top)); right: 10px; }
        #tg-back-to-top  { right: 10px; bottom: max(14px, env(safe-area-inset-bottom)); }
      }

      /* ---- Reduced motion ---- */
      @media (prefers-reduced-motion: reduce) {
        #tg-theme-toggle, #tg-back-to-top, #tg-theme-toggle .tg-icon {
          transition: none !important;
        }
      }

      /* ---- Print ---- */
      @media print {
        #tg-theme-toggle, #tg-back-to-top { display: none !important; }
      }
    `;

    const style = document.createElement('style');
    style.id = 'tg-ui-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ----------------------------------------------------------------------
  // ICONS
  // ----------------------------------------------------------------------
  const ICONS = {
    light: `<svg class="tg-icon" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2"/>
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4
                       M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
            </svg>`,
    dark: `<svg class="tg-icon" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
            </svg>`,
    auto: `<svg class="tg-icon" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2.5" y="3.5" width="19" height="13" rx="2"/>
              <path d="M8 20h8M12 16.5V20"/>
            </svg>`,
    arrowUp: `<svg width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.4"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>`,
  };

  const LABELS = {
    light: 'Theme: Light — click for Dark',
    dark: 'Theme: Dark — click for Auto',
    auto: 'Theme: Auto — click for Light',
  };

  // ----------------------------------------------------------------------
  // THEME TOGGLE BUTTON
  // ----------------------------------------------------------------------
  function createThemeToggle() {
    const btn = document.createElement('button');
    btn.id = 'tg-theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle color theme');

    const render = () => {
      const pref = ThemeEngine.getStored();
      const resolved = ThemeEngine.resolve(pref);
      // Icon reflects the *current preference*, not the resolved mode
      btn.innerHTML = ICONS[pref] || ICONS.auto;
      btn.title = LABELS[pref] || LABELS.auto;
      btn.setAttribute('data-theme-pref', pref);
      btn.setAttribute('data-theme-resolved', resolved);
    };

    btn.addEventListener('click', () => {
      ThemeEngine.cycle();
      btn.classList.add('tg-spin');
      render();
      window.setTimeout(() => btn.classList.remove('tg-spin'), 350);
    });

    render();
    return btn;
  }

  // ----------------------------------------------------------------------
  // BACK TO TOP BUTTON
  // ----------------------------------------------------------------------
  function createBackToTop() {
    const btn = document.createElement('button');
    btn.id = 'tg-back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.title = 'Back to top';
    btn.innerHTML = ICONS.arrowUp;

    btn.addEventListener('click', () => {
      const reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });

    // Throttled scroll listener via rAF
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const visible = window.scrollY > SCROLL_THRESHOLD;
        btn.classList.toggle('tg-visible', visible);
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // set initial state

    return btn;
  }

  // ----------------------------------------------------------------------
  // BOOTSTRAP
  // ----------------------------------------------------------------------
  function init() {
    injectStyles();
    ThemeEngine.init();

    const mount = () => {
      if (!document.getElementById('tg-theme-toggle')) {
        document.body.appendChild(createThemeToggle());
      }
      if (!document.getElementById('tg-back-to-top')) {
        document.body.appendChild(createBackToTop());
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount);
    } else {
      mount();
    }
  }

  init();
})();
