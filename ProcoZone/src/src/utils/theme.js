const THEME_KEY = 'procozone_theme';

/** Preferencia del sistema operativo (prefers-color-scheme) */
function preferenciaSistema() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Tema activo: primero la elección guardada del usuario;
 * si nunca eligió, se respeta la preferencia del SO.
 */
export function getTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return preferenciaSistema();
}

export function setTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, nextTheme);
  document.documentElement.setAttribute('data-theme', nextTheme);
  window.dispatchEvent(new CustomEvent('themechange'));
}

export function applyTheme(theme = getTheme()) {
  document.documentElement.setAttribute('data-theme', theme);
}

/* Si el usuario no ha elegido nada, el tema sigue los cambios del SO en vivo */
window.matchMedia?.('(prefers-color-scheme: dark)')?.addEventListener?.('change', (event) => {
  if (!localStorage.getItem(THEME_KEY)) {
    document.documentElement.setAttribute('data-theme', event.matches ? 'dark' : 'light');
    window.dispatchEvent(new CustomEvent('themechange'));
  }
});
