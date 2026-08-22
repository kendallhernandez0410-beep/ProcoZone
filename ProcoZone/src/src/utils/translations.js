/* ============================================
   ProcoZone — i18n
   Diccionarios separados por idioma:
   - locales/es.json
   - locales/en.json
   API: t(), tf(), getLanguage(), setLanguage()
   ============================================ */
import es from './locales/es.json';
import en from './locales/en.json';

const translations = { es, en };

export function getLanguage() {
  const value = localStorage.getItem('procozone_language');
  return value === 'en' ? 'en' : 'es';
}

export function setLanguage(language) {
  const next = language === 'en' ? 'en' : 'es';
  localStorage.setItem('procozone_language', next);
  document.documentElement.lang = next;
  window.dispatchEvent(new CustomEvent('languagechange'));
}

export function t(key, fallback = '') {
  const lang = getLanguage();
  const text = translations[lang]?.[key] ?? translations.es[key] ?? fallback ?? key;
  return text;
}

/** Reemplaza {n} en plantillas tipo "Hace {n} días" */
export function tf(key, valor) {
  return t(key).replace('{n}', valor);
}

export { translations };
