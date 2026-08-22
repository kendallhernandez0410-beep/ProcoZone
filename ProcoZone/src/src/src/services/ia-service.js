import { http } from '../../services/http-client.js';
import { t, tf } from '../../utils/translations.js';

function simularProcesamiento(minMs = 650, maxMs = 1200) {
  return new Promise((resolve) => setTimeout(resolve, minMs + Math.random() * (maxMs - minMs)));
}

export function evaluarSolicitud(solicitud, empresa, zonaFranca) {
  const detalles = solicitud.detalles || {};
  const requeridos = [solicitud.empresaId, solicitud.zonaFrancaId, solicitud.sector, detalles.inversionEstimada, detalles.empleosNuevos, detalles.tipoActividad, detalles.areaSolicitada, solicitud.descripcion];
  if (requeridos.some((valor) => valor === undefined || valor === null || valor === '')) throw new Error(t('ia_error_incomplete'));
  if (empresa.estado === 'Suspendida') throw new Error(t('ia_error_suspended'));
  if (!zonaFranca) throw new Error(t('ia_error_zone_not_found'));

  const sectorPermitido = zonaFranca.sectoresPermitidos.some((sector) => sector.toLowerCase() === solicitud.sector.toLowerCase());
  const puntajeSector = sectorPermitido ? 40 : 0;
  const puntajeInversion = Math.min(30, Math.round((Number(detalles.inversionEstimada) / Number(zonaFranca.inversionMinima)) * 30));
  const puntajeEmpleos = Math.min(30, Math.round((Number(detalles.empleosNuevos) / Number(zonaFranca.empleosMinimos)) * 30));
  const puntajeAfinidad = Math.max(0, Math.min(100, puntajeSector + puntajeInversion + puntajeEmpleos));
  const recomendacion = puntajeAfinidad >= 75 ? 'Recomendada' : puntajeAfinidad >= 50 ? 'Revisar' : 'Rechazada';
  const factores = [
    `Sector ${sectorPermitido ? 'permitido' : 'no permitido'} en la zona franca: ${puntajeSector}/40`,
    `Inversión proyectada: ${puntajeInversion}/30`,
    `Empleos proyectados: ${puntajeEmpleos}/30`
  ];
  return { puntajeAfinidad, recomendacion, nivelRiesgo: puntajeAfinidad >= 75 ? 'Bajo' : puntajeAfinidad >= 50 ? 'Medio' : 'Alto', factores, justificacion: factores.join('. '), fechaClasificacion: new Date().toISOString() };
}

export async function clasificarSolicitud(solicitudId) {
  try {
    await simularProcesamiento();
    const solicitud = await http.getById('solicitudes', solicitudId);
    const [empresa, zonas] = await Promise.all([http.getById('empresas', solicitud.empresaId), http.get('zonasFrancas')]);
    const clasificacion = evaluarSolicitud(solicitud, empresa, zonas.find((zona) => zona.id === solicitud.zonaFrancaId));

    /* Decisión automática según el cumplimiento del expediente:
       Recomendada (≥75) → aprobada · Rechazada (<50) → rechazada
       Revisar (50-74) → pendiente por documento/requisito faltante */
    let estadoFinal = 'pendiente';
    if (clasificacion.recomendacion === 'Recomendada') estadoFinal = 'aprobada';
    else if (clasificacion.recomendacion === 'Rechazada') estadoFinal = 'rechazada';

    const cambios = { clasificacionIa: clasificacion, estado: estadoFinal };
    if (estadoFinal === 'pendiente') cambios.observaciones = t('doc_pending_note');
    await http.patch('solicitudes', solicitudId, cambios);

    // Notificación a la empresa con el resultado de la evaluación
    const descripcion = estadoFinal === 'aprobada'
      ? `${empresa.nombre}: ${tf('alert_auto_decision_ok', clasificacion.puntajeAfinidad)}`
      : estadoFinal === 'rechazada'
        ? `${empresa.nombre}: ${tf('alert_auto_decision_no', clasificacion.puntajeAfinidad)}`
        : `${empresa.nombre}: ${tf('alert_doc_pending_desc', clasificacion.puntajeAfinidad)}`;
    await http.post('alertas', {
      empresaId: empresa.id,
      solicitudId,
      tipo: estadoFinal === 'aprobada' ? 'info' : estadoFinal === 'rechazada' ? 'critica' : 'warning',
      titulo: estadoFinal === 'aprobada'
        ? t('notif_approved_title')
        : estadoFinal === 'rechazada'
          ? t('notif_rejected_title')
          : t('alert_doc_pending_title'),
      descripcion,
      fechaCreacion: new Date().toISOString().slice(0, 10),
      estado: 'abierta'
    });

    return clasificacion;
  } catch (error) {
    console.error('Error en el servicio de IA:', error);
    throw new Error(t('ia_error_classification'));
  }
}

export async function clasificarSolicitudesPendientes() {
  const solicitudes = await http.get('solicitudes', { estado: 'pendiente' });
  return Promise.all(solicitudes.map((solicitud) => clasificarSolicitud(solicitud.id)));
}

export function generarAlertasCumplimiento(reporte, empresa) {
  return Object.entries(reporte.indicadores || {}).filter(([, indicador]) => indicador.estado === 'incumple').map(([metrica, indicador]) => ({ empresaId: empresa.id, reporteId: reporte.id, tipo: 'critica', titulo: `Incumplimiento: ${metrica}`, descripcion: `${empresa.nombre}: valor reportado ${indicador.actual}; requerido ${indicador.requerido}.`, estado: 'abierta' }));
}
