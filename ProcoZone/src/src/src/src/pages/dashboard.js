/* ============================================
   ProcoZone — Página Dashboard
   Carga datos en paralelo con Promise.all
   Métricas visualizadas como gráficos de dona
   ============================================ */
import { http } from '../../../services/http-client.js';
import { renderLoading, renderError } from '../../components/estado-carga.js';
import { tiempoRelativo, colorCumplimiento } from '../../../utils/formateador.js';
import { UMBRALES_CUMPLIMIENTO, ALERTA_BADGE, estadoSolicitudTexto, alertaTipoTexto, alertaTexto, nivelRiesgoTexto } from '../../../utils/constantes.js';
import { t } from '../../../utils/translations.js';

let destroyFn = null;

/* Color de cada estado de solicitud, alineado con los badges */
const COLOR_ESTADO = {
  borrador: 'var(--text-muted)',
  pendiente: 'var(--warning)',
  en_revision: 'var(--info)',
  observada: 'var(--accent)',
  aprobada: 'var(--success)',
  rechazada: 'var(--error)'
};

/**
 * Gráfico de dona SVG (sin librerías) con centro informativo
 * y leyenda de porcentajes. segmentos: [{ etiqueta, cantidad, color }]
 */
function crearGraficoDona(segmentos, etiquetaCentro) {
  const total = segmentos.reduce((suma, seg) => suma + seg.cantidad, 0);

  if (!total) {
    return `<p class="dash-vacio"><i class="fa-regular fa-chart-bar"></i> ${t('chart_no_data')}</p>`;
  }

  let acumulado = 0;
  const arcos = segmentos
    .filter(seg => seg.cantidad > 0)
    .map(seg => {
      const pct = (seg.cantidad / total) * 100;
      const offset = 25 - acumulado;
      acumulado += pct;
      // Circunferencia r=15.9155 ≈ 100 unidades → dasharray trabaja en %
      const trazo = Math.max(pct - 0.8, 0.4);
      return `<circle class="dash-donut__arc" cx="21" cy="21" r="15.9155" fill="none" stroke="${seg.color}" stroke-width="4.6"
        stroke-dasharray="${trazo} ${100 - trazo}" stroke-dashoffset="${offset}"></circle>`;
    })
    .join('');

  const leyenda = segmentos.map(seg => `
    <div class="dash-leyenda__item" title="${seg.etiqueta}">
      <span class="dash-leyenda__dot" style="background: ${seg.color};"></span>
      <span class="dash-leyenda__nombre">${seg.etiqueta}</span>
      <span class="dash-leyenda__valor">${seg.cantidad}</span>
      <span class="dash-leyenda__pct">${total ? Math.round((seg.cantidad / total) * 100) : 0}%</span>
    </div>`).join('');

  return `
    <div class="dash-donut">
      <div class="dash-donut__figura">
        <svg viewBox="0 0 42 42" role="img" aria-label="${etiquetaCentro}">
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--bg-tertiary)" stroke-width="4.6"></circle>
          ${arcos}
        </svg>
        <div class="dash-donut__centro">
          <span class="dash-donut__total">${total}</span>
          <span class="dash-donut__etiqueta">${etiquetaCentro}</span>
        </div>
      </div>
      <div class="dash-donut__leyenda">${leyenda}</div>
    </div>
  `;
}

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

    /* Segmentos del gráfico: distribución porcentual por estado */
    const segmentosSolicitudes = ['pendiente', 'en_revision', 'aprobada', 'rechazada', 'observada', 'borrador']
      .map(estado => ({
        etiqueta: estadoSolicitudTexto(estado),
        cantidad: solicitudes.filter(s => s.estado === estado).length,
        color: COLOR_ESTADO[estado]
      }))
      .filter(seg => seg.cantidad > 0);

    /* Segmentos del gráfico: empresas por categoría de riesgo */
    const riesgoAlto = empresas.filter(e => e.porcentajeCumplimiento < UMBRALES_CUMPLIMIENTO.CRITICO).length;
    const riesgoMedio = empresas.filter(e =>
      e.porcentajeCumplimiento >= UMBRALES_CUMPLIMIENTO.CRITICO &&
      e.porcentajeCumplimiento < UMBRALES_CUMPLIMIENTO.ACEPTABLE
    ).length;
    const cumplimientoOptimo = empresas.length - riesgoAlto - riesgoMedio;
    const segmentosRiesgo = [
      { etiqueta: nivelRiesgoTexto('Alto'), cantidad: riesgoAlto, color: 'var(--error)' },
      { etiqueta: nivelRiesgoTexto('Medio'), cantidad: riesgoMedio, color: 'var(--warning)' },
      { etiqueta: t('risk_optimal_compliance'), cantidad: cumplimientoOptimo, color: 'var(--success)' }
    ];

    container.innerHTML = `
      <!-- Tarjetas de estadísticas compactas (accesos directos a cada sección) -->
      <div class="dashboard-grid">
        <a class="stat-card stat-card--compact stat-card--primary" href="#/solicitudes">
          <div class="stat-card__icon"><i class="fa-solid fa-file-circle-plus"></i></div>
          <div class="stat-card__meta">
            <span class="stat-card__value">${solicitudes.length}</span>
            <span class="stat-card__label">${t('total_applications')}</span>
            <small class="stat-card__hint" title="${conteoEstados}"><i class="fa-solid fa-clock"></i> ${solicitudesPendientes} ${t('pending').toLowerCase()}</small>
          </div>
        </a>
        <a class="stat-card stat-card--compact stat-card--accent" href="#/empresas">
          <div class="stat-card__icon"><i class="fa-solid fa-building"></i></div>
          <div class="stat-card__meta">
            <span class="stat-card__value">${empresasActivas}</span>
            <span class="stat-card__label">${t('active_companies')}</span>
            <small class="stat-card__hint"><i class="fa-solid fa-arrow-up-right-from-square"></i></small>
          </div>
        </a>
        <a class="stat-card stat-card--compact stat-card--success" href="#/cumplimiento">
          <div class="stat-card__icon"><i class="fa-solid fa-chart-line"></i></div>
          <div class="stat-card__meta">
            <span class="stat-card__value">${avgCumplimiento}%</span>
            <span class="stat-card__label">${t('average_compliance')}</span>
            <div class="progress-bar stat-card__bar">
              <div class="progress-bar__fill progress-bar__fill--${colorCumplimiento(avgCumplimiento)}" style="width: ${avgCumplimiento}%;"></div>
            </div>
          </div>
        </a>
        <a class="stat-card stat-card--compact stat-card--error" href="#/alertas">
          <div class="stat-card__icon"><i class="fa-solid fa-bell"></i></div>
          <div class="stat-card__meta">
            <span class="stat-card__value">${alertasAbiertas}</span>
            <span class="stat-card__label">${t('open_alerts')}</span>
            <small class="stat-card__hint"><i class="fa-solid fa-circle-info"></i></small>
          </div>
        </a>
      </div>

      <!-- Secciones inferiores: gráficos porcentuales -->
      <div class="dashboard-sections">
        <!-- Distribución de solicitudes por estado -->
        <div class="card dash-card">
          <div class="section-header">
            <h2>${t('dash_requests_distribution')}</h2>
            <a href="#/solicitudes" class="btn btn-ghost btn-sm">${t('view_all')} <i class="fa-solid fa-arrow-right" style="font-size: 10px;"></i></a>
          </div>
          ${crearGraficoDona(segmentosSolicitudes, t('unit_applications'))}
        </div>

        <!-- Nivel de riesgo de las empresas -->
        <div class="card dash-card">
          <div class="section-header">
            <h2>${t('dash_risk_distribution')}</h2>
            <a href="#/cumplimiento" class="btn btn-ghost btn-sm">${t('see_compliance')} <i class="fa-solid fa-arrow-right" style="font-size: 10px;"></i></a>
          </div>
          ${crearGraficoDona(segmentosRiesgo, t('unit_companies'))}
        </div>
      </div>

      <!-- Alertas recientes -->
      <div class="card" style="margin-top: var(--space-6);">
        <div class="section-header">
          <h2>${t('recent_alerts')} <span class="dash-chip dash-chip--warning">${alertas.filter(a => a.estado === 'abierta').length}</span></h2>
          <a href="#/alertas" class="btn btn-ghost btn-sm">${t('view_all')} <i class="fa-solid fa-arrow-right" style="font-size: 10px;"></i></a>
        </div>
        <div class="dash-list">
        ${alertas.slice(0, 3).map(alerta => {
          const empresa = empresas.find(e => e.id === alerta.empresaId);
          const textoAlerta = alertaTexto(alerta);
          return `
            <div class="activity-item dash-list__item">
              <div class="activity-dot" style="background: ${
                alerta.tipo === 'critica' ? 'var(--error)' :
                alerta.tipo === 'warning' ? 'var(--warning)' : 'var(--info)'
              };"></div>
              <div style="flex: 1;">
                <div class="activity-text">
                    <strong>${textoAlerta.titulo}</strong> — ${empresa?.nombre || '—'}
                </div>
                <div class="activity-time">${tiempoRelativo(alerta.fechaCreacion)}</div>
              </div>
              <span class="badge ${ALERTA_BADGE[alerta.tipo]}" style="font-size: 10px;">${alertaTipoTexto(alerta.tipo)}</span>
            </div>
          `;
        }).join('')}
        </div>
      </div>
    `;

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
