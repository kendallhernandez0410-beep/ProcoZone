/* ============================================
   ProcoZone — Shell de la aplicación
   Layout principal: Sidebar + Header + Content
   ============================================ */
import { renderSidebar, iniciarSidebar } from './components/sidebar.js';
import { renderHeader, iniciarBusqueda, iniciarAlertasDropdown } from '../components/header.js';
import { navegar } from '../router.js';
import { esEmpresa, esInterno, estaAutenticado } from '../utils/auth.js';
import { iniciarChatbot, detenerChatbot } from './components/chatbot.js';
import { mostrarCookieConsent } from './components/cookie-consent.js';
import { applyTheme } from '../utils/theme.js';
import { getLanguage, t } from '../utils/translations.js';
import { iniciarControlesGlobales } from '../components/theme-language-controls.js';

const rutasPublicas = ['/landing', '/login', '/solicitar-acceso'];
// Rol 1 — Empresa Solicitante / Instalada: registra solicitudes y consulta estado/alertas
// (los reportes de cumplimiento son exclusivos del panel interno)
const rutasEmpresa = ['/solicitudes', '/nueva-solicitud', '/alertas'];

/**
 * Devuelve la ruta corregida según el rol de la sesión activa:
 * - Empresa: solo sus rutas (solicitudes, reportes y alertas)
 * - Analista/Administrador: todo el panel interno excepto nueva solicitud
 */
function normalizarRutaPorRol(ruta) {
  if (esEmpresa()) {
    if (!rutasEmpresa.includes(ruta)) {
      window.location.hash = '#/solicitudes';
      return '/solicitudes';
    }
    return ruta;
  }
  if (esInterno() && ruta === '/nueva-solicitud') {
    window.location.hash = '#/';
    return '/';
  }
  return ruta;
}

function rutaActual() {
  return window.location.hash.slice(1) || '/landing';
}

function montarAplicacion() {
  const app = document.getElementById('app');
  if (!app) return;

  applyTheme();
  const lang = getLanguage();
  document.documentElement.lang = lang;

  let ruta = normalizarRutaPorRol(rutaActual());
  if (!rutasPublicas.includes(ruta) && !estaAutenticado()) {
    window.location.hash = '#/login';
    ruta = '/login';
  }
  if (rutasPublicas.includes(ruta)) {
    app.innerHTML = '<main id="public-content"></main>';
    mostrarCookieConsent();
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
  iniciarBusqueda();
  iniciarAlertasDropdown();
  // El asistente virtual acompaña a la empresa en toda su área
  if (esEmpresa()) iniciarChatbot(); else detenerChatbot();

  // Actualizar título dinámicamente desde el router
  const headerTitle = document.getElementById('headerTitle');
  if (!headerTitle) {
    // Crear referencia para el router
    const h1 = app.querySelector('.header__title');
    if (h1) h1.id = 'headerTitle';
  }

  navegar(ruta);
}

export function iniciarApp() {
  iniciarControlesGlobales();
  montarAplicacion();
  window.addEventListener('app:language-updated', () => montarAplicacion());
  window.addEventListener('app:theme-updated', () => montarAplicacion());
  window.addEventListener('hashchange', () => {
    let ruta = normalizarRutaPorRol(rutaActual());
    const esPublica = rutasPublicas.includes(ruta);
    const hayShell = document.querySelector('.app-layout');
    if (esPublica !== !hayShell) montarAplicacion();
    else navegar(ruta);
  });
}
