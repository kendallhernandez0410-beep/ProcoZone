/* ============================================
   ProcoZone — Componente Modal de Solicitud
   Muestra detalle completo + clasificación IA
   ============================================ */
import { estadoSolicitudBadge, tipoSolicitudTexto, recomendacionIaTexto, nivelRiesgoTexto, factorIaTexto } from '../../utils/constantes.js';
import { formatearFecha, formatearMoneda, formatearNumero, colorAfinidad } from '../../utils/formateador.js';
import { renderLoading } from './estado-carga.js';
import { esAnalista } from '../../utils/auth.js';
import { t } from '../../utils/translations.js';

export function abrirModalSolicitud(solicitud, empresa) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const estado = estadoSolicitudBadge(solicitud.estado);
  const ia = solicitud.clasificacionIa;

  container.innerHTML = `
    <div class="modal-overlay" id="modalOverlay"></div>
    <div class="modal-content" style="max-width: 720px;">
      <div class="modal-header">
        <h3>${t('request_number')}${solicitud.id}</h3>
        <button class="modal-close" id="modalClose" aria-label="${t('close')}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-5);">
          <span class="badge ${estado.clase}" style="font-size: var(--text-sm); padding: 4px 14px;">${estado.texto}</span>
          <span class="badge badge-neutral">${tipoSolicitudTexto(solicitud.tipo)}</span>
        </div>

        <div class="detalle-grid" style="margin-bottom: var(--space-5);">
          <div class="detalle-item">
            <span class="detalle-item__label">${t('modal_company')}</span>
            <span class="detalle-item__value">${empresa?.nombre || '—'}</span>
          </div>
          <div class="detalle-item">
            <span class="detalle-item__label">${t('modal_free_zone')}</span>
            <span class="detalle-item__value">${empresa?.zonaFranca || '—'}</span>
          </div>
          <div class="detalle-item">
            <span class="detalle-item__label">${t('modal_request_date')}</span>
            <span class="detalle-item__value">${formatearFecha(solicitud.fechaSolicitud)}</span>
          </div>
          <div class="detalle-item">
            <span class="detalle-item__label">${t('modal_responsible')}</span>
            <span class="detalle-item__value">${solicitud.responsable || '—'}</span>
          </div>
          <div class="detalle-item detalle-item--full">
            <span class="detalle-item__label">${t('modal_description')}</span>
            <span class="detalle-item__value" style="font-weight: 400; line-height: 1.6;">${solicitud.descripcion}</span>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border); padding-top: var(--space-5); margin-bottom: var(--space-5);">
          <h4 style="font-size: var(--text-sm); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-4);">${t('modal_request_details')}</h4>
          <div class="detalle-grid">
            <div class="detalle-item">
              <span class="detalle-item__label">${t('modal_activity_type')}</span>
              <span class="detalle-item__value">${solicitud.detalles?.tipoActividad || '—'}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-item__label">${t('modal_requested_area')}</span>
              <span class="detalle-item__value">${formatearNumero(solicitud.detalles?.areaSolicitada)} m²</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-item__label">${t('modal_estimated_investment')}</span>
              <span class="detalle-item__value">${formatearMoneda(solicitud.detalles?.inversionEstimada)}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-item__label">${t('modal_new_jobs')}</span>
              <span class="detalle-item__value">${formatearNumero(solicitud.detalles?.empleosNuevos)}</span>
            </div>
          </div>
        </div>

        <!-- Sección de clasificación IA -->
        <div id="modal-ia-section">
          ${ia ? renderClasificacionIA(ia) : renderSinClasificacion(solicitud.id)}
        </div>

        ${solicitud.decisionAnalista ? `
          <div style="margin-top: var(--space-4); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-md);">
            <h4 style="margin-bottom: var(--space-2);">${t('decision_final_analyst')}</h4>
            <p style="margin-bottom: 4px;"><strong>${recomendacionIaTexto(solicitud.decisionAnalista.decision)}</strong> · ${solicitud.decisionAnalista.analista}</p>
            <p style="margin: 0; color: var(--text-muted);">${solicitud.decisionAnalista.justificacion || t('no_additional_justification')}</p>
          </div>
        ` : ''}

        ${solicitud.observaciones ? `
          <div style="margin-top: var(--space-5); padding: var(--space-4); background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border);">
            <p style="font-size: var(--text-sm); color: var(--text-secondary);">${solicitud.observaciones}</p>
          </div>
        ` : ''}
      </div>

      <div class="modal-footer" id="modalFooter">
        ${esAnalista() && solicitud.estado === 'en_revision' ? `
          <button class="btn btn-danger" id="btnRechazar" data-id="${solicitud.id}">
            <i class="fa-solid fa-xmark"></i> ${t('reject')}
          </button>
          <button class="btn btn-success" id="btnAprobar" data-id="${solicitud.id}">
            <i class="fa-solid fa-check"></i> ${t('approve')}
          </button>
        ` : ''}
        <button class="btn btn-outline" id="modalCloseBtn">${t('close')}</button>
      </div>
    </div>
  `;

  container.classList.add('active');

  // Event listeners
  document.getElementById('modalOverlay')?.addEventListener('click', cerrarModal);
  document.getElementById('modalClose')?.addEventListener('click', cerrarModal);
  document.getElementById('modalCloseBtn')?.addEventListener('click', cerrarModal);
}

