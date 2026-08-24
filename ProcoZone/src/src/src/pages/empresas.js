/* ============================================
   ProcoZone — Página de Empresas
   Tabla con búsqueda y detalle en modal
   ============================================ */
import { http } from '../../services/http-client.js';
import { renderLoading, renderError, renderSkeletonRows } from '../components/estado-carga.js';
import { formatearFecha, formatearNumero, formatearMoneda, colorCumplimiento, colorDesdeString, obtenerIniciales } from '../../utils/formateador.js';
import { EMPRESA_ESTADO_BADGE, empresaEstadoTexto, textoCatalogo } from '../../utils/constantes.js';
import { toast } from '../../services/notificacion-service.js';
import { t } from '../../utils/translations.js';

let destroyFn = null;

export async function render() {
  return `
    <div class="page-enter" id="empresasPage">
      ${renderLoading(t('loading_companies'))}
    </div>
  `;
}

export async function init() {
  const container = document.getElementById('empresasPage');
  if (!container) return;

  let empresas = [];
  let terminoBusqueda = '';

  async function cargarEmpresas() {
    try {
      container.innerHTML = renderSkeletonRows(4, 5);
      empresas = await http.get('empresas');
      renderEmpresas();
    } catch (error) {
      container.innerHTML = renderError(error.message, () => cargarEmpresas());
      container.querySelector('button')?.addEventListener('click', () => cargarEmpresas());
    }
  }

  function renderEmpresas() {
    const filtradas = terminoBusqueda
      ? empresas.filter(e =>
          e.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
          String(e.cedulaJuridica || '').includes(terminoBusqueda)
        )
      : empresas;

    container.innerHTML = `
      <div class="empresas-header">
        <h1>${t('companies')}</h1>
        <div class="search-box">
          <span class="search-box__icon"><i class="fa-solid fa-magnifying-glass"></i></span>
          <input type="text" class="search-box__input" id="searchEmpresas" placeholder="${t('search_companies')}" value="${terminoBusqueda}" />
        </div>
      </div>

      ${filtradas.length > 0 ? `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>${t('th_company')}</th>
                <th>${t('th_free_zone')}</th>
                <th>${t('th_category')}</th>
                <th>${t('th_status')}</th>
                <th>${t('th_employees')}</th>
                <th>${t('th_compliance')}</th>
              </tr>
            </thead>
            <tbody>
              ${filtradas.map(emp => {
                const color = colorCumplimiento(emp.porcentajeCumplimiento);
                const bgAvatar = colorDesdeString(emp.nombre);
                return `
                  <tr class="empresa-row" data-empresa-id="${emp.id}">
                    <td>
                      <div class="empresa-nombre">
                        <div class="empresa-avatar" style="background: ${bgAvatar}22; color: ${bgAvatar};">${obtenerIniciales(emp.nombre)}</div>
                        <div>
                          <div style="font-weight: 500; color: var(--text);">${emp.nombre}</div>
                          <div style="font-size: var(--text-xs); color: var(--text-muted);">${emp.cedulaJuridica}</div>
                        </div>
                      </div>
                    </td>
                    <td>${emp.zonaFranca}</td>
                    <td>${textoCatalogo(emp.categoria)}</td>
                    <td><span class="badge ${EMPRESA_ESTADO_BADGE[emp.estado]}">${empresaEstadoTexto(emp.estado)}</span></td>
                    <td>${formatearNumero(emp.empleados)}</td>
                    <td>
                      <div class="empresa-cumplimiento">
                        <div class="empresa-cumplimiento__bar">
                          <div class="progress-bar" style="height: 6px;">
                            <div class="progress-bar__fill progress-bar__fill--${color}" style="width: ${emp.porcentajeCumplimiento}%;"></div>
                          </div>
                        </div>
                        <span class="empresa-cumplimiento__valor" style="color: var(--${color});">${emp.porcentajeCumplimiento}%</span>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state">
          <i class="fa-solid fa-building"></i>
          <h3>${t('no_companies')}</h3>
          <p>${t('no_companies_message')}</p>
        </div>
      `}
    `;

    // Bind búsqueda con debounce
    const searchInput = document.getElementById('searchEmpresas');
    let timeout;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        terminoBusqueda = e.target.value;
        renderEmpresas();
      }, 300);
    });

    // Bind click en filas
    container.querySelectorAll('.empresa-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = parseInt(row.dataset.empresaId);
        const emp = empresas.find(e => e.id === id);
        if (emp) abrirDetalleEmpresa(emp);
      });
    });
  }

  function abrirDetalleEmpresa(emp) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const color = colorCumplimiento(emp.porcentajeCumplimiento);
    const bgAvatar = colorDesdeString(emp.nombre);

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="modalOverlay"></div>
      <div class="modal-content" style="max-width: 680px;">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <div class="empresa-avatar" style="background: ${bgAvatar}22; color: ${bgAvatar}; width: 42px; height: 42px; font-size: var(--text-base);">${obtenerIniciales(emp.nombre)}</div>
            <h3>${emp.nombre}</h3>
          </div>
          <button class="modal-close" id="modalClose" aria-label="${t('close')}"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div style="display: flex; gap: var(--space-3); margin-bottom: var(--space-5);">
            <span class="badge ${EMPRESA_ESTADO_BADGE[emp.estado]}">${empresaEstadoTexto(emp.estado)}</span>
            <span class="badge badge-neutral">${textoCatalogo(emp.categoria)}</span>
          </div>

          <div class="empresa-detalle">
            <div class="empresa-detalle__info">
              <div class="detalle-grid">
                <div class="detalle-item"><span class="detalle-item__label">${t('lbl_legal_id')}</span><span class="detalle-item__value">${emp.cedulaJuridica}</span></div>
                <div class="detalle-item"><span class="detalle-item__label">${t('lbl_free_zone')}</span><span class="detalle-item__value">${emp.zonaFranca}</span></div>
                <div class="detalle-item"><span class="detalle-item__label">${t('lbl_registration_date')}</span><span class="detalle-item__value">${formatearFecha(emp.fechaRegistro)}</span></div>
                <div class="detalle-item"><span class="detalle-item__label">${t('lbl_contact')}</span><span class="detalle-item__value">${emp.contactoNombre}</span></div>
                <div class="detalle-item"><span class="detalle-item__label">${t('lbl_email')}</span><span class="detalle-item__value">${emp.contactoEmail}</span></div>
                <div class="detalle-item"><span class="detalle-item__label">${t('lbl_phone')}</span><span class="detalle-item__value">${emp.contactoTelefono}</span></div>
              </div>
            </div>
            <div class="empresa-detalle__metricas">
              <div class="metrica-card">
                <div class="metrica-card__valor" style="color: var(--${color});">${emp.porcentajeCumplimiento}%</div>
                <div class="metrica-card__label">${t('lbl_compliance')}</div>
              </div>
              <div class="metrica-card">
                <div class="metrica-card__valor">${formatearNumero(emp.empleados)}</div>
                <div class="metrica-card__label">${t('lbl_employees')}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="modalCloseBtn">${t('close')}</button>
        </div>
      </div>
    `;

    modalContainer.classList.add('active');
    document.getElementById('modalOverlay')?.addEventListener('click', cerrarModalEmpresa);
    document.getElementById('modalClose')?.addEventListener('click', cerrarModalEmpresa);
    document.getElementById('modalCloseBtn')?.addEventListener('click', cerrarModalEmpresa);
  }

  function cerrarModalEmpresa() {
    const mc = document.getElementById('modal-container');
    if (mc) { mc.classList.remove('active'); mc.innerHTML = ''; }
  }

  destroyFn = () => cerrarModalEmpresa();

  await cargarEmpresas();
}

export function destroy() {
  if (destroyFn) destroyFn();
}
