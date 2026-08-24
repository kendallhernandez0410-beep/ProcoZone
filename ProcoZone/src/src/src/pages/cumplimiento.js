import { http } from '../../services/http-client.js';
import { guardarReporteCumplimiento } from '../../services/cumplimiento-service.js';
import { toast } from '../../services/notificacion-service.js';
import { t } from '../../utils/translations.js';

const entrada = (id, texto, extra = '') => `<div class="form-group"><label class="form-label" for="${id}">${texto} *</label><input id="${id}" class="form-input" type="number" min="0" step="1" inputmode="numeric" autocomplete="off" ${extra} required></div>`;

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

/** Advertencia única por interacción: el servicio deduplica avisos idénticos */
function toastNoCompromisos() {
  toast.warning(t('no_approved_commitments_title'), t('no_approved_commitments_msg'));
}

/** Lee un indicador tolerando las claves usadas por reportes antiguos y nuevos */
function leerIndicador(reporte, claves) {
  return claves.map((clave) => reporte.indicadores?.[clave]).find(Boolean) || null;
}

function celdaIndicador(indicador) {
  return indicador ? `${indicador.actual} / ${indicador.requerido}` : '—';
}

function cumple(reporte) {
  return reporte.estadoGeneral ? reporte.estadoGeneral === 'en_regla' : Number(reporte.porcentajeCumplimiento) === 100;
}

function filaHtml(reporte, empresa) {
  const empleos = leerIndicador(reporte, ['empleos', 'empleoNacional']);
  const inversion = leerIndicador(reporte, ['inversion']);
  const exportaciones = leerIndicador(reporte, ['exportaciones']);
  const oportunos = leerIndicador(reporte, ['reportesOportunos']);
  const ok = cumple(reporte);
  return `<tr class="${ok ? 'fila-ok' : 'fila-mala'}">
    <td>${empresa?.nombre || t('th_company')}</td>
    <td>${reporte.periodo || '—'}</td>
    <td>${reporte.fechaReporte || '—'}</td>
    <td class="num">${celdaIndicador(empleos)}</td>
    <td class="num">${celdaIndicador(inversion)}</td>
    <td class="num">${celdaIndicador(exportaciones)}</td>
    <td class="num">${celdaIndicador(oportunos)}</td>
    <td class="num"><strong>${Number(reporte.porcentajeCumplimiento || 0)}%</strong></td>
    <td><span class="badge-cumple ${ok ? 'badge-cumple--si' : 'badge-cumple--no'}">${ok ? t('cumple_si') : t('cumple_no')}</span></td>
  </tr>`;
}

