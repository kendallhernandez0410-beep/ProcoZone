/* ============================================
   ProcoZone — Componente Tarjeta de Solicitud
   ============================================ */
import { estadoSolicitudBadge, tipoSolicitudTexto, solicitudDescripcionTexto } from '../../utils/constantes.js';
import { formatearFecha, truncarTexto, colorAfinidad } from '../../utils/formateador.js';
import { esAnalista } from '../../utils/auth.js';
import { t } from '../../utils/translations.js';

export function renderTarjetaSolicitud(solicitud, empresa) {
  const estado = estadoSolicitudBadge(solicitud.estado);
  const tipoTexto = tipoSolicitudTexto(solicitud.tipo) || solicitud.tipo;
  const ia = solicitud.clasificacionIa;

  let iaHTML;
  if (ia) {
    const colorClase = colorAfinidad(ia.puntajeAfinidad);
    iaHTML = `
      <div class="solicitud-card__ia">
        <div class="ia-badge">
          <i class="fa-solid fa-microchip"></i>
          <span>${t('ai_classification')}</span>
        </div>
        <span class="ia-puntaje ia-puntaje--${colorClase}">${ia.puntajeAfinidad}</span>
      </div>
    `;
  } else {
    iaHTML = `
      <div class="solicitud-card__ia">
        <div class="sin-clasificacion">
          <i class="fa-solid fa-clock"></i>
          <span>${t('no_ai_classification')}</span>
        </div>
        ${esAnalista() ? `<button class="btn btn-sm btn-accent btn-clasificar" data-id="${solicitud.id}">
          <i class="fa-solid fa-wand-magic-sparkles"></i> ${t('classify')}
        </button>` : `<span class="sin-clasificacion__readonly">${t('pending_analysis')}</span>`}
      </div>
    `;
  }

  const estadoIncompleto = solicitud.estado === 'pendiente' && solicitud.observaciones;

  return `
    <div class="solicitud-card" data-solicitud-id="${solicitud.id}">
      <div class="solicitud-card__top">
        <div>
          <div class="solicitud-card__empresa">${empresa?.nombre || t('company_not_found')}</div>
          <div class="solicitud-card__tipo">${tipoTexto} — #${solicitud.id}</div>
        </div>
        <div class="solicitud-card__estados">
          <span class="badge ${estado.clase}">${estado.texto}</span>
          ${estadoIncompleto ? `
            <span class="badge badge-warning sol-badge-incompleto" title="${solicitud.observaciones}">
              <i class="fa-solid fa-triangle-exclamation"></i> ${t('state_incomplete_badge')}
            </span>` : ''}
        </div>
      </div>

      <p class="solicitud-card__desc">${truncarTexto(solicitudDescripcionTexto(solicitud.descripcion), 120)}</p>

      <div class="solicitud-card__meta">
        <span><i class="fa-regular fa-calendar"></i> ${formatearFecha(solicitud.fechaSolicitud)}</span>
        <span><i class="fa-regular fa-user"></i> ${solicitud.responsable || '—'}</span>
      </div>

      ${iaHTML}
    </div>
  `;
}
