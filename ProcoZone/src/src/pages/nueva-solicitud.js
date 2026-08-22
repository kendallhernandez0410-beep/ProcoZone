import { http } from '../services/http-client.js';
import { toast } from '../services/notificacion-service.js';
import { clasificarSolicitud } from '../src/services/ia-service.js';
import { obtenerSesion } from '../utils/auth.js';
import { t, tf } from '../utils/translations.js';
import { ACTIVIDADES_ECONOMICAS, textoCatalogo } from '../utils/constantes.js';

const campo = (id, etiqueta, tipo = 'text', extra = '') => `<div class="form-group"><label class="form-label" for="${id}">${etiqueta} *</label><input class="form-input" id="${id}" type="${tipo}" ${extra} required><span class="form-error" id="error-${id}"></span></div>`;

export async function render() {
  try {
    const [empresas, zonas] = await Promise.all([http.get('empresas'), http.get('zonasFrancas')]);
    const sesion = obtenerSesion();
    const disponibles = empresas.filter((empresa) => empresa.estado !== 'Suspendida');
    return `<div class="page-enter"><div style="margin-bottom:var(--space-6)"><h1>${t('new_request_title')}</h1><p>${t('new_request_intro')}</p></div><form id="formSolicitud" novalidate>
      <div class="form-section"><div class="form-section-title">${t('company_and_destination')}</div><div class="form-grid">
        <div class="form-group"><label class="form-label" for="empresaId">${t('company_label')}</label><select class="form-select" id="empresaId" required><option value="">${t('select_company_option')}</option>${disponibles.map((empresa) => `<option value="${empresa.id}" data-cedula="${empresa.cedulaJuridica}">${empresa.nombre}</option>`).join('')}</select><span class="form-error" id="error-empresaId"></span></div>
        <div class="form-group"><label class="form-label" for="cedulaJuridica">${t('legal_id_label')}</label><input class="form-input" id="cedulaJuridica" readonly placeholder="${t('legal_id_autofill')}"><span class="form-error" id="error-cedulaJuridica"></span></div>
        <div class="form-group"><label class="form-label" for="zonaFrancaId">${t('destination_zone')}</label><select class="form-select" id="zonaFrancaId" required><option value="">${t('select_zone')}</option>${zonas.map((zona) => `<option value="${zona.id}">${zona.nombre}</option>`).join('')}</select><span class="form-error" id="error-zonaFrancaId"></span></div>
        <div class="form-group"><label class="form-label" for="sector">${t('sector_label')}</label><select class="form-select" id="sector" required disabled><option value="">${t('select_zone_first')}</option></select><span class="form-error" id="error-sector"></span></div>
      </div></div>
      <div class="form-section"><div class="form-section-title">${t('request_projection')}</div><div class="form-grid">
        <div class="form-group"><label class="form-label" for="tipo">${t('request_type_label')}</label><select class="form-select" id="tipo" required><option value="">${t('select_type')}</option><option value="instalacion">${t('type_installation')}</option><option value="expansion">${t('type_expansion')}</option></select><span class="form-error" id="error-tipo"></span></div>
        <div class="form-group"><label class="form-label" for="tipoActividad">${t('activity_type')} *</label><select class="form-select" id="tipoActividad" required><option value="">${t('select_activity')}</option>${ACTIVIDADES_ECONOMICAS.map((actividad) => `<option value="${actividad}">${textoCatalogo(actividad)}</option>`).join('')}</select><span class="form-error" id="error-tipoActividad"></span></div>${campo('areaSolicitada', t('requested_area'), 'number', 'min="1"')}${campo('inversionEstimada', t('projected_investment'), 'number', 'min="1"')}${campo('empleosNuevos', t('new_jobs'), 'number', 'min="1"')}${campo('exportacionesProyectadas', t('projected_exports'), 'number', 'min="0" max="100"')}${campo('reportesOportunosComprometidos', t('committed_timely_reports'), 'number', 'min="0" max="100" value="100"')}
        <div class="form-group form-group--full"><label class="form-label" for="descripcion">${t('description_label')}</label><textarea class="form-textarea" id="descripcion" rows="3" required></textarea><span class="form-error" id="error-descripcion"></span></div>
      </div></div><div style="display:flex;gap:var(--space-3);justify-content:flex-end"><a class="btn btn-outline" href="#/solicitudes">${t('cancel')}</a><button class="btn btn-primary btn-lg" id="btnSubmit">${t('send_evaluate_ai')}</button></div></form></div>`;
  } catch (error) {
    return `<div class="empty-state"><h2>${t('form_load_error')}</h2><p>${t('check_connection')}</p><button class="btn btn-primary" onclick="location.reload()">${t('retry')}</button></div>`;
  }
}

