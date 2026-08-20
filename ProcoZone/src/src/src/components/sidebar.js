/* ============================================
   ProcoZone — Componente Sidebar
   ============================================ */
import { esAnalista, esConsulta, obtenerSesion, cerrarSesion } from '../../utils/auth.js';

function navItemsBase() {
  return [
    { ruta: '/', icono: 'fa-gauge-high', texto: t('dashboard') },
    { ruta: '/solicitudes', icono: 'fa-file-circle-plus', texto: t('applications') },
    { ruta: '/cumplimiento', icono: 'fa-chart-line', texto: t('compliance') },
    { ruta: '/alertas', icono: 'fa-bell', texto: t('alerts') }
  ];
}

export function renderSidebar(rutaActual) {
  const navItems = navItemsBase();
  const items = esAnalista()
    ? navItems.filter(item => item.ruta !== '/nueva-solicitud')
    : esConsulta()
      ? [{ ruta: '/solicitudes', icono: 'fa-file-circle-plus', texto: 'Mis Solicitudes' }, { ruta: '/nueva-solicitud', icono: 'fa-plus-circle', texto: 'Nueva Solicitud' }, { ruta: '/alertas', icono: 'fa-bell', texto: 'Mis Alertas' }]
      : navItems;
  if (esAnalista()) items.splice(2, 0, { ruta: '/empresas', icono: 'fa-building', texto: 'Empresas' });
  const navHTML = items.map(item => {
    const isActive = rutaActual === item.ruta;
    return `
      <a href="#${item.ruta}" class="sidebar-link ${isActive ? 'active' : ''}" data-ruta="${item.ruta}">
        <i class="fa-solid ${item.icono}"></i>
        <span class="sidebar-link__text">${item.texto}</span>
      </a>
    `;
  }).join('');

  return `
    <aside class="sidebar">
      <div class="sidebar__brand">
        <div class="sidebar__logo">
          <i class="fa-solid fa-cubes"></i>
        </div>
        <div class="sidebar__brand-text">
          <span class="sidebar__title">ProcoZone</span>
          <span class="sidebar__subtitle">PROCOMER</span>
        </div>
      </div>

      <nav class="sidebar__nav">
        <div class="sidebar__section-label">${t('principal')}</div>
        ${navHTML}
      </nav>

      <div class="sidebar__footer">
        ${renderThemeLanguageControls()}
        <div class="sidebar__user">
          <div class="sidebar__user-avatar">${obtenerSesion()?.nombre?.split(' ').map(nombre => nombre[0]).slice(0, 2).join('') || 'UC'}</div>
          <div class="sidebar__user-info">
            <span class="sidebar__user-name">${obtenerSesion()?.nombre || t('user')}</span>
            <span class="sidebar__user-role">${obtenerSesion()?.rol || t('viewer')}</span>
          </div>
        </div>
        <button class="sidebar-logout" id="logoutBtn" type="button"><i class="fa-solid fa-arrow-right-from-bracket"></i> ${t('logout')}</button>
      </div>
    </aside>
  `;
}

export function iniciarSidebar() {
  document.getElementById('logoutBtn')?.addEventListener('click', cerrarSesion);
  bindThemeLanguageControls();
}