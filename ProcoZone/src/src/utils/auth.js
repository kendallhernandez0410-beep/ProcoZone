export function obtenerSesion() {
  try {
    return JSON.parse(sessionStorage.getItem('procozone-session') || 'null');
  } catch {
    return null;
  }
}

export function tieneRol(rol) {
  return obtenerSesion()?.rol === rol;
}

export function esAnalista() {
  return tieneRol('Analista');
}

export function esConsulta() {
  return tieneRol('Consulta') || tieneRol('Empresa');
}

export function cerrarSesion() {
  sessionStorage.removeItem('procozone-session');
  sessionStorage.removeItem('procozone-authenticated');
  window.location.hash = '#/landing';
}
