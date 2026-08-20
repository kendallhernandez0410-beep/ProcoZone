/* ============================================
   ProcoZone — Página de Cumplimiento
   Reportes con indicadores detallados
   ============================================ */
import { http } from '../../services/http-client.js';
import { renderLoading, renderError } from '../components/estado-carga.js';
import { renderIndicador } from '../src/components/indicador-cumplimiento.js';
import { formatearFecha, colorCumplimiento, colorDesdeString, obtenerIniciales } from '../../utils/formateador.js';
import { UMBRALES_CUMPLIMIENTO } from '../../utils/constantes.js';

let destroyFn = null;

export async function render() {
  return `
    <div class="page-enter" id="cumplimientoPage">
      ${renderLoading('Cargando reportes de cumplimiento...')}
    </div>
  `;
}

export async function init() {
  const container = document.getElementById('cumplimientoPage');
  if (!container) return;

  try {
    // Cargar en paralelo: reportes y empresas
    const [reportes, empresas] = await Promise.all([
      http.get('reportesCumplimiento'),
      http.get('empresas')
    ]);

    container.innerHTML = `
      <div style="margin-bottom: var(--space-6);">
        <h1 style="font-size: var(--text-2xl); margin-bottom: var(--space-2);">Reportes de Cumplimiento</h1>
        <p style="color: var(--text-muted); font-size: var(--text-sm);">Evaluación trimestral del cumplimiento de las empresas operando bajo el régimen de Zonas Francas.</p>
      </div>

      <div class="cumplimiento-grid">
        ${reportes.map(reporte => {
          const empresa = empresas.find(e => e.id === reporte.empresaId);
          if (!empresa) return '';
          const color = colorCumplimiento(reporte.porcentajeCumplimiento);
          const bgAvatar = colorDesdeString(empresa.nombre);
          const indicadores = reporte.indicadores || {};

          return `
            <div class="cumplimiento-card">
              <div class="cumplimiento-card__header">
                <div>
                  <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: 2px;">
                    <div style="width: 24px; height: 24px; border-radius: var(--radius-sm); background: ${bgAvatar}22; color: ${bgAvatar}; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; font-family: var(--font-heading);">${obtenerIniciales(empresa.nombre)}</div>
                    <span class="cumplimiento-card__empresa">${empresa.nombre}</span>
                  </div>
                  <span class="cumplimiento-card__periodo">${reporte.periodo} — ${formatearFecha(reporte.fechaReporte)}</span>
                </div>
              </div>

              <div class="cumplimiento-card__puntaje">
                <span class="puntaje-grande puntaje-grande--${color}">${reporte.porcentajeCumplimiento}</span>
                <span class="puntaje-sufijo">%</span>
                <span style="margin-left: var(--space-2); font-size: var(--text-xs); color: var(--text-muted);">de cumplimiento</span>
              </div>

              <div class="indicadores-list">
                ${indicadores.exportaciones ? renderIndicador(
                  'Exportaciones',
                  indicadores.exportaciones.requerido,
                  indicadores.exportaciones.actual,
                  true
                ) : ''}
                ${indicadores.empleoNacional ? renderIndicador(
                  'Empleo Nacional',
                  indicadores.empleoNacional.requerido,
                  indicadores.empleoNacional.actual,
                  true
                ) : ''}
                ${indicadores.inversion ? renderIndicador(
                  'Inversión Mínima',
                  indicadores.inversion.requerido,
                  indicadores.inversion.actual,
                  false,
                  'CRC'
                ) : ''}
                ${indicadores.reportesOportunos ? renderIndicador(
                  'Reportes Oportunos',
                  indicadores.reportesOportunos.requerido,
                  indicadores.reportesOportunos.actual,
                  true
                ) : ''}
              </div>

              ${reporte.alertasGeneradas && reporte.alertasGeneradas.length > 0 ? `
                <div class="cumplimiento-card__alertas">
                  ${reporte.alertasGeneradas.map(alerta => `
                    <div class="alerta-mini ${alerta.toLowerCase().includes('crític') ? 'alerta-mini--critica' : 'alerta-mini--warning'}">
                      <i class="fa-solid ${alerta.toLowerCase().includes('crític') ? 'fa-circle-exclamation' : 'fa-triangle-exclamation'}"></i>
                      <span>${alerta}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

  } catch (error) {
    container.innerHTML = renderError(
      error.message || 'Error al cargar los reportes.',
      () => init()
    );
    container.querySelector('button')?.addEventListener('click', () => init());
  }
}

export function destroy() {
  if (destroyFn) destroyFn();
}