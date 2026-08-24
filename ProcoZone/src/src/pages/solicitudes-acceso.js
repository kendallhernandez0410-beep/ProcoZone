/* ============================================
   ProcoZone — Solicitudes de Acceso (panel interno)
   Módulo para el Analista/Administrador: lista las
   empresas que solicitaron ingreso al sistema y
   permite Aprobar (genera y envía credenciales por
   correo) o Rechazar con nota aclaratoria.
   Se sincroniza en vivo con la campanita del header.
   ============================================ */
import { http } from '../services/http-client.js';
import { renderSkeletonCards } from '../src/components/estado-carga.js';
import { refrescarAlertas } from '../components/header.js';
import { toast } from '../services/notificacion-service.js';
import { esInterno, obtenerSesion } from '../utils/auth.js';
import { formatearFecha, obtenerIniciales, colorDesdeString } from '../utils/formateador.js';
import { t } from '../utils/translations.js';

// Clave compartida con modal-alerta-detalle.js:
// al pulsar "Gestionar solicitud" en la notificación se guarda el id aquí
const CLAVE_GESTIONAR = 'procozone-gestionar-acceso';

let filtroActual = 'todos';
let busqueda = '';
let solicitudes = [];
let destroyFn = null;

/* ==================== Utilidades ==================== */

const BADGES = { pendiente: 'badge-accent', aprobada: 'badge-success', rechazada: 'badge-error' };

const TEXTOS_ESTADO = () => ({
  pendiente: t('access_state_pendiente'),
  aprobada: t('access_state_aprobada'),
  rechazada: t('access_state_rechazada')
});

const badgeEstado = (estado) =>
  `<span class="badge ${BADGES[estado] || 'badge-neutral'}">${TEXTOS_ESTADO()[estado] || estado}</span>`;

