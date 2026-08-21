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
import { toast } from '../../../../services/notificacion-service.js';
import { esAnalista, esAdmin, esEmpresa, obtenerSesion } from '../../../../utils/auth.js';
import { estadoSolicitudBadge, tipoSolicitudTexto, recomendacionIaTexto } from '../../../../utils/constantes.js';
import { formatearFecha } from '../../../../utils/formateador.js';
import { t } from '../../../../utils/translations.js';

let filtroActual = 'todos';
let filtroZona = 'todos';
let filtroFecha = '';
let destroyFn = null;

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

  function renderSolicitudes() {
    let filtradas = filtroActual === 'todos'
      ? solicitudes
      : solicitudes.filter(s => s.estado === filtroActual);
    if (filtroZona !== 'todos') filtradas = filtradas.filter((solicitud) => solicitud.zonaFrancaId === Number(filtroZona));
    if (filtroFecha) filtradas = filtradas.filter((solicitud) => solicitud.fechaSolicitud === filtroFecha);

    const contar = (estado) => solicitudes.filter(s => s.estado === estado).length;

    container.innerHTML = `
      <div class="solicitudes-header">
        <h1>${t('applications')}</h1>
        ${esEmpresa() ? `<a href="#/nueva-solicitud" class="btn btn-primary">
          <i class="fa-solid fa-plus"></i> ${t('new_application_btn')}
        </a>` : esAnalista() ? `<button class="btn btn-outline" id="btnClasificarPendientes">${t('evaluate_pending')}</button>` : ''}
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
        <select class="form-select" id="filtroZona" style="width:auto"><option value="todos">${t('all_zones')}</option>${zonas.map((zona) => `<option value="${zona.id}" ${Number(filtroZona) === zona.id ? 'selected' : ''}>${zona.nombre}</option>`).join('')}</select>
        <input class="form-input filtro-fecha" id="filtroFecha" type="date" value="${filtroFecha}" style="width:auto">
      </div>

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

  function abrirDetalle(solicitudId) {
    const sol = solicitudes.find(s => s.id === solicitudId);
    const emp = empresas.find(e => e.id === sol?.empresaId);
    if (sol) abrirModalSolicitud(sol, emp);
    bindModalEvents(sol);
  }

  function bindEvents() {
    // Filtros
    container.querySelectorAll('.filtro-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filtroActual = btn.dataset.filtro;
        renderSolicitudes();
      });
    });
    document.getElementById('filtroZona')?.addEventListener('change', (event) => { filtroZona = event.target.value; renderSolicitudes(); });
    document.getElementById('filtroFecha')?.addEventListener('change', (event) => { filtroFecha = event.target.value; renderSolicitudes(); });
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
