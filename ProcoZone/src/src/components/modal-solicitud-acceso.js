/* ============================================
   ProcoZone — Modal de Solicitud de Acceso
   Formulario de contacto para empresas sin
   usuario. Persiste en la colección
   "solicitudesAcceso" de json-server.
   ============================================ */
import { http } from '../services/http-client.js';
import { toast } from '../services/notificacion-service.js';
import { t } from '../utils/translations.js';

/* Cédula jurídica costarricense: sección(1) - tomo(3) - folio(4-6). Ej. 3-101-123456 */
const REGEX_CEDULA_JURIDICA = /^[1-9]-\d{3}-\d{4,6}$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

let manejadorEscape = null;

function renderMotivoSelect() {
  const opciones = [
    'access_reason_first_time',
    'access_reason_forgot_user',
    'access_reason_initial_credentials'
  ].map((clave) => `<option value="${t(clave)}">${t(clave)}</option>`).join('');
  return `
    <option value="" disabled selected>${t('access_reason_select')}</option>
    ${opciones}
    <option value="otro">${t('access_reason_other')}</option>
  `;
}

function renderFormulario() {
  return `
    <form id="formSolicitudAcceso" class="acceso-form" novalidate>
      <div class="acceso-form__campo">
        <label for="solicitudNombre">${t('access_full_name')} <span aria-hidden="true">*</span></label>
        <div class="input-wrap"><i class="fa-regular fa-user"></i><input id="solicitudNombre" name="nombre" type="text" placeholder="${t('access_full_name_placeholder')}" autocomplete="name" required></div>
        <p class="acceso-form__error" data-error-for="solicitudNombre" role="alert"></p>
      </div>
      <div class="acceso-form__campo">
        <label for="solicitudEmail">${t('access_corporate_email')} <span aria-hidden="true">*</span></label>
        <div class="input-wrap"><i class="fa-regular fa-envelope"></i><input id="solicitudEmail" name="email" type="email" placeholder="${t('access_corporate_email_placeholder')}" autocomplete="email" required></div>
        <p class="acceso-form__error" data-error-for="solicitudEmail" role="alert"></p>
      </div>
      <div class="acceso-form__fila">
        <div class="acceso-form__campo">
          <label for="solicitudCedula">${t('access_legal_id')} <span aria-hidden="true">*</span></label>
          <div class="input-wrap"><i class="fa-regular fa-id-card"></i><input id="solicitudCedula" name="cedulaJuridica" type="text" placeholder="${t('legal_id_placeholder')}" autocomplete="off" required></div>
          <p class="acceso-form__error" data-error-for="solicitudCedula" role="alert"></p>
        </div>
        <div class="acceso-form__campo">
          <label for="solicitudEmpresa">${t('access_company_name')} <span aria-hidden="true">*</span></label>
          <div class="input-wrap"><i class="fa-solid fa-building"></i><input id="solicitudEmpresa" name="empresa" type="text" placeholder="${t('access_company_placeholder')}" autocomplete="organization" required></div>
          <p class="acceso-form__error" data-error-for="solicitudEmpresa" role="alert"></p>
        </div>
      </div>
      <div class="acceso-form__campo">
        <label for="solicitudMotivo">${t('access_reason')} <span aria-hidden="true">*</span></label>
        <div class="input-wrap input-wrap--select"><i class="fa-regular fa-comment-dots"></i><select id="solicitudMotivo" name="motivo" required>${renderMotivoSelect()}</select></div>
        <p class="acceso-form__error" data-error-for="solicitudMotivo" role="alert"></p>
      </div>
      <div class="acceso-form__campo" id="campoMotivoOtro" hidden>
        <label for="solicitudMotivoOtro">${t('access_reason_other')}</label>
        <textarea id="solicitudMotivoOtro" name="motivoOtro" rows="3" maxlength="300" placeholder="${t('access_reason_other_placeholder')}"></textarea>
        <p class="acceso-form__error" data-error-for="solicitudMotivoOtro" role="alert"></p>
      </div>
      <p class="acceso-form__general-error" id="solicitudErrorGeneral" role="alert"></p>
      <button class="btn btn-primary btn-lg acceso-form__submit" type="submit">
        <span>${t('access_send_request')}</span> <i class="fa-solid fa-paper-plane"></i>
      </button>
    </form>
  `;
}

