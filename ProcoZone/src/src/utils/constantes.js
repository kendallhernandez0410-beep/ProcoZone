/* ============================================
   ProcoZone — Constantes de la aplicación
   Los textos de estado son funciones para
   mantener el idioma de la UI consistente.
   ============================================ */
import { t } from './translations.js';

// Estados de solicitudes
export const ESTADOS_SOLICITUD = {
  PENDIENTE: 'pendiente',
  EN_REVISION: 'en_revision',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada'
};

// Clase de badge por estado (el texto se obtiene con estadoSolicitudTexto)
export const ESTADO_BADGE = {
  pendiente: { clase: 'badge-accent' },
  en_revision: { clase: 'badge-info' },
  aprobada: { clase: 'badge-success' },
  rechazada: { clase: 'badge-error' }
};

/** Texto traducido del estado de una solicitud */
export function estadoSolicitudTexto(estado) {
  const mapas = {
    pendiente: 'state_pending',
    en_revision: 'state_under_review',
    aprobada: 'state_approved',
    rechazada: 'state_rejected'
  };
  return mapas[estado] ? t(mapas[estado]) : estado;
}

/** Badge completo (clase + texto traducido) de una solicitud */
export function estadoSolicitudBadge(estado) {
  return { clase: ESTADO_BADGE[estado]?.clase || 'badge-info', texto: estadoSolicitudTexto(estado) };
}

// Tipos de solicitud
export const TIPOS_SOLICITUD = {
  INSTALACION: 'instalacion',
  EXPANSION: 'expansion'
};

/** Texto traducido del tipo de solicitud */
export function tipoSolicitudTexto(tipo) {
  const mapas = { instalacion: 'type_installation', expansion: 'type_expansion' };
  return mapas[tipo] ? t(mapas[tipo]) : tipo;
}

// Compatibilidad: texto según idioma actual (evitar uso nuevo)
export function TIPO_TEXTO() {
  return {
    instalacion: tipoSolicitudTexto('instalacion'),
    expansion: tipoSolicitudTexto('expansion')
  };
}

// Estados de empresa
export const ESTADOS_EMPRESA = {
  ACTIVA: 'Activa',
  EN_REVISION: 'En Revisión',
  SUSPENDIDA: 'Suspendida'
};

export const EMPRESA_ESTADO_BADGE = {
  Activa: 'badge-success',
  'En Revisión': 'badge-warning',
  Suspendida: 'badge-error'
};

/** Texto traducido del estado de una empresa */
export function empresaEstadoTexto(estado) {
  const mapas = {
    'Activa': 'company_active',
    'En Revisión': 'company_under_review',
    'Suspendida': 'company_suspended'
  };
  return mapas[estado] ? t(mapas[estado]) : estado;
}

// Niveles de riesgo IA
export const NIVELES_RIESGO = {
  BAJO: 'Bajo',
  MEDIO: 'Medio',
  ALTO: 'Alto'
};

/** Texto traducido de la recomendación de la IA */
export function recomendacionIaTexto(recomendacion) {
  const mapas = {
    'Recomendada': 'rec_recommended',
    'Revisar': 'rec_review',
    'Rechazada': 'state_rejected',
    'Aprobada': 'state_approved',
    'Aprobar': 'approve',
    'Rechazar': 'reject'
  };
  return mapas[recomendacion] ? t(mapas[recomendacion]) : recomendacion;
}

/** Texto traducido del nivel de riesgo */
export function nivelRiesgoTexto(nivel) {
  const mapas = { 'Bajo': 'risk_low', 'Medio': 'risk_medium', 'Alto': 'risk_high' };
  return mapas[nivel] ? t(mapas[nivel]) : nivel;
}

// Tipos de alerta
export const TIPOS_ALERTA = {
  CRITICA: 'critica',
  WARNING: 'warning',
  INFO: 'info'
};

export const ALERTA_BADGE = {
  critica: 'badge-error',
  warning: 'badge-warning',
  info: 'badge-info'
};

/** Texto traducido del tipo de alerta */
export function alertaTipoTexto(tipo) {
  const mapas = { critica: 'alert_critical', warning: 'alert_warning', info: 'alert_info' };
  return mapas[tipo] ? t(mapas[tipo]) : tipo;
}

// Estados de alerta
export const ESTADOS_ALERTA = {
  ABIERTA: 'abierta',
  EN_PROCESO: 'en_proceso',
  CERRADA: 'cerrada'
};

/** Texto traducido del estado de una alerta */
export function alertaEstadoTexto(estado) {
  const mapas = { abierta: 'alert_open', en_proceso: 'alert_in_process', cerrada: 'alert_closed' };
  return mapas[estado] ? t(mapas[estado]) : estado;
}

/** Texto traducido "Cumple" / "No cumple" */
export function indicadorEstadoTexto(estado) {
  return estado === 'cumple' ? t('meets') : t('does_not_meet');
}

/** Texto traducido del estado general del reporte */
export function estadoGeneralTexto(estadoGeneral) {
  return estadoGeneral === 'en_regla' ? t('in_compliance') : t('with_non_compliance');
}

/**
 * Traduce en pantalla los factores generados por la IA
 * (los datos almacenados permanecen en su idioma original)
 */
export function factorIaTexto(factor) {
  const patrones = [
    { regex: /^Sector\s+(permitido|no permitido)\s+.*?:\s*(\d+\/\d+)$/i, clave: (m) => m[1].toLowerCase() === 'permitido' ? 'ia_factor_sector_allowed' : 'ia_factor_sector_not_allowed' },
    { regex: /^Inversión proyectada:\s*(\d+\/\d+)$/i, clave: () => 'ia_factor_investment' },
    { regex: /^Inversion proyectada:\s*(\d+\/\d+)$/i, clave: () => 'ia_factor_investment' },
    { regex: /^Empleos proyectados:\s*(\d+\/\d+)$/i, clave: () => 'ia_factor_jobs' }
  ];
  for (const patron of patrones) {
    const m = factor.match(patron.regex);
    if (m) {
      const sufijo = m[m.length - 1];
      return `${t(patron.clave(m))}: ${sufijo}`;
    }
  }
  return factor;
}

// Categorías de zona franca
export const CATEGORIAS_ZF = [
  'Servicios Tecnológicos',
  'Biotecnología',
  'Manufactura Electrónica',
  'Empaques Biodegradables',
  'Análisis de Datos',
  'Materiales Compuestos',
  'Dispositivos Médicos',
  'Energías Renovables',
  'Alimentos Procesados',
  'Logística Avanzada'
];

// Zonas francas disponibles
export const ZONAS_FRANCAS = [
  'Zona Franca América',
  'Parque Logístico Atlántico',
  'Zona Franca Coyol',
  'Zona Franca El Coyol',
  'Parque Logístico Pacífico',
  'Zona Franca Ultramar',
  'Parque Tecnológico Cartago'
];

// Colores para avatares de empresas
export const AVATAR_COLORS = [
  '#0EA5A0', '#E8A838', '#10B981', '#EF4444',
  '#8B5CF6', '#EC4899', '#F59E0B', '#38BDF8'
];

// Umbrales de cumplimiento
export const UMBRALES_CUMPLIMIENTO = {
  OPTIMO: 90,
  ACEPTABLE: 70,
  CRITICO: 50
};

// URL base de la API
export const API_BASE_URL = '/api';