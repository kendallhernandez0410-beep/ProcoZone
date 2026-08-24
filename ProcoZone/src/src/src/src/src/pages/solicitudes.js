/* ============================================
   ProcoZone — Página de Solicitudes
   Lista con filtros, búsqueda y clasificación IA
   Vista de tabla para administrador
   ============================================ */
import { http } from '../../../../services/http-client.js';
import { renderLoading, renderError, renderSkeletonCards } from '../../../components/estado-carga.js';
import { renderTarjetaSolicitud } from '../../../components/tarjeta-solicitud.js';
import { abrirModalSolicitud, cerrarModal, mostrarIaLoadingEnModal, actualizarIaEnModal } from '../../../components/modal-solicitud.js';
import { clasificarSolicitud, clasificarSolicitudesPendientes } from '../../../services/ia-service.js';
import { refrescarAlertas } from '../../../../components/header.js';
import { toast } from '../../../../services/notificacion-service.js';
import { esAnalista, esAdmin, esEmpresa, obtenerSesion } from '../../../../utils/auth.js';
import { estadoSolicitudBadge, tipoSolicitudTexto, recomendacionIaTexto } from '../../../../utils/constantes.js';
import { formatearFecha } from '../../../../utils/formateador.js';
import { t } from '../../../../utils/translations.js';

let filtroActual = 'todos';
let filtroFecha = '';
// Búsqueda local de la sección (empresa o cédula jurídica):
// se despliega únicamente al presionar el botón de lupa
let terminoBusqueda = '';
let busquedaVisible = false;
// Contexto de zona de la empresa en sesión (perfil con una sola zona):
// se fija automáticamente tras cargar datos y no requiere selector
let zonaEmpresaId = null;
let destroyFn = null;

/** Filtro de fecha tolerante: compara año-mes para que la lista
    muestre todos los registros del período seleccionado */
function coincideFecha(fechaIso) {
  if (!fechaIso) return false;
  return String(fechaIso).slice(0, 7) === String(filtroFecha).slice(0, 7);
}

export async function render() {
  return `
    <div class="page-enter" id="solicitudesPage">
      ${renderLoading(t('loading_applications'))}
    </div>
  `;
}

