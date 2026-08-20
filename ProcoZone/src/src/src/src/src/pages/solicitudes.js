/* ============================================
   ProcoZone — Página de Solicitudes
   Lista con filtros, búsqueda y clasificación IA
   ============================================ */
import { http } from '../../../../services/http-client.js';
import { renderLoading, renderError, renderSkeletonCards } from '../../../components/estado-carga.js';
import { renderTarjetaSolicitud } from '../../../components/tarjeta-solicitud.js';
import { abrirModalSolicitud, cerrarModal, mostrarIaLoadingEnModal, actualizarIaEnModal } from '../../../components/modal-solicitud.js';
import { clasificarSolicitud } from '../../../services/ia-service.js';
import { toast } from '../../../../services/notificacion-service.js';
import { esAnalista } from '../../../../utils/auth.js';
import { esConsulta, obtenerSesion } from '../../../../utils/auth.js';
import { t } from '../../../../utils/translations.js';

let filtroActual = 'todos';
let destroyFn = null;

export async function render() {
  return `
    <div class="page-enter" id="solicitudesPage">
      ${renderLoading('Cargando solicitudes...')}
    </div>
  `;
}

export async function init() {
  const container = document.getElementById('solicitudesPage');
  if (!container) return;

  let empresas = [];
  let solicitudes = [];

  async function cargarSolicitudes() {
    try {
      container.innerHTML = renderSkeletonCards(4);

      // Carga paralela con Promise.all
      [empresas, solicitudes] = await Promise.all([
        http.get('empresas'),
        http.get('solicitudes')
      ]);
      if (esConsulta()) {
        solicitudes = solicitudes.filter(solicitud => solicitud.empresaId === obtenerSesion()?.empresaId);
      }

      renderSolicitudes();
    } catch (error) {
      container.innerHTML = renderError(
        error.message || 'Error al cargar las solicitudes.',
        () => cargarSolicitudes()
      );
      container.querySelector('button')?.addEventListener('click', () => cargarSolicitudes());
    }
  }

  function renderSolicitudes() {
    const filtradas = filtroActual === 'todos'
      ? solicitudes
      : solicitudes.filter(s => s.estado === filtroActual);

    const contar = (estado) => solicitudes.filter(s => s.estado === estado).length;

    container.innerHTML = `
      <div class="solicitudes-header">
        <h1>${t('applications')}</h1>
        ${esAnalista() ? `<a href="#/nueva-solicitud" class="btn btn-primary">
          <i class="fa-solid fa-plus"></i> Nueva Solicitud
        </a>` : ''}
      </div>

      <div class="solicitudes-filtros">
        <button class="filtro-btn ${filtroActual === 'todos' ? 'active' : ''}" data-filtro="todos">
          Todos (${solicitudes.length})
        </button>
        <button class="filtro-btn ${filtroActual === 'pendiente' ? 'active' : ''}" data-filtro="pendiente">
          Pendientes (${contar('pendiente')})
        </button>
        <button class="filtro-btn ${filtroActual === 'en_revision' ? 'active' : ''}" data-filtro="en_revision">
          En Revisión (${contar('en_revision')})
        </button>
        <button class="filtro-btn ${filtroActual === 'aprobada' ? 'active' : ''}" data-filtro="aprobada">
          Aprobadas (${contar('aprobada')})
        </button>
        <button class="filtro-btn ${filtroActual === 'rechazada' ? 'active' : ''}" data-filtro="rechazada">
          Rechazadas (${contar('rechazada')})
        </button>
      </div>

      ${filtradas.length > 0 ? `
        <div class="solicitudes-grid">
          ${filtradas.map(sol => {
            const empresa = empresas.find(e => e.id === sol.empresaId);
            return renderTarjetaSolicitud(sol, empresa);
          }).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <i class="fa-solid fa-inbox"></i>
          <h3>${t('no_requests')}</h3>
          <p>${t('no_requests_message')}</p>
        </div>
      `}
    `;

    bindEvents();
  }

  function bindEvents() {
    // Filtros
    container.querySelectorAll('.filtro-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filtroActual = btn.dataset.filtro;
        renderSolicitudes();
      });
    });

    // Click en tarjeta → abrir modal
    container.querySelectorAll('.solicitud-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // No abrir modal si se hizo click en "Clasificar"
        if (e.target.closest('.btn-clasificar')) return;

        const id = parseInt(card.dataset.solicitudId);
        const sol = solicitudes.find(s => s.id === id);
        const emp = empresas.find(e => e.id === sol?.empresaId);
        if (sol) abrirModalSolicitud(sol, emp);

        // Bind eventos del modal
        bindModalEvents(sol);
      });
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

      toast.success('Clasificación completada', `Puntaje de afinidad: ${clasificacion.puntajeAfinidad}/100`);

    } catch (error) {
      toast.error('Error en clasificación', error.message);
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
        await http.patch('solicitudes', solicitud.id, { estado: 'aprobada' });
        solicitud.estado = 'aprobada';
        cerrarModal();
        toast.success('Solicitud aprobada', `La solicitud #${solicitud.id} ha sido aprobada.`);
        renderSolicitudes();
      } catch (error) {
        toast.error('Error', 'No se pudo actualizar la solicitud.');
      }
    });

    // Rechazar solicitud
    document.getElementById('btnRechazar')?.addEventListener('click', async () => {
      try {
        await http.patch('solicitudes', solicitud.id, { estado: 'rechazada' });
        solicitud.estado = 'rechazada';
        cerrarModal();
        toast.warning('Solicitud rechazada', `La solicitud #${solicitud.id} ha sido rechazada.`);
        renderSolicitudes();
      } catch (error) {
        toast.error('Error', 'No se pudo actualizar la solicitud.');
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