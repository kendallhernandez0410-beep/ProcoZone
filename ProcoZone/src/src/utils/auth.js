/* ============================================
   ProcoZone — Autenticación y roles
   Roles: Empresa | Analista | Administrador
   ============================================ */

const CLAVE_SESION = 'procozone-session';
const CLAVE_AUTH = 'procozone-authenticated';
const CLAVE_RECUERDAME = 'procozone-remember-user';

export function obtenerSesion() {
  try {
    const cruda = sessionStorage.getItem(CLAVE_SESION) || localStorage.getItem(CLAVE_SESION);
    return JSON.parse(cruda || 'null');
  } catch {
    return null;
  }
}

export function estaAutenticado() {
  return sessionStorage.getItem(CLAVE_AUTH) === 'true' || localStorage.getItem(CLAVE_AUTH) === 'true';
}

/**
 * Guarda la sesión. Si `recordar` es true se persiste en localStorage
 * para mantener al usuario autenticado entre sesiones del navegador.
 */
export function guardarSesion(sesion, recordar = false) {
  limpiarAlmacen();
  const almacen = recordar ? localStorage : sessionStorage;
  almacen.setItem(CLAVE_SESION, JSON.stringify(sesion));
  almacen.setItem(CLAVE_AUTH, 'true');
}

/** "Recordar usuario": guarda el nombre de usuario para precargarlo en el login */
export function recordarUsuario(usuario) {
  if (usuario) localStorage.setItem(CLAVE_RECUERDAME, usuario);
  else localStorage.removeItem(CLAVE_RECUERDAME);
}

export function obtenerUsuarioRecordado() {
  return localStorage.getItem(CLAVE_RECUERDAME) || '';
}

function limpiarAlmacen() {
  [sessionStorage, localStorage].forEach((almacen) => {
    almacen.removeItem(CLAVE_SESION);
    almacen.removeItem(CLAVE_AUTH);
  });
}

export function tieneRol(...roles) {
  return roles.includes(obtenerSesion()?.rol);
}

/** Rol 1: Empresa Solicitante / Instalada (cliente externo) */
export function esEmpresa() {
  return tieneRol('Empresa', 'Consulta');
}

/** Rol 2: Analista de la Zona Franca / Operaciones (usuario interno) */
export function esAnalista() {
  return tieneRol('Analista');
}

/** Rol 3: Administrador / Gerente de la Zona Franca (gestión y control) */
export function esAdmin() {
  return tieneRol('Administrador');
}

/** Usuarios internos (Analista o Administrador) */
export function esInterno() {
  return esAnalista() || esAdmin();
}

export function cerrarSesion() {
  limpiarAlmacen();
  window.location.hash = '#/landing';
}