function exportarCsv(filas) {
  const escapar = (valor) => `"${String(valor).replace(/"/g, '""')}"`;
  const encabezados = [t('th_company'), t('period'), t('th_fecha_registro'), t('real_employees'), t('executed_investment'), t('exports_pct'), t('timely_reports_pct'), t('th_cumplimiento'), t('th_cumple')];
  const csv = '\uFEFF' + [encabezados, ...filas].map((fila) => fila.map(escapar).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const enlace = Object.assign(document.createElement('a'), { href: url, download: `reportes-cumplimiento-${new Date().toISOString().slice(0, 10)}.csv` });
  enlace.click();
  URL.revokeObjectURL(url);
}

export function render() {
  return `<div id="cumplimientoPage" class="page-enter"><div class="loading-overlay"><span class="spinner"></span>${t('loading_reports')}</div></div>`;
}

export async function init() {
  const container = document.getElementById('cumplimientoPage');
  async function cargar() {
    try {
      const [empresas, solicitudes, reportes] = await Promise.all([http.get('empresas'), http.get('solicitudes'), http.get('reportesCumplimiento')]);
      // Listado completo de empresas registradas (sin suspensas); la solicitud aprobada
      // se adjunta como data-solicitud cuando existe, para habilitar la evaluación
      const disponibles = empresas.filter((empresa) => empresa.estado !== 'Suspendida');
      const opcionesEmpresa = disponibles.map((empresa) => {
        const aprobada = solicitudes.find((solicitud) => solicitud.estado === 'aprobada' && solicitud.empresaId === empresa.id);
        return `<option value="${empresa.id}"${aprobada ? ` data-solicitud="${aprobada.id}"` : ''}>${empresa.nombre}</option>`;
      }).join('');

      const cuerpoTabla = reportes.length
        ? reportes.map((reporte) => filaHtml(reporte, empresas.find((item) => item.id === reporte.empresaId))).join('')
        : `<tr><td colspan="9" style="text-align:center;padding:var(--space-6);color:var(--text-muted)">${t('no_alerts_created')}</td></tr>`;
      const filasCsv = reportes.map((reporte) => {
        const empresa = empresas.find((item) => item.id === reporte.empresaId);
        const indicador = (claves) => { const dato = leerIndicador(reporte, claves); return dato ? `${dato.actual} / ${dato.requerido}` : '—'; };
        return [empresa?.nombre || t('th_company'), reporte.periodo || '—', reporte.fechaReporte || '—', indicador(['empleos', 'empleoNacional']), indicador(['inversion']), indicador(['exportaciones']), indicador(['reportesOportunos']), `${Number(reporte.porcentajeCumplimiento || 0)}%`, cumple(reporte) ? t('cumple_si') : t('cumple_no')];
      });

      container.innerHTML = `
      <div class="section-header"><div><h1>${t('compliance_reports')}</h1><p>${t('report_intro')}</p></div></div>
      <div class="card" style="margin-bottom:var(--space-6)">
        <form id="reporteForm" class="form-grid" novalidate>
          <div class="form-group"><label class="form-label" for="reporteEmpresa">${t('approved_company')}</label><select id="reporteEmpresa" class="form-select" required><option value="">${t('select_company')}</option>${opcionesEmpresa}</select></div>
          <div class="form-group"><label class="form-label" for="periodo">${t('period')}</label><select id="periodo" class="form-select" required>${generarPeriodos().map((periodo, indice) => `<option value="${periodo}" ${indice === 0 ? 'selected' : ''}>${periodo}</option>`).join('')}</select></div>
          ${entrada('empleosReales', t('real_employees'))}
          ${entrada('inversionEjecutada', t('executed_investment'))}
          ${entrada('exportaciones', t('exports_pct'), 'max="100"')}
          ${entrada('reportesOportunos', t('timely_reports_pct'), 'max="100"')}
          <div class="form-group form-group--full">
            <label class="form-label">${t('adjuntar_documento')}</label>
            <label class="file-upload" for="documentoEmpresa">
              <input type="file" id="documentoEmpresa" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg">
              <span class="file-upload__btn"><i class="fa-solid fa-paperclip"></i> ${t('adjuntar_documento')}</span>
              <span class="file-upload__nombre" id="nombreDocumento">${t('sin_archivo')}</span>
            </label>
          </div>
          <div class="form-group form-group--full"><button class="btn btn-primary" id="guardarReporte">${t('save_report')}</button></div>
        </form>
      </div>
      <div class="section-header"><h2>${t('consolidated_summary')}</h2><button type="button" class="btn btn-outline btn-sm" id="btnExportarCsv"><i class="fa-solid fa-file-csv"></i> ${t('export_csv')}</button></div>
      <div class="tabla-excel-wrap">
        <table class="tabla-excel">
          <thead><tr>
            <th>${t('th_company')}</th><th>${t('period')}</th><th>${t('th_fecha_registro')}</th>
            <th class="num">${t('real_employees')}</th><th class="num">${t('executed_investment')}</th><th class="num">${t('exports_pct')}</th><th class="num">${t('timely_reports_pct')}</th>
            <th class="num">${t('th_cumplimiento')}</th><th>${t('th_cumple')}</th>
          </tr></thead>
          <tbody>${cuerpoTabla}</tbody>
        </table>
      </div>`;

      // Mostrar el nombre del archivo seleccionado junto al botón
      document.getElementById('documentoEmpresa').addEventListener('change', (event) => {
        const archivo = event.target.files[0];
        document.getElementById('nombreDocumento').textContent = archivo ? `${archivo.name} (${Math.max(1, Math.round(archivo.size / 1024))} KB)` : t('sin_archivo');
      });

      // Aviso único al elegir una empresa sin solicitud aprobada (o el placeholder)
      document.getElementById('reporteEmpresa').addEventListener('change', (event) => {
        const seleccion = event.target.selectedOptions[0];
        if (!seleccion || !seleccion.value || !seleccion.dataset.solicitud) toastNoCompromisos();
      });

      document.getElementById('btnExportarCsv').addEventListener('click', () => exportarCsv(filasCsv));

      document.getElementById('reporteForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!event.target.checkValidity()) { event.target.reportValidity(); return; }
        const seleccion = document.getElementById('reporteEmpresa').selectedOptions[0];
        const empresa = empresas.find((item) => item.id === Number(seleccion.value));
        const solicitud = solicitudes.find((item) => item.id === Number(seleccion.dataset.solicitud));
        if (!empresa || !solicitud) { toastNoCompromisos(); return; }
        const archivo = document.getElementById('documentoEmpresa').files[0];
        const boton = document.getElementById('guardarReporte');
        boton.disabled = true;
        boton.innerHTML = `<span class="spinner spinner-sm"></span> ${t('evaluating')}`;
        try {
          const resultado = await guardarReporteCumplimiento({
            periodo: document.getElementById('periodo').value.trim(),
            empleosReales: document.getElementById('empleosReales').value,
            inversionEjecutada: document.getElementById('inversionEjecutada').value,
            exportaciones: document.getElementById('exportaciones').value,
            reportesOportunos: document.getElementById('reportesOportunos').value,
            documento: archivo ? { nombre: archivo.name, tipo: archivo.type || 'desconocido', pesoKb: Math.max(1, Math.round(archivo.size / 1024)) } : null
          }, empresa, solicitud);
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
