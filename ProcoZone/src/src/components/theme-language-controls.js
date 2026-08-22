import { getTheme, setTheme } from '../utils/theme.js';
import { getLanguage, setLanguage, t } from '../utils/translations.js';

/* ============================================
   ProcoZone — Switches tipo píldora
   ThemeToggle (claro/oscuro) + LanguageToggle (ES/EN)
   Se renderizan en la esquina superior derecha del
   header; el estado es global y se sincroniza por
   delegación en document, por lo que sobrevive a los
   remontajes de innerHTML.
   ============================================ */

function markupSwitchIdioma() {
  const enActivo = getLanguage() === 'en';
  return `
    <button type="button"
      class="pill-switch pill-switch--lang"
      role="switch"
      aria-checked="${enActivo ? 'true' : 'false'}"
      data-switch="lang"
      aria-label="${enActivo ? t('switch_to_spanish') : t('switch_to_english')}">
      <span class="pill-switch__thumb" aria-hidden="true"></span>
      <span class="pill-switch__opt pill-switch__opt--es">ES</span>
      <span class="pill-switch__opt pill-switch__opt--en">EN</span>
    </button>
  `;
}

function markupSwitchTema() {
  const oscuro = getTheme() === 'dark';
  return `
    <button type="button"
      class="pill-switch pill-switch--theme"
      role="switch"
      aria-checked="${oscuro ? 'true' : 'false'}"
      data-switch="theme"
      aria-label="${oscuro ? t('switch_to_light') : t('switch_to_dark')}">
      <span class="pill-switch__knob" aria-hidden="true">
        <i class="fa-solid ${oscuro ? 'fa-moon' : 'fa-sun'}"></i>
      </span>
    </button>
  `;
}

/** Par de switches para la esquina superior derecha del header */
export function renderHeaderControls() {
  return `<div class="header__controls">${markupSwitchIdioma()}${markupSwitchTema()}</div>`;
}

/** Refleja el estado actual en todas las instancias montadas */
export function sincronizarControles() {
  const oscuro = getTheme() === 'dark';
  const enActivo = getLanguage() === 'en';

  document.querySelectorAll('[data-switch="theme"]').forEach(control => {
    control.setAttribute('aria-checked', oscuro ? 'true' : 'false');
    control.setAttribute('aria-label', oscuro ? t('switch_to_light') : t('switch_to_dark'));
    const knob = control.querySelector('.pill-switch__knob');
    if (knob) knob.innerHTML = `<i class="fa-solid ${oscuro ? 'fa-moon' : 'fa-sun'}"></i>`;
  });

  document.querySelectorAll('[data-switch="lang"]').forEach(control => {
    control.setAttribute('aria-checked', enActivo ? 'true' : 'false');
    control.setAttribute('aria-label', enActivo ? t('switch_to_spanish') : t('switch_to_english'));
  });
}

let delegacionActiva = false;

/**
 * Delegación única en document: cualquier [data-switch] del DOM
 * dispara el toggle sin necesidad de re-binding por remonte.
 */
export function iniciarControlesGlobales() {
  if (delegacionActiva) return;
  delegacionActiva = true;

  document.addEventListener('click', event => {
    const control = event.target.closest('[data-switch]');
    if (!control) return;

    if (control.dataset.switch === 'theme') {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
      window.dispatchEvent(new CustomEvent('app:theme-updated'));
    } else {
      setLanguage(getLanguage() === 'en' ? 'es' : 'en');
      window.dispatchEvent(new CustomEvent('app:language-updated'));
    }
    sincronizarControles();
  });

  /* Cambios externos de estado (p. ej. seguimiento del SO) */
  document.addEventListener('themechange', sincronizarControles);
  document.addEventListener('languagechange', sincronizarControles);
}

/* Alias de compatibilidad con llamadas existentes */
export function bindThemeLanguageControls() {
  iniciarControlesGlobales();
}
