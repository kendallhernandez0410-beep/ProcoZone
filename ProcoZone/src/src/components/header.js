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
          <input type="text" placeholder="Buscar..." class="header__search-input" id="globalSearch" />
        </div>
        <button class="header__icon-btn" id="alertasBtn" aria-label="Alertas">
          <i class="fa-solid fa-bell"></i>
          <span class="header__badge" id="alertasCount">3</span>
        </button>
      </div>
    </header>
  `;
}