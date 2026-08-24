/* ============================================
   ProcoZone — Componente Indicador de Cumplimiento
   ============================================ */
import { colorCumplimiento } from '../../../utils/formateador.js';
import { t } from '../../../utils/translations.js';

export function renderIndicador(nombre, requerido, actual, esPorcentaje = true, unidad = '%') {
  const estado = actual >= requerido ? 'cumple' : 'incumple';
  const color = colorCumplimiento(esPorcentaje ? actual : (actual / requerido) * 100);
  const porcentajeBarra = esPorcentaje
    ? Math.min(100, actual)
    : Math.min(100, (actual / requerido) * 100);

  const estadoBadge = estado === 'cumple'
    ? `<span class="badge badge-success" style="font-size: 10px; padding: 1px 8px;">${t('meets')}</span>`
    : `<span class="badge badge-error" style="font-size: 10px; padding: 1px 8px;">${t('does_not_meet')}</span>`;

  return `
    <div class="indicador-row">
      <span class="indicador-row__nombre">${nombre}</span>
      <div class="indicador-row__bar">
        <div class="progress-bar">
          <div class="progress-bar__fill progress-bar__fill--${color}" style="width: ${porcentajeBarra}%;"></div>
        </div>
      </div>
      <span class="indicador-row__estado">
        ${estadoBadge}
      </span>
    </div>
  `;
}