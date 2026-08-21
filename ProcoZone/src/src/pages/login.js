import { http } from '../services/http-client.js';
import { t } from '../utils/translations.js';
import { guardarSesion, obtenerUsuarioRecordado, recordarUsuario } from '../utils/auth.js';

export function render() {
  const usuarioRecordado = obtenerUsuarioRecordado();
  return `
    <div class="public-page login-page">
      <a class="login-back" href="#/landing"><i class="fa-solid fa-arrow-left"></i> ${t('back_to_landing')}</a>
      <div class="login-layout">
        <section class="login-aside">
          <a class="brand-lockup brand-lockup--light" href="#/landing"><span class="brand-mark"><i class="fa-solid fa-cubes"></i></span><span><strong>ProcoZone</strong><small>PROCOMER</small></span></a>
          <div><p class="eyebrow eyebrow--light"><span></span> ${t('workspace_eyebrow')}</p><h1>${t('login_aside_title')}</h1><p>${t('login_aside_text')}</p></div>
          <div class="login-aside__meta"><span><i class="fa-solid fa-lock"></i> ${t('secure_access')}</span><span><i class="fa-solid fa-clock"></i> ${t('available_247')}</span></div>
        </section>
        <section class="login-card-wrap">
          <div class="login-card">
            <div class="login-card__heading"><p class="eyebrow">${t('access_platform')}</p><h2>${t('login_title')}</h2><p>${t('login_subtitle')}</p></div>
            <form id="loginForm" class="login-form">
              <label for="loginEmail">${t('username')}</label>
              <div class="input-wrap"><i class="fa-regular fa-user"></i><input id="loginEmail" type="text" placeholder="empresa, analista o admin" autocomplete="username" value="${usuarioRecordado}" required></div>
              <label for="loginPassword">${t('password')}</label>
              <div class="input-wrap"><i class="fa-solid fa-lock"></i><input id="loginPassword" type="password" placeholder="${t('password')}" autocomplete="current-password" required><button type="button" class="password-toggle" aria-label="${t('show_password')}"><i class="fa-regular fa-eye"></i></button></div>
              <div class="login-options"><label class="checkbox-label"><input type="checkbox" id="rememberUser" ${usuarioRecordado ? 'checked' : ''}> <span>${t('remember_user')}</span></label><button type="button" class="login-link" id="forgotPassword">${t('forgot_password')}</button></div>
              <a class="access-request-link" href="#/solicitar-acceso"><i class="fa-solid fa-building-circle-check"></i> ${t('no_username_access')}</a>
              <p class="login-error" id="loginError" role="alert"></p>
              <button class="btn btn-primary btn-lg login-submit" type="submit">${t('sign_in_system')} <i class="fa-solid fa-arrow-right"></i></button>
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
    const usuario = document.getElementById('loginEmail').value.trim();
    const contrasena = document.getElementById('loginPassword').value;
    const recordar = document.getElementById('rememberUser')?.checked ?? false;
    try {
      const resultados = await http.get('usuarios', { usuario, contrasena });
      const cuenta = resultados[0];
      if (!cuenta) {
        error.textContent = t('wrong_credentials');
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
    }
  });
}
