/**
 * CHEZ LES GOURMANDS — script commun à toutes les pages.
 * Lit SITE (site-data.js) pour :
 *  - remplir les liens tel:/adresse/horaires (attributs data-clg-*) ;
 *  - construire la navigation active, le menu mobile ;
 *  - injecter les données structurées Schema.org ;
 *  - gérer le bandeau de consentement et le chargement différé de la carte Google Maps ;
 *  - construire la carte des plats (page carte.html) et la galerie (page galerie.html) ;
 *  - déclencher les animations d'apparition douces (désactivées si prefers-reduced-motion).
 */
(function () {
  "use strict";

  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const esc = (str) =>
    String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

  /* ---------------------------------------------------------------------
   * 1. Champs data-clg-* : téléphone, adresse, horaires — partout sur le site
   * ------------------------------------------------------------------- */
  function fillFacts() {
    $$("[data-clg-phone-display]").forEach((el) => { el.textContent = SITE.phone.display; });
    $$("[data-clg-phone-href]").forEach((el) => { el.setAttribute("href", SITE.phone.href); });
    $$("[data-clg-address-line1]").forEach((el) => { el.textContent = SITE.address.line1; });
    $$("[data-clg-address-full]").forEach((el) => {
      el.textContent = `${SITE.address.line1}, ${SITE.address.postalCode} ${SITE.address.city}`;
    });
    $$("[data-clg-maps-url]").forEach((el) => { el.setAttribute("href", SITE.address.mapsUrl); });
    $$("[data-clg-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

    $$("[data-clg-hours-table]").forEach((el) => {
      const todayIndex = (new Date().getDay() + 6) % 7; // lundi = 0
      el.innerHTML = SITE.hours.map((h, i) => {
        const isToday = i === todayIndex ? " is-today" : "";
        const value = h.closed ? '<span class="closed">Fermé</span>' : `${h.open} – ${h.close}`;
        return `<div class="hours-row${isToday}"><span>${esc(h.day)}</span><span>${value}</span></div>`;
      }).join("");
    });

    $$("[data-clg-hours-inline]").forEach((el) => {
      el.textContent = "Lundi – samedi : 7 h 30 – 18 h · Dimanche : fermé";
    });
  }

  /* ---------------------------------------------------------------------
   * 2. Navigation — génère desktop + mobile depuis SITE.nav, marque la page active
   * ------------------------------------------------------------------- */
  function buildNav() {
    const current = (document.body.getAttribute("data-page") || "").trim();
    const linkHtml = (item) => {
      const isCurrent = item.id === current;
      return `<li><a href="${item.href}"${isCurrent ? ' aria-current="page"' : ""}>${esc(item.label)}</a></li>`;
    };
    const desktop = document.getElementById("nav-desktop");
    const mobile = document.getElementById("nav-mobile-links");
    if (desktop) desktop.innerHTML = `<ul>${SITE.nav.map(linkHtml).join("")}</ul>`;
    if (mobile) mobile.innerHTML = `<ul>${SITE.nav.map(linkHtml).join("")}</ul>`;

    const toggle = document.getElementById("nav-toggle");
    if (toggle && mobile) {
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
   * 3. Footer — coordonnées, horaires, liens légaux
   * ------------------------------------------------------------------- */
  function buildFooter() {
    const nav = document.getElementById("footer-nav");
    if (nav) nav.innerHTML = SITE.nav.map((i) => `<li><a href="${i.href}">${esc(i.label)}</a></li>`).join("");

    const legal = document.getElementById("footer-legal");
    if (legal) {
      legal.innerHTML = SITE.legalLinks.map((l) => `<a href="${l.href}">${esc(l.label)}</a>`).join("")
        + `<button type="button" class="link-like" id="footer-cookie-settings">Gérer les cookies</button>`;
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
      hours.innerHTML = `<li>Lun. – sam. : 7 h 30 – 18 h</li><li>Dimanche : fermé</li>`;
    }
  }

  /* ---------------------------------------------------------------------
   * 4. Données structurées Schema.org — générées depuis SITE, sans invention
   * ------------------------------------------------------------------- */
  function buildSchema() {
    const ldEl = document.getElementById("ld-json");
    if (!ldEl) return;
    const openingHoursSpecification = SITE.hours
      .filter((h) => !h.closed)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.schemaDay,
        opens: h.open,
        closes: h.close,
      }));

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
   * 5. Carte des plats — page carte.html (attend #menu-categories)
   * ------------------------------------------------------------------- */
  function buildMenuPage() {
    const root = document.getElementById("menu-categories");
    if (!root) return;
    root.innerHTML = SITE.menuCategories.map((cat) => `
      <div class="menu-category" id="${cat.id}">
        <div class="menu-category-head">
          <h2>${esc(cat.title)}</h2>
          <span class="count">${cat.items.length} ${cat.items.length > 1 ? "propositions" : "proposition"}</span>
        </div>
        ${cat.note ? `<p class="hours-note">${esc(cat.note)}</p>` : ""}
        <div class="menu-list">
          ${cat.items.map((item) => `
            <div class="menu-item">
              <div class="menu-item-info">
                <h3>${esc(item.name)}</h3>
                ${item.description ? `<p>${esc(item.description)}</p>` : ""}
              </div>
              ${item.price ? `<div class="menu-item-price">${esc(item.price)}</div>` : ""}
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");

    const jump = document.getElementById("menu-jump");
    if (jump) {
      jump.innerHTML = SITE.menuCategories.map((cat) => `<a href="#${cat.id}">${esc(cat.title)}</a>`).join("");
    }
  }

  /* ---------------------------------------------------------------------
   * 6. Aperçu de la carte — page d'accueil (attend #menu-preview-grid)
   * ------------------------------------------------------------------- */
  function buildMenuPreview() {
    const root = document.getElementById("menu-preview-grid");
    if (!root) return;
    root.innerHTML = SITE.menuPreview.map((dish) => `
      <article class="dish-card">
        <figure>
          <img src="${dish.image}" alt="${esc(dish.imageAlt)}" loading="lazy" width="400" height="300">
        </figure>
        <figcaption>
          <h3>${esc(dish.name)}</h3>
          <p>${esc(dish.description)}</p>
          <p class="price">${esc(dish.price)}</p>
        </figcaption>
      </article>
    `).join("");
  }

  /* ---------------------------------------------------------------------
   * 7. Galerie — page galerie.html (attend #gallery-grid)
   * ------------------------------------------------------------------- */
  function buildGallery() {
    const root = document.getElementById("gallery-grid");
    if (!root) return;
    root.innerHTML = SITE.gallery.map((item) => `
      <figure class="gallery-item">
        <img src="${item.image}" alt="${esc(item.alt)}" loading="lazy" width="450" height="450">
        <figcaption class="gallery-cap">${esc(item.caption)}</figcaption>
      </figure>
    `).join("");
  }

  /* ---------------------------------------------------------------------
   * 8. Consentement cookies — uniquement pour la carte Google Maps intégrée
   *    (aucun autre cookie non essentiel sur le site). Stocké en
   *    localStorage : "granted" / "denied". Rejouable à tout moment via
   *    le bouton "Gérer les cookies" du pied de page.
   * ------------------------------------------------------------------- */
  const CONSENT_KEY = "clg-consent-maps";

  function getConsent() {
    try { return window.localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { window.localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* stockage indisponible : rien à faire */ }
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
        <p>La carte interactive Google Maps dépose des cookies. Elle ne s'affiche qu'avec votre accord.</p>
        <button type="button" class="btn btn--secondary" id="map-consent-inline">Afficher la carte</button>
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

  function initConsent() {
    applyConsentEverywhere();

    const acceptBtn = document.getElementById("consent-accept");
    const declineBtn = document.getElementById("consent-decline");
    if (acceptBtn) acceptBtn.addEventListener("click", () => { setConsent("granted"); applyConsentEverywhere(); });
    if (declineBtn) declineBtn.addEventListener("click", () => { setConsent("denied"); applyConsentEverywhere(); });

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
   * Initialisation
   * ------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    fillFacts();
    buildNav();
    buildFooter();
    buildSchema();
    buildMenuPreview();
    buildMenuPage();
    buildGallery();
    initConsent();
  });
})();
