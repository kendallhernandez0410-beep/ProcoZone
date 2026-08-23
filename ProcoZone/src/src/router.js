/* ============================================
   ProcoZone — Router SPA basado en hashes
   Carga páginas dinámicamente con async/await
   ============================================ */
import { t } from './utils/translations.js';
import { esEmpresa } from './utils/auth.js';

const rutas = {
  '/landing': () => import('./pages/landing.js'),
  '/login': () => import('./pages/login.js'),
  '/solicitar-acceso': () => import('./pages/solicitar-acceso.js'),
  '/': () => import('./src/src/pages/dashboard.js'),
  '/solicitudes': () => import('./src/src/src/pages/solicitudes.js'),
  '/solicitudes-acceso': () => import('./pages/solicitudes-acceso.js'),
  '/nueva-solicitud': () => import('./pages/nueva-solicitud.js'),
  '/empresas': () => import('./src/pages/empresas.js'),
  '/auditoria': () => import('./src/pages/auditoria.js'),
  '/zonas-francas': () => import('./pages/zonas-francas.js'),
  '/cumplimiento': () => import('./src/pages/cumplimiento.js'),
  '/alertas': () => import('./src/pages/alertas.js')
};

const titulos = () => ({
  '/landing': t('back_to_landing'),
  '/login': t('login'),
  '/solicitar-acceso': t('access_title'),
  '/': t('dashboard'),
  '/solicitudes': t('applications'),
  '/solicitudes-acceso': t('access_requests_menu'),
  '/nueva-solicitud': t('new_application'),
  '/empresas': t('companies'),
  '/auditoria': t('audit_trail'),
  '/zonas-francas': t('zones_title'),
  '/cumplimiento': t('compliance_reports_menu'),
  '/alertas': t('alerts')
});

let moduloActual = null;
let navegacionActual = 0;

/**
 * Navega a una ruta específica
 */
export async function navegar(ruta) {
  const idNavegacion = ++navegacionActual;
  const contentEl = document.getElementById('content') || document.getElementById('public-content');
  if (!contentEl) return;

  // Destruir página anterior si existe
  if (moduloActual?.destroy) {
    moduloActual.destroy();
    moduloActual = null;
  }

  // Normalizar ruta
  if (!ruta.startsWith('/')) ruta = '/' + ruta;
  ruta = ruta.replace(/\/+$/, '') || '/';

  // 404
  if (!rutas[ruta]) {
    contentEl.innerHTML = `
      <div class="page-enter" style="text-align: center; padding: var(--space-16) 0;">
        <i class="fa-solid fa-compass" style="font-size: 4rem; color: var(--text-muted); opacity: 0.3; margin-bottom: var(--space-6);"></i>
        <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-2);">${t('page_not_found')}</h2>
        <p style="color: var(--text-muted); margin-bottom: var(--space-6);">${t('page_not_found_msg')} <code style="background: var(--bg-tertiary); padding: 2px 8px; border-radius: 4px;">${ruta}</code> ${t('does_not_exist')}</p>
        <a href="#/" class="btn btn-primary"><i class="fa-solid fa-house"></i> ${t('back_to_dashboard')}</a>
      </div>
    `;
    return;
  }

  // Actualizar header
  const headerTitle = document.getElementById('headerTitle');
  if (headerTitle) headerTitle.textContent = titulos()[ruta] || 'ProcoZone';

  // CTA "Nueva Solicitud": visible para la empresa en todas sus pantallas,
  // salvo en el propio formulario de creación (evita duplicar la acción)
  const btnNuevaSolicitud = document.getElementById('headerNuevaSolicitud');
  if (btnNuevaSolicitud) {
    btnNuevaSolicitud.hidden = !(esEmpresa() && ruta !== '/nueva-solicitud');
  }

  // Actualizar sidebar activo
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.toggle('active', link.dataset.ruta === ruta);
  });

  // Cargar módulo dinámicamente
  try {
    const modulo = await rutas[ruta]();
    if (idNavegacion !== navegacionActual) return;
    moduloActual = modulo;

    // Renderizar HTML de la página
    const html = await modulo.render();
    if (idNavegacion !== navegacionActual) return;
    contentEl.innerHTML = html;

    // Inicializar la página (bind events, cargar datos, etc.)
    if (modulo.init) {
      await modulo.init();
    }
  } catch (error) {
    console.error('Error al cargar la página:', error);
    contentEl.innerHTML = `
      <div class="page-enter" style="text-align: center; padding: var(--space-16) 0;">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 4rem; color: var(--error); opacity: 0.5; margin-bottom: var(--space-6);"></i>
        <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-2);">${t('load_error')}</h2>
        <p style="color: var(--text-muted); margin-bottom: var(--space-6);">${error.message}</p>
        <button class="btn btn-primary" onclick="location.reload()"><i class="fa-solid fa-rotate-right"></i> ${t('retry')}</button>
      </div>
    `;
  }
}

/**
 * Inicializa el router escuchando cambios de hash
 */
export function iniciarRouter() {
  const hash = window.location.hash.slice(1) || '/';
  navegar(hash);
}
