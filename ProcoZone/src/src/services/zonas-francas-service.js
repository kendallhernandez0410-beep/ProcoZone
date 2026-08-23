import { http } from './http-client.js';
import { t } from '../utils/translations.js';

export function validarZonaFranca(datos) {
  const errores = {};
  if (!datos.nombre?.trim()) errores.nombre = t('zone_name_required');
  if (!Number.isFinite(datos.inversionMinima) || datos.inversionMinima <= 0) errores.inversionMinima = t('zone_min_investment');
  if (!Number.isFinite(datos.empleosMinimos) || datos.empleosMinimos <= 0) errores.empleosMinimos = t('zone_min_jobs');
  if (!datos.sectoresPermitidos?.length) errores.sectores = t('zone_sectors_required');
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
