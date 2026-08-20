/* ============================================
   ProcoZone — Shell de la aplicación
   Layout principal: Sidebar + Header + Content
   ============================================ */
import { renderSidebar } from './components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { iniciarRouter } from '../router.js';
import { http } from '../services/http-client.js';

/**
 * Inicializa el layout completo de la aplicación
 */
export function iniciarApp() {
  const app = document.getElementById('app');
  if (!app) return;

  // Obtener ruta actual para marcar sidebar
  const rutaActual = window.location.hash.slice(1) || '/';

  app.innerHTML = `
    <div class="app-layout">
      ${renderSidebar(rutaActual)}
      <div class="app-main">
        ${renderHeader('Dashboard', 'Gestión de Zonas Francas — PROCOMER')}
        <main class="app-content" id="content">
          <!-- El router inyecta las páginas aquí -->
        </main>
      </div>
    </div>
  `;

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

  // Iniciar el router
  iniciarRouter();
}