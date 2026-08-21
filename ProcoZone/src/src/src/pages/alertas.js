/* ============================================
   ProcoZone — Página de Alertas
   Lista de alertas con filtros y acciones
   ============================================ */
import { http } from '../../services/http-client.js';
import { renderLoading, renderError } from '../components/estado-carga.js';
import { formatearFecha, tiempoRelativo, colorDesdeString, obtenerIniciales } from '../../utils/formateador.js';
import { ALERTA_BADGE, alertaTipoTexto, alertaEstadoTexto } from '../../utils/constantes.js';
import { toast } from '../../services/notificacion-service.js';
import { esAnalista, esAdmin, esEmpresa, obtenerSesion } from '../../utils/auth.js';
import { t } from '../../utils/translations.js';

let destroyFn = null;
let filtroAlerta = 'todas';

export async function render() {
  return `
    <div class="page-enter" id="alertasPage">
      ${renderLoading(t('loading_alerts'))}
    </div>
  `;
}

export async function init() {
  const container = document.getElementById('alertasPage');
  if (!container) return;

  let alertas = [];
  let empresas = [];

  async function cargarAlertas() {
    try {
      [alertas, empresas] = await Promise.all([
        http.get('alertas'),
        http.get('empresas')
      ]);
      if (esEmpresa()) {
        const empresaId = obtenerSesion()?.empresaId;
        alertas = alertas.filter(alerta => alerta.empresaId === empresaId);
        empresas = empresas.filter(empresa => empresa.id === empresaId);
      }
      renderAlertas();
    } catch (error) {
      container.innerHTML = renderError(error.message, () => cargarAlertas());
      container.querySelector('button')?.addEventListener('click', () => cargarAlertas());
    }
  }

  function renderAlertas() {
    const filtradas = filtroAlerta === 'todas'
      ? alertas
      : alertas.filter(a => a.tipo === filtroAlerta);

    const contar = (tipo) => alertas.filter(a => a.tipo === tipo).length;

    container.innerHTML = `
      <div style="margin-bottom: var(--space-6);">
        <h1 style="font-size: var(--text-2xl); margin-bottom: var(--space-2);">${t('alerts')}</h1>
        <p style="color: var(--text-muted); font-size: var(--text-sm);">${t('alerts_description')}</p>
      </div>

      <div class="solicitudes-filtros" style="margin-bottom: var(--space-6);">
        <button class="filtro-btn ${filtroAlerta === 'todas' ? 'active' : ''}" data-filtro="todas">${t('all')} (${alertas.length})</button>
        <button class="filtro-btn ${filtroAlerta === 'critica' ? 'active' : ''}" data-filtro="critica">${t('critical')} (${contar('critica')})</button>
        <button class="filtro-btn ${filtroAlerta === 'warning' ? 'active' : ''}" data-filtro="warning">${t('warnings')} (${contar('warning')})</button>
        <button class="filtro-btn ${filtroAlerta === 'info' ? 'active' : ''}" data-filtro="info">${t('info')} (${contar('info')})</button>
      </div>

      <div class="alertas-list">
        ${filtradas.length > 0 ? filtradas.map(alerta => {
          const empresa = empresas.find(e => e.id === alerta.empresaId);
          const estadoTexto = alertaEstadoTexto(alerta.estado);
          const estadoBadge = alerta.estado === 'abierta' ? 'badge-error' :
            alerta.estado === 'en_proceso' ? 'badge-warning' : 'badge-neutral';

          const icono = alerta.tipo === 'critica' ? 'fa-circle-exclamation' :
            alerta.tipo === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info';

          return `
            <div class="alerta-card alerta-card--${alerta.tipo}">
              <div class="alerta-card__icon">
                <i class="fa-solid ${icono}"></i>
              </div>
              <div class="alerta-card__body">
                <div class="alerta-card__titulo">${alerta.titulo}</div>
                <div class="alerta-card__desc">${alerta.descripcion}</div>
                <div class="alerta-card__footer">
                  <span><i class="fa-solid fa-building" style="margin-right: 4px;"></i>${empresa?.nombre || '—'}</span>
                  <span><i class="fa-regular fa-calendar" style="margin-right: 4px;"></i>${formatearFecha(alerta.fechaCreacion)} (${tiempoRelativo(alerta.fechaCreacion)})</span>
                  <span class="badge ${estadoBadge}">${estadoTexto}</span>
                </div>
              </div>
              <div class="alerta-card__actions">
                ${!esAnalista() && !esAdmin() ? `<span class="badge badge-info">${t('readonly_badge')}</span>` : `
                ${alerta.estado === 'abierta' ? `
                  <button class="btn btn-sm btn-outline btn-atender" data-id="${alerta.id}">
                    <i class="fa-solid fa-eye"></i> ${t('attend')}
                  </button>
                ` : alerta.estado === 'en_proceso' ? `
                  <button class="btn btn-sm btn-success btn-cerrar-alerta" data-id="${alerta.id}">
                    <i class="fa-solid fa-check"></i> ${t('close_alert')}
                  </button>
                ` : `
                  <span class="badge badge-neutral"><i class="fa-solid fa-check" style="margin-right: 4px;"></i>${t('resolved')}</span>
                `}
                `}
              </div>
            </div>
          `;
        }).join('') : `
          <div class="empty-state">
            <i class="fa-solid fa-bell-slash"></i>
            <h3>${t('no_alerts')}</h3>
            <p>${t('no_alerts_message')}</p>
          </div>
        `}
      </div>
    `;

    // Bind filtros
    container.querySelectorAll('.filtro-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filtroAlerta = btn.dataset.filtro;
        renderAlertas();
      });
    });

    // Bind atender
    container.querySelectorAll('.btn-atender').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        try {
          await http.patch('alertas', id, { estado: 'en_proceso' });
          toast.info(t('alert_attended_title'), t('alert_attended_msg'));
          await cargarAlertas();
        } catch (error) {
          toast.error(t('error_title'), t('error_update_alert'));
        }
      });
    });

    // Bind cerrar
    container.querySelectorAll('.btn-cerrar-alerta').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        try {
          await http.patch('alertas', id, { estado: 'cerrada' });
          toast.success(t('alert_closed_title'), t('alert_closed_msg'));
          await cargarAlertas();
        } catch (error) {
          toast.error(t('error_title'), t('error_close_alert'));
        }
      });
    });
  }

  await cargarAlertas();
}

export function destroy() {
  if (destroyFn) destroyFn();
}