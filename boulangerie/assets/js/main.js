// La Boulange de Beaulieu — script principal (page d'accueil)

document.addEventListener('DOMContentLoaded', () => {
  // Menu mobile
  const toggle = document.getElementById('nav-toggle');
  const navMobile = document.getElementById('nav-mobile');
  if (toggle && navMobile) {
    toggle.addEventListener('click', () => {
      const isOpen = navMobile.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    navMobile.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navMobile.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Année dynamique dans le pied de page
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
