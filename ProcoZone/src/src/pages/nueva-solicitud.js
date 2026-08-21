import { http } from '../services/http-client.js';
import { toast } from '../services/notificacion-service.js';
import { clasificarSolicitud } from '../src/services/ia-service.js';
import { esConsulta, obtenerSesion } from '../utils/auth.js';

const campo = (id, etiqueta, tipo = 'text', extra = '') => `<div class="form-group"><label class="form-label" for="${id}">${etiqueta} *</label><input class="form-input" id="${id}" type="${tipo}" ${extra} required><span class="form-error" id="error-${id}"></span></div>`;

export async function render() {
  try {
    const [empresas, zonas] = await Promise.all([http.get('empresas'), http.get('zonasFrancas')]);
    const sesion = obtenerSesion();
    const disponibles = empresas.filter((empresa) => empresa.estado !== 'Suspendida');
    return `<div class="page-enter"><div style="margin-bottom:var(--space-6)"><h1>Nueva solicitud de instalación</h1><p>Complete todos los datos para enviarla a la evaluación automática.</p></div><form id="formSolicitud" novalidate>
      <div class="form-section"><div class="form-section-title">Empresa y destino</div><div class="form-grid">
        <div class="form-group"><label class="form-label" for="empresaId">Empresa *</label><select class="form-select" id="empresaId" required><option value="">Seleccione una empresa</option>${disponibles.map((empresa) => `<option value="${empresa.id}" data-cedula="${empresa.cedulaJuridica}">${empresa.nombre}</option>`).join('')}</select><span class="form-error" id="error-empresaId"></span></div>
        <div class="form-group"><label class="form-label" for="cedulaJuridica">Cédula jurídica</label><input class="form-input" id="cedulaJuridica" readonly placeholder="Se completa al elegir empresa"><span class="form-error" id="error-cedulaJuridica"></span></div>
        <div class="form-group"><label class="form-label" for="zonaFrancaId">Zona franca destino *</label><select class="form-select" id="zonaFrancaId" required><option value="">Seleccione una zona</option>${zonas.map((zona) => `<option value="${zona.id}">${zona.nombre}</option>`).join('')}</select><span class="form-error" id="error-zonaFrancaId"></span></div>
        <div class="form-group"><label class="form-label" for="sector">Sector *</label><select class="form-select" id="sector" required disabled><option value="">Seleccione primero la zona</option></select><span class="form-error" id="error-sector"></span></div>
      </div></div>
      <div class="form-section"><div class="form-section-title">Proyección de la solicitud</div><div class="form-grid">
        <div class="form-group"><label class="form-label" for="tipo">Tipo *</label><select class="form-select" id="tipo" required><option value="">Seleccione un tipo</option><option value="instalacion">Instalación</option><option value="expansion">Expansión</option></select><span class="form-error" id="error-tipo"></span></div>
        ${campo('tipoActividad', 'Tipo de actividad')}${campo('areaSolicitada', 'Área solicitada (m²)', 'number', 'min="1"')}${campo('inversionEstimada', 'Inversión proyectada (CRC)', 'number', 'min="1"')}${campo('empleosNuevos', 'Empleos proyectados', 'number', 'min="1"')}${campo('exportacionesProyectadas', 'Exportaciones proyectadas (%)', 'number', 'min="0" max="100"')}${campo('reportesOportunosComprometidos', 'Reportes a tiempo comprometidos (%)', 'number', 'min="0" max="100" value="100"')}
        <div class="form-group form-group--full"><label class="form-label" for="descripcion">Descripción *</label><textarea class="form-textarea" id="descripcion" rows="3" required></textarea><span class="form-error" id="error-descripcion"></span></div>
      </div></div><div style="display:flex;gap:var(--space-3);justify-content:flex-end"><a class="btn btn-outline" href="#/solicitudes">Cancelar</a><button class="btn btn-primary btn-lg" id="btnSubmit">Enviar y evaluar con IA</button></div></form></div>`;
  } catch (error) { return `<div class="empty-state"><h2>No fue posible cargar el formulario</h2><p>Revise la conexión e intente nuevamente.</p><button class="btn btn-primary" onclick="location.reload()">Reintentar</button></div>`; }
}