function renderExito() {
  return `
    <div class="acceso-exito page-enter" role="status">
      <span class="acceso-exito__icono"><i class="fa-solid fa-circle-check"></i></span>
      <h3>${t('access_success_title')}</h3>
      <p>${t('access_success_msg')}</p>
      <button class="btn btn-primary" type="button" id="btnExitoVolverLogin">
        <i class="fa-solid fa-arrow-left"></i> ${t('access_back_to_login')}
      </button>
    </div>
  `;
}

/** Muestra u oculta el mensaje de error de un campo */
function marcarError(input, mensaje) {
  const campo = input.closest('.acceso-form__campo');
  const parrafo = document.querySelector(`[data-error-for="${input.id}"]`);
  if (!campo || !parrafo) return;
  campo.classList.toggle('has-error', Boolean(mensaje));
  parrafo.textContent = mensaje || '';
}

/** Valida todos los campos; devuelve el objeto a persistir o null si hay errores */
function validarFormulario(form) {
  const nombre = form.elements.nombre;
  const email = form.elements.email;
  const cedula = form.elements.cedulaJuridica;
  const empresa = form.elements.empresa;
  const motivo = form.elements.motivo;
  const motivoOtro = form.elements.motivoOtro;
  let esValido = true;

  const validarCampo = (input, condicion, mensaje) => {
    const ok = condicion();
    marcarError(input, ok ? '' : mensaje);
    if (!ok && esValido) {
      input.focus();
      esValido = false;
    }
  };

  validarCampo(nombre, () => nombre.value.trim().length >= 5, t('access_error_required'));
  validarCampo(email, () => REGEX_EMAIL.test(email.value.trim()), t('access_error_email'));
  validarCampo(cedula, () => REGEX_CEDULA_JURIDICA.test(cedula.value.trim()), t('access_error_legal_id'));
  validarCampo(empresa, () => empresa.value.trim().length >= 2, t('access_error_required'));
  validarCampo(motivo, () => Boolean(motivo.value), t('access_error_select_reason'));

  const requiereOtro = motivo.value === 'otro';
  if (requiereOtro) {
    validarCampo(motivoOtro, () => motivoOtro.value.trim().length >= 5, t('access_error_required'));
  }

  if (!esValido) return null;

  return {
    nombre: nombre.value.trim(),
    email: email.value.trim(),
    cedulaJuridica: cedula.value.trim(),
    empresa: empresa.value.trim(),
    motivo: requiereOtro ? motivoOtro.value.trim() : motivo.value,
    estado: 'pendiente',
    fechaSolicitud: new Date().toISOString().slice(0, 10)
  };
}

/**
 * Notificación dirigida al Analista (campanita del panel interno).
 * Se persiste en "alertas" sin empresaId para que solo la vean
 * los usuarios internos; el sondeo del header la muestra en vivo.
 */
function construirNotificacionAnalista(solicitud) {
  return {
    solicitudAccesoId: solicitud.id,
    tipo: 'warning',
    titulo: t('notif_access_new_title'),
    descripcion: `${t('notif_access_new_prefix')} ${solicitud.empresa} (${t('access_legal_id_short')}: ${solicitud.cedulaJuridica}) ${t('notif_access_new_mid')} ${solicitud.motivo}.`,
    fechaCreacion: new Date().toISOString().slice(0, 10),
    estado: 'abierta',
    detalle: {
      solicitante: solicitud.nombre,
      empresa: solicitud.empresa,
      email: solicitud.email,
      cedulaJuridica: solicitud.cedulaJuridica,
      motivo: solicitud.motivo,
      fechaSolicitud: solicitud.fechaSolicitud
    }
  };
}

