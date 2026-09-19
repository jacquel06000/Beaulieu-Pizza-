/**
 * main.js — assemble SITE (site-data.js) + I18N (i18n.js) :
 * traduction, rendu de la carte, horaires en direct, navigation, animations.
 */
(function () {
  'use strict';

  const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const JS_DAY_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const LANGS = ['fr', 'en', 'it'];
  const DEFAULT_LANG = 'fr';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function getStoredLang() {
    try {
      const saved = localStorage.getItem('mdp_lang');
      if (saved && LANGS.includes(saved)) return saved;
    } catch (e) { /* localStorage indisponible */ }
    const nav = (navigator.language || '').slice(0, 2).toLowerCase();
    return LANGS.includes(nav) ? nav : DEFAULT_LANG;
  }

  function setStoredLang(lang) {
    try { localStorage.setItem('mdp_lang', lang); } catch (e) { /* ignore */ }
  }

  function getByPath(obj, path) {
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  function applyTranslations(lang) {
    const dict = I18N[lang];
    document.documentElement.lang = dict.htmlLang;

    $$('[data-i18n]').forEach((el) => {
      const value = getByPath(dict, el.getAttribute('data-i18n'));
      if (value !== undefined) el.textContent = value;
    });

    $$('[data-i18n-attr]').forEach((el) => {
      el.getAttribute('data-i18n-attr').split(';').forEach((pair) => {
        const [attr, path] = pair.split(':').map((s) => s.trim());
        const value = getByPath(dict, path);
        if (attr && value !== undefined) el.setAttribute(attr, value);
      });
    });

    const page = document.body.getAttribute('data-page') || 'home';
    const meta = dict.meta[page];
    if (meta) {
      document.title = meta.title;
      const metaDesc = $('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', meta.desc);
      const ogTitle = $('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', meta.title);
      const ogDesc = $('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', meta.desc);
    }

    $$('.lang-menu button').forEach((btn) => {
      btn.setAttribute('aria-current', btn.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
    $$('[data-lang-label]').forEach((el) => { el.textContent = lang.toUpperCase(); });

    renderHours(lang);
    renderMenu(lang);
    renderLegal();
    injectStructuredData(lang);
  }

  function setLanguage(lang) {
    if (!LANGS.includes(lang)) lang = DEFAULT_LANG;
    setStoredLang(lang);
    applyTranslations(lang);
    document.dispatchEvent(new CustomEvent('mdp:langchange', { detail: { lang } }));
  }

  /* ------------------------------------------------------------------ */
  /* Header : scroll, menu mobile, sélecteur de langue                   */
  /* ------------------------------------------------------------------ */
  function initHeader() {
    const header = $('.site-header');
    if (header) {
      const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    const navToggle = $('.nav-toggle');
    const mobilePanel = $('.mobile-panel');
    const mobileClose = $('.mobile-panel-close');
    if (navToggle && mobilePanel) {
      const open = () => {
        mobilePanel.classList.add('is-open');
        document.body.classList.add('no-scroll');
        navToggle.setAttribute('aria-expanded', 'true');
      };
      const close = () => {
        mobilePanel.classList.remove('is-open');
        document.body.classList.remove('no-scroll');
        navToggle.setAttribute('aria-expanded', 'false');
      };
      navToggle.addEventListener('click', open);
      if (mobileClose) mobileClose.addEventListener('click', close);
      $$('.mobile-panel nav a').forEach((a) => a.addEventListener('click', close));
    }

    $$('.lang-switch').forEach((wrap) => {
      const btn = $('.lang-btn', wrap);
      const menu = $('.lang-menu', wrap);
      if (!btn || !menu) return;
      const toggle = (force) => {
        const willOpen = force !== undefined ? force : !wrap.classList.contains('is-open');
        wrap.classList.toggle('is-open', willOpen);
        btn.setAttribute('aria-expanded', String(willOpen));
      };
      btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
      $$('button[data-lang]', menu).forEach((item) => {
        item.addEventListener('click', () => {
          setLanguage(item.getAttribute('data-lang'));
          toggle(false);
        });
      });
      document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) toggle(false); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
    });

    const currentFile = (location.pathname.split('/').pop() || 'index.html');
    $$('[data-nav-link]').forEach((a) => {
      const target = a.getAttribute('data-nav-link');
      a.classList.toggle('is-active', target === currentFile || (target === 'index.html' && currentFile === ''));
    });
  }

  /* ------------------------------------------------------------------ */
  /* Horaires en direct                                                  */
  /* ------------------------------------------------------------------ */
  function toMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  function computeStatus() {
    const now = new Date();
    const todayKey = JS_DAY_TO_KEY[now.getDay()];
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const today = SITE.hours.find((h) => h.day === todayKey);

    if (today && !today.closed) {
      const openMin = toMinutes(today.open);
      const closeMin = toMinutes(today.close);
      if (nowMin >= openMin && nowMin < closeMin) {
        return { open: true, closingSoon: closeMin - nowMin <= 30, closeTime: today.close };
      }
      if (nowMin < openMin) {
        return { open: false, opensToday: true, openTime: today.open };
      }
    }
    // Fermé : cherche la prochaine ouverture
    for (let i = 1; i <= 7; i++) {
      const idx = (DAY_ORDER.indexOf(todayKey) + i) % 7;
      const next = SITE.hours[idx];
      if (next && !next.closed) return { open: false, nextDay: next.day, openTime: next.open };
    }
    return { open: false };
  }

  function renderHours(lang) {
    const dict = I18N[lang];
    const statusEls = $$('[data-hours-status]');
    if (statusEls.length) {
      const status = computeStatus();
      let label;
      if (status.open) {
        label = status.closingSoon
          ? `${dict.hoursWidget.closingSoon} · ${status.closeTime}`
          : dict.hoursWidget.open;
      } else if (status.opensToday) {
        label = `${dict.hoursWidget.opensAt} ${status.openTime}`;
      } else if (status.nextDay) {
        label = `${dict.hoursWidget.reopens} ${dict.days[status.nextDay]} · ${status.openTime}`;
      } else {
        label = dict.hoursWidget.closed;
      }
      statusEls.forEach((el) => {
        el.classList.toggle('is-closed', !status.open);
        el.innerHTML = `<span class="dot"></span> ${label}`;
      });
    }

    const lists = $$('[data-hours-list]');
    if (lists.length) {
      const todayKey = JS_DAY_TO_KEY[new Date().getDay()];
      const html = DAY_ORDER.map((dayKey) => {
        const entry = SITE.hours.find((h) => h.day === dayKey);
        const isToday = dayKey === todayKey;
        const timeMarkup = entry && !entry.closed
          ? `<span class="time">${entry.open} – ${entry.close}</span>`
          : `<span class="time off">${dict.hoursWidget.closed}</span>`;
        return `<li class="${isToday ? 'is-today' : ''}"><span class="day">${dict.days[dayKey]}</span>${timeMarkup}</li>`;
      }).join('');
      lists.forEach((list) => { list.innerHTML = html; });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Rendu de la carte (page Nos Pâtes)                                  */
  /* ------------------------------------------------------------------ */
  function pastaIconSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 12c0-4 3-8 8-8s8 4 8 8-3 8-8 8-8-4-8-8Z" opacity="0"/><path d="M5 8c2 2 2 6 0 8M9 6c2 2 2 10 0 12M13 6c2 2 2 10 0 12M17 8c2 2 2 6 0 8"/></svg>';
  }

  function renderMenu(lang) {
    const dict = I18N[lang].pates;
    if (!dict) return;
    const menu = SITE.menu;

    const catRoot = $('[data-menu-categories]');
    if (catRoot) {
      const titles = { classiques: dict.catClassiques, farcies1: dict.catFarcies1, farcies2: dict.catFarcies2 };
      catRoot.innerHTML = menu.pastaCategories.map((cat) => `
        <div class="menu-block">
          <div class="menu-block-head">
            <h2>${titles[cat.id]}</h2>
            <div class="menu-prices">
              <span><b>${cat.price}</b> ${dict.priceLabel}</span>
              <span>${dict.halfLabel} · ${cat.half}</span>
              <span>${dict.maxiLabel} · ${cat.maxi}</span>
            </div>
          </div>
          <div class="pasta-grid">
            ${cat.items.map((item) => `<div class="pasta-item">${pastaIconSvg()}<span>${item}</span></div>`).join('')}
          </div>
        </div>
      `).join('');
    }

    const saucesIncRoot = $('[data-sauces-included]');
    if (saucesIncRoot) {
      saucesIncRoot.innerHTML = menu.saucesIncluded.map((s) => `<div class="sauce-row"><span>${s}</span></div>`).join('');
    }
    const saucesExtraRoot = $('[data-sauces-extra]');
    if (saucesExtraRoot) {
      saucesExtraRoot.innerHTML = menu.saucesExtra.map((s) => `<div class="sauce-row"><span>${s.name}</span><span class="price">${s.price}</span></div>`).join('');
    }

    const dessertsRoot = $('[data-desserts]');
    if (dessertsRoot) {
      dessertsRoot.innerHTML = menu.desserts.items.map((d) => `<li><span class="n">${d}</span><span class="p">${menu.desserts.price}</span></li>`).join('');
    }

    const waterRoot = $('[data-drinks-water]');
    if (waterRoot) waterRoot.innerHTML = menu.drinks.water.map((d) => `<li><span class="n">${d.name}</span><span class="p">${d.price}</span></li>`).join('');
    const softRoot = $('[data-drinks-soft]');
    if (softRoot) softRoot.innerHTML = menu.drinks.soft.map((d) => `<li><span class="n">${d.name}</span><span class="p">${d.price}</span></li>`).join('');
    const beersRoot = $('[data-drinks-beers]');
    if (beersRoot) beersRoot.innerHTML = menu.drinks.beers.map((d) => `<li><span class="n">${d.name}</span><span class="p">${d.price}</span></li>`).join('');
    const winesRoot = $('[data-drinks-wines]');
    if (winesRoot) {
      winesRoot.innerHTML = menu.drinks.wines.map((w) => `
        <li class="wine-item">
          <span class="n">${w.name}</span>
          <span class="prices"><span>${dict.glassLabel} · ${w.glass}</span><span>${dict.bottleLabel} · ${w.bottle}</span></span>
        </li>`).join('');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Mentions légales (page mentions-legales.html)                      */
  /* ------------------------------------------------------------------ */
  function renderLegal() {
    const legal = SITE.legal;
    if (!legal) return;
    const set = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };
    set('[data-legal-company]', legal.companyName);
    set('[data-legal-vat]', legal.vatNumber);
    set('[data-legal-address]', `${legal.registeredAddress.line1}<br>${legal.registeredAddress.line2}`);
    set('[data-legal-management]', legal.management.join(', '));
    set('[data-legal-designer]', legal.designer);
    set('[data-legal-host]', `${legal.host.name}<br>${legal.host.line1}<br>${legal.host.line2}`);
  }

  /* ------------------------------------------------------------------ */
  /* Données structurées Schema.org                                     */
  /* ------------------------------------------------------------------ */
  function injectStructuredData(lang) {
    const existing = $('#ld-restaurant');
    if (existing) existing.remove();

    const openingHoursSpecification = SITE.hours
      .filter((h) => !h.closed)
      .map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${{
          mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
        }[h.day]}`,
        opens: h.open,
        closes: h.close,
      }));

    const data = {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: SITE.brand,
      servesCuisine: 'Italian',
      priceRange: '€€',
      telephone: SITE.phoneDisplay,
      address: {
        '@type': 'PostalAddress',
        streetAddress: SITE.address.line1,
        addressLocality: 'Monaco',
        postalCode: '98000',
        addressCountry: 'MC',
      },
      openingHoursSpecification,
      inLanguage: lang,
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'ld-restaurant';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /* ------------------------------------------------------------------ */
  /* Apparition progressive au défilement                                */
  /* ------------------------------------------------------------------ */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });
    items.forEach((el) => observer.observe(el));
  }

  function initFooterYear() {
    $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initFooterYear();
    applyTranslations(getStoredLang());
    initReveal();
  });
})();
