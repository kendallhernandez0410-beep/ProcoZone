import { http } from '../../services/http-client.js';
import { guardarReporteCumplimiento } from '../../services/cumplimiento-service.js';
import { toast } from '../../services/notificacion-service.js';
import { indicadorEstadoTexto, estadoGeneralTexto } from '../../utils/constantes.js';
import { t } from '../../utils/translations.js';

const entrada = (id, texto, tipo = 'number', extra = '') => `<div class="form-group"><label class="form-label" for="${id}">${texto} *</label><input id="${id}" class="form-input" type="${tipo}" min="0" ${extra} required></div>`;

const nombreIndicador = {
  empleos: 'indicator_employees',
  inversion: 'indicator_investment',
  exportaciones: 'indicator_exports',
  reportesOportunos: 'indicator_timely_reports'
};

function toastNoCompromisos() {
  if (window.Toastify) {
    window.Toastify({
      text: t('no_approved_commitments_msg'),
      duration: 4000,
      gravity: 'top',
      position: 'right',
      style: { background: 'var(--warning, #E8A838)', color: '#1A1D27' }
    }).showToast();
  } else {
    toast.warning(t('no_approved_commitments_title'), t('no_approved_commitments_msg'));
  }
}

/** Últimos 8 trimestres (más reciente primero) para el selector de período */
function generarPeriodos() {
  const ahora = new Date();
  const periodos = [];
  for (let i = 0; i < 8; i++) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i * 3, 1);
    periodos.push(`${fecha.getFullYear()}-Q${Math.floor(fecha.getMonth() / 3) + 1}`);
  }
  return periodos;
}

export function render() {
  return `<div id="cumplimientoPage" class="page-enter"><div class="loading-overlay"><span class="spinner"></span>${t('loading_reports')}</div></div>`;
}

export async function init() {
  const container = document.getElementById('cumplimientoPage');
  async function cargar() {
    try {
      const [empresas, solicitudes, reportes] = await Promise.all([http.get('empresas'), http.get('solicitudes'), http.get('reportesCumplimiento')]);
      const aprobadas = solicitudes.filter((solicitud) => solicitud.estado === 'aprobada');
      container.innerHTML = `<div class="section-header"><div><h1>${t('compliance_reports')}</h1><p>${t('report_intro')}</p></div></div><div class="card" style="margin-bottom:var(--space-6)"><form id="reporteForm" class="form-grid" novalidate><div class="form-group"><label class="form-label" for="reporteEmpresa">${t('approved_company')}</label><select id="reporteEmpresa" class="form-select" required><option value="">${t('select_company')}</option>${aprobadas.map((solicitud) => { const empresa = empresas.find((item) => item.id === solicitud.empresaId); return empresa ? `<option value="${empresa.id}" data-solicitud="${solicitud.id}">${empresa.nombre}</option>` : ''; }).join('')}</select></div><div class="form-group"><label class="form-label" for="periodo">${t('period')}</label><select id="periodo" class="form-select" required>${generarPeriodos().map((periodo, indice) => `<option value="${periodo}" ${indice === 0 ? 'selected' : ''}>${periodo}</option>`).join('')}</select></div>${entrada('empleosReales', t('real_employees'))}${entrada('inversionEjecutada', t('executed_investment'))}${entrada('exportaciones', t('exports_pct'), 'number', 'max="100"')}${entrada('reportesOportunos', t('timely_reports_pct'), 'number', 'max="100"')}<div class="form-group form-group--full"><button class="btn btn-primary" id="guardarReporte">${t('save_report')}</button></div></form></div><h2>${t('consolidated_summary')}</h2><div class="cumplimiento-grid">${reportes.map((reporte) => { const empresa = empresas.find((item) => item.id === reporte.empresaId); const indicadores = Object.entries(reporte.indicadores || {}).map(([nombre, indicador]) => `<li>${t(nombreIndicador[nombre] ?? '') || nombre}: <strong>${indicadorEstadoTexto(indicador.estado)}</strong> (${indicador.actual}/${indicador.requerido})</li>`).join(''); return `<article class="card"><h3>${empresa?.nombre || t('th_company')}</h3><p><strong>${reporte.porcentajeCumplimiento}%</strong> — ${estadoGeneralTexto(reporte.estadoGeneral)}</p><ul>${indicadores}</ul></article>`; }).join('') || `<p>${t('no_reports')}</p>`}</div>`;

      // Si la empresa seleccionada no autocompleta compromisos (sin solicitud aprobada), avisar con Toastify
      document.getElementById('reporteEmpresa').addEventListener('change', (event) => {
        const seleccion = event.target.selectedOptions[0];
        if (!seleccion || !seleccion.value || !seleccion.dataset.solicitud) {
          toastNoCompromisos();
        }
      });

      document.getElementById('reporteForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!event.target.checkValidity()) { event.target.reportValidity(); return; }
        const seleccion = document.getElementById('reporteEmpresa').selectedOptions[0];
        const solicitud = solicitudes.find((item) => item.id === Number(seleccion.dataset.solicitud));
        const empresa = empresas.find((item) => item.id === Number(seleccion.value));
        if (!solicitud || !empresa) { toastNoCompromisos(); return; }
        const boton = document.getElementById('guardarReporte');
        boton.disabled = true;
        boton.innerHTML = `<span class="spinner spinner-sm"></span> ${t('evaluating')}`;
        try {
          const resultado = await guardarReporteCumplimiento({ periodo: document.getElementById('periodo').value.trim(), empleosReales: document.getElementById('empleosReales').value, inversionEjecutada: document.getElementById('inversionEjecutada').value, exportaciones: document.getElementById('exportaciones').value, reportesOportunos: document.getElementById('reportesOportunos').value }, empresa, solicitud);
          toast.success(resultado.reporte.estadoGeneral === 'en_regla' ? t('report_saved_ok') : t('report_with_alerts'), resultado.alertasCreadas ? `${resultado.alertasCreadas} ${t('alerts_created')}` : t('no_alerts_created'));
          await cargar();
        } catch (error) {
          console.error(error);
          toast.error(t('report_save_error'), error.message || t('try_again'));
          boton.disabled = false;
          boton.textContent = t('save_report');
        }
      });
    } catch (error) {
      console.error(error);
      container.innerHTML = `<div class="empty-state"><h2>${t('reports_load_error')}</h2><button id="retryReportes" class="btn btn-primary">${t('retry')}</button></div>`;
      document.getElementById('retryReportes').addEventListener('click', cargar);
    }
  }
  await cargar();
}
