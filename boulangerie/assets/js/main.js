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

  // Horaires : jour du jour en surbrillance + badge ouvert/fermé,
  // calculés sur l'heure de Paris (indépendamment du fuseau du visiteur).
  const hoursList = document.getElementById('hours-list');
  const statusEl = document.getElementById('hours-status');
  if (hoursList && statusEl) {
    const parts = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());

    const weekdayMap = { dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6 };
    let day = null, hour = null, minute = null;
    parts.forEach((p) => {
      if (p.type === 'weekday') day = weekdayMap[p.value.toLowerCase().slice(0, 3)];
      if (p.type === 'hour') hour = parseInt(p.value, 10);
      if (p.type === 'minute') minute = parseInt(p.value, 10);
    });

    if (day !== null && hour !== null) {
      const minutesNow = hour * 60 + minute;
      const todayLi = hoursList.querySelector(`li[data-day="${day}"]`);
      if (todayLi) todayLi.classList.add('is-today');

      // Créneaux : 7h-13h et 16h-19h tous les jours, sauf dimanche (7h-13h seulement)
      const morning = minutesNow >= 7 * 60 && minutesNow < 13 * 60;
      const evening = day !== 0 && minutesNow >= 16 * 60 && minutesNow < 19 * 60;
      const isOpen = morning || evening;

      statusEl.textContent = isOpen ? 'Ouvert maintenant' : 'Fermé actuellement';
      statusEl.classList.add(isOpen ? 'is-open' : 'is-closed');
    }
  }
});
