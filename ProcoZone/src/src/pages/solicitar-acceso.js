import { http } from '../services/http-client.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

export function render() {
  return `
    <main class="public-page access-page">
      <a class="access-page__back" href="#/login"><i class="fa-solid fa-arrow-left"></i> Volver a iniciar sesión</a>
      <section class="access-card page-enter" aria-labelledby="accessTitle">
        <div class="access-card__heading">
          <p class="eyebrow"><span></span> Acceso de empresas</p>
          <h1 id="accessTitle">Solicitar acceso</h1>
          <p>Ingresa la cédula jurídica de tu empresa para consultar las credenciales asignadas por PROCOMER.</p>
        </div>
        <form class="access-form" id="accessRequestForm">
          <div class="input-wrap"><i class="fa-regular fa-id-card"></i><input id="companyId" type="text" inputmode="numeric" placeholder="Ej. 3-101-123456" autocomplete="off" required aria-label="Cédula jurídica"></div>
          <button class="btn btn-primary" type="submit"><span>Buscar mis credenciales</span><i class="fa-solid fa-magnifying-glass"></i></button>
        </form>
        <div class="access-result" id="accessResult" aria-live="polite"></div>
      </section>
    </main>
  `;
}

function renderFound(empresa, usuario) {
  return `
    <section class="credential-result">
      <div class="credential-result__company"><i class="fa-solid fa-building"></i><div><strong>${escapeHtml(empresa.nombre)}</strong><small>${escapeHtml(empresa.zonaFranca)}</small></div><span class="badge badge-success">${escapeHtml(empresa.estado)}</span></div>
      <div class="credential-result__details">
        <p class="credential-result__success"><i class="fa-solid fa-circle-check"></i> Credenciales encontradas</p>
        <button type="button" class="company-credential selected" data-usuario="${escapeHtml(usuario.usuario)}" aria-pressed="true">
          <span><span class="company-credential__label">USUARIO</span><code>${escapeHtml(usuario.usuario)}</code></span>
          <span><span class="company-credential__label">CONTRASEÑA</span><code>${escapeHtml(usuario.contrasena)}</code></span>
        </button>
        <p class="credential-result__hint">Haz clic para seleccionar las credenciales.</p>
        <button type="button" class="btn btn-primary credential-result__action" id="goToLogin">Ir a iniciar sesión <i class="fa-solid fa-arrow-right"></i></button>
      </div>
    </section>`;
}

export function init() {
  const form = document.getElementById('accessRequestForm');
  const input = document.getElementById('companyId');
  const result = document.getElementById('accessResult');
  let selectedUser = '';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const cedulaJuridica = input.value.trim();
    if (!cedulaJuridica) return;
    result.innerHTML = '<div class="access-loading"><span class="spinner spinner-sm"></span> Buscando...</div>';
    try {
      const [empresas] = await Promise.all([
        http.get('empresas', { cedulaJuridica }),
        new Promise((resolve) => setTimeout(resolve, 500))
      ]);
      const empresa = empresas[0];
      if (!empresa) {
        result.innerHTML = '<div class="access-message access-message--error"><i class="fa-solid fa-circle-xmark"></i> Empresa no encontrada. Contacte al administrador de PROCOMER.</div>';
        return;
      }
      const usuarios = await http.get('usuarios', { empresaId: empresa.id });
      const usuario = usuarios[0];
      if (!usuario) {
        result.innerHTML = '<div class="access-message access-message--warning"><i class="fa-solid fa-clock"></i> Empresa sin usuario. Contacte al administrador para que genere sus credenciales.</div>';
        return;
      }
      selectedUser = usuario.usuario;
      result.innerHTML = renderFound(empresa, usuario);
      document.querySelector('.company-credential')?.addEventListener('click', (clickEvent) => {
        selectedUser = clickEvent.currentTarget.dataset.usuario;
        clickEvent.currentTarget.classList.add('selected');
      });
      document.getElementById('goToLogin')?.addEventListener('click', () => {
        sessionStorage.setItem('procozone-prefilled-username', selectedUser);
        window.location.hash = '#/login';
      });
    } catch (error) {
      result.innerHTML = `<div class="access-message access-message--error"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(error.message || 'No fue posible consultar las credenciales.')}</div>`;
    }
  });
}