export function init() {
  const form = document.getElementById('formSolicitud');
  if (!form) return;
  const empresa = document.getElementById('empresaId'); const cedula = document.getElementById('cedulaJuridica'); const zona = document.getElementById('zonaFrancaId'); const sector = document.getElementById('sector');
  const actualizarCedula = () => { cedula.value = empresa.selectedOptions[0]?.dataset.cedula || ''; };
  actualizarCedula(); empresa.addEventListener('change', actualizarCedula);
  // Intentar escribir/clic en la cédula sin empresa seleccionada → aviso abajo a la derecha
  const avisarSeleccionEmpresa = () => {
    if (!empresa.value) toast.warning(t('select_company_first_title'), t('select_company_first_msg'));
  };
  ['click', 'focus', 'keydown'].forEach((evento) => cedula.addEventListener(evento, avisarSeleccionEmpresa));
  zona.addEventListener('change', async () => {
    try {
      const seleccionada = (await http.getById('zonasFrancas', zona.value));
      sector.disabled = false;
      sector.innerHTML = `<option value="">${t('select_sector')}</option>${seleccionada.sectoresPermitidos.map((nombre) => `<option value="${nombre}">${nombre}</option>`).join('')}`;
    } catch { toast.error(t('error_title'), t('sectors_load_error')); }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); document.querySelectorAll('.form-error').forEach((el) => { el.textContent = ''; });
    const valor = (id) => document.getElementById(id).value.trim();
    const numero = (id) => Number(document.getElementById(id).value);
    const ids = ['empresaId', 'zonaFrancaId', 'sector', 'tipo', 'tipoActividad', 'areaSolicitada', 'inversionEstimada', 'empleosNuevos', 'exportacionesProyectadas', 'reportesOportunosComprometidos', 'descripcion'];
    const vacios = ids.filter((id) => !valor(id));
    let valido = vacios.length === 0;
    vacios.forEach((id) => { document.getElementById(`error-${id}`).textContent = t('required_field'); });
    if (valor('descripcion') && valor('descripcion').length < 20) { document.getElementById('error-descripcion').textContent = t('desc_min_length'); valido = false; }
    ['areaSolicitada', 'inversionEstimada', 'empleosNuevos'].forEach((id) => { if (valor(id) && !(numero(id) > 0)) { document.getElementById(`error-${id}`).textContent = t('invalid_number'); valido = false; } });
    ['exportacionesProyectadas', 'reportesOportunosComprometidos'].forEach((id) => { if (valor(id) && !(numero(id) >= 0 && numero(id) <= 100)) { document.getElementById(`error-${id}`).textContent = t('invalid_range'); valido = false; } });
    if (!valido) { toast.warning(t('incomplete_fields_title'), t('incomplete_fields_msg')); return; }
    const seleccionada = empresa.selectedOptions[0];
    const detalles = { tipoActividad: valor('tipoActividad'), areaSolicitada: numero('areaSolicitada'), inversionEstimada: numero('inversionEstimada'), empleosNuevos: numero('empleosNuevos') };
    const nueva = { empresaId: Number(empresa.value), cedulaJuridica: seleccionada.dataset.cedula, zonaFrancaId: Number(zona.value), sector: sector.value, tipo: document.getElementById('tipo').value, descripcion: valor('descripcion'), fechaSolicitud: new Date().toISOString().slice(0, 10), estado: 'en_revision', clasificacionIa: null, compromisos: { ...detalles, exportacionesProyectadas: numero('exportacionesProyectadas'), reportesOportunosComprometidos: numero('reportesOportunosComprometidos') }, detalles, observaciones: '' };
    const boton = document.getElementById('btnSubmit'); boton.disabled = true; boton.innerHTML = `<span class="spinner spinner-sm"></span> ${t('saving_evaluating')}`;
    try {
      const creada = await http.post('solicitudes', nueva);
      // Notificación al equipo de analistas: solicitud entró en revisión
      await http.post('alertas', {
        empresaId: nueva.empresaId,
        solicitudId: creada.id,
        tipo: 'info',
        titulo: t('alert_new_request_title'),
        descripcion: `${seleccionada.textContent.trim()} ${tf('alert_new_request_desc', creada.id)}`,
        fechaCreacion: nueva.fechaSolicitud,
        estado: 'abierta'
      });
      // La IA evalúa y decide automáticamente (aprobada / rechazada / pendiente por documento)
      const ia = await clasificarSolicitud(creada.id);
      toast.success(t('toast_submitted_title'), `${t('affinity_score')}: ${ia.puntajeAfinidad}/100. ${t('toast_submitted_msg')}`);
      window.location.hash = '#/solicitudes';
    } catch (error) { console.error(error); toast.error(t('evaluation_failed_title'), t('evaluation_failed_msg')); boton.disabled = false; boton.textContent = t('send_evaluate_ai'); }
  });
}
