/* ==========================================================================
   travis-ui.js — Shared UI enhancements for Travis Guardian
   --------------------------------------------------------------------------
   Injects:
     1. Theme toggle (light / dark / auto) — top corner, responsive
     2. "Back to top" button — bottom corner, appears on scroll
   Both are non-blocking, respect safe areas, and persist user preference.
   Auto-avoids collision with a mobile hamburger menu (#menuToggle).
   ========================================================================== */

(function () {
  'use strict';

  // ----------------------------------------------------------------------
  // CONFIG
  // ----------------------------------------------------------------------
  const STORAGE_KEY = 'tg-theme-preference'; // 'light' | 'dark' | 'auto'
  const ROOT = document.documentElement;
  const SCROLL_THRESHOLD = 320; // px before back-to-top appears

  // Brand colors — used so the toggle is NEVER camouflaged
  const BRAND = {
    navy: '#0B1F3A',
    teal: '#0FB5A6',
    green: '#1FA971',
    gold: '#F2B705',
  };

  // ----------------------------------------------------------------------
  // THEME ENGINE
  // ----------------------------------------------------------------------
  const ThemeEngine = {
    light: {
      '--tg-surface': '#FFFFFF',
      '--tg-surface-alt': '#F6F8FB',
      '--tg-text': '#0F172A',
      '--tg-text-muted': '#5A6B85',
      '--tg-border': '#E4E9F0',
      '--tg-navy': '#0B1F3A',
      '--tg-header-bg': 'rgba(255,255,255,.92)',
      '--tg-shadow': 'rgba(15,23,42,.18)',
      // Toggle: always high-contrast (navy pill on white page)
      '--tg-toggle-bg': 'linear-gradient(135deg, #0B1F3A, #13355F)',
      '--tg-toggle-border': 'rgba(15,181,166,.35)',
      '--tg-toggle-icon': '#FFFFFF',
      '--tg-toggle-glow': 'rgba(11,31,58,.35)',
    },
    dark: {
      '--tg-surface': '#0E1626',
      '--tg-surface-alt': '#111C30',
      '--tg-text': '#E6EDF7',
      '--tg-text-muted': '#93A4BE',
      '--tg-border': '#1E2C45',
      '--tg-navy': '#E6EDF7',
      '--tg-header-bg': 'rgba(14,22,38,.85)',
      '--tg-shadow': 'rgba(0,0,0,.55)',
      // Toggle: teal pill on dark page
      '--tg-toggle-bg': 'linear-gradient(135deg, #0FB5A6, #1FA971)',
      '--tg-toggle-border': 'rgba(255,255,255,.18)',
      '--tg-toggle-icon': '#FFFFFF',
      '--tg-toggle-glow': 'rgba(15,181,166,.55)',
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

    resolve(pref) {
      if (pref === 'auto') return this.systemPrefersDark() ? 'dark' : 'light';
      return pref;
    },

    apply(mode) {
      const palette = this[mode] || this.light;
      Object.entries(palette).forEach(([key, val]) => {
        ROOT.style.setProperty(key, val);
      });
      ROOT.setAttribute('data-tg-theme', mode);
      ROOT.style.colorScheme = mode;
    },

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
  // STYLE INJECTION
  // ----------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('tg-ui-styles')) return;

    const css = `
      /* ---- Theme toggle ---- */
      #tg-theme-toggle {
        position: fixed;
        top: max(14px, env(safe-area-inset-top));
        right: max(14px, env(safe-area-inset-right));
        z-index: 2147483000;
        width: 46px;
        height: 46px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        border: 1.5px solid var(--tg-toggle-border, rgba(15,181,166,.35));
        background: var(--tg-toggle-bg, linear-gradient(135deg, #0B1F3A, #13355F));
        color: var(--tg-toggle-icon, #FFFFFF);
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        padding: 0;
        box-shadow:
          0 6px 20px var(--tg-toggle-glow, rgba(11,31,58,.35)),
          0 2px 6px rgba(0,0,0,.15);
        transition: transform .2s ease, box-shadow .2s ease,
                    background .3s ease, border-color .3s ease, color .3s ease,
                    right .3s ease;
        -webkit-tap-highlight-color: transparent;
        pointer-events: auto;
      }
      #tg-theme-toggle:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow:
          0 10px 28px var(--tg-toggle-glow, rgba(11,31,58,.45)),
          0 3px 8px rgba(0,0,0,.2);
      }
      #tg-theme-toggle:active { transform: translateY(0) scale(.94); }
      #tg-theme-toggle:focus-visible {
        outline: 3px solid ${BRAND.gold};
        outline-offset: 2px;
      }
      #tg-theme-toggle .tg-icon {
        display: block;
        transition: transform .4s cubic-bezier(.34,1.56,.64,1), opacity .25s ease;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,.25));
      }
      #tg-theme-toggle.tg-spin .tg-icon {
        transform: rotate(180deg) scale(.85);
      }

      /* Small pill indicator showing current mode */
      #tg-theme-toggle::after {
        content: attr(data-theme-pref);
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: .1em;
        text-transform: uppercase;
        padding: 1px 5px;
        border-radius: 4px;
        background: ${BRAND.gold};
        color: ${BRAND.navy};
        pointer-events: none;
        opacity: .9;
      }

      /* ---- Back to top ---- */
      #tg-back-to-top {
        position: fixed;
        bottom: max(20px, env(safe-area-inset-bottom));
        right: max(14px, env(safe-area-inset-right));
        z-index: 2147482999;
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        border: 1.5px solid rgba(255,255,255,.25);
        background: linear-gradient(135deg, ${BRAND.teal}, ${BRAND.green});
        color: #fff;
        cursor: pointer;
        font-size: 20px;
        padding: 0;
        box-shadow:
          0 8px 24px rgba(15,181,166,.5),
          0 2px 6px rgba(0,0,0,.15);
        opacity: 0;
        transform: translateY(16px) scale(.85);
        pointer-events: none;
        transition: opacity .3s ease, transform .35s cubic-bezier(.34,1.56,.64,1),
                    box-shadow .2s ease, right .3s ease;
        -webkit-tap-highlight-color: transparent;
      }
      #tg-back-to-top.tg-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      #tg-back-to-top:hover {
        box-shadow: 0 14px 32px rgba(15,181,166,.65);
        transform: translateY(-3px) scale(1.06);
      }
      #tg-back-to-top:active { transform: translateY(0) scale(.94); }
      #tg-back-to-top:focus-visible {
        outline: 3px solid ${BRAND.gold};
        outline-offset: 2px;
      }
      #tg-back-to-top svg { display: block; filter: drop-shadow(0 1px 2px rgba(0,0,0,.25)); }

      /* ---- Responsive tweaks ---- */
      @media (max-width: 820px) {
        #tg-theme-toggle { width: 42px; height: 42px; font-size: 16px; border-radius: 12px; }
        #tg-theme-toggle::after { display: none; }
        #tg-back-to-top  { width: 44px; height: 44px; font-size: 18px; }
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
    light: `<svg class="tg-icon" width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2"/>
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4
                       M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
            </svg>`,
    dark: `<svg class="tg-icon" width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
            </svg>`,
    auto: `<svg class="tg-icon" width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2.5" y="3.5" width="19" height="13" rx="2"/>
              <path d="M8 20h8M12 16.5V20"/>
            </svg>`,
    arrowUp: `<svg width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.6"
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
      btn.innerHTML = ICONS[pref] || ICONS.auto;
      btn.title = LABELS[pref] || LABELS.auto;
      btn.setAttribute('data-theme-pref', pref);
      btn.setAttribute('data-theme-resolved', resolved);
    };

    btn.addEventListener('click', () => {
      ThemeEngine.cycle();
      btn.classList.add('tg-spin');
      render();
      window.setTimeout(() => btn.classList.remove('tg-spin'), 400);
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
    onScroll();

    return btn;
  }

  // ----------------------------------------------------------------------
  // COLLISION AVOIDANCE — dodge the site's hamburger menu (#menuToggle)
  // ----------------------------------------------------------------------
  function avoidMenuCollision() {
    const toggle = document.getElementById('tg-theme-toggle');
    const menu = document.getElementById('menuToggle');
    if (!toggle) return;

    // Reset first
    toggle.style.right = '';

    if (!menu) return;

    // Is the menu currently visible (not display:none)?
    const menuStyles = window.getComputedStyle(menu);
    const menuVisible = menuStyles.display !== 'none' &&
                        menuStyles.visibility !== 'hidden' &&
                        menuStyles.opacity !== '0';
    if (!menuVisible) return;

    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    // Menu is on the right side if its center is past the midpoint
    const menuOnRight = (menuRect.left + menuRect.width / 2) > viewportWidth / 2;
    if (!menuOnRight) return;

    // Push our toggle to the LEFT of the menu, with a gap
    const GAP = 10;
    const safeRight = viewportWidth - menuRect.left + GAP;
    // Clamp so it never goes off-screen on tiny devices
    const clampedRight = Math.min(safeRight, viewportWidth - 60);
    toggle.style.right = `${clampedRight}px`;
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

      // Wait a tick so the layout settles, then position
      requestAnimationFrame(() => {
        avoidMenuCollision();
      });

      // Reposition on resize / orientation change (debounced)
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(avoidMenuCollision, 120);
      });
      window.addEventListener('orientationchange', () => {
        setTimeout(avoidMenuCollision, 200);
      });

      // Also watch for the menu being toggled open/closed
      const menu = document.getElementById('menuToggle');
      if (menu) {
        menu.addEventListener('click', () => {
          // The menu's own handler may change layout — re-check shortly after
          setTimeout(avoidMenuCollision, 50);
          setTimeout(avoidMenuCollision, 250);
        });
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
