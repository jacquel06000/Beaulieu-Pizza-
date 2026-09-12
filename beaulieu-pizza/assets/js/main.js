/**
 * ============================================================================
 * BEAULIEU PIZZA — SCRIPT PRINCIPAL
 * La page est peuplée à partir de `SITE` (données neutres, site-data.js) et
 * `I18N` (textes par langue, i18n.js). Modifier le contenu du site = modifier
 * ces deux fichiers, jamais celui-ci.
 * ============================================================================
 */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const badgeIcon = { bestseller: "star", spicy: "flame", vegetarian: "leaf" };
  const badgeClass = { bestseller: "badge--bestseller", spicy: "badge--epicee", vegetarian: "badge--vegetarienne" };

  // -------------------------------------------------------------------
  // Langue courante
  // -------------------------------------------------------------------
  function getInitialLang() {
    try {
      const saved = localStorage.getItem("bp-lang");
      if (saved && I18N[saved]) return saved;
    } catch (e) {
      /* localStorage indisponible (navigation privée…) : on ignore */
    }
    const browserLang = (navigator.language || "").slice(0, 2).toLowerCase();
    if (I18N[browserLang]) return browserLang;
    return DEFAULT_LANG;
  }

  let currentLang = getInitialLang();

  function setLang(code) {
    if (!I18N[code] || code === currentLang) {
      closeLangMenu();
      return;
    }
    currentLang = code;
    try {
      localStorage.setItem("bp-lang", code);
    } catch (e) {
      /* ignore */
    }
    document.documentElement.lang = code;
    renderAll();
  }

  // -------------------------------------------------------------------
  // Traduction : ingrédients, noms/descriptions courtes, alt d'images
  // -------------------------------------------------------------------
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function translateIngredients(list, lang) {
    return list
      .map((key, i) => {
        const word = (INGREDIENTS_I18N[key] && INGREDIENTS_I18N[key][lang]) || key;
        return i === 0 ? capitalize(word) : word;
      })
      .join(", ");
  }

  function translateFromDict(dict, frText, lang) {
    if (!frText) return "";
    const entry = dict[frText];
    return (entry && entry[lang]) || frText;
  }

  function itemName(name, lang) {
    return translateFromDict(MISC_NAME_I18N, name, lang);
  }

  function itemDescription(item, lang) {
    if (item.ingredients) return translateIngredients(item.ingredients, lang);
    return translateFromDict(MISC_DESC_I18N, item.description, lang);
  }

  function translateAlt(frText, lang) {
    return translateFromDict(ALT_I18N, frText, lang);
  }

  function renderBadges(badgeKeys, lang) {
    if (!badgeKeys || !badgeKeys.length) return "";
    return (
      '<div class="badges">' +
      badgeKeys
        .map((key) => {
          const icon = badgeIcon[key] ? `<i data-lucide="${badgeIcon[key]}"></i>` : "";
          const label = I18N[lang].badges[key] || key;
          return `<span class="badge ${badgeClass[key] || ""}">${icon}${label}</span>`;
        })
        .join("") +
      "</div>"
    );
  }

  // -------------------------------------------------------------------
  // Horaires
  // -------------------------------------------------------------------
  function formatTime(time, lang) {
    return lang === "fr" ? time.replace(":", "h") : time;
  }

  function formatTimeRange(range, lang) {
    return `${formatTime(range.open, lang)} – ${formatTime(range.close, lang)}`;
  }

  function formatHours(h, lang, separator) {
    const t = I18N[lang].hours;
    if (!h.lunch && !h.dinner) return t.closed;
    const lunchPart = h.lunch ? formatTimeRange(h.lunch, lang) : t.closedLunch;
    const dinnerPart = h.dinner ? formatTimeRange(h.dinner, lang) : t.closed;
    return `${lunchPart} ${separator} ${dinnerPart}`;
  }

  // -------------------------------------------------------------------
  // Sélecteur de langue (drapeaux, en haut à droite)
  // -------------------------------------------------------------------
  function closeLangMenu() {
    const menu = document.getElementById("lang-menu");
    const toggle = document.getElementById("lang-toggle");
    if (menu) menu.hidden = true;
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function renderLanguageSwitcher() {
    const lang = currentLang;
    const current = LANGUAGES.find((l) => l.code === lang);
    const container = document.getElementById("lang-switcher");

    container.innerHTML = `
      <button type="button" class="lang-toggle" id="lang-toggle" aria-haspopup="listbox" aria-expanded="false" aria-label="${I18N[lang].ui.langSwitcherLabel}">
        <span class="lang-flag" aria-hidden="true">${current.flag}</span>
        <span class="lang-code">${current.code.toUpperCase()}</span>
        <i data-lucide="chevron-down" aria-hidden="true"></i>
      </button>
      <ul class="lang-menu" id="lang-menu" role="listbox" aria-label="${I18N[lang].ui.langSwitcherLabel}" hidden>
        ${LANGUAGES.map(
          (l) => `
          <li role="presentation">
            <button type="button" class="lang-option${l.code === lang ? " is-active" : ""}" role="option" aria-selected="${l.code === lang}" data-lang="${l.code}">
              <span class="lang-flag" aria-hidden="true">${l.flag}</span> ${l.label}
            </button>
          </li>`
        ).join("")}
      </ul>`;

    document.getElementById("lang-toggle").addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = document.getElementById("lang-menu");
      const isOpen = !menu.hidden;
      menu.hidden = isOpen;
      e.currentTarget.setAttribute("aria-expanded", String(!isOpen));
    });

    container.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.dataset.lang));
    });
  }

  // -------------------------------------------------------------------
  // Header : logo, navigation, CTA
  // -------------------------------------------------------------------
  function renderHeader() {
    const lang = currentLang;
    const navHtml = SITE.nav
      .map((n) => `<a href="${n.href}" data-nav-link>${I18N[lang].nav[n.id]}</a>`)
      .join("");
    document.getElementById("nav-desktop").innerHTML = navHtml;
    document.getElementById("nav-mobile-links").innerHTML =
      navHtml +
      `<a class="btn btn--primary btn--block" href="${SITE.ORDER_URL}">
         <i data-lucide="phone-call"></i> ${I18N[lang].ui.order} · ${SITE.phoneDisplay}
       </a>`;

    document.getElementById("header-order-btn").setAttribute("aria-label", I18N[lang].ui.orderAriaLabel);
    document.getElementById("header-order-text").textContent = I18N[lang].ui.order;
    document.getElementById("nav-toggle").setAttribute("aria-label", I18N[lang].ui.openMenu);
    document.getElementById("float-call-btn").setAttribute("aria-label", I18N[lang].ui.floatCallAriaLabel);
    document.getElementById("skip-link").textContent = I18N[lang].ui.skipLink;

    document
      .querySelectorAll("[data-order-url]")
      .forEach((el) => (el.href = SITE.ORDER_URL));
    document
      .querySelectorAll("[data-phone-display]")
      .forEach((el) => (el.textContent = SITE.phoneDisplay));
  }

  // -------------------------------------------------------------------
  // Hero
  // -------------------------------------------------------------------
  function renderHero() {
    const lang = currentLang;
    const h = I18N[lang].hero;
    document.getElementById("hero-eyebrow").textContent = h.eyebrow;
    document.getElementById("hero-title").textContent = h.title;
    document.getElementById("hero-text").textContent = h.text;
    document.getElementById("hero-cta-primary").textContent = h.ctaPrimary;
    document.getElementById("hero-cta-secondary").textContent = h.ctaSecondary;

    const img = document.getElementById("hero-image");
    img.src = SITE.hero.image;
    img.alt = translateAlt(SITE.hero.imageAlt, lang);

    document.getElementById("hero-services").innerHTML = SITE.services
      .map((id) => `<li><i data-lucide="check"></i>${I18N[lang].services[id]}</li>`)
      .join("");
  }

  // -------------------------------------------------------------------
  // Engagements
  // -------------------------------------------------------------------
  function renderCommitments() {
    const lang = currentLang;
    const c = I18N[lang].commitments;
    document.getElementById("commitments-eyebrow").textContent = c.eyebrow;
    document.getElementById("commitments-title").textContent = c.title;
    document.getElementById("commitments-grid").innerHTML = c.items
      .map(
        (item) => `
        <article class="commitment" data-reveal>
          <div class="commitment-icon"><i data-lucide="${item.icon}"></i></div>
          <h3>${item.title}</h3>
          <p>${item.text}</p>
        </article>`
      )
      .join("");
  }

  // -------------------------------------------------------------------
  // Pizzas populaires
  // -------------------------------------------------------------------
  function renderPopularPizzas() {
    const lang = currentLang;
    document.getElementById("popular-eyebrow").textContent = I18N[lang].popular.eyebrow;
    document.getElementById("popular-title").textContent = I18N[lang].popular.title;
    document.getElementById("popular-intro").textContent = I18N[lang].popular.intro;

    document.getElementById("popular-pizza-grid").innerHTML = SITE.popularPizzas
      .map(
        (p) => `
        <article class="pizza-card" data-reveal>
          <div class="pizza-media">
            ${renderBadges(p.badges, lang)}
            <img src="${p.image}" alt="${translateAlt(p.imageAlt, lang)}" loading="lazy" width="600" height="450">
          </div>
          <div class="pizza-body">
            <div class="pizza-title-row">
              <h3>${p.name}</h3>
              <span class="pizza-price">${p.price}</span>
            </div>
            <p>${itemDescription(p, lang)}</p>
          </div>
        </article>`
      )
      .join("");
  }

  // -------------------------------------------------------------------
  // Carte complète + filtres
  // -------------------------------------------------------------------
  function renderMenu() {
    const lang = currentLang;
    document.getElementById("menu-eyebrow").textContent = I18N[lang].menu.eyebrow;
    document.getElementById("carte-title").textContent = I18N[lang].menu.title;
    document.getElementById("menu-intro").textContent = I18N[lang].menu.intro;
    document.getElementById("menu-note").textContent = I18N[lang].ui.extraIngredient;

    const filtersEl = document.getElementById("menu-filters");
    filtersEl.setAttribute("aria-label", I18N[lang].menu.filterAriaLabel);

    const activeFilter = filtersEl.dataset.active || "tout";
    const chips = [{ id: "tout", label: I18N[lang].ui.allMenu }].concat(
      SITE.menuCategories.map((c) => ({ id: c.id, label: I18N[lang].categories[c.id].label }))
    );
    filtersEl.innerHTML = chips
      .map(
        (c) =>
          `<button type="button" class="filter-chip${c.id === activeFilter ? " is-active" : ""}" data-filter="${c.id}" aria-pressed="${c.id === activeFilter}">${c.label}</button>`
      )
      .join("");

    document.getElementById("menu-categories").innerHTML = SITE.menuCategories
      .map((cat) => {
        const t = I18N[lang].categories[cat.id];
        const headHtml = cat.image
          ? `<div class="menu-category-head has-image">
               <div class="menu-category-photo">
                 <img src="${cat.image}" alt="${translateAlt(cat.imageAlt, lang)}" loading="lazy" width="400" height="300">
               </div>
               <div>
                 <h3>${t.label}</h3>
                 <p class="intro">${t.intro}</p>
               </div>
             </div>`
          : `<div class="menu-category-head">
               <div>
                 <h3>${t.label}</h3>
                 <p class="intro">${t.intro}</p>
               </div>
             </div>`;

        const itemsHtml = cat.items
          .map(
            (it) => `
            <li class="menu-item">
              <div class="menu-item-main">
                <div class="menu-item-name-row">
                  <span class="menu-item-name">${itemName(it.name, lang)}</span>
                  ${renderBadges(it.badges, lang)}
                </div>
                <p class="menu-item-desc">${itemDescription(it, lang)}</p>
              </div>
              <span class="menu-item-leader" aria-hidden="true"></span>
              <span class="menu-item-price">${it.price}</span>
            </li>`
          )
          .join("");

        return `
          <div class="menu-category" data-category="${cat.id}" ${cat.id === activeFilter || activeFilter === "tout" ? "" : "hidden"} data-reveal>
            ${headHtml}
            <ul class="menu-items">${itemsHtml}</ul>
          </div>`;
      })
      .join("");
  }

  // Attaché une seule fois : les clics sur les puces de filtre marchent
  // quelle que soit la langue affichée au moment du clic.
  function setupMenuFilters() {
    const filtersEl = document.getElementById("menu-filters");
    const listEl = document.getElementById("menu-categories");
    filtersEl.dataset.active = "tout";

    filtersEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      const target = btn.dataset.filter;
      filtersEl.dataset.active = target;
      filtersEl.querySelectorAll(".filter-chip").forEach((c) => {
        const active = c === btn;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-pressed", String(active));
      });
      listEl.querySelectorAll(".menu-category").forEach((cat) => {
        cat.hidden = !(target === "tout" || cat.dataset.category === target);
      });
    });
  }

  // -------------------------------------------------------------------
  // Notre histoire
  // -------------------------------------------------------------------
  function renderAbout() {
    const lang = currentLang;
    const a = I18N[lang].about;
    document.getElementById("histoire-eyebrow").textContent = a.eyebrow;
    document.getElementById("histoire-title-prefix").textContent = a.titlePrefix;
    document.getElementById("about-paragraphs").innerHTML = a.paragraphs
      .map((p) => `<p>${p}</p>`)
      .join("");
    document.getElementById("about-stat-years-label").textContent = a.stats.years;
    document.getElementById("about-stat-homemade-label").textContent = a.stats.homemade;
    document.getElementById("about-stat-oven-label").textContent = a.stats.oven;

    const img = document.getElementById("about-image");
    img.src = SITE.about.image;
    img.alt = translateAlt(SITE.about.imageAlt, lang);
    document.getElementById("about-year").textContent = SITE.foundedYear;
    document.getElementById("about-years-count").textContent =
      new Date().getFullYear() - SITE.foundedYear;
  }

  // -------------------------------------------------------------------
  // Avis clients
  // -------------------------------------------------------------------
  function renderTestimonials() {
    const lang = currentLang;
    document.getElementById("testimonials-eyebrow").textContent = I18N[lang].testimonials.eyebrow;
    document.getElementById("avis-title").textContent = I18N[lang].testimonials.title;

    document.getElementById("testimonial-grid").innerHTML = SITE.testimonials
      .map((t) => {
        const text = (TESTIMONIALS_I18N[t.name] && TESTIMONIALS_I18N[t.name][lang]) || "";
        const stars = Array.from({ length: 5 })
          .map((_, i) => `<i data-lucide="star" class="${i < t.rating ? "is-filled" : ""}"></i>`)
          .join("");
        return `
          <article class="testimonial-card" data-reveal>
            <div class="stars" role="img" aria-label="${I18N[lang].testimonials.ratingAriaLabel(t.rating)}">${stars}</div>
            <p class="testimonial-text">« ${text} »</p>
            <div class="testimonial-name">
              <span class="testimonial-avatar">${t.name.charAt(0)}</span>
              ${t.name}
            </div>
          </article>`;
      })
      .join("");
  }

  // -------------------------------------------------------------------
  // Informations pratiques
  // -------------------------------------------------------------------
  function renderPractical() {
    const lang = currentLang;
    const t = I18N[lang];
    document.getElementById("contact-eyebrow").textContent = t.contact.eyebrow;
    document.getElementById("contact-title").textContent = t.contact.title;
    document.getElementById("label-address").textContent = t.ui.address;
    document.getElementById("label-phone").textContent = t.ui.phone;
    document.getElementById("label-hours").textContent = t.ui.hours;
    document.getElementById("label-services").textContent = t.ui.services;
    document.getElementById("maps-link").textContent = t.ui.viewOnMaps;
    document.getElementById("contact-call-text").textContent = t.ui.callToOrder;
    document.getElementById("map-frame").title = t.ui.mapTitle;
    document.getElementById("footer-instagram").setAttribute("aria-label", t.ui.instagramAriaLabel);

    document.getElementById("uber-eats-btn").href = SITE.uberEatsUrl;
    document.getElementById("uber-eats-btn").setAttribute("aria-label", t.ui.uberEatsAriaLabel);
    document.getElementById("uber-eats-text").textContent = t.ui.orderUberEats;
    document.getElementById("footer-uber-eats").href = SITE.uberEatsUrl;
    document.getElementById("footer-uber-eats").setAttribute("aria-label", t.ui.uberEatsAriaLabel);

    const a = SITE.address;
    document.getElementById("practical-address").innerHTML = `${a.line1}<br>${a.postalCode} ${a.city}`;
    document.querySelectorAll("[data-maps-url]").forEach((el) => (el.href = a.mapsUrl));

    document.getElementById("hours-table").innerHTML = SITE.hours
      .map(
        (h) => `
        <div class="hours-row">
          <span class="hours-day">${t.days[h.day]}</span>
          <span class="hours-time">${formatHours(h, lang, "·")}</span>
        </div>`
      )
      .join("");
    document.getElementById("hours-note").textContent = t.hours.note;

    document.getElementById("services-row").innerHTML = SITE.services
      .map((id) => {
        const icon = id === "sur-place" ? "utensils" : id === "emporter" ? "shopping-bag" : "bike";
        return `<span class="service-pill"><i data-lucide="${icon}"></i>${t.services[id]}</span>`;
      })
      .join("");

    document.getElementById("map-frame").src = a.mapsEmbedUrl;
  }

  // -------------------------------------------------------------------
  // Footer
  // -------------------------------------------------------------------
  function renderFooter() {
    const lang = currentLang;
    const t = I18N[lang];

    document.getElementById("footer-tagline").textContent = t.ui.footerTagline;
    document.getElementById("footer-nav-label").textContent = t.ui.footerNav;
    document.getElementById("footer-address-label").textContent = t.ui.footerAddress;
    document.getElementById("footer-hours-label").textContent = t.ui.footerHours;
    document.getElementById("footer-rights").textContent = t.ui.rightsReserved;

    document.getElementById("footer-nav").innerHTML = SITE.nav
      .map((n) => `<li><a href="${n.href}">${t.nav[n.id]}</a></li>`)
      .join("");

    document.getElementById("footer-address").innerHTML =
      `<li>${SITE.address.line1}, ${SITE.address.postalCode} ${SITE.address.city}</li>
       <li><a href="${SITE.phoneHref}">${SITE.phoneDisplay}</a></li>
       <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>`;

    document.getElementById("footer-hours").innerHTML = SITE.hours
      .map((h) => `<li>${t.days[h.day]} — ${formatHours(h, lang, "/")}</li>`)
      .join("");

    document.getElementById("footer-instagram").href = SITE.social.instagram;
    document.getElementById("footer-legal").textContent = t.legal;
    document.getElementById("footer-year").textContent = new Date().getFullYear();
  }

  // -------------------------------------------------------------------
  // <title>, meta description & Open Graph (mis à jour selon la langue)
  // -------------------------------------------------------------------
  const OG_LOCALES = { fr: "fr_FR", en: "en_GB", es: "es_ES", it: "it_IT", ru: "ru_RU" };

  function renderMeta() {
    const lang = currentLang;
    const m = I18N[lang].meta;
    document.title = m.title;
    document.getElementById("meta-description").setAttribute("content", m.description);
    document.getElementById("og-title").setAttribute("content", m.title);
    document.getElementById("og-description").setAttribute("content", m.description);
    document.getElementById("og-locale").setAttribute("content", OG_LOCALES[lang] || "fr_FR");
  }

  // -------------------------------------------------------------------
  // Données structurées Schema.org (générées depuis SITE, source unique)
  // -------------------------------------------------------------------
  function renderStructuredData() {
    const dayMap = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
    const openingHours = [];
    SITE.hours.forEach((h) => {
      const day = dayMap[h.day];
      if (h.lunch) {
        openingHours.push({ "@type": "OpeningHoursSpecification", dayOfWeek: day, opens: h.lunch.open, closes: h.lunch.close });
      }
      if (h.dinner) {
        openingHours.push({ "@type": "OpeningHoursSpecification", dayOfWeek: day, opens: h.dinner.open, closes: h.dinner.close });
      }
    });

    const data = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: SITE.name,
      servesCuisine: "Pizza",
      priceRange: "€€",
      telephone: SITE.phoneHref.replace("tel:", ""),
      image: SITE.hero.image,
      url: window.location.href,
      address: {
        "@type": "PostalAddress",
        streetAddress: SITE.address.line1,
        addressLocality: SITE.address.city,
        postalCode: SITE.address.postalCode,
        addressCountry: "FR",
      },
      geo: { "@type": "GeoCoordinates", latitude: SITE.address.lat, longitude: SITE.address.lng },
      sameAs: [SITE.social.instagram],
      openingHoursSpecification: openingHours,
      hasMenu: window.location.href.split("#")[0] + "#carte",
    };

    document.getElementById("ld-json").textContent = JSON.stringify(data);
  }

  // -------------------------------------------------------------------
  // Rendu complet (appelé au chargement ET à chaque changement de langue)
  // -------------------------------------------------------------------
  function renderAll() {
    renderMeta();
    renderLanguageSwitcher();
    renderHeader();
    renderHero();
    renderCommitments();
    renderPopularPizzas();
    renderMenu();
    renderAbout();
    renderTestimonials();
    renderPractical();
    renderFooter();
    renderStructuredData();
    if (window.lucide) lucide.createIcons();
  }

  // -------------------------------------------------------------------
  // Interactions : header, menu mobile, scroll actif, reveal
  // -------------------------------------------------------------------
  function setupHeaderBehaviour() {
    const header = document.getElementById("site-header");
    const toggle = document.getElementById("nav-toggle");

    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    toggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.innerHTML = isOpen ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
      if (window.lucide) lucide.createIcons();
    });

    document.getElementById("nav-mobile-links").addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        header.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.innerHTML = '<i data-lucide="menu"></i>';
        if (window.lucide) lucide.createIcons();
      }
    });

    // Ferme le sélecteur de langue au clic ailleurs ou avec Échap
    document.addEventListener("click", closeLangMenu);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLangMenu();
    });
  }

  function setupActiveSection() {
    const sections = SITE.nav.map((n) => document.querySelector(n.href)).filter(Boolean);
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = "#" + entry.target.id;
            // Requêté à chaque déclenchement : le header est re-rendu à
            // chaque changement de langue, les anciens liens n'existent plus.
            document
              .querySelectorAll("[data-nav-link]")
              .forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === id));
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => io.observe(s));
  }

  function setupReveal() {
    if (prefersReducedMotion) return;
    const els = document.querySelectorAll("[data-reveal]");
    els.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  }

  // -------------------------------------------------------------------
  // Init
  // -------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.lang = currentLang;
    renderAll();
    setupMenuFilters();
    setupHeaderBehaviour();
    setupActiveSection();
    setupReveal();
  });
})();
