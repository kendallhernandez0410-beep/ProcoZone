/* ============================================
   ProcoZone — Componente Sidebar
   ============================================ */
const navItems = [
  { ruta: '/', icono: 'fa-gauge-high', texto: 'Dashboard' },
  { ruta: '/solicitudes', icono: 'fa-file-circle-plus', texto: 'Solicitudes' },
  { ruta: '/nueva-solicitud', icono: 'fa-plus-circle', texto: 'Nueva Solicitud' },
  { ruta: '/empresas', icono: 'fa-building', texto: 'Empresas' },
  { ruta: '/cumplimiento', icono: 'fa-chart-line', texto: 'Cumplimiento' },
  { ruta: '/alertas', icono: 'fa-bell', texto: 'Alertas' }
];

export function renderSidebar(rutaActual) {
  const navHTML = navItems.map(item => {
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
        <div class="sidebar__section-label">Principal</div>
        ${navHTML}
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__user">
          <div class="sidebar__user-avatar">AR</div>
          <div class="sidebar__user-info">
            <span class="sidebar__user-name">Ana Rodríguez</span>
            <span class="sidebar__user-role">Analista Senior</span>
          </div>
        </div>
      </div>
    </aside>
  `;
}