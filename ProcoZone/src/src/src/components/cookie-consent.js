/* ============================================
   ProcoZone — Aviso de cookies (estilo PROCOMER)
   ============================================ */
import { t } from '../../utils/translations.js';

const CLAVE_COOKIES = 'procozone-cookies';

export function mostrarCookieConsent() {
  let decision = null;
  try {
    decision = localStorage.getItem(CLAVE_COOKIES);
  } catch {
    decision = null;
  }
  if (decision) return;
  if (document.getElementById('cookieConsent')) {
    document.getElementById('cookieConsent').outerHTML = renderConsentimiento();
    enlazarAcciones();
    return;
  }

  document.body.insertAdjacentHTML('beforeend', renderConsentimiento());
  enlazarAcciones();
}

function renderConsentimiento() {
  return `
    <section class="cookie-consent" id="cookieConsent" role="dialog" aria-live="polite" aria-label="${t('cookie_notice')}">
      <div class="cookie-consent__icon"><i class="fa-solid fa-cookie-bite"></i></div>
      <div class="cookie-consent__body">
        <strong>${t('cookie_title')}</strong>
        <p>${t('cookie_text')}</p>
      </div>
      <div class="cookie-consent__actions">
        <button type="button" class="btn btn-primary btn-sm" id="cookieAceptar">${t('accept')}</button>
        <button type="button" class="btn btn-outline btn-sm" id="cookieRechazar">${t('reject')}</button>
      </div>
    </section>
  `;
}

function enlazarAcciones() {
  const cerrar = valor => {
    try {
      localStorage.setItem(CLAVE_COOKIES, valor);
    } catch {
      /* almacenamiento no disponible */
    }
    document.getElementById('cookieConsent')?.remove();
  };

  document.getElementById('cookieAceptar')?.addEventListener('click', () => cerrar('aceptadas'));
  document.getElementById('cookieRechazar')?.addEventListener('click', () => cerrar('rechazadas'));
}

window.addEventListener('languagechange', () => {
  if (!localStorage.getItem(CLAVE_COOKIES) && document.getElementById('cookieConsent')) mostrarCookieConsent();
});
