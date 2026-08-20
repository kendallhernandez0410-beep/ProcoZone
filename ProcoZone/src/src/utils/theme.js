const THEME_KEY = 'procozone_theme';

export function getTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'dark' ? 'dark' : 'light';
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