/** Genera usuario y contraseña temporal para el nuevo acceso */
function generarCredenciales(email) {
  const base = (email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'usuario';
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const contrasena = Array.from({ length: 10 }, () => caracteres[Math.floor(Math.random() * caracteres.length)]).join('');
  return { usuario: `${base}${Math.floor(100 + Math.random() * 900)}`, contrasena };
}

/** Cierra las notificaciones de campanita asociadas a la solicitud gestionada */
async function cerrarNotificacionesAsociadas(solicitudAccesoId) {
  try {
    const alertas = await http.get('alertas', { solicitudAccesoId });
    await Promise.all((alertas || []).map(alerta => http.patch('alertas', alerta.id, { estado: 'cerrada' })));
    refrescarAlertas();
  } catch { /* no bloquea la gestión de la solicitud */ }
}

/* ==================== Modales genéricos ==================== */

let manejadorEscape = null;

function abrirModalHTML(titulo, cuerpo, pie) {
  const container = document.getElementById('modal-container');
  if (!container) return;
  container.innerHTML = `
    <div class="modal-overlay" id="accesoGestionOverlay"></div>
    <div class="modal-content" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>${titulo}</h3>
        <button class="modal-close" id="accesoGestionCerrar" aria-label="${t('close')}"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">${cuerpo}</div>
      <div class="modal-footer">${pie}</div>
    </div>
  `;
  container.classList.add('active');
  document.getElementById('accesoGestionOverlay')?.addEventListener('click', cerrarModalAcceso);
  document.getElementById('accesoGestionCerrar')?.addEventListener('click', cerrarModalAcceso);
  if (manejadorEscape) document.removeEventListener('keydown', manejadorEscape);
  manejadorEscape = (event) => { if (event.key === 'Escape') cerrarModalAcceso(); };
  document.addEventListener('keydown', manejadorEscape);
}

export function cerrarModalAcceso() {
  const container = document.getElementById('modal-container');
  if (!container) return;
  container.classList.remove('active');
  container.innerHTML = '';
  if (manejadorEscape) {
    document.removeEventListener('keydown', manejadorEscape);
    manejadorEscape = null;
  }
}

/* ==================== Renderizado ==================== */

function renderFilaDato(icono, etiqueta, valor) {
  return `
    <div class="acceso-dato">
      <i class="fa-solid ${icono}" aria-hidden="true"></i>
      <div>
        <span class="acceso-dato__label">${etiqueta}</span>
        <span class="acceso-dato__value">${valor}</span>
      </div>
    </div>
  `;
}

function renderResultadoGestion(sol) {
  if (sol.estado === 'aprobada' && sol.credenciales) {
    return `
      <div class="credencial-mini">
        <i class="fa-solid fa-key"></i>
        <span>${t('access_req_username')}: <code>${sol.credenciales.usuario}</code></span>
        <small>${formatearFecha(sol.fechaAtencion)} · ${sol.atendidaPor || ''}</small>
      </div>`;
  }
  if (sol.estado === 'rechazada' && sol.notaRechazo) {
    return `
      <div class="credencial-mini credencial-mini--rechazo">
        <i class="fa-solid fa-circle-xmark"></i>
        <span>${t('access_req_note_label')}: ${sol.notaRechazo}</span>
        <small>${formatearFecha(sol.fechaAtencion)} · ${sol.atendidaPor || ''}</small>
      </div>`;
  }
  return '';
}

function renderTarjeta(sol) {
  const pendiente = sol.estado === 'pendiente';
  return `
    <article class="acceso-card" data-id="${sol.id}">
      <div class="acceso-card__head">
        <span class="acceso-card__avatar" style="background: ${colorDesdeString(sol.empresa)};">${obtenerIniciales(sol.empresa)}</span>
        <div class="acceso-card__titulos">
          <strong>${sol.empresa}</strong>
          <span><i class="fa-regular fa-user"></i> ${t('th_requester')}: ${sol.nombre}</span>
        </div>
        ${badgeEstado(sol.estado)}
      </div>

      <div class="acceso-card__datos">
        ${renderFilaDato('fa-envelope', t('access_req_email_label'), sol.email)}
        ${renderFilaDato('fa-id-card', t('access_legal_id_short'), sol.cedulaJuridica)}
        ${renderFilaDato('fa-comment-dots', t('access_req_reason_label'), sol.motivo)}
        ${renderFilaDato('fa-calendar', t('access_req_date_label'), formatearFecha(sol.fechaSolicitud))}
      </div>

      ${renderResultadoGestion(sol)}

      <div class="acceso-card__acciones">
        ${pendiente ? `
          <button class="btn btn-primary btn-sm" data-accion="aprobar"><i class="fa-solid fa-check"></i> ${t('approve')}</button>
          <button class="btn btn-danger btn-sm" data-accion="rechazar"><i class="fa-solid fa-xmark"></i> ${t('reject')}</button>
        ` : ''}
        <button class="btn btn-outline btn-sm" data-accion="detalle"><i class="fa-regular fa-eye"></i> ${t('notif_detail_title')}</button>
      </div>
    </article>
  `;
}

function filtrar() {
  let lista = filtroActual === 'todos' ? solicitudes : solicitudes.filter(s => s.estado === filtroActual);
  if (busqueda) {
    const termino = busqueda.toLowerCase();
    lista = lista.filter(sol =>
      [sol.empresa, sol.nombre, sol.email, sol.cedulaJuridica]
        .some(campo => (campo || '').toLowerCase().includes(termino))
    );
  }
  return lista;
}

function renderLista() {
  const container = document.getElementById('solicitudesAccesoPage');
  if (!container) return;

  const contar = (estado) => solicitudes.filter(s => s.estado === estado).length;
  const chip = (valor, texto, cantidad) => `
    <button class="filtro-btn ${filtroActual === valor ? 'active' : ''}" data-filtro="${valor}">${texto} (${cantidad})</button>`;

  const lista = filtrar();

  container.innerHTML = `
    <div class="solicitudes-header">
      <div>
        <h1>${t('access_requests_menu')}</h1>
        <p style="color: var(--text-muted); margin: var(--space-1) 0 0;">${t('access_requests_subtitle')}</p>
      </div>
      <div class="accesos-busqueda">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="search" id="accesosBusqueda" placeholder="${t('access_req_search_placeholder')}" value="${busqueda}" autocomplete="off">
      </div>
    </div>

    <div class="solicitudes-filtros">
      ${chip('todos', t('all'), solicitudes.length)}
      ${chip('pendiente', t('pending'), contar('pendiente'))}
      ${chip('aprobada', t('approved'), contar('aprobada'))}
      ${chip('rechazada', t('rejected'), contar('rechazada'))}
    </div>

    ${lista.length > 0 ? `<div class="accesos-grid">${lista.map(renderTarjeta).join('')}</div>` : `
      <div class="empty-state">
        <i class="fa-solid fa-inbox"></i>
        <h3>${t('access_req_empty_title')}</h3>
        <p>${t('access_req_empty_msg')}</p>
      </div>
    `}
  `;

  bindEventos();
}

/* ==================== Acciones: Aprobar / Rechazar / Detalle ==================== */

function resumenSolicitudHTML(sol) {
  return `
    <div class="detalle-grid">
      <div class="detalle-item"><span class="detalle-item__label">${t('th_company')}</span><span class="detalle-item__value">${sol.empresa}</span></div>
      <div class="detalle-item"><span class="detalle-item__label">${t('th_requester')}</span><span class="detalle-item__value">${sol.nombre}</span></div>
      <div class="detalle-item"><span class="detalle-item__label">${t('access_req_email_label')}</span><span class="detalle-item__value">${sol.email}</span></div>
      <div class="detalle-item"><span class="detalle-item__label">${t('access_legal_id_short')}</span><span class="detalle-item__value">${sol.cedulaJuridica}</span></div>
      <div class="detalle-item detalle-item--full"><span class="detalle-item__label">${t('access_req_reason_label')}</span><span class="detalle-item__value">${sol.motivo}</span></div>
    </div>
  `;
}

async function aprobarSolicitud(sol, botonConfirmar, textoOriginalBoton) {
  botonConfirmar.disabled = true;
  botonConfirmar.innerHTML = `<span class="spinner spinner-sm"></span> ${t('access_sending')}`;
  try {
    const credenciales = generarCredenciales(sol.email);
    const actualizada = await http.patch('solicitudesAcceso', sol.id, {
      estado: 'aprobada',
      credenciales,
      atendidaPor: obtenerSesion()?.nombre || '',
      fechaAtencion: new Date().toISOString().slice(0, 10)
    });
    // Sincroniza el objeto del listado (el modal de detalle puede recibir una copia)
    const objetivo = solicitudes.find(s => String(s.id) === String(sol.id)) || sol;
    Object.assign(objetivo, actualizada);
    await cerrarNotificacionesAsociadas(sol.id);

    // Vista de confirmación: credenciales "enviadas" al correo del solicitante
    abrirModalHTML(
      `<i class="fa-solid fa-circle-check" style="color: var(--success);"></i> ${t('access_req_credentials_title')}`,
      `
      ${resumenSolicitudHTML(sol)}
      <div class="credencial-box">
        <div class="credencial-box__fila"><span>${t('access_req_username')}</span><code>${credenciales.usuario}</code></div>
        <div class="credencial-box__fila"><span>${t('access_req_password')}</span><code>${credenciales.contrasena}</code></div>
        <p class="credencial-box__envio"><i class="fa-regular fa-paper-plane"></i> ${t('access_req_credentials_sent')} <strong>${sol.email}</strong></p>
        <p class="credencial-box__nota"><i class="fa-solid fa-circle-info"></i> ${t('access_req_mail_simulated')}</p>
      </div>
      `,
      `<button class="btn btn-primary" id="accesoGestionOk">${t('close')}</button>`
    );
    document.getElementById('accesoGestionOk')?.addEventListener('click', cerrarModalAcceso);

    toast.success(t('access_req_approved_toast_title'), t('access_req_approved_toast_msg'));
    renderLista();
  } catch (error) {
    toast.error(t('error_title'), error.message || t('access_req_error_update'));
    botonConfirmar.disabled = false;
    botonConfirmar.innerHTML = textoOriginalBoton;
  }
}

function abrirModalAprobar(sol) {
  abrirModalHTML(
    `<i class="fa-solid fa-user-check"></i> ${t('access_req_approve_title')}`,
    `
    <p class="acceso-modal__msg">${t('access_req_approve_msg')}</p>
    ${resumenSolicitudHTML(sol)}
    `,
    `
    <button class="btn btn-outline" id="accesoGestionCancelar">${t('close')}</button>
    <button class="btn btn-primary" id="accesoGestionConfirmar"><i class="fa-solid fa-key"></i> ${t('access_req_confirm_approve')}</button>
    `
  );
  document.getElementById('accesoGestionCancelar')?.addEventListener('click', cerrarModalAcceso);
  const confirmar = document.getElementById('accesoGestionConfirmar');
  confirmar?.addEventListener('click', () => aprobarSolicitud(sol, confirmar, confirmar.innerHTML));
}

async function rechazarSolicitud(sol, nota, botonConfirmar, textoOriginalBoton) {
  botonConfirmar.disabled = true;
  botonConfirmar.innerHTML = `<span class="spinner spinner-sm"></span> ${t('access_sending')}`;
  try {
    const actualizada = await http.patch('solicitudesAcceso', sol.id, {
      estado: 'rechazada',
      notaRechazo: nota,
      atendidaPor: obtenerSesion()?.nombre || '',
      fechaAtencion: new Date().toISOString().slice(0, 10)
    });
    const objetivo = solicitudes.find(s => String(s.id) === String(sol.id)) || sol;
    Object.assign(objetivo, actualizada);
    await cerrarNotificacionesAsociadas(sol.id);
    cerrarModalAcceso();
    toast.warning(t('access_req_rejected_toast_title'), t('access_req_rejected_toast_msg'));
    renderLista();
  } catch (error) {
    toast.error(t('error_title'), error.message || t('access_req_error_update'));
    botonConfirmar.disabled = false;
    botonConfirmar.innerHTML = textoOriginalBoton;
  }
}

function abrirModalRechazar(sol) {
  abrirModalHTML(
    `<i class="fa-solid fa-user-slash"></i> ${t('access_req_reject_title')}`,
    `
    <p class="acceso-modal__msg">${t('access_req_reject_msg')}</p>
    ${resumenSolicitudHTML(sol)}
    <div class="acceso-form__campo">
      <label for="accesoNotaRechazo">${t('access_req_reject_note_label')} <span aria-hidden="true">*</span></label>
      <textarea id="accesoNotaRechazo" rows="4" maxlength="300" placeholder="${t('access_req_reject_note_placeholder')}"></textarea>
      <p class="acceso-form__error" id="accesoNotaRechazoError" role="alert"></p>
    </div>
    `,
    `
    <button class="btn btn-outline" id="accesoGestionCancelar">${t('close')}</button>
    <button class="btn btn-danger" id="accesoGestionConfirmar"><i class="fa-solid fa-paper-plane"></i> ${t('access_req_confirm_reject')}</button>
    `
  );
  document.getElementById('accesoGestionCancelar')?.addEventListener('click', cerrarModalAcceso);

  const textarea = document.getElementById('accesoNotaRechazo');
  textarea?.addEventListener('input', () => {
    const parrafo = document.getElementById('accesoNotaRechazoError');
    if (parrafo) parrafo.textContent = '';
  });

  const confirmar = document.getElementById('accesoGestionConfirmar');
  confirmar?.addEventListener('click', () => {
    const nota = (textarea?.value || '').trim();
    if (nota.length < 5) {
      const parrafo = document.getElementById('accesoNotaRechazoError');
      if (parrafo) parrafo.textContent = t('access_req_note_required');
      textarea?.focus();
      return;
    }
    rechazarSolicitud(sol, nota, confirmar, confirmar.innerHTML);
  });
  textarea?.focus();
}

function abrirDetalle(sol) {
  abrirModalHTML(
    `<i class="fa-regular fa-folder-open"></i> ${t('access_req_detail_title')}`,
    `
    <div class="alerta-detalle__cabecera">
      <span class="acceso-card__avatar" style="background: ${colorDesdeString(sol.empresa)};">${obtenerIniciales(sol.empresa)}</span>
      <div>
        <strong>${sol.empresa}</strong>
        <p class="alerta-detalle__texto">${sol.nombre}</p>
        ${badgeEstado(sol.estado)}
      </div>
    </div>
    ${resumenSolicitudHTML(sol)}
    ${sol.credenciales ? `
      <div class="credencial-box">
        <div class="credencial-box__fila"><span>${t('access_req_username')}</span><code>${sol.credenciales.usuario}</code></div>
        <div class="credencial-box__fila"><span>${t('access_req_password')}</span><code>${sol.credenciales.contrasena}</code></div>
      </div>` : ''}
    ${sol.notaRechazo ? `
      <div class="alerta-detalle__seccion">
        <span class="detalle-item__label">${t('access_req_note_label')}</span>
        <p class="alerta-detalle__texto">${sol.notaRechazo}</p>
      </div>` : ''}
    ${(sol.atendidaPor) ? `
      <div class="alerta-detalle__seccion">
        <span class="detalle-item__label">${t('access_req_attended_by')}</span>
        <p class="alerta-detalle__texto">${sol.atendidaPor} · ${formatearFecha(sol.fechaAtencion)}</p>
      </div>` : ''}
    `,
    sol.estado === 'pendiente'
      ? `
        <button class="btn btn-outline" id="accesoDetalleRechazar"><i class="fa-solid fa-xmark"></i> ${t('reject')}</button>
        <button class="btn btn-primary" id="accesoDetalleAprobar"><i class="fa-solid fa-check"></i> ${t('approve')}</button>`
      : `<button class="btn btn-primary" id="accesoGestionCerrarBtn">${t('close')}</button>`
  );

  document.getElementById('accesoGestionCerrarBtn')?.addEventListener('click', cerrarModalAcceso);
  document.getElementById('accesoDetalleAprobar')?.addEventListener('click', () => abrirModalAprobar({ ...sol }));
  document.getElementById('accesoDetalleRechazar')?.addEventListener('click', () => abrirModalRechazar({ ...sol }));
}

/* ==================== Eventos ==================== */

function bindEventos() {
  const container = document.getElementById('solicitudesAccesoPage');
  if (!container) return;

  container.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filtroActual = btn.dataset.filtro;
      renderLista();
    });
  });

  const inputBusqueda = document.getElementById('accesosBusqueda');
  inputBusqueda?.addEventListener('input', (event) => {
    busqueda = event.target.value.trim();
    // Solo refresca el grid conservando el foco y el texto tecleado
    const grid = container.querySelector('.accesos-grid');
    const vacio = container.querySelector('.empty-state');
    const lista = filtrar();
    const html = lista.length > 0 ? `<div class="accesos-grid">${lista.map(renderTarjeta).join('')}</div>` : `
      <div class="empty-state">
        <i class="fa-solid fa-magnifying-glass"></i>
        <h3>${t('no_results')}</h3>
      </div>`;
    if (grid) grid.outerHTML = html; else if (vacio) vacio.outerHTML = html;
    bindAccionesTarjetas();
  });

  bindAccionesTarjetas();
}

