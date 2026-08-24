/* ============================================
   ProcoZone — Modal de Detalle de Notificación
   Muestra el mensaje completo y detallado de una
   alerta (motivos, observaciones del revisor,
   decisión, fecha y hora) sin información recortada.
   ============================================ */
import { http } from '../services/http-client.js';
import { cerrarModal } from '../src/components/modal-solicitud.js';
import { formatearFecha } from '../utils/formateador.js';
import { factorIaTexto, estadoSolicitudTexto, alertaTipoTexto, alertaTexto } from '../utils/constantes.js';
import { esEmpresa, obtenerSesion } from '../utils/auth.js';
import { t } from '../utils/translations.js';

const ICONO_POR_TIPO = {
  critica: { icono: 'fa-circle-exclamation', clase: 'alerta-detalle__icono--critica' },
  warning: { icono: 'fa-triangle-exclamation', clase: 'alerta-detalle__icono--warning' },
  info: { icono: 'fa-circle-check', clase: 'alerta-detalle__icono--info' }
};

function formatearFechaHora(iso) {
  if (!iso) return '—';
  const locale = document.documentElement.lang === 'en' ? 'en-US' : 'es-CR';
  const hora = new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return `${formatearFecha(iso)} · ${hora}`;
}

export async function abrirModalDetalleAlerta(alertaId) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  // Estado de carga mientras se consulta la notificación
  container.innerHTML = `
    <div class="modal-overlay" id="modalOverlay"></div>
    <div class="modal-content" style="max-width: 640px;">
      <div class="modal-header">
        <h3>${t('notif_detail_title')}</h3>
        <button class="modal-close" id="modalClose" aria-label="${t('close')}"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="ia-loading"><div class="spinner"></div><span>${t('loading_default')}</span></div>
      </div>
    </div>
  `;
  container.classList.add('active');
  const cerrar = () => { document.removeEventListener('keydown', escapeHandler); cerrarModal(); };
  const escapeHandler = (e) => { if (e.key === 'Escape') cerrar(); };
  document.getElementById('modalOverlay')?.addEventListener('click', cerrar);
  document.getElementById('modalClose')?.addEventListener('click', cerrar);
  document.addEventListener('keydown', escapeHandler);

  let alerta;
  try {
    alerta = await http.getById('alertas', alertaId);
  } catch {
    container.querySelector('.modal-body').innerHTML = `
      <div class="empty-state" style="padding: var(--space-6);">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p>${t('notifications_load_error')}</p>
      </div>`;
    return;
  }

  // Contexto opcional: empresa y solicitud asociadas
  const [empresa, solicitud] = await Promise.all([
    alerta.empresaId ? http.getById('empresas', alerta.empresaId).catch(() => null) : Promise.resolve(null),
    alerta.solicitudId ? http.getById('solicitudes', alerta.solicitudId).catch(() => null) : Promise.resolve(null)
  ]);
  const detalle = alerta.detalle || {};
  const estilo = ICONO_POR_TIPO[alerta.tipo] || ICONO_POR_TIPO.info;
  const motivos = Array.isArray(detalle.motivos) ? detalle.motivos.filter(Boolean) : [];
  const tieneDetalle = detalle.decision || detalle.revisor || motivos.length > 0 || detalle.observacionesRevisor;

  const motivosHTML = motivos.length ? `
    <div class="alerta-detalle__seccion">
      <span class="detalle-item__label">${t('notif_reasons_label')}</span>
      <ul class="clasificacion-ia__factores">
        ${motivos.map(motivo => `<li class="factor-item"><i class="fa-solid fa-circle-check"></i><span>${factorIaTexto(motivo)}</span></li>`).join('')}
      </ul>
    </div>` : '';

  const observacionesHTML = detalle.observacionesRevisor ? `
    <div class="alerta-detalle__seccion">
      <span class="detalle-item__label">${t('notif_observations_label')}</span>
      <p class="alerta-detalle__texto">${detalle.observacionesRevisor}</p>
    </div>` : '';

  container.innerHTML = `
    <div class="modal-overlay" id="modalOverlay"></div>
    <div class="modal-content" style="max-width: 640px;">
      <div class="modal-header">
        <h3>${t('notif_detail_title')}</h3>
        <button class="modal-close" id="modalClose" aria-label="${t('close')}"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="alerta-detalle__cabecera">
          <div class="alerta-detalle__icono ${estilo.clase}"><i class="fa-solid ${estilo.icono}"></i></div>
          <div>
            <strong>${alertaTexto(alerta).titulo}</strong>
            <p class="alerta-detalle__texto">${alertaTexto(alerta).descripcion || ''}</p>
            <span class="badge badge-neutral">${alertaTipoTexto(alerta.tipo)}</span>
          </div>
        </div>

        <div class="detalle-grid">
          ${solicitud ? `
            <div class="detalle-item">
              <span class="detalle-item__label">${t('notif_request_label')}</span>
              <span class="detalle-item__value">#${solicitud.id} · ${estadoSolicitudTexto(solicitud.estado)}</span>
            </div>` : ''}
          ${empresa && !esEmpresa() ? `
            <div class="detalle-item">
              <span class="detalle-item__label">${t('modal_company')}</span>
              <span class="detalle-item__value">${empresa.nombre}</span>
            </div>` : ''}
          ${detalle.estadoFinal ? `
            <div class="detalle-item">
              <span class="detalle-item__label">${t('notif_decision_label')}</span>
              <span class="detalle-item__value" style="font-weight:600;">${estadoSolicitudTexto(detalle.estadoFinal)}</span>
            </div>` : ''}
          ${detalle.revisor ? `
            <div class="detalle-item">
              <span class="detalle-item__label">${t('notif_reviewer_label')}</span>
              <span class="detalle-item__value">${detalle.revisor}</span>
            </div>` : ''}
          ${(detalle.fechaDecision || alerta.fechaCreacion) ? `
            <div class="detalle-item detalle-item--full">
              <span class="detalle-item__label">${t('notif_datetime_label')}</span>
              <span class="detalle-item__value">${formatearFechaHora(detalle.fechaDecision || alerta.fechaCreacion)}</span>
            </div>` : ''}
        </div>

        ${tieneDetalle ? `${motivosHTML}${observacionesHTML}` : `
          <p class="alerta-detalle__texto" style="color: var(--text-muted); margin-top: var(--space-4);">${t('notif_no_details')}</p>`}
      </div>
      <div class="modal-footer">
        ${esEmpresa() && solicitud ? `<a class="btn btn-outline" href="#/solicitudes" id="btnVerSolicitud">${t('notif_view_request')}</a>` : ''}
        ${!esEmpresa() && alerta.solicitudAccesoId ? `<button class="btn btn-outline" id="btnGestionarAcceso"><i class="fa-solid fa-user-gear"></i> ${t('access_req_manage')}</button>` : ''}
        <button class="btn btn-primary" id="modalCloseBtn">${t('close')}</button>
      </div>
    </div>
  `;

  document.getElementById('modalOverlay')?.addEventListener('click', cerrar);
  document.getElementById('modalClose')?.addEventListener('click', cerrar);
  document.getElementById('modalCloseBtn')?.addEventListener('click', cerrar);

  // Acción directa: abre la gestión de la solicitud de acceso en el panel interno
  document.getElementById('btnGestionarAcceso')?.addEventListener('click', () => {
    sessionStorage.setItem('procozone-gestionar-acceso', String(alerta.solicitudAccesoId));
    cerrar();
    if (window.location.hash === '#/solicitudes-acceso') {
      window.dispatchEvent(new Event('hashchange'));
    } else {
      window.location.hash = '#/solicitudes-acceso';
    }
  });
}
