/* ============================================
   ProcoZone — Servicio de IA para clasificación
   Simula el análisis de solicitudes con lógica
   de puntuación basada en reglas + delay async
   ============================================ */
import { http } from '../../services/http-client.js';

/**
 * Simula el tiempo de procesamiento de un modelo de IA
 * En producción, esto sería una llamada real a una API de IA
 */
function simularProcesamiento(minMs = 1200, maxMs = 2500) {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Evalúa la solicitud y genera un puntaje de afinidad
 * basado en reglas de negocio de PROCOMER
 */
function evaluarSolicitud(solicitud, empresa) {
  let puntaje = 50; // Base
  const factores = [];
  const alertas = [];

  // Factor 1: Estado de la empresa
  if (empresa.estado === 'Activa') {
    puntaje += 15;
    factores.push('Empresa con estado activo en el régimen');
  } else if (empresa.estado === 'En Revisión') {
    puntaje -= 10;
    factores.push('Empresa en estado de revisión — requiere atención');
    alertas.push('Estado de empresa no activo');
  } else {
    puntaje -= 30;
    factores.push('Empresa suspendida — solicitud de alto riesgo');
    alertas.push('Empresa suspendida del régimen');
  }

  // Factor 2: Cumplimiento histórico
  const cumplimiento = empresa.porcentajeCumplimiento || 0;
  if (cumplimiento >= 90) {
    puntaje += 20;
    factores.push(`Excelente historial de cumplimiento (${cumplimiento}%)`);
  } else if (cumplimiento >= 70) {
    puntaje += 5;
    factores.push(`Cumplimiento aceptable (${cumplimiento}%) pero mejorable`);
  } else if (cumplimiento >= 50) {
    puntaje -= 10;
    factores.push(`Cumplimiento bajo (${cumplimiento}%) — riesgo moderado`);
    alertas.push(`Cumplimiento del ${cumplimiento}% por debajo del mínimo óptimo`);
  } else {
    puntaje -= 25;
    factores.push(`Cumplimiento crítico (${cumplimiento}%) — riesgo alto`);
    alertas.push(`Cumplimiento crítico del ${cumplimiento}%`);
  }

  // Factor 3: Inversión estimada
  const inversion = solicitud.detalles?.inversionEstimada || 0;
  if (inversion >= 2000000) {
    puntaje += 10;
    factores.push('Inversión estimada significativa (≥ $2M)');
  } else if (inversion >= 500000) {
    puntaje += 5;
    factores.push('Inversión estimada moderada');
  } else {
    puntaje -= 5;
    factores.push('Inversión estimada baja — evaluar viabilidad');
  }

  // Factor 4: Generación de empleo
  const empleos = solicitud.detalles?.empleosNuevos || 0;
  if (empleos >= 30) {
    puntaje += 10;
    factores.push(`Generación de ${empleos} empleos nuevos — impacto positivo`);
  } else if (empleos >= 10) {
    puntaje += 5;
    factores.push(`Generación de ${empleos} empleos nuevos`);
  } else {
    factores.push(`Solo ${empleos} empleos nuevos proyectados`);
  }

  // Factor 5: Área solicitada vs. criterio
  const area = solicitud.detalles?.areaSolicitada || 0;
  if (area > 1000) {
    puntaje -= 5;
    alertas.push(`Área solicitada extensa (${area} m²) — requiere verificación`);
  }

  // Factor 6: Coherencia categoría-actividad
  const categoria = empresa.categoria || '';
  const actividad = solicitud.detalles?.tipoActividad || '';
  const palabrasClave = categoria.toLowerCase().split(' ');
  const coincide = palabrasClave.some(p => p.length > 3 && actividad.toLowerCase().includes(p));
  if (coincide || actividad.toLowerCase().includes(categoria.toLowerCase().split(' ')[0]?.toLowerCase())) {
    puntaje += 5;
    factores.push('Actividad alineada con la categoría registrada de la empresa');
  }

  // Clamp del puntaje
  puntaje = Math.max(0, Math.min(100, puntaje));

  // Determinar nivel de riesgo y recomendación
  let nivelRiesgo, recomendacion;
  if (puntaje >= 75) {
    nivelRiesgo = 'Bajo';
    recomendacion = 'Aprobar';
  } else if (puntaje >= 45) {
    nivelRiesgo = 'Medio';
    recomendacion = 'Revisar';
  } else {
    nivelRiesgo = 'Alto';
    recomendacion = 'Rechazar';
  }

  return {
    puntajeAfinidad: Math.round(puntaje),
    nivelRiesgo,
    recomendacion,
    factores,
    alertas,
    fechaClasificacion: new Date().toISOString()
  };
}

/**
 * Servicio de IA: clasifica una solicitud usando async/await
 * Simula el procesamiento y retorna la clasificación completa
 */
export async function clasificarSolicitud(solicitudId) {
  try {
    // Simular tiempo de procesamiento del modelo
    await simularProcesamiento();

    // Obtener la solicitud y la empresa en paralelo con Promise.all
    const [solicitud, empresa] = await Promise.all([
      http.getById('solicitudes', solicitudId),
      // La solicitud tiene empresaId, obtenemos la empresa
      http.get('solicitudes', { id: solicitudId }).then(([sol]) =>
        http.getById('empresas', sol.empresaId)
      )
    ]);

    // Evaluar con la lógica de reglas
    const clasificacion = evaluarSolicitud(solicitud, empresa);

    // Actualizar la solicitud con la clasificación IA
    await http.patch('solicitudes', solicitudId, {
      clasificacionIa: clasificacion
    });

    return clasificacion;

  } catch (error) {
    console.error('Error en el servicio de IA:', error);
    throw new Error('No se pudo completar la clasificación con IA. Intente nuevamente.');
  }
}

/**
 * Clasificación directa sin persistir (para previsualización)
 */
export async function preClasificar(solicitud, empresa) {
  await simularProcesamiento(600, 1200);
  return evaluarSolicitud(solicitud, empresa);
}

/**
 * Genera alertas de incumplimiento basadas en un reporte
 * usando análisis de reglas
 */
export function generarAlertasCumplimiento(reporte, empresa) {
  const alertas = [];
  const indicadores = reporte.indicadores || {};

  for (const [nombre, indicador] of Object.entries(indicadores)) {
    if (indicador.estado === 'incumple') {
      const nombreLegible = {
        exportaciones: 'Exportaciones',
        empleoNacional: 'Empleo nacional',
        inversion: 'Inversión mínima',
        reportesOportunos: 'Reportes oportunos'
      }[nombre] || nombre;

      alertas.push({
        tipo: indicador.estado === 'incumple' ? 'critica' : 'warning',
        mensaje: `${empresa.nombre}: ${nombreLegible} por debajo del mínimo requerido`
      });
    } else if (indicador.estado === 'alerta') {
      alertas.push({
        tipo: 'warning',
        mensaje: `${empresa.nombre}: ${nombre} presenta alerta`
      });
    }
  }

  return alertas;
}