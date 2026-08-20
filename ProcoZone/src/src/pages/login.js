import { http } from '../services/http-client.js';
import { t } from '../utils/translations.js';

export function render() {
  return `
    <div class="public-page login-page">
      <a class="login-back" href="#/landing"><i class="fa-solid fa-arrow-left"></i> Volver al inicio</a>
      <div class="login-layout">
        <section class="login-aside">
          <a class="brand-lockup brand-lockup--light" href="#/landing"><span class="brand-mark"><i class="fa-solid fa-cubes"></i></span><span><strong>ProcoZone</strong><small>PROCOMER</small></span></a>
          <div><p class="eyebrow eyebrow--light"><span></span> Espacio de trabajo institucional</p><h1>La claridad también es una forma de avanzar.</h1><p>Accede a la plataforma para gestionar solicitudes y monitorear el cumplimiento de las empresas del régimen.</p></div>
          <div class="login-aside__meta"><span><i class="fa-solid fa-lock"></i> Acceso seguro</span><span><i class="fa-solid fa-clock"></i> Disponible 24/7</span></div>
        </section>
        <section class="login-card-wrap">
          <div class="login-card">
            <div class="login-card__heading"><p class="eyebrow">Acceso de analistas</p><h2>Bienvenido de nuevo</h2><p>Ingresa tus credenciales para continuar.</p></div>
            <form id="loginForm" class="login-form">
              <label for="loginEmail">${t('username')}</label>
              <div class="input-wrap"><i class="fa-regular fa-user"></i><input id="loginEmail" type="text" placeholder="admin o usuario" autocomplete="username" required></div>
              <label for="loginPassword">${t('password')}</label>
              <div class="input-wrap"><i class="fa-solid fa-lock"></i><input id="loginPassword" type="password" placeholder="Ingresa tu contraseña" autocomplete="current-password" required><button type="button" class="password-toggle" aria-label="Mostrar contraseña"><i class="fa-regular fa-eye"></i></button></div>
              <div class="login-options"><label class="checkbox-label"><input type="checkbox"> <span>Recordarme</span></label><button type="button" class="login-link" id="forgotPassword">¿Olvidaste tu contraseña?</button></div>
              <p class="login-error" id="loginError" role="alert"></p>
              <button class="btn btn-primary btn-lg login-submit" type="submit">Ingresar al sistema <i class="fa-solid fa-arrow-right"></i></button>
            </form>
            <div class="demo-credentials">
              <div class="demo-credentials__title"><i class="fa-solid fa-key"></i> Credenciales de demostración</div>
              <button type="button" class="credential-card" data-usuario="admin" data-contrasena="admin"><span><strong>admin</strong><small>Analista</small></span><code>admin</code><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
              <button type="button" class="credential-card" data-usuario="usuario" data-contrasena="usuario"><span><strong>usuario</strong><small>Consulta</small></span><code>usuario</code><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
            </div>
            <div class="recovery-panel" id="recoveryPanel" hidden>
              <div class="recovery-panel__heading"><i class="fa-solid fa-life-ring"></i><div><strong>Recuperar contraseña</strong><p>Ingresa tu usuario y te enviaremos instrucciones.</p></div></div>
              <form id="recoveryForm"><div class="input-wrap"><i class="fa-regular fa-user"></i><input id="recoveryUser" type="text" placeholder="Tu usuario" required></div><button class="btn btn-outline" type="submit">Solicitar recuperación</button></form>
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
    recoveryMessage.textContent = `Si el usuario "${document.getElementById('recoveryUser').value.trim()}" existe, recibirá instrucciones de recuperación.`;
  });
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      error.textContent = 'Ingresa un correo y una contraseña para continuar.';
      return;
    }
    const usuario = document.getElementById('loginEmail').value.trim();
    const contrasena = document.getElementById('loginPassword').value;
    try {
      const resultados = await http.get('usuarios', { usuario, contrasena });
      const cuenta = resultados[0];
      if (!cuenta) {
        error.textContent = 'Usuario o contraseña incorrectos.';
        return;
      }
      sessionStorage.setItem('procozone-authenticated', 'true');
      sessionStorage.setItem('procozone-session', JSON.stringify({
        id: cuenta.id,
        usuario: cuenta.usuario,
        nombre: cuenta.nombre,
        rol: cuenta.rol,
        empresaId: cuenta.empresaId ?? null
      }));
      window.location.hash = '#/';
    } catch (requestError) {
      error.textContent = requestError.message || 'No se pudo validar el acceso.';
    }
  });
}
