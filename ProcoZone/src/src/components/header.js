import { esAnalista } from '../utils/auth.js';

/* ============================================
   ProcoZone — Componente Header
   ============================================ */

export function renderHeader(titulo, subtitulo = '') {
  return `
    <header class="header">
      <div class="header__left">
        <button class="header__menu-btn" id="menuToggle" aria-label="Menú">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div>
          <h1 class="header__title">${titulo}</h1>
          ${subtitulo ? `<p class="header__subtitle">${subtitulo}</p>` : ''}
        </div>
      </div>
      <div class="header__right">
        <div class="header__search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="search" placeholder="Buscar por título..." class="header__search-input" id="globalSearch" autocomplete="off" />
          <div class="search-results" id="searchResults" hidden></div>
        </div>
        <button class="header__icon-btn" id="alertasBtn" aria-label="Alertas">
          <i class="fa-solid fa-bell"></i>
          <span class="header__badge" id="alertasCount">3</span>
        </button>
      </div>
    </header>
  `;
}

const paginas = [
  { titulo: 'Dashboard', ruta: '/' },
  { titulo: 'Solicitudes', ruta: '/solicitudes' },
  { titulo: 'Nueva Solicitud', ruta: '/nueva-solicitud' },
  { titulo: 'Empresas', ruta: '/empresas' },
  { titulo: 'Reportes de Cumplimiento', ruta: '/cumplimiento' },
  { titulo: 'Alertas', ruta: '/alertas' }
];

export function iniciarBusqueda() {
  const input = document.getElementById('globalSearch');
  const results = document.getElementById('searchResults');
  if (!input || !results) return;
  const pintar = () => {
    const termino = input.value.trim().toLowerCase();
    const paginasDisponibles = esAnalista()
      ? paginas
      : paginas.filter(pagina => ['/solicitudes', '/nueva-solicitud', '/alertas'].includes(pagina.ruta));
    const coincidencias = paginasDisponibles.filter(pagina => pagina.titulo.toLowerCase().includes(termino));
    results.innerHTML = coincidencias.length
      ? coincidencias.map(pagina => `<a href="#${pagina.ruta}"><i class="fa-solid fa-arrow-up-right-from-square"></i>${pagina.titulo}</a>`).join('')
      : '<span>No se encontraron títulos.</span>';
    results.hidden = !termino;
  };
  input.addEventListener('input', pintar);
  input.addEventListener('focus', pintar);
  results.addEventListener('click', () => { results.hidden = true; input.value = ''; });
  document.addEventListener('click', event => {
    if (!event.target.closest('.header__search')) results.hidden = true;
  });
}