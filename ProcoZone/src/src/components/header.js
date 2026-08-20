import { esAnalista, esConsulta, obtenerSesion } from '../utils/auth.js';
import { http } from '../services/http-client.js';

/* ============================================
   ProcoZone — Componente Header
   ============================================ */
import { t } from '../utils/translations.js';

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
          <input type="search" placeholder="Buscar por título..." class="header__search-input" id="globalSearch" autocomplete="off" />
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
              <div class="alertas-dropdown__empty"><i class="fa-solid fa-spinner fa-spin"></i> Cargando notificaciones...</div>
            </div>
            <a class="alertas-dropdown__footer" href="#/alertas">Ver todas las alertas <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>
      </div>
    </header>
  `;
}

const paginas = [
  { titulo: 'Dashboard', ruta: '/' },
  { titulo: 'Solicitudes', ruta: '/solicitudes' },
  { titulo: 'Nueva Solicitud', ruta: '/nueva-solicitud' },
  { titulo: 'Empresas', ruta: '/empresas' },
  { titulo: 'Reportes de Cumplimiento', ruta: '/cumplimiento' },
  { titulo: 'Alertas', ruta: '/alertas' }
];

export function iniciarBusqueda() {
  const input = document.getElementById('globalSearch');
  const results = document.getElementById('searchResults');
  if (!input || !results) return;
  const pintar = () => {
    const termino = input.value.trim().toLowerCase();
    const paginasDisponibles = esAnalista()
      ? paginas
      : paginas.filter(pagina => ['/solicitudes', '/nueva-solicitud', '/alertas'].includes(pagina.ruta));
    const coincidencias = paginasDisponibles.filter(pagina => pagina.titulo.toLowerCase().includes(termino));
    results.innerHTML = coincidencias.length
      ? coincidencias.map(pagina => `<a href="#${pagina.ruta}"><i class="fa-solid fa-arrow-up-right-from-square"></i>${pagina.titulo}</a>`).join('')
      : '<span>No se encontraron títulos.</span>';
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
        titulo: 'Solicitud aprobada',
        mensaje: `${empresaNombre}: validando los datos, cumple con los requerimientos solicitados, por lo tanto su solicitud fue aprobada.`
      };
    case 'rechazada': {
      const pendiente = solicitud?.observaciones ? ` Documento pendiente: ${solicitud.observaciones}` : '';
      return {
        icono: 'fa-circle-xmark',
        clase: 'alerta-item--rechazada',
        titulo: 'Solicitud rechazada',
        mensaje: `${empresaNombre}: validando los datos, su empresa no cumple con todos los requerimientos, por lo tanto su solicitud fue rechazada.${pendiente}`
      };
    }
    default:
      return {
        icono: 'fa-clock',
        clase: 'alerta-item--pendiente',
        titulo: estado === 'en_revision' ? 'Solicitud en revisión' : 'Solicitud pendiente',
        mensaje: `${empresaNombre}: estamos validando su documentación; en cuanto esté aprobada, su aprobación será enviada al correo y de igual forma la podrá visualizar en la página.`
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

  let cargado = false;

  function pintar(items) {
    if (badge) {
      badge.textContent = items.length;
      badge.hidden = items.length === 0;
    }
    if (sub) sub.textContent = `${items.length} notificación${items.length === 1 ? '' : 'es'}`;
    list.innerHTML = items.length
      ? items.map(item => `
        <article class="alerta-item ${item.clase}">
          <i class="fa-solid ${item.icono}"></i>
          <div>
            <strong>${item.titulo}</strong>
            <p>${item.mensaje}</p>
          </div>
        </article>
      `).join('')
      : `
        <div class="alertas-dropdown__empty">
          <i class="fa-regular fa-bell-slash"></i>
          No tiene notificaciones por el momento.
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
      if (esConsulta()) {
        const empresaId = obtenerSesion()?.empresaId;
        base = solicitudes.filter(s => s.empresaId === empresaId);
      } else if (!esAnalista()) {
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
          No se pudieron cargar las notificaciones.
        </div>
      `;
    }
  }

  btn.addEventListener('click', event => {
    event.stopPropagation();
    const abierto = !panel.hidden;
    panel.hidden = abierto;
    btn.setAttribute('aria-expanded', String(!abierto));
    if (!abierto && !cargado) {
      cargado = true;
      cargar();
    }
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
