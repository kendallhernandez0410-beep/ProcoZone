/* ============================================
   ProcoZone — Utilidades de formateo
   ============================================ */

/**
 * Formatea un número como moneda en colones
 */
export function formatearMoneda(valor) {
  if (valor == null) return '—';
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
}

/**
 * Formatea un número con separadores de miles
 */
export function formatearNumero(valor) {
  if (valor == null) return '—';
  return new Intl.NumberFormat('es-CR').format(valor);
}

/**
 * Formatea una fecha ISO a formato legible
 */
export function formatearFecha(fechaISO) {
  if (!fechaISO) return '—';
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formatea una fecha ISO con hora
 */
export function formatearFechaHora(fechaISO) {
  if (!fechaISO) return '—';
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calcula tiempo relativo desde una fecha
 */
export function tiempoRelativo(fechaISO) {
  if (!fechaISO) return '';
  const ahora = new Date();
  const fecha = new Date(fechaISO);
  const diffMs = ahora - fecha;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias === 0) return 'Hoy';
  if (diffDias === 1) return 'Ayer';
  if (diffDias < 7) return `Hace ${diffDias} días`;
  if (diffDias < 30) return `Hace ${Math.floor(diffDias / 7)} semanas`;
  if (diffDias < 365) return `Hace ${Math.floor(diffDias / 30)} meses`;
  return `Hace ${Math.floor(diffDias / 365)} años`;
}

/**
 * Obtiene las iniciales de un nombre
 */
export function obtenerIniciales(nombre) {
  if (!nombre) return '??';
  return nombre
    .split(' ')
    .filter(p => p.length > 0)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}

/**
 * Trunca texto a una longitud máxima
 */
export function truncarTexto(texto, max = 100) {
  if (!texto) return '';
  if (texto.length <= max) return texto;
  return texto.substring(0, max).trim() + '...';
}

/**
 * Obtiene la clase de color para un puntaje de cumplimiento
 */
export function colorCumplimiento(puntaje) {
  if (puntaje >= 90) return 'success';
  if (puntaje >= 70) return 'warning';
  return 'error';
}

/**
 * Obtiene la clase de color para un puntaje de afinidad IA
 */
export function colorAfinidad(puntaje) {
  if (puntaje >= 75) return 'alto';
  if (puntaje >= 45) return 'medio';
  return 'bajo';
}

/**
 * Genera un color consistente para un string (para avatares)
 */
export function colorDesdeString(str) {
  if (!str) return '#0EA5A0';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colores = ['#0EA5A0', '#E8A838', '#10B981', '#EC4899', '#8B5CF6', '#F59E0B', '#38BDF8', '#EF4444'];
  return colores[Math.abs(hash) % colores.length];
}