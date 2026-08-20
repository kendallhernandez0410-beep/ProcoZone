/* ============================================
   ProcoZone — Constantes de la aplicación
   ============================================ */

// Estados de solicitudes
export const ESTADOS_SOLICITUD = {
  PENDIENTE: 'pendiente',
  EN_REVISION: 'en_revision',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada'
};

// Mapeo de estados a badges
export const ESTADO_BADGE = {
  pendiente: { clase: 'badge-accent', texto: 'Pendiente' },
  en_revision: { clase: 'badge-info', texto: 'En Revisión' },
  aprobada: { clase: 'badge-success', texto: 'Aprobada' },
  rechazada: { clase: 'badge-error', texto: 'Rechazada' }
};

// Tipos de solicitud
export const TIPOS_SOLICITUD = {
  INSTALACION: 'instalacion',
  EXPANSION: 'expansion'
};

export const TIPO_TEXTO = {
  instalacion: 'Instalación',
  expansion: 'Expansión'
};

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

// Niveles de riesgo IA
export const NIVELES_RIESGO = {
  BAJO: 'Bajo',
  MEDIO: 'Medio',
  ALTO: 'Alto'
};

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

export const ALERTA_TEXTO = {
  critica: 'Crítica',
  warning: 'Advertencia',
  info: 'Informativa'
};

// Estados de alerta
export const ESTADOS_ALERTA = {
  ABIERTA: 'abierta',
  EN_PROCESO: 'en_proceso',
  CERRADA: 'cerrada'
};

export const ALERTA_ESTADO_TEXTO = {
  abierta: 'Abierta',
  en_proceso: 'En Proceso',
  cerrada: 'Cerrada'
};

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