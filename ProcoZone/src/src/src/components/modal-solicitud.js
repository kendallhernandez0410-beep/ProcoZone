/* ============================================
   ProcoZone — Componente Modal de Solicitud
   Muestra detalle completo + clasificación IA
   ============================================ */
import { ESTADO_BADGE, TIPO_TEXTO, NIVELES_RIESGO } from '../../utils/constantes.js';
import { formatearFecha, formatearMoneda, formatearNumero, colorAfinidad } from '../../utils/formateador.js';
import { renderLoading } from './estado-carga.js';
import { esAnalista } from '../../utils/auth.js';

export function abrirModalSolicitud(solicitud, empresa) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const estado = ESTADO_BADGE[solicitud.estado];
  const ia = solicitud.clasificacionIa;

  container.innerHTML = `
    <div class="modal-overlay" id="modalOverlay"></div>
    <div class="modal-content" style="max-width: 720px;">
      <div class="modal-header">
        <h3>Solicitud #${solicitud.id}</h3>
        <button class="modal-close" id="modalClose" aria-label="Cerrar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-5);">
          <span class="badge ${estado.clase}" style="font-size: var(--text-sm); padding: 4px 14px;">${estado.texto}</span>
          <span class="badge badge-neutral">${TIPO_TEXTO[solicitud.tipo]}</span>
        </div>

        <div class="detalle-grid" style="margin-bottom: var(--space-5);">
          <div class="detalle-item">
            <span class="detalle-item__label">Empresa</span>
            <span class="detalle-item__value">${empresa?.nombre || '—'}</span>
          </div>
          <div class="detalle-item">
            <span class="detalle-item__label">Zona Franca</span>
            <span class="detalle-item__value">${empresa?.zonaFranca || '—'}</span>
          </div>
          <div class="detalle-item">
            <span class="detalle-item__label">Fecha de Solicitud</span>
            <span class="detalle-item__value">${formatearFecha(solicitud.fechaSolicitud)}</span>
          </div>
          <div class="detalle-item">
            <span class="detalle-item__label">Responsable</span>
            <span class="detalle-item__value">${solicitud.responsable || '—'}</span>
          </div>
          <div class="detalle-item detalle-item--full">
            <span class="detalle-item__label">Descripción</span>
            <span class="detalle-item__value" style="font-weight: 400; line-height: 1.6;">${solicitud.descripcion}</span>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border); padding-top: var(--space-5); margin-bottom: var(--space-5);">
          <h4 style="font-size: var(--text-sm); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-4);">Detalles de la Solicitud</h4>
          <div class="detalle-grid">
            <div class="detalle-item">
              <span class="detalle-item__label">Tipo de Actividad</span>
              <span class="detalle-item__value">${solicitud.detalles?.tipoActividad || '—'}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-item__label">Área Solicitada</span>
              <span class="detalle-item__value">${formatearNumero(solicitud.detalles?.areaSolicitada)} m²</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-item__label">Inversión Estimada</span>
              <span class="detalle-item__value">${formatearMoneda(solicitud.detalles?.inversionEstimada)}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-item__label">Empleos Nuevos</span>
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
            <h4 style="margin-bottom: var(--space-2);">Decisión final del analista</h4>
            <p style="margin-bottom: 4px;"><strong>${solicitud.decisionAnalista.decision}</strong> por ${solicitud.decisionAnalista.analista}</p>
            <p style="margin: 0; color: var(--text-muted);">${solicitud.decisionAnalista.justificacion || 'Sin justificación adicional.'}</p>
          </div>
        ` : ''}

        ${solicitud.observaciones ? `
          <div style="margin-top: var(--space-5); padding: var(--space-4); background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border);">
            <h4 style="font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-2);">Observaciones</h4>
            <p style="font-size: var(--text-sm); color: var(--text-secondary);">${solicitud.observaciones}</p>
          </div>
        ` : ''}
      </div>

      <div class="modal-footer" id="modalFooter">
        ${esAnalista() && solicitud.estado === 'en_revision' ? `
          <button class="btn btn-danger" id="btnRechazar" data-id="${solicitud.id}">
            <i class="fa-solid fa-xmark"></i> Rechazar
          </button>
          <button class="btn btn-success" id="btnAprobar" data-id="${solicitud.id}">
            <i class="fa-solid fa-check"></i> Aprobar
          </button>
        ` : ''}
        <button class="btn btn-outline" id="modalCloseBtn">Cerrar</button>
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
    `<li class="factor-item"><i class="fa-solid fa-circle-check"></i><span>${f}</span></li>`
  ).join('');

  return `
    <div class="clasificacion-ia">
      <div class="clasificacion-ia__header">
        <div class="clasificacion-ia__icon">
          <i class="fa-solid fa-microchip"></i>
        </div>
        <div>
          <div class="clasificacion-ia__title">Clasificación por IA</div>
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
          <div style="font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-1);">Recomendación</div>
          <div style="font-size: var(--text-lg); font-weight: 600; color: ${colorHex};">${ia.recomendacion}</div>
          <div style="font-size: var(--text-xs); color: var(--text-muted); margin-top: var(--space-1);">Riesgo: ${ia.nivelRiesgo}</div>
        </div>
      </div>

      <div style="font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3);">Factores considerados</div>
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
        <p style="color: var(--text-muted); font-size: var(--text-sm); margin-bottom: var(--space-4);">Esta solicitud aún no ha sido clasificada por el motor de IA.</p>
        ${esAnalista() ? `<button class="btn btn-accent" id="btnClasificarModal" data-id="${solicitudId}">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Clasificar con IA
        </button>` : '<span class="sin-clasificacion__readonly">Disponible para el analista</span>'}
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
          <span>Analizando solicitud con IA...</span>
          <span style="font-size: var(--text-xs);">Evaluando empresa, cumplimiento histórico, inversión y empleo</span>
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
