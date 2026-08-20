/* ============================================
   ProcoZone — Shell de la aplicación
   Layout principal: Sidebar + Header + Content
   ============================================ */
import { renderSidebar, iniciarSidebar } from './components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { navegar } from '../router.js';
import { esAnalista } from '../utils/auth.js';
import { applyTheme } from '../utils/theme.js';
import { getLanguage, t } from '../utils/translations.js';

const rutasPublicas = ['/landing', '/login'];

function rutaActual() {
  return window.location.hash.slice(1) || '/landing';
}

function montarAplicacion() {
  const app = document.getElementById('app');
  if (!app) return;

  applyTheme();
  const lang = getLanguage();
  document.documentElement.lang = lang;

  let ruta = rutaActual();
  if (ruta === '/nueva-solicitud' && !esAnalista()) {
    window.location.hash = '#/solicitudes';
    ruta = '/solicitudes';
  }
  if (!rutasPublicas.includes(ruta) && sessionStorage.getItem('procozone-authenticated') !== 'true') {
    window.location.hash = '#/login';
    ruta = '/login';
  }
  if (rutasPublicas.includes(ruta)) {
    app.innerHTML = '<main id="public-content"></main>';
    navegar(ruta);
    return;
  }

  app.innerHTML = `
    <div class="app-layout">
      ${renderSidebar(ruta)}
      <div class="app-main">
        ${renderHeader(t('dashboard'), t('dashboard_subtitle'))}
        <main class="app-content" id="content">
          <!-- El router inyecta las páginas aquí -->
        </main>
      </div>
    </div>
  `;
  iniciarSidebar();

  // Actualizar título dinámicamente desde el router
  const headerTitle = document.getElementById('headerTitle');
  if (!headerTitle) {
    // Crear referencia para el router
    const h1 = app.querySelector('.header__title');
    if (h1) h1.id = 'headerTitle';
  }

  // Navegación desde el sidebar al alertas
  document.getElementById('alertasBtn')?.addEventListener('click', () => {
    window.location.hash = '#/alertas';
  });

  navegar(ruta);
}

export function iniciarApp() {
  montarAplicacion();
  window.addEventListener('app:language-updated', () => montarAplicacion());
  window.addEventListener('app:theme-updated', () => montarAplicacion());
  window.addEventListener('hashchange', () => {
    let ruta = rutaActual();
    if (ruta === '/nueva-solicitud' && !esAnalista()) {
      window.location.hash = '#/solicitudes';
      ruta = '/solicitudes';
    }
    const esPublica = rutasPublicas.includes(ruta);
    const hayShell = document.querySelector('.app-layout');
    if (esPublica !== !hayShell) montarAplicacion();
    else navegar(ruta);
  });
}