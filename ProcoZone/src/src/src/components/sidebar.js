/* ============================================
   ProcoZone — Componente Sidebar
   ============================================ */
import { esEmpresa, esAnalista, esAdmin, obtenerSesion, cerrarSesion } from '../../utils/auth.js';
import { t } from '../../utils/translations.js';
import { renderThemeLanguageControls, bindThemeLanguageControls } from '../../components/theme-language-controls.js';

const ETIQUETAS_ROL = () => ({
  Empresa: t('role_company'),
  Analista: t('role_analyst'),
  Administrador: t('role_admin')
});

/**
 * Menú según el rol de la sesión:
 * 1. Empresa Solicitante / Instalada — registra solicitudes, envía reportes y consulta estado
 * 2. Analista ZF / Operaciones — panel de solicitudes con IA, empresas, cumplimiento y alertas
 * 3. Administrador / Gerente ZF — métricas, auditoría y configuración del régimen
 */
function menuPorRol() {
  if (esEmpresa()) {
    return [
      { ruta: '/solicitudes', icono: 'fa-file-circle-plus', texto: t('my_applications') },
      { ruta: '/nueva-solicitud', icono: 'fa-plus-circle', texto: t('new_request_menu') },
      { ruta: '/cumplimiento', icono: 'fa-chart-line', texto: t('compliance_reports_menu') },
      { ruta: '/alertas', icono: 'fa-bell', texto: t('my_alerts') }
    ];
  }
  if (esAnalista()) {
    return [
      { ruta: '/', icono: 'fa-gauge-high', texto: t('dashboard') },
      { ruta: '/solicitudes', icono: 'fa-file-circle-plus', texto: t('applications') },
      { ruta: '/empresas', icono: 'fa-building', texto: t('companies') },
      { ruta: '/cumplimiento', icono: 'fa-chart-line', texto: t('compliance') },
      { ruta: '/alertas', icono: 'fa-bell', texto: t('alerts') }
    ];
  }
  if (esAdmin()) {
    return [
      { ruta: '/', icono: 'fa-chart-pie', texto: t('process_metrics') },
      { ruta: '/solicitudes', icono: 'fa-file-circle-check', texto: t('applications') },
      { ruta: '/empresas', icono: 'fa-building', texto: t('companies') },
      { ruta: '/auditoria', icono: 'fa-clipboard-list-check', texto: t('audit_trail') },
      { ruta: '/zonas-francas', icono: 'fa-sliders', texto: t('regime_settings') },
      { ruta: '/cumplimiento', icono: 'fa-chart-line', texto: t('compliance') },
      { ruta: '/alertas', icono: 'fa-bell', texto: t('alerts') }
    ];
  }
  return [
    { ruta: '/', icono: 'fa-gauge-high', texto: t('dashboard') },
    { ruta: '/solicitudes', icono: 'fa-file-circle-plus', texto: t('applications') },
    { ruta: '/cumplimiento', icono: 'fa-chart-line', texto: t('compliance') },
    { ruta: '/alertas', icono: 'fa-bell', texto: t('alerts') }
  ];
}

export function renderSidebar(rutaActual) {
  const sesion = obtenerSesion();
  const items = menuPorRol();
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
          <div class="sidebar__user-avatar">${sesion?.nombre?.split(' ').map(nombre => nombre[0]).slice(0, 2).join('') || 'UC'}</div>
          <div class="sidebar__user-info">
            <span class="sidebar__user-name">${sesion?.nombre || t('user')}</span>
            <span class="sidebar__user-role">${ETIQUETAS_ROL()[sesion?.rol] || sesion?.rol || t('viewer')}</span>
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
