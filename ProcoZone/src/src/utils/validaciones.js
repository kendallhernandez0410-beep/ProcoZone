import { t } from './translations.js';

/* ============================================
   ProcoZone — Validaciones de formularios
   ============================================ */

/**
 * Valida que un campo no esté vacío
 */
export function requerido(valor, nombreCampo) {
  if (!valor || (typeof valor === 'string' && valor.trim() === '')) {
    return t('validation_required_field').replace('{n}', nombreCampo);
  }
  return null;
}

/**
 * Valida que un valor sea un número positivo
 */
export function numeroPositivo(valor, nombreCampo) {
  if (valor == null || valor === '' || isNaN(Number(valor)) || Number(valor) <= 0) {
    return t('validation_positive_number').replace('{n}', nombreCampo);
  }
  return null;
}

/**
 * Valida que un valor esté dentro de un rango
 */
export function rango(valor, nombreCampo, min, max) {
  const num = Number(valor);
  if (isNaN(num) || num < min || num > max) {
    return t('validation_range').replace('{n}', nombreCampo).replace('{min}', min).replace('{max}', max);
  }
  return null;
}

/**
 * Valida formato de email
 */
export function email(valor, nombreCampo = 'Email') {
  if (!valor) return null;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(valor)) {
    return t('validation_email').replace('{n}', nombreCampo);
  }
  return null;
}

/**
 * Valida una cédula jurídica costarricense (formato básico)
 */
export function cedulaJuridica(valor) {
  if (!valor) return t('validation_legal_id_required');
  const regex = /^\d-\d{3}-\d{6}$/;
  if (!regex.test(valor)) {
    return t('validation_legal_id_format');
  }
  return null;
}

/**
 * Ejecuta múltiples validaciones y retorna la primera falla
 */
export function validarCampos(reglas) {
  const errores = {};
  let hayErrores = false;

  for (const [campo, validaciones] of Object.entries(reglas)) {
    for (const validacion of validaciones) {
      const error = validacion();
      if (error) {
        errores[campo] = error;
        hayErrores = true;
        break;
      }
    }
  }

  return hayErrores ? errores : null;
}

/**
 * Valida el formulario completo de nueva solicitud
 */
export function validarSolicitud(datos) {
  return validarCampos({
    empresaId: [() => requerido(datos.empresaId, 'Empresa')],
    tipo: [() => requerido(datos.tipo, 'Tipo de solicitud')],
    descripcion: [
      () => requerido(datos.descripcion, 'Descripción'),
      () => datos.descripcion.length < 20 ? t('desc_min_length') : null
    ],
    areaSolicitada: [
      () => requerido(datos.areaSolicitada, 'Área solicitada'),
      () => numeroPositivo(datos.areaSolicitada, 'Área solicitada'),
      () => rango(datos.areaSolicitada, 'Área solicitada', 1, 10000)
    ],
    tipoActividad: [() => requerido(datos.tipoActividad, 'Tipo de actividad')],
    inversionEstimada: [
      () => requerido(datos.inversionEstimada, 'Inversión estimada'),
      () => numeroPositivo(datos.inversionEstimada, 'Inversión estimada')
    ],
    empleosNuevos: [
      () => requerido(datos.empleosNuevos, 'Empleos nuevos'),
      () => numeroPositivo(datos.empleosNuevos, 'Empleos nuevos'),
      () => rango(datos.empleosNuevos, 'Empleos nuevos', 1, 5000)
    ]
  });
}