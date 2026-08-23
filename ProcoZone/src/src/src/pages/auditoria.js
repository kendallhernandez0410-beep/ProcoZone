/* ============================================
   ProcoZone — Página de Auditoría y Trazabilidad
   Historial completo de solicitudes y reportes
   con registro de quién tomó cada decisión
   ============================================ */
import { http } from '../../services/http-client.js';
import { renderLoading, renderError } from '../components/estado-carga.js';
import { formatearFecha, formatearMoneda } from '../../utils/formateador.js';
import { ALERTA_BADGE, estadoSolicitudBadge, tipoSolicitudTexto, recomendacionIaTexto, textoCatalogo } from '../../utils/constantes.js';
import { t } from '../../utils/translations.js';

let destroyFn = null;

export async function render() {
  return `
    <div class="page-enter" id="auditoriaPage">
      ${renderLoading(t('loading_default'))}
    </div>
  `;
}

export async function init() {
  const container = document.getElementById('auditoriaPage');
  if (!container) return;

  try {
    const [empresas, solicitudes, reportes] = await Promise.all([
      http.get('empresas'),
      http.get('solicitudes'),
      http.get('reportesCumplimiento')
    ]);

    const nombreEmpresa = (id) => empresas.find(e => e.id === id)?.nombre || '—';

    const decisiones = [...solicitudes].sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));

    container.innerHTML = `
      <div class="page-enter">
        <div class="card" style="margin-bottom: var(--space-6);">
          <div class="section-header">
            <h2><i class="fa-solid fa-clipboard-list-check" style="color: var(--primary); margin-right: var(--space-2);"></i> ${t('audit_requests_history')}</h2>
          </div>
          <p style="color: var(--text-muted); font-size: var(--text-sm); margin-bottom: var(--space-4);">
            ${t('audit_intro')}
          </p>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>${t('th_company')}</th>
                  <th>${t('th_type')}</th>
                  <th>${t('th_request_date')}</th>
                  <th>${t('th_ai_decision')}</th>
                  <th>${t('th_score')}</th>
                  <th>${t('th_final_status')}</th>
                  <th>${t('th_decided_by')}</th>
                  <th>${t('th_notes')}</th>
                </tr>
              </thead>
              <tbody>
                ${decisiones.map(sol => {
                  const estado = estadoSolicitudBadge(sol.estado);
                  const ia = sol.clasificacionIa;
                  return `
                    <tr>
                      <td style="font-weight: 500;">${nombreEmpresa(sol.empresaId)}</td>
                      <td>${tipoSolicitudTexto(sol.tipo) || sol.tipo}</td>
                      <td>${formatearFecha(sol.fechaSolicitud)}</td>
                      <td>${ia ? recomendacionIaTexto(ia.recomendacion) : `<span style="color: var(--text-muted);">${t('unclassified')}</span>`}</td>
                      <td>${ia ? `<strong>${ia.puntajeAfinidad}/100</strong>` : '—'}</td>
                      <td><span class="badge ${estado.clase}">${estado.texto}</span></td>
                      <td>${sol.responsable || '—'}<br><small style="color: var(--text-muted);">${sol.observaciones ? '' : t('no_notes')}</small></td>
                      <td style="max-width: 260px; font-size: var(--text-xs); color: var(--text-muted);">${sol.observaciones || '—'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="section-header">
            <h2><i class="fa-solid fa-file-shield" style="color: var(--primary); margin-right: var(--space-2);"></i> ${t('audit_reports_history')}</h2>
          </div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>${t('th_company')}</th>
                  <th>${t('th_period')}</th>
                  <th>${t('th_report_date')}</th>
                  <th>${t('lbl_compliance')}</th>
                  <th>${t('th_generated_alerts')}</th>
                </tr>
              </thead>
              <tbody>
                ${reportes.map(rep => `
                  <tr>
                    <td style="font-weight: 500;">${nombreEmpresa(rep.empresaId)}</td>
                    <td>${rep.periodo}</td>
                    <td>${formatearFecha(rep.fechaReporte)}</td>
                    <td><strong>${rep.porcentajeCumplimiento}%</strong></td>
                    <td>
                      ${rep.alertasGeneradas?.length > 0
                        ? rep.alertasGeneradas.map(a => `<span class="badge ${ALERTA_BADGE.warning}" style="margin: 2px;">${textoCatalogo(a)}</span>`).join('')
                        : `<span class="badge badge-success">${t('no_alerts_generated')}</span>`}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    destroyFn = () => {};
  } catch (error) {
    container.innerHTML = renderError(error.message || t('audit_load_error'), () => init());
    container.querySelector('button')?.addEventListener('click', () => init());
  }
}

export function destroy() {
  if (destroyFn) destroyFn();
}
