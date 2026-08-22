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
const clavesReportadas = new Set();

/**
 * Comprueba que ambos diccionarios tengan exactamente las mismas claves.
 * Se expone para que la comprobación pueda ejecutarse también en pruebas.
 */
export function validarTraducciones() {
  const clavesEs = Object.keys(es);
  const clavesEn = Object.keys(en);
  const faltanEn = clavesEs.filter(clave => !(clave in en));
  const faltanEs = clavesEn.filter(clave => !(clave in es));
  const reporte = { faltanEn, faltanEs, valido: !faltanEn.length && !faltanEs.length };

  if (!reporte.valido) {
    console.error('[i18n] Diccionarios desincronizados.', reporte);
  }
  return reporte;
}

function reportarClaveFaltante(clave, idioma) {
  const id = `${idioma}:${clave}`;
  if (clavesReportadas.has(id)) return;
  clavesReportadas.add(id);
  // No se hace fallback silencioso: el marcador queda visible durante el desarrollo.
  console.error(`[i18n] Falta la traducción "${clave}" para el idioma "${idioma}".`);
}

export function getLanguage() {
  const value = localStorage.getItem('procozone_language');
  return value === 'en' ? 'en' : 'es';
}

export function setLanguage(language) {
  const next = language === 'en' ? 'en' : 'es';
  localStorage.setItem('procozone_language', next);
  document.documentElement.lang = next;
  window.dispatchEvent(new CustomEvent('languagechange'));
  window.dispatchEvent(new CustomEvent('app:language-updated'));
}

export function t(key, fallback = '') {
  const lang = getLanguage();
  if (typeof key !== 'string' || !key) {
    reportarClaveFaltante(String(key), lang);
    return fallback || `⟦${String(key)}⟧`;
  }
  const text = translations[lang]?.[key];
  if (text !== undefined) return text;
  reportarClaveFaltante(key, lang);
  return fallback || `⟦${key}⟧`;
}

/** Reemplaza {n} en plantillas tipo "Hace {n} días" */
export function tf(key, valor) {
  return t(key).replace('{n}', valor);
}

export { translations };

// Detecta desajustes de claves en cuanto se carga el módulo, sin esperar a que
// una pantalla intente usar la traducción faltante.
validarTraducciones();
