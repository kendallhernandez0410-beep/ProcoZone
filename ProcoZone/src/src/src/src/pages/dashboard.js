/* ============================================
   ProcoZone — Página Dashboard
   Carga datos en paralelo con Promise.all
   ============================================ */
import { http } from '../../../services/http-client.js';
import { renderLoading, renderError } from '../../components/estado-carga.js';
import { formatearMoneda, formatearFecha, tiempoRelativo, colorCumplimiento, colorDesdeString, obtenerIniciales } from '../../../utils/formateador.js';
import { UMBRALES_CUMPLIMIENTO, ALERTA_BADGE, estadoSolicitudBadge, estadoSolicitudTexto, tipoSolicitudTexto, alertaTipoTexto } from '../../../utils/constantes.js';
import { renderIndicador } from '../components/indicador-cumplimiento.js';
import { t } from '../../../utils/translations.js';

let destroyFn = null;

export async function render() {
  return `
    <div class="page-enter" id="dashboardPage">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <span>${t('loading_dashboard')}</span>
      </div>
    </div>
  `;
}

export async function init() {
  const container = document.getElementById('dashboardPage');
  if (!container) return;

  try {
    // Cargar TODOS los datos en paralelo con Promise.all
    // Esto demuestra el uso de Promise.all para optimizar carga
    const [empresas, solicitudes, reportes, alertas] = await Promise.all([
      http.get('empresas'),
      http.get('solicitudes'),
      http.get('reportesCumplimiento'),
      http.get('alertas')
    ]);

    // Calcular métricas
    const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente' || s.estado === 'en_revision').length;
    const alertasAbiertas = alertas.filter(a => a.estado === 'abierta').length;
    const avgCumplimiento = reportes.length > 0
      ? Math.round(reportes.reduce((sum, r) => sum + r.porcentajeCumplimiento, 0) / reportes.length)
      : 0;
    const empresasActivas = empresas.filter(e => e.estado === 'Activa').length;
    const conteoEstados = ['pendiente', 'en_revision', 'aprobada', 'rechazada'].map((estado) => `${estadoSolicitudTexto(estado)}: ${solicitudes.filter((solicitud) => solicitud.estado === estado).length}`).join(' · ');

    // Solicitudes recientes (últimas 5)
    const recientes = [...solicitudes].sort((a, b) =>
      new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud)
    ).slice(0, 5);

    // Empresas con menor cumplimiento
    const empresasRiesgo = empresas
      .filter(e => e.porcentajeCumplimiento < UMBRALES_CUMPLIMIENTO.ACEPTABLE)
      .sort((a, b) => a.porcentajeCumplimiento - b.porcentajeCumplimiento);

    // Último reporte por empresa para la tabla
    const ultimosReportes = reportes.slice(0, 4);

    container.innerHTML = `
      <!-- Tarjetas de estadísticas -->
      <div class="dashboard-grid">
        <div class="stat-card stat-card--primary">
          <div class="stat-card__icon"><i class="fa-solid fa-file-circle-plus"></i></div>
          <div class="stat-card__value">${solicitudes.length}</div>
          <div class="stat-card__label">${t('total_applications')}</div>
          <small>${conteoEstados}</small>
        </div>
        <div class="stat-card stat-card--accent">
          <div class="stat-card__icon"><i class="fa-solid fa-building"></i></div>
          <div class="stat-card__value">${empresasActivas}</div>
          <div class="stat-card__label">${t('active_companies')}</div>
        </div>
        <div class="stat-card stat-card--success">
          <div class="stat-card__icon"><i class="fa-solid fa-chart-line"></i></div>
          <div class="stat-card__value">${avgCumplimiento}%</div>
          <div class="stat-card__label">${t('average_compliance')}</div>
        </div>
        <div class="stat-card stat-card--error">
          <div class="stat-card__icon"><i class="fa-solid fa-bell"></i></div>
          <div class="stat-card__value">${alertasAbiertas}</div>
          <div class="stat-card__label">${t('open_alerts')}</div>
        </div>
      </div>

      <!-- Secciones inferiores -->
      <div class="dashboard-sections">
        <!-- Solicitudes recientes -->
        <div class="card">
          <div class="section-header">
            <h2>${t('recent_applications')}</h2>
              <a href="#/solicitudes" class="btn btn-ghost btn-sm">${t('view_all')} <i class="fa-solid fa-arrow-right" style="font-size: 10px;"></i></a>
          </div>
          ${recientes.length > 0 ? recientes.map(sol => {
            const empresa = empresas.find(e => e.id === sol.empresaId);
            const estado = estadoSolicitudBadge(sol.estado);
            return `
              <div class="activity-item" style="cursor: pointer;" data-sol-id="${sol.id}">
                <div class="activity-dot" style="background: ${
                  sol.estado === 'aprobada' ? 'var(--success)' :
                  sol.estado === 'rechazada' ? 'var(--error)' :
                  'var(--accent)'
                };"></div>
                <div style="flex: 1;">
                  <div class="activity-text">
                    <strong>${empresa?.nombre || '—'}</strong> — ${tipoSolicitudTexto(sol.tipo)} #${sol.id}
                  </div>
                  <div class="activity-time">${tiempoRelativo(sol.fechaSolicitud)}</div>
                </div>
                <span class="badge ${estado.clase}" style="font-size: 10px;">${estado.texto}</span>
              </div>
            `;
          }).join('') : `<p style="color: var(--text-muted); font-size: var(--text-sm); padding: var(--space-4);">${t('no_recent_applications')}</p>`}
        </div>

        <!-- Empresas en riesgo -->
        <div class="card">
          <div class="section-header">
            <h2>${t('risk_companies')}</h2>
              <a href="#/cumplimiento" class="btn btn-ghost btn-sm">${t('see_compliance')} <i class="fa-solid fa-arrow-right" style="font-size: 10px;"></i></a>
          </div>
          ${empresasRiesgo.length > 0 ? empresasRiesgo.map(emp => {
            const color = colorCumplimiento(emp.porcentajeCumplimiento);
            return `
              <div style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) 0; border-bottom: 1px solid var(--border);">
                <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: ${colorDesdeString(emp.nombre)}22; color: ${colorDesdeString(emp.nombre)}; display: flex; align-items: center; justify-content: center; font-size: var(--text-xs); font-weight: 700; font-family: var(--font-heading); flex-shrink: 0;">
                  ${obtenerIniciales(emp.nombre)}
                </div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: var(--text-sm); font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${emp.nombre}</div>
                  <div class="progress-bar" style="height: 4px; margin-top: var(--space-1);">
                    <div class="progress-bar__fill progress-bar__fill--${color}" style="width: ${emp.porcentajeCumplimiento}%;"></div>
                  </div>
                </div>
                <span style="font-family: var(--font-heading); font-weight: 600; font-size: var(--text-sm); color: var(--${color}); min-width: 40px; text-align: right;">${emp.porcentajeCumplimiento}%</span>
              </div>
            `;
          }).join('') : `<p style="color: var(--text-muted); font-size: var(--text-sm); padding: var(--space-4);">${t('no_risk_companies')}</p>`}
        </div>
      </div>

      <!-- Alertas recientes -->
      <div class="card" style="margin-top: var(--space-6);">
        <div class="section-header">
          <h2>${t('recent_alerts')}</h2>
          <a href="#/alertas" class="btn btn-ghost btn-sm">${t('view_all')} <i class="fa-solid fa-arrow-right" style="font-size: 10px;"></i></a>
        </div>
        ${alertas.slice(0, 3).map(alerta => {
          const empresa = empresas.find(e => e.id === alerta.empresaId);
          return `
            <div class="activity-item">
              <div class="activity-dot" style="background: ${
                alerta.tipo === 'critica' ? 'var(--error)' :
                alerta.tipo === 'warning' ? 'var(--warning)' : 'var(--info)'
              };"></div>
              <div style="flex: 1;">
                <div class="activity-text">
                  <strong>${alerta.titulo}</strong> — ${empresa?.nombre || '—'}
                </div>
                <div class="activity-time">${tiempoRelativo(alerta.fechaCreacion)}</div>
              </div>
              <span class="badge ${ALERTA_BADGE[alerta.tipo]}" style="font-size: 10px;">${alertaTipoTexto(alerta.tipo)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Click en solicitudes recientes navega al detalle
    destroyFn = () => {
      // cleanup si se necesita
    };

  } catch (error) {
    container.innerHTML = renderError(
      error.message || t('dashboard_load_error'),
      () => init()
    );
    // Bind retry
    container.querySelector('button')?.addEventListener('click', () => init());
  }
}

export function destroy() {
  if (destroyFn) destroyFn();
}
