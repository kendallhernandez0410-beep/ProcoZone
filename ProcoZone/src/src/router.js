/* ============================================
   ProcoZone — Router SPA basado en hashes
   Carga páginas dinámicamente con async/await
   ============================================ */

const rutas = {
  '/landing': () => import('./pages/landing.js'),
  '/login': () => import('./pages/login.js'),
  '/': () => import('./src/src/pages/dashboard.js'),
  '/solicitudes': () => import('./src/src/src/pages/solicitudes.js'),
  '/nueva-solicitud': () => import('./pages/nueva-solicitud.js'),
  '/empresas': () => import('./src/pages/empresas.js'),
  '/cumplimiento': () => import('./src/pages/cumplimiento.js'),
  '/alertas': () => import('./src/pages/alertas.js')
};

const titulos = {
  '/landing': 'Inicio',
  '/login': 'Acceso',
  '/': 'Dashboard',
  '/solicitudes': 'Solicitudes',
  '/nueva-solicitud': 'Nueva Solicitud',
  '/empresas': 'Empresas',
  '/cumplimiento': 'Cumplimiento',
  '/alertas': 'Alertas'
};

let moduloActual = null;

/**
 * Navega a una ruta específica
 */
export async function navegar(ruta) {
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
        <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-2);">Página no encontrada</h2>
        <p style="color: var(--text-muted); margin-bottom: var(--space-6);">La ruta <code style="background: var(--bg-tertiary); padding: 2px 8px; border-radius: 4px;">${ruta}</code> no existe.</p>
        <a href="#/" class="btn btn-primary"><i class="fa-solid fa-house"></i> Volver al Dashboard</a>
      </div>
    `;
    return;
  }

  // Actualizar header
  const headerTitle = document.getElementById('headerTitle');
  if (headerTitle) headerTitle.textContent = titulos[ruta] || 'ProcoZone';

  // Actualizar sidebar activo
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.toggle('active', link.dataset.ruta === ruta);
  });

  // Cargar módulo dinámicamente
  try {
    const modulo = await rutas[ruta]();
    moduloActual = modulo;

    // Renderizar HTML de la página
    const html = await modulo.render();
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
        <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-2);">Error al cargar</h2>
        <p style="color: var(--text-muted); margin-bottom: var(--space-6);">${error.message}</p>
        <button class="btn btn-primary" onclick="location.reload()"><i class="fa-solid fa-rotate-right"></i> Reintentar</button>
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