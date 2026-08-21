import { http } from './http-client.js';

export function validarZonaFranca(datos) {
  const errores = {};
  if (!datos.nombre?.trim()) errores.nombre = 'El nombre es requerido.';
  if (!Number.isFinite(datos.inversionMinima) || datos.inversionMinima <= 0) errores.inversionMinima = 'La inversión mínima debe ser mayor a cero.';
  if (!Number.isFinite(datos.empleosMinimos) || datos.empleosMinimos <= 0) errores.empleosMinimos = 'Los empleos mínimos deben ser mayores a cero.';
  if (!datos.sectoresPermitidos?.length) errores.sectores = 'Indique al menos un sector permitido.';
  return Object.keys(errores).length ? errores : null;
}

export async function listarZonasFrancas() {
  return http.get('zonasFrancas');
}

export async function crearZonaFranca(datos) {
  const errores = validarZonaFranca(datos);
  if (errores) throw new Error(Object.values(errores)[0]);
  return http.post('zonasFrancas', datos);
}
