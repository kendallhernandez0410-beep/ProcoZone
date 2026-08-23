import { http } from '../services/http-client.js';
import { t } from '../utils/translations.js';
import { renderHeaderControls } from '../components/theme-language-controls.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

export function render() {
  return `
    <main class="public-page access-page">
      <div class="public-controls">${renderHeaderControls()}</div>
      <a class="access-page__back" href="#/login"><i class="fa-solid fa-arrow-left"></i> ${t('access_back')}</a>
      <section class="access-card page-enter" aria-labelledby="accessTitle">
        <div class="access-card__heading">
          <p class="eyebrow"><span></span> ${t('access_eyebrow')}</p>
          <h1 id="accessTitle">${t('access_title')}</h1>
          <p>${t('access_intro')}</p>
        </div>
        <form class="access-form" id="accessRequestForm">
          <label for="companySelect" class="access-form__label">${t('applicant_company')}</label>
          <div class="input-wrap">
            <i class="fa-solid fa-building"></i>
            <select id="companySelect" required aria-label="${t('select_your_company')}">
              <option value="" disabled selected>${t('loading_companies_select')}</option>
            </select>
          </div>
          <label for="companyId" class="access-form__label">${t('legal_id_label')}</label>
          <div class="input-wrap"><i class="fa-regular fa-id-card"></i><input id="companyId" type="text" placeholder="${t('legal_id_placeholder')}" autocomplete="off" required aria-label="${t('legal_id_label')}"></div>
          <button class="btn btn-primary" type="submit"><span>${t('find_credentials')}</span><i class="fa-solid fa-magnifying-glass"></i></button>
        </form>
        <div class="access-result" id="accessResult" aria-live="polite"></div>
      </section>
    </main>
  `;
}

function renderFound(empresa, usuario) {
  return `
    <section class="credential-result">
      <div class="credential-result__company"><i class="fa-solid fa-building"></i><div><strong>${escapeHtml(empresa.nombre)}</strong><small>${escapeHtml(empresa.zonaFranca)}</small></div><span class="badge badge-success">${t(empresa.estado === 'Activa' ? 'company_active' : empresa.estado === 'En Revisión' ? 'company_under_review' : 'company_suspended')}</span></div>
      <div class="credential-result__details">
        <p class="credential-result__success"><i class="fa-solid fa-circle-check"></i> ${t('credentials_found')}</p>
        <button type="button" class="company-credential selected" data-usuario="${escapeHtml(usuario.usuario)}" aria-pressed="true">
          <span><span class="company-credential__label">${t('user_label')}</span><code>${escapeHtml(usuario.usuario)}</code></span>
          <span><span class="company-credential__label">${t('password_label')}</span><code>${escapeHtml(usuario.contrasena)}</code></span>
        </button>
        <p class="credential-result__hint">${t('click_to_select')}</p>
        <button type="button" class="btn btn-primary credential-result__action" id="goToLogin">${t('go_to_login')} <i class="fa-solid fa-arrow-right"></i></button>
      </div>
    </section>`;
}

async function cargarEmpresas(select) {
  try {
    const empresas = await http.get('empresas');
    if (!Array.isArray(empresas) || empresas.length === 0) throw new Error('sin datos');
    const opciones = empresas.map((empresa) => `
      <option value="${empresa.id}" data-cedula="${escapeHtml(empresa.cedulaJuridica)}">
        ${escapeHtml(empresa.nombre)} — ${escapeHtml(empresa.zonaFranca)}
      </option>`).join('');
    select.innerHTML = `<option value="" disabled selected>${t('select_your_company')}</option>${opciones}`;
  } catch {
    select.innerHTML = `<option value="" disabled selected>${t('companies_load_error_select')}</option>`;
  }
}

export function init() {
  const form = document.getElementById('accessRequestForm');
  const select = document.getElementById('companySelect');
  const input = document.getElementById('companyId');
  const result = document.getElementById('accessResult');
  let selectedUser = '';

  cargarEmpresas(select);

  select.addEventListener('change', () => {
    const opcion = select.selectedOptions[0];
    const cedula = opcion?.dataset.cedula;
    if (cedula) input.value = cedula;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const cedulaJuridica = input.value.trim();
    if (!cedulaJuridica) return;
    result.innerHTML = `<div class="access-loading"><span class="spinner spinner-sm"></span> ${t('searching')}</div>`;
    try {
      const [empresas] = await Promise.all([
        http.get('empresas', { cedulaJuridica }),
        new Promise((resolve) => setTimeout(resolve, 500))
      ]);
      const empresa = empresas[0];
      if (!empresa) {
        result.innerHTML = `<div class="access-message access-message--error"><i class="fa-solid fa-circle-xmark"></i> ${t('company_not_found_msg')}</div>`;
        return;
      }
      const usuarios = await http.get('usuarios', { empresaId: empresa.id });
      const usuario = usuarios[0];
      if (!usuario) {
        result.innerHTML = `<div class="access-message access-message--warning"><i class="fa-solid fa-clock"></i> ${t('company_no_user')}</div>`;
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
      result.innerHTML = `<div class="access-message access-message--error"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(error.message || t('credentials_error'))}</div>`;
    }
  });
}