function bindAccionesTarjetas() {
  const container = document.getElementById('solicitudesAccesoPage');
  if (!container) return;

  container.querySelectorAll('.acceso-card [data-accion]').forEach(btn => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const tarjeta = btn.closest('.acceso-card');
      const sol = solicitudes.find(s => String(s.id) === tarjeta?.dataset.id);
      if (!sol) return;
      if (btn.dataset.accion === 'aprobar') abrirModalAprobar(sol);
      else if (btn.dataset.accion === 'rechazar') abrirModalRechazar(sol);
      else abrirDetalle(sol);
    });
  });
}

/* ==================== Ciclo de vida (router) ==================== */

export async function render() {
  return `<div class="page-enter" id="solicitudesAccesoPage">${renderSkeletonCards(3)}</div>`;
}

export async function init() {
  // Solo usuarios internos (Analista / Administrador)
  if (!esInterno()) {
    window.location.hash = '#/solicitudes';
    return;
  }

  try {
    solicitudes = await http.get('solicitudesAcceso', { _sort: 'id', _order: 'desc' });
    renderLista();

    // Apertura directa desde la notificación de la campanita ("Gestionar solicitud")
    const idPendiente = sessionStorage.getItem(CLAVE_GESTIONAR);
    if (idPendiente) {
      sessionStorage.removeItem(CLAVE_GESTIONAR);
      const sol = solicitudes.find(s => String(s.id) === String(idPendiente));
      if (sol && sol.estado === 'pendiente') abrirDetalle(sol);
    }
  } catch (error) {
    const container = document.getElementById('solicitudesAccesoPage');
    if (container) {
      container.innerHTML = `
        <div class="empty-state error-state" role="alert">
          <i class="fa-solid fa-circle-exclamation"></i>
          <h3>${t('error_title')}</h3>
          <p>${error.message || t('load_error')}</p>
          <button class="btn btn-primary" onclick="location.reload()"><i class="fa-solid fa-rotate-right"></i> ${t('retry')}</button>
        </div>
      `;
    }
  }
}

destroyFn = cerrarModalAcceso;

export function destroy() {
  if (destroyFn) destroyFn();
}
