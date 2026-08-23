import { esEmpresa, esInterno, obtenerSesion } from '../utils/auth.js';
import { http } from '../services/http-client.js';
import { abrirModalDetalleAlerta } from './modal-alerta-detalle.js';
import { toast } from '../services/notificacion-service.js';

/* ============================================
   ProcoZone — Componente Header
   ============================================ */
import { t } from '../utils/translations.js';
import { renderHeaderControls } from './theme-language-controls.js';

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
        ${esEmpresa() ? `
        <a href="#/nueva-solicitud" class="btn btn-primary header__cta" id="headerNuevaSolicitud" hidden>
          <i class="fa-solid fa-plus"></i> <span class="header__cta-text">${t('new_application_btn')}</span>
        </a>` : ''}
        <div class="header__search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="search" placeholder="${t('search_placeholder')}" class="header__search-input" id="globalSearch" autocomplete="off" />
          <div class="search-results" id="searchResults" hidden></div>
        </div>
        <div class="header__alertas">
          <button class="header__icon-btn" id="alertasBtn" aria-label="${t('alerts')}" aria-expanded="false">
            <i class="fa-solid fa-bell"></i>
            <span class="header__badge" id="alertasCount" hidden>0</span>
          </button>
          <div class="alertas-dropdown" id="alertasDropdown" hidden>
            <div class="alertas-dropdown__header">
              <strong><i class="fa-solid fa-bell"></i> ${t('alerts')}</strong>
              <button type="button" class="alertas-dropdown__markall" id="alertasMarkAll">${t('mark_all_read')}</button>
            </div>
            <div class="alertas-dropdown__list" id="alertasDropdownList">
              <div class="alertas-dropdown__empty"><i class="fa-solid fa-spinner fa-spin"></i> ${t('loading_default')}</div>
            </div>
            <a class="alertas-dropdown__footer" href="#/alertas">${t('view_full_info')} <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>
        ${renderHeaderControls()}
      </div>
    </header>
  `;
}

const paginas = () => [
  { titulo: t('dashboard'), ruta: '/' },
  { titulo: t('applications'), ruta: '/solicitudes' },
  { titulo: t('access_requests_menu'), ruta: '/solicitudes-acceso' },
  { titulo: t('new_application'), ruta: '/nueva-solicitud' },
  { titulo: t('companies'), ruta: '/empresas' },
  { titulo: t('audit_trail'), ruta: '/auditoria' },
  { titulo: t('regime_settings'), ruta: '/zonas-francas' },
  { titulo: t('compliance_reports_menu'), ruta: '/cumplimiento' },
  { titulo: t('alerts'), ruta: '/alertas' }
];

export function iniciarBusqueda() {
  const input = document.getElementById('globalSearch');
  const results = document.getElementById('searchResults');
  if (!input || !results) return;
  const pintar = () => {
    const termino = input.value.trim().toLowerCase();
    const paginasDisponibles = esEmpresa()
      ? paginas().filter(pagina => ['/solicitudes', '/nueva-solicitud', '/alertas'].includes(pagina.ruta))
      : paginas();
    const coincidencias = paginasDisponibles.filter(pagina => pagina.titulo.toLowerCase().includes(termino));
    results.innerHTML = coincidencias.length
      ? coincidencias.map(pagina => `<a href="#${pagina.ruta}"><i class="fa-solid fa-arrow-up-right-from-square"></i>${pagina.titulo}</a>`).join('')
      : `<span>${t('no_results')}</span>`;
    results.hidden = !termino;
  };
  input.addEventListener('input', pintar);
  input.addEventListener('focus', pintar);
  results.addEventListener('click', () => { results.hidden = true; input.value = ''; });
  document.addEventListener('click', event => {
    if (!event.target.closest('.header__search')) results.hidden = true;
  });
}

/* ============================================
   Dropdown de notificaciones (campanita)
   Conectado al recurso /alertas del backend.
   Badge rojo = alertas no leídas (no cerradas
   y sin marca de lectura local).
   ============================================ */

const CLAVE_LEIDAS = 'procozone-alertas-leidas';
const MAX_ITEMS_DROPDOWN = 8;

/** Icono y tono visual según el tipo de alerta del backend */
const ESTILO_POR_TIPO = {
  critica: { icono: 'fa-circle-exclamation', clase: 'alerta-item--rechazada' },
  warning: { icono: 'fa-triangle-exclamation', clase: 'alerta-item--pendiente' },
  info: { icono: 'fa-circle-check', clase: 'alerta-item--aprobada' }
};

function leerLeidas() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAVE_LEIDAS) || '[]'));
  } catch {
    return new Set();
  }
}

function guardarLeidas(conjunto) {
  try {
    localStorage.setItem(CLAVE_LEIDAS, JSON.stringify([...conjunto]));
  } catch { /* almacenamiento no disponible */ }
}

let recargarNotificaciones = null;
let pollingTimer = null;
let idsConocidos = null;
let recargarSiVisible = null;
// Sondeo periódico: json-server no soporta WebSockets/SSE, así que el
// contador y listado de la campanita se mantienen al día sin recargar
// la página mediante polling corto + refresco al recuperar el foco.
const INTERVALO_POLLING_MS = 10000;

/** Refresca badge/listado desde fuera (p.ej. tras cambiar un estado de solicitud) */
export function refrescarAlertas() {
  recargarNotificaciones?.();
}

let cerrarDropdownHandler = null;

export function iniciarAlertasDropdown() {
  const btn = document.getElementById('alertasBtn');
  const panel = document.getElementById('alertasDropdown');
  const list = document.getElementById('alertasDropdownList');
  const badge = document.getElementById('alertasCount');
  const markAll = document.getElementById('alertasMarkAll');
  if (!btn || !panel || !list) return;

  async function cargar() {
    try {
      const alertas = await http.get('alertas');
      const propias = esEmpresa()
        ? alertas.filter(alerta => alerta.empresaId === obtenerSesion()?.empresaId)
        : alertas;

      // Detección de notificaciones nuevas en vivo (sin recargar):
      // avisa con toast y hace pulsar la campanita
      const idsActuales = new Set(propias.map(alerta => String(alerta.id)));
      if (idsConocidos instanceof Set) {
        const nuevas = propias.filter(alerta => !idsConocidos.has(String(alerta.id)));
        if (nuevas.length) {
          const ultima = nuevas.sort((a, b) => String(b.id).localeCompare(String(a.id)))[0];
          toast.info(ultima.titulo || t('alerts'), ultima.descripcion || '');
          btn.classList.remove('header__icon-btn--pulse');
          void btn.offsetWidth;
          btn.classList.add('header__icon-btn--pulse');
        }
      }
      idsConocidos = idsActuales;

      const ordenadas = [...propias]
        .sort((a, b) => (b.fechaCreacion || '').localeCompare(a.fechaCreacion || ''));

      // No leídas = no cerradas y sin marca local de lectura
      const leidas = leerLeidas();
      const pendientesLeer = ordenadas
        .filter(alerta => alerta.estado !== 'cerrada' && !leidas.has(String(alerta.id)))
        .map(alerta => String(alerta.id));

      if (badge) {
        badge.textContent = pendientesLeer.length > 99 ? '99+' : String(pendientesLeer.length);
        badge.hidden = pendientesLeer.length === 0;
      }
      if (markAll) {
        markAll.hidden = pendientesLeer.length === 0;
        markAll.dataset.ids = JSON.stringify(pendientesLeer);
      }

      const visibles = ordenadas.slice(0, MAX_ITEMS_DROPDOWN);
      list.innerHTML = visibles.length
        ? visibles.map((alerta, indice) => {
          const estilo = ESTILO_POR_TIPO[alerta.tipo] || ESTILO_POR_TIPO.info;
          const noLeida = alerta.estado !== 'cerrada' && !leidas.has(String(alerta.id));
          return `
          <article class="alerta-item ${estilo.clase} alerta-item--link ${noLeida ? 'alerta-item--unread' : ''}" data-alerta-id="${alerta.id}" data-alerta-idx="${indice}" role="button" tabindex="0" title="${t('view_full_info')}">
            <i class="fa-solid ${estilo.icono}"></i>
            <div>
              <strong>${alerta.titulo}</strong>
              <p>${alerta.descripcion || ''}</p>
            </div>
            ${noLeida ? '<span class="alerta-item__dot" aria-hidden="true"></span>' : ''}
            <i class="fa-solid fa-chevron-right alerta-item__go" aria-hidden="true"></i>
          </article>
        `;
        }).join('')
        : `
          <div class="alertas-dropdown__empty">
            <i class="fa-regular fa-bell-slash"></i>
            ${t('notifications_empty')}
          </div>
        `;
    } catch {
      list.innerHTML = `
        <div class="alertas-dropdown__empty">
          <i class="fa-solid fa-circle-exclamation"></i>
          ${t('notifications_load_error')}
        </div>
      `;
    }
  }

  recargarNotificaciones = cargar;

  // Reiniciar el sondeo en cada montaje del layout (idioma/tema lo vuelven a llamar)
  if (pollingTimer) clearInterval(pollingTimer);
  pollingTimer = setInterval(cargar, INTERVALO_POLLING_MS);

  // Refresco inmediato al volver a la pestaña/ventana del Analista
  if (recargarSiVisible) {
    document.removeEventListener('visibilitychange', recargarSiVisible);
    window.removeEventListener('focus', recargarSiVisible);
  }
  recargarSiVisible = () => { if (!document.hidden) cargar(); };
  document.addEventListener('visibilitychange', recargarSiVisible);
  window.addEventListener('focus', recargarSiVisible);

  btn.addEventListener('click', event => {
    event.stopPropagation();
    const abierto = !panel.hidden;
    panel.hidden = abierto;
    btn.setAttribute('aria-expanded', String(!abierto));
    // Recargar siempre al desplegar para reflejar notificaciones nuevas
    if (!abierto) cargar();
  });

  /* Marcar todas como leídas */
  markAll?.addEventListener('click', event => {
    event.stopPropagation();
    try {
      const ids = JSON.parse(markAll.dataset.ids || '[]');
      const leidas = leerLeidas();
      ids.forEach(id => leidas.add(id));
      guardarLeidas(leidas);
    } catch { /* dataset inválido */ }
    cargar();
  });

  /* Clic en una notificación → marca como leída y abre
     el mensaje completo y detallado en un modal */
  list.addEventListener('click', event => {
    const item = event.target.closest('[data-alerta-id]');
    if (!item) return;
    const leidas = leerLeidas();
    leidas.add(String(item.dataset.alertaId));
    guardarLeidas(leidas);
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    refrescarAlertas();
    abrirModalDetalleAlerta(item.dataset.alertaId);
  });

  panel.addEventListener('click', event => event.stopPropagation());

  if (cerrarDropdownHandler) document.removeEventListener('click', cerrarDropdownHandler);
  cerrarDropdownHandler = event => {
    if (!event.target.closest('.header__alertas')) {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
  };
  document.addEventListener('click', cerrarDropdownHandler);

  cargar();
}
