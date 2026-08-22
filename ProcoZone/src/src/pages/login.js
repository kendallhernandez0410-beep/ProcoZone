import { http } from '../services/http-client.js';
import { t } from '../utils/translations.js';
import { guardarSesion, obtenerUsuarioRecordado, recordarUsuario } from '../utils/auth.js';
import { abrirModalSolicitudAcceso } from '../components/modal-solicitud-acceso.js';

export function render() {
  const usuarioRecordado = obtenerUsuarioRecordado();
  return `
    <div class="public-page login-page">
      <a class="login-back" href="#/landing"><i class="fa-solid fa-arrow-left"></i> ${t('back_to_landing')}</a>
      <div class="login-layout">
        <section class="login-aside login-left-panel">
          <div class="brand-overlay-card">
            <span class="badge">${t('workspace_eyebrow')}</span>
            <h2>${t('login_aside_title')}</h2>
            <p>${t('login_aside_text')}</p>
          </div>
        </section>
        <section class="login-card-wrap login-right-panel">
          <div class="login-card">
            <div class="brand-header">
              <div class="logo-box" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
                  <path d="M3 7 L12 12 L21 7 M12 12 V22" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="brand-text">
                <span class="brand-title">ProcoZone</span>
                <span class="brand-sub">PROCOMER</span>
              </div>
            </div>
            <span class="section-subtitle">${t('access_platform')}</span>
            <h1>${t('login_title')}</h1>
            <p class="section-desc">${t('login_subtitle')}</p>
            <form id="loginForm" class="login-form">
              <label for="loginEmail">${t('username')}</label>
              <div class="input-wrap"><i class="fa-regular fa-user"></i><input id="loginEmail" type="text" placeholder="empresa, analista o admin" autocomplete="username" value="${usuarioRecordado}" required></div>
              <label for="loginPassword">${t('password')}</label>
              <div class="input-wrap"><i class="fa-solid fa-lock"></i><input id="loginPassword" type="password" placeholder="${t('password')}" autocomplete="current-password" required><button type="button" class="password-toggle" aria-label="${t('show_password')}"><i class="fa-regular fa-eye"></i></button></div>
              <div class="login-options"><label class="checkbox-label"><input type="checkbox" id="rememberUser" ${usuarioRecordado ? 'checked' : ''}> <span>${t('remember_user')}</span></label><button type="button" class="login-link" id="forgotPassword">${t('forgot_password')}</button></div>
              <p class="login-error" id="loginError" role="alert"></p>
              <button class="btn btn-primary btn-lg login-submit" id="loginSubmit" type="submit">${t('sign_in_system')} <i class="fa-solid fa-arrow-right"></i></button>
              <div class="login-alt">
                <button type="button" class="access-request-link" id="btnSolicitarAcceso"><i class="fa-solid fa-building-circle-check"></i> ${t('no_username_access')}</button>
              </div>
            </form>
            <div class="demo-credentials">
              <div class="demo-credentials__title"><i class="fa-solid fa-key"></i> ${t('demo_credentials')}</div>
              <button type="button" class="credential-card" data-usuario="empresa" data-contrasena="empresa123"><span><strong>empresa</strong><small>${t('demo_role_company')}</small></span><code>empresa123</code><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
              <button type="button" class="credential-card" data-usuario="analista" data-contrasena="analista123"><span><strong>analista</strong><small>${t('demo_role_analyst')}</small></span><code>analista123</code><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
              <button type="button" class="credential-card" data-usuario="admin" data-contrasena="admin123"><span><strong>admin</strong><small>${t('demo_role_admin')}</small></span><code>admin123</code><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
            </div>
            <div class="recovery-panel" id="recoveryPanel" hidden>
              <div class="recovery-panel__heading"><i class="fa-solid fa-life-ring"></i><div><strong>${t('recovery_title')}</strong><p>${t('recovery_subtitle')}</p></div></div>
              <form id="recoveryForm"><div class="input-wrap"><i class="fa-regular fa-user"></i><input id="recoveryUser" type="text" placeholder="${t('your_user')}" required></div><button class="btn btn-outline" type="submit">${t('request_recovery')}</button></form>
              <p class="recovery-message" id="recoveryMessage" role="status"></p>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}

export function init() {
  const form = document.getElementById('loginForm');
  const password = document.getElementById('loginPassword');
  const toggle = document.querySelector('.password-toggle');
  const error = document.getElementById('loginError');
  const forgotPassword = document.getElementById('forgotPassword');
  const recoveryPanel = document.getElementById('recoveryPanel');
  const recoveryForm = document.getElementById('recoveryForm');
  const recoveryMessage = document.getElementById('recoveryMessage');
  const usuarioPrecargado = sessionStorage.getItem('procozone-prefilled-username');
  if (usuarioPrecargado) {
    document.getElementById('loginEmail').value = usuarioPrecargado;
    sessionStorage.removeItem('procozone-prefilled-username');
    password.focus();
  }
  toggle?.addEventListener('click', () => {
    const visible = password.type === 'text';
    password.type = visible ? 'password' : 'text';
    toggle.innerHTML = `<i class="fa-regular fa-eye${visible ? '' : '-slash'}"></i>`;
  });
  forgotPassword?.addEventListener('click', () => {
    recoveryPanel.hidden = !recoveryPanel.hidden;
    if (!recoveryPanel.hidden) document.getElementById('recoveryUser')?.focus();
  });
  document.getElementById('btnSolicitarAcceso')?.addEventListener('click', abrirModalSolicitudAcceso);
  document.querySelectorAll('.credential-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.getElementById('loginEmail').value = card.dataset.usuario;
      document.getElementById('loginPassword').value = card.dataset.contrasena;
      error.textContent = '';
    });
  });
  recoveryForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    recoveryMessage.textContent = `${t('recovery_if_user')} "${document.getElementById('recoveryUser').value.trim()}" ${t('recovery_sent')}`;
  });
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      error.textContent = t('enter_credentials');
      return;
    }
    const submitBtn = document.getElementById('loginSubmit');
    const restaurarBoton = () => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `${t('sign_in_system')} <i class="fa-solid fa-arrow-right"></i>`;
    };
    const usuario = document.getElementById('loginEmail').value.trim();
    const contrasena = document.getElementById('loginPassword').value;
    const recordar = document.getElementById('rememberUser')?.checked ?? false;
    error.textContent = '';
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner spinner-sm" aria-hidden="true"></span> ${t('signing_in')}`;
    try {
      const resultados = await http.get('usuarios', { usuario, contrasena });
      const cuenta = resultados[0];
      if (!cuenta) {
        error.textContent = t('wrong_credentials');
        restaurarBoton();
        return;
      }
      guardarSesion({
        id: cuenta.id,
        usuario: cuenta.usuario,
        nombre: cuenta.nombre,
        rol: cuenta.rol,
        empresaId: cuenta.empresaId ?? null
      }, recordar);
      recordarUsuario(recordar ? cuenta.usuario : '');
      window.location.hash = '#/';
    } catch (requestError) {
      error.textContent = requestError.message || t('connection_error_login');
      restaurarBoton();
    }
  });
}
