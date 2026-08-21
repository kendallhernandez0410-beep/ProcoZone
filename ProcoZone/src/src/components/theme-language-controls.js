import { getTheme, setTheme } from '../utils/theme.js';
import { getLanguage, setLanguage, t } from '../utils/translations.js';

export function renderThemeLanguageControls() {
  const currentTheme = getTheme();
  const currentLanguage = getLanguage();

  return `
    <label class="language-switch" for="languageToggle">
      <span>${t('language')}</span>
      <span class="language-switch__control">
        <span class="language-switch__option">ES</span>
        <input id="languageToggle" type="checkbox" role="switch" aria-label="${t('language')}" ${currentLanguage === 'en' ? 'checked' : ''} />
        <span class="language-switch__slider"><i class="fa-solid fa-hand-pointer"></i></span>
        <span class="language-switch__option">EN</span>
      </span>
    </label>
    <label class="theme-switch" for="themeToggle">
      <span>${t('theme')}</span>
      <span class="theme-switch__control">
        <span class="theme-switch__option">☀</span>
        <input id="themeToggle" type="checkbox" role="switch" aria-label="${t('theme')}" ${currentTheme === 'dark' ? 'checked' : ''} />
        <span class="theme-switch__slider"></span>
        <span class="theme-switch__option">☾</span>
      </span>
    </label>
  `;
}

export function bindThemeLanguageControls() {
  const languageToggle = document.getElementById('languageToggle');
  const themeToggle = document.getElementById('themeToggle');

  languageToggle?.addEventListener('change', (event) => {
    setLanguage(event.target.checked ? 'en' : 'es');
    window.dispatchEvent(new CustomEvent('app:language-updated'));
  });

  themeToggle?.addEventListener('change', (event) => {
    const nextTheme = event.target.checked ? 'dark' : 'light';
    setTheme(nextTheme);
    window.dispatchEvent(new CustomEvent('app:theme-updated'));
  });
}
