import { esEmpresa, esInterno, obtenerSesion } from '../utils/auth.js';
import { http } from '../services/http-client.js';

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
              <span id="alertasDropdownSub"></span>
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
   Dropdown de notificaciones (icono de alertas)
   ============================================ */

function mensajePorEstado(estado, empresaNombre, solicitud) {
  switch (estado) {
    case 'aprobada':
      return {
        icono: 'fa-circle-check',
        clase: 'alerta-item--aprobada',
        titulo: t('notif_approved_title'),
        mensaje: `${empresaNombre}: ${t('notif_approved_msg')}`
      };
    case 'rechazada': {
      const pendiente = solicitud?.observaciones ? ` ${t('pending_document')} ${solicitud.observaciones}` : '';
      return {
        icono: 'fa-circle-xmark',
        clase: 'alerta-item--rechazada',
        titulo: t('notif_rejected_title'),
        mensaje: `${empresaNombre}: ${t('notif_rejected_msg')}${pendiente}`
      };
    }
    default:
      return {
        icono: 'fa-clock',
        clase: 'alerta-item--pendiente',
        titulo: estado === 'en_revision' ? t('notif_review_title') : t('notif_pending_title'),
        mensaje: `${empresaNombre}: ${t('notif_review_msg')}`
      };
  }
}

let cerrarDropdownHandler = null;

export function iniciarAlertasDropdown() {
  const btn = document.getElementById('alertasBtn');
  const panel = document.getElementById('alertasDropdown');
  const list = document.getElementById('alertasDropdownList');
  const badge = document.getElementById('alertasCount');
  const sub = document.getElementById('alertasDropdownSub');
  if (!btn || !panel || !list) return;

  function pintar(items) {
    if (badge) {
      badge.textContent = items.length;
      badge.hidden = items.length === 0;
    }
    if (sub) sub.textContent = `${items.length}`;
    list.innerHTML = items.length
      ? items.map((item, indice) => `
        <article class="alerta-item ${item.clase} alerta-item--link" data-alerta-idx="${indice}" role="button" tabindex="0" title="${t('view_full_info')}">
          <i class="fa-solid ${item.icono}"></i>
          <div>
            <strong>${item.titulo}</strong>
            <p>${item.mensaje}</p>
          </div>
          <i class="fa-solid fa-chevron-right alerta-item__go" aria-hidden="true"></i>
        </article>
      `).join('')
      : `
        <div class="alertas-dropdown__empty">
          <i class="fa-regular fa-bell-slash"></i>
          ${t('notifications_empty')}
        </div>
      `;
  }

  async function cargar() {
    try {
      const [empresas, solicitudes] = await Promise.all([
        http.get('empresas'),
        http.get('solicitudes')
      ]);
      let base = solicitudes;
      if (esEmpresa()) {
        const empresaId = obtenerSesion()?.empresaId;
        base = solicitudes.filter(s => s.empresaId === empresaId);
      } else if (!esInterno()) {
        pintar([]);
        return;
      }
      const items = [...base]
        .sort((a, b) => (b.fechaSolicitud || '').localeCompare(a.fechaSolicitud || ''))
        .slice(0, 8)
        .map(solicitud => {
          const empresa = empresas.find(e => e.id === solicitud.empresaId);
          return mensajePorEstado(solicitud.estado, empresa?.nombre || 'Empresa', solicitud);
        });
      pintar(items);
    } catch (error) {
      list.innerHTML = `
        <div class="alertas-dropdown__empty">
          <i class="fa-solid fa-circle-exclamation"></i>
          ${t('notifications_load_error')}
        </div>
      `;
    }
  }

  btn.addEventListener('click', event => {
    event.stopPropagation();
    const abierto = !panel.hidden;
    panel.hidden = abierto;
    btn.setAttribute('aria-expanded', String(!abierto));
    // Recargar siempre al desplegar para reflejar notificaciones nuevas
    if (!abierto) cargar();
  });

  /* Clic en una notificación → información completa y detallada */
  list.addEventListener('click', event => {
    if (!event.target.closest('[data-alerta-idx]')) return;
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    window.location.hash = esEmpresa() ? '#/alertas' : '#/solicitudes';
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
}