async function enviarSolicitud(botonSubmit, textoOriginal) {
  const form = document.getElementById('formSolicitudAcceso');
  const datos = validarFormulario(form);
  const errorGeneral = document.getElementById('solicitudErrorGeneral');
  if (!datos) return;

  botonSubmit.disabled = true;
  botonSubmit.innerHTML = `<span class="spinner spinner-sm"></span> ${t('access_sending')}`;
  errorGeneral.textContent = '';

  try {
    // json-server asigna el id numérico automáticamente al hacer POST
    const solicitud = await http.post('solicitudesAcceso', datos);
    // Alerta en vivo para la campanita del Analista
    await http.post('alertas', construirNotificacionAnalista(solicitud)).catch(() => { /* no bloquea el registro */ });
    document.getElementById('accesoModalBody').innerHTML = renderExito();
    document.getElementById('btnExitoVolverLogin')?.addEventListener('click', cerrarModalSolicitudAcceso);
    toast.success(t('access_success_title'), t('access_success_msg'));
  } catch (requestError) {
    errorGeneral.textContent = requestError.message || t('access_connection_error');
    botonSubmit.disabled = false;
    botonSubmit.innerHTML = textoOriginal;
  }
}

export function abrirModalSolicitudAcceso() {
  const container = document.getElementById('modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay" id="accesoModalOverlay"></div>
    <div class="modal-content modal-content--acceso" role="dialog" aria-modal="true" aria-labelledby="accesoModalTitulo">
      <div class="modal-header">
        <h3 id="accesoModalTitulo"><i class="fa-solid fa-building-circle-check"></i> ${t('access_modal_title')}</h3>
        <button class="modal-close" id="accesoModalCerrar" aria-label="${t('close')}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body" id="accesoModalBody">
        <p class="acceso-form__intro">${t('access_modal_subtitle')}</p>
        ${renderFormulario()}
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" id="accesoModalCancelar">${t('close')}</button>
      </div>
    </div>
  `;

  container.classList.add('active');

  // Cierre: overlay, botón X, "Cerrar" y tecla Escape
  document.getElementById('accesoModalOverlay')?.addEventListener('click', cerrarModalSolicitudAcceso);
  document.getElementById('accesoModalCerrar')?.addEventListener('click', cerrarModalSolicitudAcceso);
  document.getElementById('accesoModalCancelar')?.addEventListener('click', cerrarModalSolicitudAcceso);
  manejadorEscape = (event) => {
    if (event.key === 'Escape') cerrarModalSolicitudAcceso();
  };
  document.addEventListener('keydown', manejadorEscape);

  const form = document.getElementById('formSolicitudAcceso');
  const selectMotivo = form.elements.motivo;
  const campoOtro = document.getElementById('campoMotivoOtro');

  // Mostrar textarea solo cuando se elige "Otro (especificar)"
  selectMotivo.addEventListener('change', () => {
    const esOtro = selectMotivo.value === 'otro';
    campoOtro.hidden = !esOtro;
    if (esOtro) form.elements.motivoOtro.focus();
  });

  // Revalidar en vivo para quitar el error apenas se corrige
  ['nombre', 'email', 'cedulaJuridica', 'empresa'].forEach((campoNombre) => {
    form.elements[campoNombre].addEventListener('input', (event) => marcarError(event.target, ''));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    enviarSolicitud(
      form.querySelector('.acceso-form__submit'),
      `<span>${t('access_send_request')}</span> <i class="fa-solid fa-paper-plane"></i>`
    );
  });

  document.getElementById('solicitudNombre')?.focus();
}

export function cerrarModalSolicitudAcceso() {
  const container = document.getElementById('modal-container');
  if (!container) return;
  container.classList.remove('active');
  container.innerHTML = '';
  if (manejadorEscape) {
    document.removeEventListener('keydown', manejadorEscape);
    manejadorEscape = null;
  }
}
