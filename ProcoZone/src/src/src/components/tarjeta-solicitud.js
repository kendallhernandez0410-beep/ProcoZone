/* ============================================
   ProcoZone — Componente Tarjeta de Solicitud
   ============================================ */
import { ESTADO_BADGE, TIPO_TEXTO } from '../../utils/constantes.js';
import { formatearFecha, truncarTexto, colorAfinidad } from '../../utils/formateador.js';

export function renderTarjetaSolicitud(solicitud, empresa) {
  const estado = ESTADO_BADGE[solicitud.estado] || ESTADO_BADGE.pendiente;
  const tipoTexto = TIPO_TEXTO[solicitud.tipo] || solicitud.tipo;
  const ia = solicitud.clasificacionIa;

  let iaHTML;
  if (ia) {
    const colorClase = colorAfinidad(ia.puntajeAfinidad);
    iaHTML = `
      <div class="solicitud-card__ia">
        <div class="ia-badge">
          <i class="fa-solid fa-microchip"></i>
          <span>Clasificación IA</span>
        </div>
        <span class="ia-puntaje ia-puntaje--${colorClase}">${ia.puntajeAfinidad}</span>
      </div>
    `;
  } else {
    iaHTML = `
      <div class="solicitud-card__ia">
        <div class="sin-clasificacion">
          <i class="fa-solid fa-clock"></i>
          <span>Sin clasificación IA</span>
        </div>
        <button class="btn btn-sm btn-accent btn-clasificar" data-id="${solicitud.id}">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Clasificar
        </button>
      </div>
    `;
  }

  return `
    <div class="solicitud-card" data-solicitud-id="${solicitud.id}">
      <div class="solicitud-card__top">
        <div>
          <div class="solicitud-card__empresa">${empresa?.nombre || 'Empresa no encontrada'}</div>
          <div class="solicitud-card__tipo">${tipoTexto} — #${solicitud.id}</div>
        </div>
        <span class="badge ${estado.clase}">${estado.texto}</span>
      </div>

      <p class="solicitud-card__desc">${truncarTexto(solicitud.descripcion, 120)}</p>

      <div class="solicitud-card__meta">
        <span><i class="fa-regular fa-calendar"></i> ${formatearFecha(solicitud.fechaSolicitud)}</span>
        <span><i class="fa-regular fa-user"></i> ${solicitud.responsable || '—'}</span>
      </div>

      ${iaHTML}
    </div>
  `;
}