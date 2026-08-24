/* ============================================
   ProcoZone — Página Dashboard
   Carga datos en paralelo con Promise.all
   ============================================ */
import { http } from '../../../services/http-client.js';
import { renderLoading, renderError } from '../../components/estado-carga.js';
import { tiempoRelativo, colorCumplimiento, colorDesdeString, colorAfinidad, obtenerIniciales } from '../../../utils/formateador.js';
import { UMBRALES_CUMPLIMIENTO, ALERTA_BADGE, estadoSolicitudBadge, estadoSolicitudTexto, tipoSolicitudTexto, alertaTipoTexto, alertaTexto, nivelRiesgoTexto } from '../../../utils/constantes.js';
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

    // Solicitudes recientes (últimas 6)
    const recientes = [...solicitudes].sort((a, b) =>
      new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud)
    ).slice(0, 6);

    // Empresas con menor cumplimiento
    const empresasRiesgo = empresas
      .filter(e => e.porcentajeCumplimiento < UMBRALES_CUMPLIMIENTO.ACEPTABLE)
      .sort((a, b) => a.porcentajeCumplimiento - b.porcentajeCumplimiento);

    const avatarEmpresa = (nombre, tamano = 32) => {
      const color = colorDesdeString(nombre);
      return `<div class="empresa-avatar" style="background: ${color}22; color: ${color}; width: ${tamano}px; height: ${tamano}px;">${obtenerIniciales(nombre)}</div>`;
    };

    container.innerHTML = `
      <!-- Tarjetas de estadísticas compactas (accesos directos a cada sección) -->
      <div class="dashboard-grid">
        <a class="stat-card stat-card--compact stat-card--primary" href="#/solicitudes">
          <div class="stat-card__icon"><i class="fa-solid fa-file-circle-plus"></i></div>
          <div class="stat-card__meta">
            <span class="stat-card__value">${solicitudes.length}</span>
            <span class="stat-card__label">${t('total_applications')}</span>
          </div>
          <small class="stat-card__hint" title="${conteoEstados}"><i class="fa-solid fa-clock"></i> ${solicitudesPendientes} ${t('pending').toLowerCase()}</small>
        </a>
        <a class="stat-card stat-card--compact stat-card--accent" href="#/empresas">
          <div class="stat-card__icon"><i class="fa-solid fa-building"></i></div>
          <div class="stat-card__meta">
            <span class="stat-card__value">${empresasActivas}</span>
            <span class="stat-card__label">${t('active_companies')}</span>
          </div>
          <small class="stat-card__hint"><i class="fa-solid fa-arrow-up-right-from-square"></i></small>
        </a>
        <a class="stat-card stat-card--compact stat-card--success" href="#/cumplimiento">
          <div class="stat-card__icon"><i class="fa-solid fa-chart-line"></i></div>
          <div class="stat-card__meta">
            <span class="stat-card__value">${avgCumplimiento}%</span>
            <span class="stat-card__label">${t('average_compliance')}</span>
          </div>
          <div class="progress-bar stat-card__bar">
            <div class="progress-bar__fill progress-bar__fill--${colorCumplimiento(avgCumplimiento)}" style="width: ${avgCumplimiento}%;"></div>
          </div>
        </a>
        <a class="stat-card stat-card--compact stat-card--error" href="#/alertas">
          <div class="stat-card__icon"><i class="fa-solid fa-bell"></i></div>
          <div class="stat-card__meta">
            <span class="stat-card__value">${alertasAbiertas}</span>
            <span class="stat-card__label">${t('open_alerts')}</span>
          </div>
          <small class="stat-card__hint"><i class="fa-solid fa-circle-info"></i></small>
        </a>
      </div>

      <!-- Secciones inferiores: cards compactos agrupados -->
      <div class="dashboard-sections">
        <!-- Solicitudes recientes -->
        <div class="card dash-card">
          <div class="section-header">
            <h2>${t('recent_applications')} <span class="dash-chip">${recientes.length}</span></h2>
            <a href="#/solicitudes" class="btn btn-ghost btn-sm">${t('view_all')} <i class="fa-solid fa-arrow-right" style="font-size: 10px;"></i></a>
          </div>
          <div class="dash-list">
          ${recientes.length > 0 ? recientes.map(sol => {
            const empresa = empresas.find(e => e.id === sol.empresaId);
            const estado = estadoSolicitudBadge(sol.estado);
            const ia = sol.clasificacionIa;
            return `
              <div class="activity-item dash-list__item" style="cursor: pointer;" data-sol-id="${sol.id}">
                ${avatarEmpresa(empresa?.nombre || '?')}
                <div style="flex: 1; min-width: 0;">
                  <div class="activity-text"><strong>${empresa?.nombre || '—'}</strong> · ${tipoSolicitudTexto(sol.tipo)}</div>
                  <div class="activity-time">#${sol.id} · ${tiempoRelativo(sol.fechaSolicitud)}</div>
                </div>
                ${ia ? `<span class="dash-score dash-score--${colorAfinidad(ia.puntajeAfinidad)}" title="${t('affinity_score')}">${ia.puntajeAfinidad}</span>` : ''}
                <span class="badge ${estado.clase}" style="font-size: 10px; flex-shrink: 0;">${estado.texto}</span>
              </div>
            `;
          }).join('') : `<p style="color: var(--text-muted); font-size: var(--text-sm); padding: var(--space-4);">${t('no_recent_applications')}</p>`}
          </div>
        </div>

        <!-- Empresas en riesgo -->
        <div class="card dash-card">
          <div class="section-header">
            <h2>${t('risk_companies')} <span class="dash-chip dash-chip--error">${empresasRiesgo.length}</span></h2>
            <a href="#/cumplimiento" class="btn btn-ghost btn-sm">${t('see_compliance')} <i class="fa-solid fa-arrow-right" style="font-size: 10px;"></i></a>
          </div>
          <div class="dash-list">
          ${empresasRiesgo.length > 0 ? empresasRiesgo.map(emp => {
            const color = colorCumplimiento(emp.porcentajeCumplimiento);
            const critico = emp.porcentajeCumplimiento < UMBRALES_CUMPLIMIENTO.CRITICO;
            return `
              <div class="activity-item dash-list__item" style="cursor: pointer;" data-empresa-id="${emp.id}">
                ${avatarEmpresa(emp.nombre)}
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: var(--text-sm); font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${emp.nombre}</div>
                  <div class="progress-bar" style="height: 4px; margin-top: var(--space-1);">
                    <div class="progress-bar__fill progress-bar__fill--${color}" style="width: ${emp.porcentajeCumplimiento}%;"></div>
                  </div>
                </div>
                <span style="font-family: var(--font-heading); font-weight: 700; font-size: var(--text-sm); color: var(--${color}); flex-shrink: 0;">${emp.porcentajeCumplimiento}%</span>
                <span class="badge ${critico ? 'badge-error' : 'badge-warning'}" style="font-size: 10px; flex-shrink: 0;">${nivelRiesgoTexto(critico ? 'Alto' : 'Medio')}</span>
              </div>
            `;
          }).join('') : `<p style="color: var(--text-muted); font-size: var(--text-sm); padding: var(--space-4);">${t('no_risk_companies')}</p>`}
          </div>
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

    // Click en solicitudes / empresas de riesgo navega al detalle
    container.querySelectorAll('[data-sol-id]').forEach(item => {
      item.addEventListener('click', () => { window.location.hash = '#/solicitudes'; });
    });
    container.querySelectorAll('[data-empresa-id]').forEach(item => {
      item.addEventListener('click', () => { window.location.hash = '#/empresas'; });
    });

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