export function init() {
  const form = document.getElementById('formSolicitud');
  if (!form) return;
  const empresa = document.getElementById('empresaId'); const cedula = document.getElementById('cedulaJuridica'); const zona = document.getElementById('zonaFrancaId'); const sector = document.getElementById('sector');
  const actualizarCedula = () => { cedula.value = empresa.selectedOptions[0]?.dataset.cedula || ''; };
  actualizarCedula(); empresa.addEventListener('change', actualizarCedula);
  zona.addEventListener('change', async () => { try { const seleccionada = (await http.getById('zonasFrancas', zona.value)); sector.disabled = false; sector.innerHTML = `<option value="">Seleccione un sector</option>${seleccionada.sectoresPermitidos.map((nombre) => `<option value="${nombre}">${nombre}</option>`).join('')}`; } catch { toast.error('Error', 'No se pudieron cargar los sectores de la zona.'); } });
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); document.querySelectorAll('.form-error').forEach((el) => { el.textContent = ''; });
    const ids = ['empresaId', 'zonaFrancaId', 'sector', 'tipo', 'tipoActividad', 'areaSolicitada', 'inversionEstimada', 'empleosNuevos', 'exportacionesProyectadas', 'reportesOportunosComprometidos', 'descripcion'];
    const vacios = ids.filter((id) => !document.getElementById(id).value.trim());
    if (vacios.length || document.getElementById('descripcion').value.trim().length < 20) { vacios.forEach((id) => { document.getElementById(`error-${id}`).textContent = 'Este campo es requerido.'; }); if (document.getElementById('descripcion').value.trim().length < 20) document.getElementById('error-descripcion').textContent = 'La descripción debe tener al menos 20 caracteres.'; toast.warning('Campos incompletos', 'Complete los campos requeridos antes de evaluar.'); return; }
    const seleccionada = empresa.selectedOptions[0];
    const detalles = { tipoActividad: document.getElementById('tipoActividad').value.trim(), areaSolicitada: Number(document.getElementById('areaSolicitada').value), inversionEstimada: Number(document.getElementById('inversionEstimada').value), empleosNuevos: Number(document.getElementById('empleosNuevos').value) };
    const nueva = { empresaId: Number(empresa.value), cedulaJuridica: seleccionada.dataset.cedula, zonaFrancaId: Number(zona.value), sector: sector.value, tipo: document.getElementById('tipo').value, descripcion: document.getElementById('descripcion').value.trim(), fechaSolicitud: new Date().toISOString().slice(0, 10), estado: 'pendiente', clasificacionIa: null, compromisos: { ...detalles, exportacionesProyectadas: Number(document.getElementById('exportacionesProyectadas').value), reportesOportunosComprometidos: Number(document.getElementById('reportesOportunosComprometidos').value) }, detalles, observaciones: '' };
    const boton = document.getElementById('btnSubmit'); boton.disabled = true; boton.innerHTML = '<span class="spinner spinner-sm"></span> Guardando y evaluando...';
    try { const creada = await http.post('solicitudes', nueva); const ia = await clasificarSolicitud(creada.id); toast.success('Solicitud evaluada', `Puntaje IA: ${ia.puntajeAfinidad}/100. Quedó en revisión de analista.`); window.location.hash = '#/solicitudes'; } catch (error) { console.error(error); toast.error('No se pudo completar la evaluación', 'La solicitud quedó pendiente y no cambió de estado. Puede reintentarlo desde el listado.'); boton.disabled = false; boton.textContent = 'Enviar y evaluar con IA'; }
  });
}
