/* ============================================
   ProcoZone — Página Nueva Solicitud
   Formulario completo con validación y submit
   ============================================ */
import { http } from '../services/http-client.js';
import { toast } from '../services/notificacion-service.js';
import { validarSolicitud } from '../utils/validaciones.js';
import { CATEGORIAS_ZF, ZONAS_FRANCAS, TIPOS_SOLICITUD, TIPO_TEXTO } from '../utils/constantes.js';

let destroyFn = null;

export async function render() {
  // Cargar empresas para el select
  let opcionesEmpresas = '<option value="">Seleccione una empresa</option>';
  try {
    const empresas = await http.get('empresas');
    opcionesEmpresas += empresas
      .filter(e => e.estado !== 'Suspendida')
      .map(e => `<option value="${e.id}">${e.nombre} — ${e.zonaFranca}</option>`)
      .join('');
  } catch (e) {
    // Si falla, mostrar opciones vacías
  }

  return `
    <div class="page-enter" id="nuevaSolicitudPage">
      <div style="margin-bottom: var(--space-6);">
        <h1 style="font-size: var(--text-2xl); margin-bottom: var(--space-2);">Nueva Solicitud</h1>
        <p style="color: var(--text-muted); font-size: var(--text-sm);">Complete el formulario para registrar una nueva solicitud de instalación o expansión.</p>
      </div>

      <form id="formSolicitud" novalidate>
        <!-- Sección: Información General -->
        <div class="form-section">
          <div class="form-section-title">
            <i class="fa-solid fa-circle-info"></i>
            Información General
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="empresaId">Empresa *</label>
              <select class="form-select" id="empresaId" name="empresaId" required>
                ${opcionesEmpresas}
              </select>
              <span class="form-error" id="error-empresaId"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="tipo">Tipo de Solicitud *</label>
              <select class="form-select" id="tipo" name="tipo" required>
                <option value="">Seleccione un tipo</option>
                ${Object.entries(TIPOS_SOLICITUD).map(([key, val]) =>
                  `<option value="${val}">${TIPO_TEXTO[val]}</option>`
                ).join('')}
              </select>
              <span class="form-error" id="error-tipo"></span>
            </div>
            <div class="form-group form-group--full">
              <label class="form-label" for="descripcion">Descripción de la Solicitud *</label>
              <textarea class="form-textarea" id="descripcion" name="descripcion" rows="3" placeholder="Describa detalladamente la solicitud..." required></textarea>
              <span class="form-error" id="error-descripcion"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="responsable">Responsable / Analista Asignado *</label>
              <input class="form-input" type="text" id="responsable" name="responsable" placeholder="Nombre del analista" required />
              <span class="form-error" id="error-responsable"></span>
            </div>
          </div>
        </div>

        <!-- Sección: Detalles Técnicos -->
        <div class="form-section">
          <div class="form-section-title">
            <i class="fa-solid fa-gear"></i>
            Detalles Técnicos
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="tipoActividad">Tipo de Actividad *</label>
              <input class="form-input" type="text" id="tipoActividad" name="tipoActividad" placeholder="Ej: Manufactura electrónica" required />
              <span class="form-error" id="error-tipoActividad"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="areaSolicitada">Área Solicitada (m²) *</label>
              <input class="form-input" type="number" id="areaSolicitada" name="areaSolicitada" placeholder="Ej: 500" min="1" max="10000" required />
              <span class="form-error" id="error-areaSolicitada"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="inversionEstimada">Inversión Estimada (CRC) *</label>
              <input class="form-input" type="number" id="inversionEstimada" name="inversionEstimada" placeholder="Ej: 2000000" min="1" required />
              <span class="form-error" id="error-inversionEstimada"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="empleosNuevos">Empleos Nuevos Generados *</label>
              <input class="form-input" type="number" id="empleosNuevos" name="empleosNuevos" placeholder="Ej: 30" min="1" max="5000" required />
              <span class="form-error" id="error-empleosNuevos"></span>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div style="display: flex; gap: var(--space-3); justify-content: flex-end; padding-top: var(--space-4); border-top: 1px solid var(--border);">
          <a href="#/solicitudes" class="btn btn-outline">Cancelar</a>
          <button type="submit" class="btn btn-primary btn-lg" id="btnSubmit">
            <i class="fa-solid fa-paper-plane"></i> Enviar Solicitud
          </button>
        </div>
      </form>
    </div>
  `;
}

export async function init() {
  const form = document.getElementById('formSolicitud');
  if (!form) return;

  let enviando = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enviando) return;

    // Recopilar datos
    const datos = {
      empresaId: parseInt(document.getElementById('empresaId').value) || null,
      tipo: document.getElementById('tipo').value,
      descripcion: document.getElementById('descripcion').value,
      responsable: document.getElementById('responsable').value,
      tipoActividad: document.getElementById('tipoActividad').value,
      areaSolicitada: parseFloat(document.getElementById('areaSolicitada').value) || null,
      inversionEstimada: parseFloat(document.getElementById('inversionEstimada').value) || null,
      empleosNuevos: parseInt(document.getElementById('empleosNuevos').value) || null
    };

    // Validar
    const errores = validarSolicitud(datos);
    limpiarErrores();

    if (errores) {
      mostrarErrores(errores);
      toast.warning('Campos incompletos', 'Por favor corrija los errores marcados.');
      return;
    }

    // Enviar
    enviando = true;
    const btnSubmit = document.getElementById('btnSubmit');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<div class="spinner spinner-sm" style="border-top-color: white;"></div> Enviando...';

    try {
      const nuevaSolicitud = {
        ...datos,
        empresaId: datos.empresaId,
        estado: 'pendiente',
        fechaSolicitud: new Date().toISOString().split('T')[0],
        clasificacionIa: null,
        detalles: {
          areaSolicitada: datos.areaSolicitada,
          tipoActividad: datos.tipoActividad,
          inversionEstimada: datos.inversionEstimada,
          empleosNuevos: datos.empleosNuevos
        },
        observaciones: ''
      };

      // Limpiar campos que no van en el nivel raíz
      delete nuevaSolicitud.tipoActividad;
      delete nuevaSolicitud.areaSolicitada;
      delete nuevaSolicitud.inversionEstimada;
      delete nuevaSolicitud.empleosNuevos;

      await http.post('solicitudes', nuevaSolicitud);

      toast.success('Solicitud creada', 'La solicitud ha sido registrada exitosamente. Puede clasificarla con IA desde la lista de solicitudes.');

      // Navegar a solicitudes
      window.location.hash = '#/solicitudes';

    } catch (error) {
      toast.error('Error al enviar', error.message || 'No se pudo crear la solicitud.');
      enviando = false;
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Solicitud';
    }
  });

  destroyFn = () => {
    enviando = false;
  };
}

function limpiarErrores() {
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
    el.style.borderColor = '';
  });
}

function mostrarErrores(errores) {
  for (const [campo, mensaje] of Object.entries(errores)) {
    const errorEl = document.getElementById(`error-${campo}`);
    const inputEl = document.getElementById(campo);
    if (errorEl) errorEl.textContent = mensaje;
    if (inputEl) inputEl.style.borderColor = 'var(--error)';
  }
}

export function destroy() {
  if (destroyFn) destroyFn();
}