function renderClasificacionIA(ia) {
  const colorClase = colorAfinidad(ia.puntajeAfinidad);
  const colorHex = colorClase === 'alto' ? 'var(--success)' : colorClase === 'medio' ? 'var(--warning)' : 'var(--error)';
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (ia.puntajeAfinidad / 100) * circumference;

  const factoresHTML = ia.factores.map(f =>
    `<li class="factor-item"><i class="fa-solid fa-circle-check"></i><span>${factorIaTexto(f)}</span></li>`
  ).join('');

  return `
    <div class="clasificacion-ia">
      <div class="clasificacion-ia__header">
        <div class="clasificacion-ia__icon">
          <i class="fa-solid fa-microchip"></i>
        </div>
        <div>
          <div class="clasificacion-ia__title">${t('ai_classification_title')}</div>
          <div class="clasificacion-ia__subtitle">${formatearFecha(ia.fechaClasificacion)}</div>
        </div>
      </div>

      <div class="clasificacion-ia__puntaje">
        <div class="puntaje-circular">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle class="puntaje-circular__bg" cx="40" cy="40" r="34"/>
            <circle class="puntaje-circular__fill" cx="40" cy="40" r="34"
              stroke="${colorHex}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"/>
          </svg>
          <span class="puntaje-circular__text" style="color: ${colorHex};">${ia.puntajeAfinidad}</span>
        </div>
        <div>
          <div style="font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-1);">${t('recommendation')}</div>
          <div style="font-size: var(--text-lg); font-weight: 600; color: ${colorHex};">${recomendacionIaTexto(ia.recomendacion)}</div>
          <div style="font-size: var(--text-xs); color: var(--text-muted); margin-top: var(--space-1);">${t('risk')}: ${nivelRiesgoTexto(ia.nivelRiesgo)}</div>
        </div>
      </div>

      <div style="font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3);">${t('considered_factors')}</div>
      <ul class="clasificacion-ia__factores">
        ${factoresHTML}
      </ul>
    </div>
  `;
}

function renderSinClasificacion(solicitudId) {
  return `
    <div class="clasificacion-ia" style="text-align: center;">
      <div style="padding: var(--space-4) 0;">
        <i class="fa-solid fa-robot" style="font-size: 2rem; color: var(--text-muted); opacity: 0.4; margin-bottom: var(--space-3);"></i>
        <p style="color: var(--text-muted); font-size: var(--text-sm); margin-bottom: var(--space-4);">${t('not_yet_classified')}</p>
        ${esAnalista() ? `<button class="btn btn-accent" id="btnClasificarModal" data-id="${solicitudId}">
          <i class="fa-solid fa-wand-magic-sparkles"></i> ${t('classify_with_ai')}
        </button>` : `<span class="sin-clasificacion__readonly">${t('available_for_analyst')}</span>`}
      </div>
    </div>
  `;
}

export function cerrarModal() {
  const container = document.getElementById('modal-container');
  if (container) {
    container.classList.remove('active');
    container.innerHTML = '';
  }
}

export function mostrarIaLoadingEnModal() {
  const section = document.getElementById('modal-ia-section');
  if (section) {
    section.innerHTML = `
      <div class="clasificacion-ia">
        <div class="ia-loading">
          <div class="spinner"></div>
          <span>${t('analyzing_with_ai')}</span>
          <span style="font-size: var(--text-xs);">${t('analyzing_details')}</span>
        </div>
      </div>
    `;
  }
}

export function actualizarIaEnModal(clasificacion) {
  const section = document.getElementById('modal-ia-section');
  if (section) {
    section.innerHTML = renderClasificacionIA(clasificacion);
  }
}
