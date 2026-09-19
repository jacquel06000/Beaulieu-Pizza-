/**
 * CHEZ LES GOURMANDS — script commun à toutes les pages.
 * Lit SITE (site-data.js, faits neutres) et I18N (i18n.js, textes FR/EN/RU)
 * pour :
 *  - déterminer et mémoriser la langue du visiteur (sélecteur FR/EN/RU) ;
 *  - remplir tout le texte de la page (attributs data-i18n / data-i18n-html
 *    / data-i18n-alt / data-i18n-aria-label) et les métadonnées (title,
 *    description, Open Graph) selon la langue courante ;
 *  - remplir les liens tel:/adresse/horaires (attributs data-clg-*) ;
 *  - injecter les données structurées Schema.org ;
 *  - gérer le bandeau de consentement et le chargement différé de la carte
 *    Google Maps ;
 *  - construire la carte des plats, son aperçu et la galerie photo.
 *
 * Limite assumée : ce rendu est effectué côté client (JavaScript). Le tout
 * premier affichage — et ce que voit un robot n'exécutant pas le JS — reste
 * en français. Voir le README pour la note SEO correspondante.
 */
(function () {
  "use strict";

  const SUPPORTED_LANGS = ["fr", "en", "ru"];
  const LANG_KEY = "clg-lang";
  const LOCALES = { fr: "fr_FR", en: "en_US", ru: "ru_RU" };
  const PAGE_I18N_KEY = { accueil: "home", carte: "carte", restaurant: "restaurant", galerie: "galerie", contact: "contact", "404": "notFound" };

  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function detectLang() {
    try {
      const stored = window.localStorage.getItem(LANG_KEY);
      if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
    } catch (e) { /* localStorage indisponible */ }
    const nav = (navigator.language || "fr").slice(0, 2).toLowerCase();
    return SUPPORTED_LANGS.includes(nav) ? nav : "fr";
  }

  let currentLang = detectLang();

  function getPath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  function t(path) {
    const value = getPath(I18N[currentLang], path);
    if (value !== undefined) return value;
    return getPath(I18N.fr, path); // repli sur le français si une clé manque
  }

  function format(str, vars) {
    if (typeof str !== "string") return str;
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m));
  }

  function esc(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function templateVars() {
    return {
      phone: `<a class="link-underline" href="${SITE.phone.href}">${SITE.phone.display}</a>`,
      privacyLink: `<a href="confidentialite.html">${t("consent.privacyLinkLabel")}</a>`,
    };
  }

  /* ---------------------------------------------------------------------
   * 1. Application générique des traductions marquées dans le HTML
   * ------------------------------------------------------------------- */
  function applyI18n() {
    const vars = templateVars();
    $$("[data-i18n]").forEach((el) => {
      const value = t(el.getAttribute("data-i18n"));
      if (value !== undefined) el.textContent = format(value, vars);
    });
    $$("[data-i18n-html]").forEach((el) => {
      const value = t(el.getAttribute("data-i18n-html"));
      if (value !== undefined) el.innerHTML = format(value, vars);
    });
    [["data-i18n-alt", "alt"], ["data-i18n-aria-label", "aria-label"], ["data-i18n-title", "title"]].forEach(([attr, target]) => {
      $$(`[${attr}]`).forEach((el) => {
        const value = t(el.getAttribute(attr));
        if (value !== undefined) el.setAttribute(target, format(value, vars));
      });
    });
    document.documentElement.setAttribute("lang", currentLang);
    $$(".legal-lang-notice").forEach((el) => el.classList.toggle("is-visible", currentLang !== "fr"));
  }

  function applyMeta() {
    const page = (document.body.getAttribute("data-page") || "").trim();
    const key = PAGE_I18N_KEY[page];
    if (!key) return;
    const meta = t(`pages.${key}.meta`);
    if (!meta) return;
    document.title = meta.title;
    const md = document.getElementById("meta-description");
    if (md) md.setAttribute("content", meta.description);
    const ogt = document.getElementById("og-title");
    if (ogt) ogt.setAttribute("content", meta.ogTitle || meta.title);
    const ogd = document.getElementById("og-description");
    if (ogd) ogd.setAttribute("content", meta.ogDescription || meta.description);
    const ogl = document.getElementById("og-locale");
    if (ogl) ogl.setAttribute("content", LOCALES[currentLang]);
  }

  /* ---------------------------------------------------------------------
   * 2. Sélecteur de langue
   * ------------------------------------------------------------------- */
  function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) return;
    currentLang = lang;
    try { window.localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    renderAll();
  }

  function buildLangSwitcher() {
    const root = document.getElementById("lang-switcher");
    if (!root) return;
    const labels = { fr: "FR", en: "EN", ru: "RU" };
    root.innerHTML = SUPPORTED_LANGS.map((lang) => `
      <button type="button" class="lang-btn${lang === currentLang ? " is-active" : ""}"
        data-lang="${lang}" aria-pressed="${lang === currentLang}" lang="${lang}">${labels[lang]}</button>
    `).join("");
    root.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
    });
  }

  /* ---------------------------------------------------------------------
   * 3. Photos centralisées — data-clg-img="hero"|"intro" (site-data.js)
   * ------------------------------------------------------------------- */
  function fillImages() {
    const map = { hero: SITE.hero.image, intro: SITE.intro.image };
    $$("[data-clg-img]").forEach((el) => {
      const src = map[el.getAttribute("data-clg-img")];
      if (src) el.setAttribute("src", src);
    });
  }

  /* ---------------------------------------------------------------------
   * 4. Champs data-clg-* : téléphone, adresse, horaires — partout sur le site
   * ------------------------------------------------------------------- */
  function fillFacts() {
    $$("[data-clg-phone-display]").forEach((el) => { el.textContent = SITE.phone.display; });
    $$("[data-clg-phone-href]").forEach((el) => { el.setAttribute("href", SITE.phone.href); });
    $$("[data-clg-address-full]").forEach((el) => {
      el.textContent = `${SITE.address.line1}, ${SITE.address.postalCode} ${SITE.address.city}`;
    });
    $$("[data-clg-maps-url]").forEach((el) => { el.setAttribute("href", SITE.address.mapsUrl); });
    $$("[data-clg-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

    $$("[data-clg-hours-table]").forEach((el) => {
      const todayIndex = (new Date().getDay() + 6) % 7; // lundi = 0
      el.innerHTML = SITE.hours.map((h, i) => {
        const isToday = i === todayIndex ? " is-today" : "";
        const value = h.closed ? `<span class="closed">${esc(t("days.closed"))}</span>` : `${h.open} – ${h.close}`;
        return `<div class="hours-row${isToday}"><span>${esc(t(`days.${h.dayKey}`))}</span><span>${value}</span></div>`;
      }).join("");
    });
  }

  /* ---------------------------------------------------------------------
   * 4. Navigation — génère desktop + mobile depuis SITE.nav, marque la page active
   * ------------------------------------------------------------------- */
  function buildNav() {
    const current = (document.body.getAttribute("data-page") || "").trim();
    const linkHtml = (item) => {
      const isCurrent = item.id === current;
      return `<li><a href="${item.href}"${isCurrent ? ' aria-current="page"' : ""}>${esc(t(`nav.${item.id}`))}</a></li>`;
    };
    const desktop = document.getElementById("nav-desktop");
    const mobile = document.getElementById("nav-mobile-links");
    if (desktop) desktop.innerHTML = `<ul>${SITE.nav.map(linkHtml).join("")}</ul>`;
    if (mobile) mobile.innerHTML = `<ul>${SITE.nav.map(linkHtml).join("")}</ul>`;

    const toggle = document.getElementById("nav-toggle");
    if (toggle && mobile && !toggle.dataset.bound) {
      toggle.dataset.bound = "1";
      toggle.addEventListener("click", () => {
        const isOpen = mobile.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });
      mobile.addEventListener("click", (e) => {
        if (e.target.tagName === "A") {
          mobile.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  /* ---------------------------------------------------------------------
   * 5. Footer — coordonnées, horaires, liens légaux
   * ------------------------------------------------------------------- */
  function buildFooter() {
    const nav = document.getElementById("footer-nav");
    if (nav) nav.innerHTML = SITE.nav.map((i) => `<li><a href="${i.href}">${esc(t(`nav.${i.id}`))}</a></li>`).join("");

    const legal = document.getElementById("footer-legal");
    if (legal) {
      legal.innerHTML = SITE.legalLinks.map((l) => `<a href="${l.href}">${esc(t(`legalLinks.${l.id}`))}</a>`).join("")
        + `<button type="button" class="link-like" id="footer-cookie-settings">${esc(t("common.cookieManageBtn"))}</button>`;
    }

    const addr = document.getElementById("footer-address");
    if (addr) {
      addr.innerHTML = `
        <li>${esc(SITE.name)}</li>
        <li>${esc(SITE.address.line1)}</li>
        <li>${esc(SITE.address.postalCode)} ${esc(SITE.address.city)}</li>
        <li><a href="${SITE.phone.href}">${esc(SITE.phone.display)}</a></li>`;
    }

    const hours = document.getElementById("footer-hours");
    if (hours) {
      const openDays = SITE.hours.filter((h) => !h.closed);
      const first = openDays[0], last = openDays[openDays.length - 1];
      hours.innerHTML = `<li>${esc(t(`days.${first.dayKey}`))} – ${esc(t(`days.${last.dayKey}`))} : ${first.open} – ${first.close}</li><li>${esc(t("days.sun"))} : ${esc(t("days.closed"))}</li>`;
    }
  }

  /* ---------------------------------------------------------------------
   * 6. Données structurées Schema.org — générées depuis SITE, sans invention
   * ------------------------------------------------------------------- */
  function buildSchema() {
    const ldEl = document.getElementById("ld-json");
    if (!ldEl) return;
    const openingHoursSpecification = SITE.hours
      .filter((h) => !h.closed)
      .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.schemaDay, opens: h.open, closes: h.close }));

    const pageUrl = window.location.href.split("#")[0];
    const data = {
      "@context": "https://schema.org",
      "@type": "FoodEstablishment",
      name: SITE.name,
      servesCuisine: "Crêperie",
      telephone: SITE.phone.href.replace("tel:", ""),
      address: {
        "@type": "PostalAddress",
        streetAddress: SITE.address.line1,
        postalCode: SITE.address.postalCode,
        addressLocality: SITE.address.city,
        addressCountry: "FR",
      },
      openingHoursSpecification,
      url: pageUrl,
      hasMenu: new URL("carte.html", pageUrl).toString(),
    };
    ldEl.textContent = JSON.stringify(data);
  }

  /* ---------------------------------------------------------------------
   * 7. Pluriel du compteur de plats ("3 propositions" / "3 позиции"...)
   * ------------------------------------------------------------------- */
  function menuCountLabel(n) {
    const forms = t("common.menuCount");
    if (currentLang === "ru") {
      const mod10 = n % 10, mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return format(forms.one, { n });
      if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return format(forms.few, { n });
      return format(forms.many, { n });
    }
    return n === 1 ? format(forms.one, { n }) : format(forms.other, { n });
  }

  /* ---------------------------------------------------------------------
   * 8. Carte des plats — page carte.html (attend #menu-categories)
   * ------------------------------------------------------------------- */
  function menuItemHtml(itemId, price) {
    const dict = t(`menu.items.${itemId}`) || {};
    return `
      <div class="menu-item">
        <div class="menu-item-info">
          <h3>${esc(dict.name)}</h3>
          ${dict.description ? `<p>${esc(dict.description)}</p>` : ""}
        </div>
        ${price ? `<div class="menu-item-price">${esc(price)}</div>` : ""}
      </div>`;
  }

  function buildMenuPage() {
    const root = document.getElementById("menu-categories");
    if (!root) return;
    root.innerHTML = SITE.menuCategories.map((cat) => {
      const catDict = t(`menu.categories.${cat.id}`) || {};
      return `
        <div class="menu-category" id="${cat.id}">
          <div class="menu-category-head">
            <h2>${esc(catDict.title)}</h2>
            <span class="count">${esc(menuCountLabel(cat.items.length))}</span>
          </div>
          ${catDict.note ? `<p class="hours-note">${esc(catDict.note)}</p>` : ""}
          <div class="menu-list">
            ${cat.items.map((item) => menuItemHtml(item.id, item.price)).join("")}
          </div>
        </div>`;
    }).join("");

    const jump = document.getElementById("menu-jump");
    if (jump) {
      jump.innerHTML = SITE.menuCategories.map((cat) => {
        const catDict = t(`menu.categories.${cat.id}`) || {};
        return `<a href="#${cat.id}">${esc(catDict.title)}</a>`;
      }).join("");
    }
  }

  /* ---------------------------------------------------------------------
   * 9. Aperçu de la carte — page d'accueil (attend #menu-preview-grid)
   * ------------------------------------------------------------------- */
  function buildMenuPreview() {
    const root = document.getElementById("menu-preview-grid");
    if (!root) return;
    root.innerHTML = SITE.menuPreviewRefs.map((ref) => {
      const cat = SITE.menuCategories.find((c) => c.id === ref.cat);
      const item = cat && cat.items.find((i) => i.id === ref.id);
      return item ? menuItemHtml(item.id, item.price) : "";
    }).join("");
  }

  /* ---------------------------------------------------------------------
   * 10. Galerie — page galerie.html (attend #gallery-grid)
   * ------------------------------------------------------------------- */
  function buildGallery() {
    const root = document.getElementById("gallery-grid");
    if (!root) return;
    const captions = t("gallery.captions") || [];
    const demoLabel = t("common.demoPhotoCaption");
    root.innerHTML = SITE.gallery.map((item, i) => {
      const caption = captions[i] || "";
      const alt = `${demoLabel} — ${caption}`;
      return `
        <figure class="gallery-item">
          <img src="${item.image}" alt="${esc(alt)}" loading="lazy" width="450" height="450">
          <figcaption class="gallery-cap">${esc(demoLabel)}</figcaption>
        </figure>`;
    }).join("");
  }

  /* ---------------------------------------------------------------------
   * 11. Consentement cookies — uniquement pour la carte Google Maps intégrée.
   *     Stocké en localStorage : "granted" / "denied". Rejouable à tout
   *     moment via le bouton "Gérer les cookies" du pied de page.
   * ------------------------------------------------------------------- */
  const CONSENT_KEY = "clg-consent-maps";

  function getConsent() {
    try { return window.localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { window.localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* stockage indisponible */ }
  }

  function loadMap(container) {
    if (!container) return;
    container.innerHTML = `<iframe src="${SITE.address.mapsEmbedUrl}"
      title="Localisation de Chez les Gourmands sur Google Maps"
      loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  }

  function showMapPlaceholder(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="map-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
        <p>${esc(t("consent.mapNotice"))}</p>
        <button type="button" class="btn btn--secondary" id="map-consent-inline">${esc(t("consent.showMapBtn"))}</button>
      </div>`;
    const btn = document.getElementById("map-consent-inline");
    if (btn) btn.addEventListener("click", () => { setConsent("granted"); applyConsentEverywhere(); });
  }

  function applyConsentEverywhere() {
    const consent = getConsent();
    $$("[data-clg-map]").forEach((container) => {
      if (consent === "granted") loadMap(container);
      else showMapPlaceholder(container);
    });
    const banner = document.getElementById("consent-banner");
    if (banner) banner.classList.toggle("is-visible", consent !== "granted" && consent !== "denied");
  }

  function buildConsentBanner() {
    const banner = document.getElementById("consent-banner");
    if (!banner) return;
    const vars = templateVars();
    banner.innerHTML = `
      <p>${format(t("consent.text"), vars)}</p>
      <div class="consent-actions">
        <button type="button" class="btn btn--primary" id="consent-accept">${esc(t("consent.acceptBtn"))}</button>
        <button type="button" class="btn btn--secondary" id="consent-decline">${esc(t("consent.declineBtn"))}</button>
      </div>`;
    document.getElementById("consent-accept").addEventListener("click", () => { setConsent("granted"); applyConsentEverywhere(); });
    document.getElementById("consent-decline").addEventListener("click", () => { setConsent("denied"); applyConsentEverywhere(); });
  }

  function initConsent() {
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "footer-cookie-settings") {
        try { window.localStorage.removeItem(CONSENT_KEY); } catch (err) { /* ignore */ }
        applyConsentEverywhere();
        const banner = document.getElementById("consent-banner");
        if (banner) { banner.classList.add("is-visible"); banner.scrollIntoView({ behavior: "smooth", block: "center" }); }
      }
    });
  }

  /* ---------------------------------------------------------------------
   * Rendu complet (premier chargement + à chaque changement de langue)
   * ------------------------------------------------------------------- */
  function renderAll() {
    applyI18n();
    applyMeta();
    buildLangSwitcher();
    fillImages();
    fillFacts();
    buildNav();
    buildFooter();
    buildSchema();
    buildMenuPreview();
    buildMenuPage();
    buildGallery();
    buildConsentBanner();
    applyConsentEverywhere();
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderAll();
    initConsent();
  });
})();