export async function init() {
  const container = document.getElementById('solicitudesPage');
  if (!container) return;

  let empresas = [];
  let zonas = [];
  let solicitudes = [];

  async function cargarSolicitudes() {
    try {
      container.innerHTML = renderSkeletonCards(4);

      // Carga paralela con Promise.all
      [empresas, solicitudes, zonas] = await Promise.all([
        http.get('empresas'),
        http.get('solicitudes'),
        http.get('zonasFrancas')
      ]);
      if (esEmpresa()) {
        solicitudes = solicitudes.filter(solicitud => solicitud.empresaId === obtenerSesion()?.empresaId);
      }

      // Fijar el contexto de la zona automáticamente para el perfil empresa:
      // la empresa pertenece a una sola zona, así que se resuelve su id
      const miEmpresa = esEmpresa() ? empresas.find(e => e.id === obtenerSesion()?.empresaId) : null;
      if (miEmpresa) {
        zonaEmpresaId = zonas.find(zona => zona.nombre === miEmpresa.zonaFranca)?.id
          ?? solicitudes.find(solicitud => solicitud.zonaFrancaId != null)?.zonaFrancaId
          ?? null;
      }

      renderSolicitudes();
    } catch (error) {
      container.innerHTML = renderError(
        error.message || t('load_error'),
        () => cargarSolicitudes()
      );
      container.querySelector('button')?.addEventListener('click', () => cargarSolicitudes());
    }
  }

  function renderTablaSolicitudes(filtradas) {
    return `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>${t('th_company')}</th>
              <th>${t('th_type')}</th>
              <th>${t('modal_request_date')}</th>
              <th>${t('th_ai_decision')}</th>
              <th>${t('th_score')}</th>
              <th>${t('th_final_status')}</th>
            </tr>
          </thead>
          <tbody>
            ${filtradas.map(sol => {
              const empresa = empresas.find(e => e.id === sol.empresaId);
              const estado = estadoSolicitudBadge(sol.estado);
              const ia = sol.clasificacionIa;
              return `
                <tr class="solicitud-row" data-solicitud-id="${sol.id}">
                  <td><strong>#${sol.id}</strong></td>
                  <td style="font-weight: 500;">${empresa?.nombre || t('company_not_found')}</td>
                  <td>${tipoSolicitudTexto(sol.tipo)}</td>
                  <td><span class="fecha-chip"><i class="fa-regular fa-calendar"></i> ${formatearFecha(sol.fechaSolicitud)}</span></td>
                  <td>${ia ? recomendacionIaTexto(ia.recomendacion) : `<span style="color: var(--text-muted);">${t('unclassified')}</span>`}</td>
                  <td>${ia ? `${ia.puntajeAfinidad}/100` : '—'}</td>
                  <td><span class="badge ${estado.clase}">${estado.texto}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Coincidencia por nombre de empresa o cédula jurídica */
  function coincideBusqueda(solicitud) {
    const termino = terminoBusqueda.trim().toLowerCase();
    if (!termino) return true;
    const empresa = empresas.find(e => e.id === solicitud.empresaId);
    return (empresa?.nombre || '').toLowerCase().includes(termino) ||
      String(empresa?.cedulaJuridica || '').toLowerCase().includes(termino);
  }

  /** Botón de lupa que despliega la búsqueda local de la sección */
  function botonBusqueda() {
    return `
      <button type="button" class="header__icon-btn btn-buscador-toggle ${busquedaVisible ? 'active' : ''}" id="btnToggleBusqueda"
        aria-label="${t(busquedaVisible ? 'close_search' : 'search')}" title="${t(busquedaVisible ? 'close_search' : 'search')}" aria-expanded="${busquedaVisible}">
        <i class="fa-solid fa-magnifying-glass"></i>
      </button>`;
  }

  /** Campo de búsqueda local, visible solo tras presionar la lupa */
  function buscadorSeccion() {
    return `
      <div class="buscador-seccion" id="buscadorSeccion" ${busquedaVisible ? '' : 'hidden'}>
        <div class="search-box">
          <span class="search-box__icon" aria-hidden="true"><i class="fa-solid fa-magnifying-glass"></i></span>
          <input type="search" class="search-box__input" id="busquedaSeccion" placeholder="${t('search_placeholder')}" value="${terminoBusqueda}" autocomplete="off" />
        </div>
      </div>`;
  }

  function renderSolicitudes() {
    if (esEmpresa()) {
      renderVistaEmpresa();
      return;
    }

    /* ===== Panel interno (Analista / Administrador): flujo original ===== */
    let filtradas = filtroActual === 'todos'
      ? solicitudes
      : solicitudes.filter(s => s.estado === filtroActual);
    if (terminoBusqueda) filtradas = filtradas.filter(coincideBusqueda);
    if (filtroFecha) filtradas = filtradas.filter((solicitud) => coincideFecha(solicitud.fechaSolicitud));

    const contar = (estado) => solicitudes.filter(s => s.estado === estado).length;

    container.innerHTML = `
      <div class="solicitudes-header">
        <h1>${t('applications')}</h1>
        <div class="solicitudes-header__acciones">
          ${botonBusqueda()}
          ${esAnalista() ? `<button class="btn btn-outline" id="btnClasificarPendientes">${t('evaluate_pending')}</button>` : ''}
        </div>
      </div>

      <div class="solicitudes-filtros">
        <button class="filtro-btn ${filtroActual === 'todos' ? 'active' : ''}" data-filtro="todos">
          ${t('all')} (${solicitudes.length})
        </button>
        <button class="filtro-btn ${filtroActual === 'pendiente' ? 'active' : ''}" data-filtro="pendiente">
          ${t('pending')} (${contar('pendiente')})
        </button>
        <button class="filtro-btn ${filtroActual === 'en_revision' ? 'active' : ''}" data-filtro="en_revision">
          ${t('in_review')} (${contar('en_revision')})
        </button>
        <button class="filtro-btn ${filtroActual === 'aprobada' ? 'active' : ''}" data-filtro="aprobada">
          ${t('approved')} (${contar('aprobada')})
        </button>
        <button class="filtro-btn ${filtroActual === 'rechazada' ? 'active' : ''}" data-filtro="rechazada">
          ${t('rejected')} (${contar('rechazada')})
        </button>
        <input class="form-input filtro-fecha" id="filtroFecha" type="date" value="${filtroFecha}" style="width:auto">
      </div>

      ${buscadorSeccion()}

      ${filtradas.length > 0 ? (
        esAdmin() ? renderTablaSolicitudes(filtradas) : `
        <div class="solicitudes-grid">
          ${filtradas.map(sol => {
            const empresa = empresas.find(e => e.id === sol.empresaId);
            return renderTarjetaSolicitud(sol, empresa);
          }).join('')}
        </div>
      `) : `
        <div class="empty-state">
          <i class="fa-solid fa-inbox"></i>
          <h3>${t('no_requests')}</h3>
          <p>${t('no_requests_message')}</p>
        </div>
      `}
    `;

    bindEvents();
  }

  /* ===== Vista exclusiva del rol Empresa Solicitante =====
     Lista única "Todas": todas las solicitudes en un solo lugar,
     las recién enviadas aparecen de inmediato. */
  function renderVistaEmpresa() {
    let filtradas = filtroActual === 'todos' ? solicitudes : solicitudes.filter(s => s.estado === filtroActual);
    // Perfil empresa: la zona se aplica internamente (sin selector ni badge)
    // usando el zona_id asociado a la empresa en sesión
    if (zonaEmpresaId != null) filtradas = filtradas.filter((solicitud) => solicitud.zonaFrancaId === zonaEmpresaId);
    if (terminoBusqueda) filtradas = filtradas.filter(coincideBusqueda);
    if (filtroFecha) filtradas = filtradas.filter((solicitud) => coincideFecha(solicitud.fechaSolicitud));

    const contar = (estado) => solicitudes.filter(s => s.estado === estado).length;
    const chip = (valor, texto, cantidad) => `
      <button class="filtro-btn ${filtroActual === valor ? 'active' : ''}" data-filtro="${valor}">
        ${texto} (${cantidad})
      </button>`;

    const filtros = `
      ${chip('todos', t('all'), solicitudes.length)}
      ${chip('pendiente', t('pending'), contar('pendiente'))}
      ${chip('en_revision', t('in_review'), contar('en_revision'))}
      ${contar('borrador') ? chip('borrador', t('state_draft'), contar('borrador')) : ''}
      ${contar('aprobada') ? chip('aprobada', t('approved'), contar('aprobada')) : ''}
      ${contar('rechazada') ? chip('rechazada', t('rejected'), contar('rechazada')) : ''}`;

    const vacio = `
      <div class="empty-state">
        <i class="fa-solid fa-file-circle-plus"></i>
        <h3>${t('empty_all_title')}</h3>
        <p>${t('empty_all_msg')}</p>
        <a href="#/nueva-solicitud" class="btn btn-primary" style="margin-top: var(--space-4);">
          <i class="fa-solid fa-plus"></i> ${t('new_application_btn')}
        </a>
      </div>`;

    container.innerHTML = `
      <div class="solicitudes-header">
        <h1>${t('my_applications')}</h1>
        <div class="solicitudes-header__acciones">
          ${botonBusqueda()}
        </div>
      </div>

      <div class="solicitudes-filtros">
        ${filtros}
        <input class="form-input filtro-fecha" id="filtroFecha" type="date" value="${filtroFecha}" style="width:auto">
      </div>

      ${buscadorSeccion()}

      ${filtradas.length > 0 ? `
        <div class="solicitudes-grid">
          ${filtradas.map(sol => {
            const empresa = empresas.find(e => e.id === sol.empresaId);
            return renderTarjetaSolicitud(sol, empresa);
          }).join('')}
        </div>
      ` : vacio}
    `;

    bindEvents();
  }

  function abrirDetalle(solicitudId) {
    const sol = solicitudes.find(s => s.id === solicitudId);
    const emp = empresas.find(e => e.id === sol?.empresaId);
    if (sol) abrirModalSolicitud(sol, emp);
    bindModalEvents(sol);
  }

  /** Restaura el foco (y el cursor al final) tras re-renderizar la búsqueda */
  function enfocarBusqueda() {
    const input = document.getElementById('busquedaSeccion');
    if (!input) return;
    input.focus();
    const largo = input.value.length;
    input.setSelectionRange(largo, largo);
  }

  function bindEvents() {
    // Filtros
    container.querySelectorAll('.filtro-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filtroActual = btn.dataset.filtro;
        renderSolicitudes();
      });
    });

    // Búsqueda local por empresa o cédula jurídica:
    // se despliega únicamente al presionar el botón de lupa
    document.getElementById('btnToggleBusqueda')?.addEventListener('click', () => {
      busquedaVisible = !busquedaVisible;
      if (!busquedaVisible) terminoBusqueda = '';
      renderSolicitudes();
      if (busquedaVisible) enfocarBusqueda();
    });
    let debounceBusqueda;
    document.getElementById('busquedaSeccion')?.addEventListener('input', (event) => {
      clearTimeout(debounceBusqueda);
      debounceBusqueda = setTimeout(() => {
        terminoBusqueda = event.target.value;
        renderSolicitudes();
        enfocarBusqueda();
      }, 250);
    });

    const filtroFechaInput = document.getElementById('filtroFecha');
    filtroFechaInput?.addEventListener('change', (event) => { filtroFecha = event.target.value; renderSolicitudes(); });
    // Desplegar el calendario nativo al hacer clic o enfocar el campo
    const abrirCalendario = () => { try { filtroFechaInput.showPicker?.(); } catch { /* navegadores sin soporte */ } };
    filtroFechaInput?.addEventListener('click', abrirCalendario);
    filtroFechaInput?.addEventListener('focus', abrirCalendario);
    filtroFechaInput?.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); abrirCalendario(); } });
    document.getElementById('btnClasificarPendientes')?.addEventListener('click', async () => { try { const resultados = await clasificarSolicitudesPendientes(); toast.success(t('evaluation_completed'), `${resultados.length} ${t('evaluated_parallel')}`); await cargarSolicitudes(); } catch (error) { console.error(error); toast.error(t('error_title'), error.message); } });

    // Click en tarjeta → abrir modal
    container.querySelectorAll('.solicitud-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // No abrir modal si se hizo click en "Clasificar"
        if (e.target.closest('.btn-clasificar')) return;
        abrirDetalle(parseInt(card.dataset.solicitudId));
      });
    });

    // Click en fila de tabla (vista admin) → abrir modal
    container.querySelectorAll('.solicitud-row').forEach(row => {
      row.addEventListener('click', () => abrirDetalle(parseInt(row.dataset.solicitudId)));
    });

    // Botón clasificar directamente desde la tarjeta
    container.querySelectorAll('.btn-clasificar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        await ejecutarClasificacion(id);
      });
    });
  }

  async function ejecutarClasificacion(solicitudId) {
    try {
      // Abrir modal primero
      const sol = solicitudes.find(s => s.id === solicitudId);
      const emp = empresas.find(e => e.id === sol?.empresaId);
      if (sol) abrirModalSolicitud(sol, emp);

      // Mostrar estado de carga IA en el modal
      mostrarIaLoadingEnModal();

      // Ejecutar clasificación con IA (async/await)
      const clasificacion = await clasificarSolicitud(solicitudId);

      // Actualizar el modal con el resultado
      actualizarIaEnModal(clasificacion);

      // Actualizar datos locales
      const idx = solicitudes.findIndex(s => s.id === solicitudId);
      if (idx !== -1) solicitudes[idx].clasificacionIa = clasificacion;

      // Re-bind eventos del modal actualizado
      bindModalEvents(solicitudes[idx]);

      toast.success(t('classification_completed'), `${t('affinity_score')}: ${clasificacion.puntajeAfinidad}/100`);

    } catch (error) {
      toast.error(t('classification_error'), error.message);
      cerrarModal();
    }
  }

  /** Estructura de detalle completo que se guarda en la alerta
      para que la campanita muestre el mensaje íntegro */
  function construirDetalleAlerta(solicitud, decisionAnalista) {
    return {
      decision: decisionAnalista.decision,
      revisor: decisionAnalista.analista,
      motivos: solicitud.clasificacionIa?.factores || [],
      observacionesRevisor: decisionAnalista.justificacion || solicitud.observaciones || '',
      fechaDecision: decisionAnalista.fecha,
      estadoFinal: decisionAnalista.decision
    };
  }

  function bindModalEvents(solicitud) {
    // Botón clasificar dentro del modal
    document.getElementById('btnClasificarModal')?.addEventListener('click', async () => {
      if (solicitud) await ejecutarClasificacion(solicitud.id);
    });

    // Aprobar solicitud
    document.getElementById('btnAprobar')?.addEventListener('click', async () => {
      try {
        const decisionAnalista = { decision: 'aprobada', fecha: new Date().toISOString(), analista: obtenerSesion()?.nombre || 'Analista', justificacion: window.prompt(t('decision_justification')) || '' };
        await http.patch('solicitudes', solicitud.id, { estado: 'aprobada', decisionAnalista });
        solicitud.estado = 'aprobada';
        // Notificación a la empresa con el detalle completo de la decisión (campanita)
        await http.post('alertas', {
          empresaId: solicitud.empresaId,
          solicitudId: solicitud.id,
          tipo: 'info',
          titulo: t('notif_approved_title'),
          descripcion: `${empresas.find(e => e.id === solicitud.empresaId)?.nombre || 'Empresa'}: ${t('notif_approved_msg')}`,
          fechaCreacion: new Date().toISOString().slice(0, 10),
          estado: 'abierta',
          detalle: construirDetalleAlerta(solicitud, decisionAnalista)
        });
        refrescarAlertas();
        cerrarModal();
        toast.success(t('application_approved_title'), `#${solicitud.id} ${t('application_approved_msg')}`);
        renderSolicitudes();
      } catch (error) {
        toast.error(t('error_title'), t('error_update_application'));
      }
    });

    // Rechazar solicitud
    document.getElementById('btnRechazar')?.addEventListener('click', async () => {
      try {
        const decisionAnalista = { decision: 'rechazada', fecha: new Date().toISOString(), analista: obtenerSesion()?.nombre || 'Analista', justificacion: window.prompt(t('decision_justification')) || '' };
        await http.patch('solicitudes', solicitud.id, { estado: 'rechazada', decisionAnalista });
        solicitud.estado = 'rechazada';
        // Notificación a la empresa con el motivo/documento pendiente (campanita)
        const documentoPendiente = solicitud.observaciones ? ` ${t('pending_document')} ${solicitud.observaciones}` : '';
        await http.post('alertas', {
          empresaId: solicitud.empresaId,
          solicitudId: solicitud.id,
          tipo: 'critica',
          titulo: t('notif_rejected_title'),
          descripcion: `${empresas.find(e => e.id === solicitud.empresaId)?.nombre || 'Empresa'}: ${t('notif_rejected_msg')}${documentoPendiente}`,
          fechaCreacion: new Date().toISOString().slice(0, 10),
          estado: 'abierta',
          detalle: construirDetalleAlerta(solicitud, decisionAnalista)
        });
        refrescarAlertas();
        cerrarModal();
        toast.warning(t('application_rejected_title'), `#${solicitud.id} ${t('application_rejected_msg')}`);
        renderSolicitudes();
      } catch (error) {
        toast.error(t('error_title'), t('error_update_application'));
      }
    });
  }

  destroyFn = () => {
    cerrarModal();
  };

  await cargarSolicitudes();
}

export function destroy() {
  if (destroyFn) destroyFn();
}
