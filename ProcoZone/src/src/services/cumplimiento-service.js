import { http } from './http-client.js';

const nombresIndicador = {
  empleos: 'Empleos',
  inversion: 'Inversión ejecutada',
  exportaciones: 'Exportaciones',
  reportesOportunos: 'Reportes a tiempo'
};

const promedio = (indicadores) => {
  const valores = Object.values(indicadores).map((indicador) => indicador.estado === 'cumple' ? 100 : 0);
  return valores.length ? Math.round(valores.reduce((suma, valor) => suma + valor, 0) / valores.length) : 0;
};

export function evaluarCumplimiento(datos, solicitud) {
  if (!solicitud) throw new Error('La empresa no posee una solicitud aprobada con compromisos para comparar.');
  const compromiso = solicitud.compromisos || solicitud.detalles || {};
  const indicadores = {
    empleos: { requerido: Number(compromiso.empleosNuevos || 0), actual: Number(datos.empleosReales), estado: Number(datos.empleosReales) >= Number(compromiso.empleosNuevos || 0) ? 'cumple' : 'incumple' },
    inversion: { requerido: Number(compromiso.inversionEstimada || 0), actual: Number(datos.inversionEjecutada), estado: Number(datos.inversionEjecutada) >= Number(compromiso.inversionEstimada || 0) ? 'cumple' : 'incumple' },
    exportaciones: { requerido: Number(compromiso.exportacionesProyectadas || 0), actual: Number(datos.exportaciones), estado: Number(datos.exportaciones) >= Number(compromiso.exportacionesProyectadas || 0) ? 'cumple' : 'incumple' },
    reportesOportunos: { requerido: Number(compromiso.reportesOportunosComprometidos || 100), actual: Number(datos.reportesOportunos), estado: Number(datos.reportesOportunos) >= Number(compromiso.reportesOportunosComprometidos || 100) ? 'cumple' : 'incumple' }
  };
  const porcentajeCumplimiento = promedio(indicadores);
  return { indicadores, porcentajeCumplimiento, estadoGeneral: porcentajeCumplimiento === 100 ? 'en_regla' : 'incumple' };
}

function crearAlerta(empresa, reporte, nombre, indicador) {
  return {
    empresaId: empresa.id,
    reporteId: reporte.id,
    tipo: 'critica',
    titulo: `Incumplimiento: ${nombresIndicador[nombre]}`,
    descripcion: `${empresa.nombre}: ${nombresIndicador[nombre]} reportado ${indicador.actual}; requerido ${indicador.requerido}.`,
    fechaCreacion: new Date().toISOString().slice(0, 10),
    estado: 'abierta',
    metrica: nombre,
    valorReportado: indicador.actual,
    valorRequerido: indicador.requerido
  };
}

export async function guardarReporteCumplimiento(datos, empresa, solicitud) {
  const evaluacion = evaluarCumplimiento(datos, solicitud);
  const reporte = await http.post('reportesCumplimiento', {
    empresaId: empresa.id,
    solicitudId: solicitud.id,
    periodo: datos.periodo,
    fechaReporte: new Date().toISOString().slice(0, 10),
    ...evaluacion
  });
  const incumplidos = Object.entries(evaluacion.indicadores).filter(([, indicador]) => indicador.estado === 'incumple');
  await Promise.all(incumplidos.map(([nombre, indicador]) => http.post('alertas', crearAlerta(empresa, reporte, nombre, indicador))));
  await http.patch('empresas', empresa.id, { porcentajeCumplimiento: evaluacion.porcentajeCumplimiento });
  return { reporte, alertasCreadas: incumplidos.length };
}
