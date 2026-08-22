// chatbot-keywords-respuestas.js
// Diccionario de palabras clave y respuestas para el chatbot
// Uso: import { responderPorPalabraClave } from './chatbot-keywords-respuestas.js';
//      responderPorPalabraClave('¿cómo lleno el formulario?')
// Si no encuentra nada, devuelve null (ahí decides si mandas a la IA real o das respuesta por defecto).

const REGLAS = [
  {
    palabras: ['hola', 'buenas', 'buenos días', 'buenas tardes', 'saludos', 'hey'],
    respuesta:
      '¡Hola! 👋 Soy el asistente virtual de ProcoZone. ' +
      'Puedo ayudarte con el formulario de instalación, los requerimientos, ' +
      'los reportes de cumplimiento y el estado de tu solicitud. ¿Qué necesitas?'
  },
  {
    palabras: ['formulario', 'llenar', 'completar', 'campos', 'instalación'],
    respuesta:
      '📋 Para llenar el formulario de solicitud:\n' +
      '• Selecciona tu empresa.\n' +
      '• Elige la zona franca destino.\n' +
      '• Completa actividad, área (m²), inversión estimada y empleos nuevos.\n' +
      '**Todos los campos marcados con * son obligatorios.**'
  },
  {
    palabras: ['requerimientos', 'requisitos', 'documentos', 'papeles'],
    respuesta:
      '📄 Requerimientos básicos:\n' +
      '• Cédula jurídica vigente.\n' +
      '• Documentación legal de la empresa.\n' +
      '• Certificaciones fiscales al día.\n\n' +
      'Si falta algo, la alerta de tu solicitud lo indicará como **documento pendiente**.'
  },
  {
    palabras: ['reporte', 'reportes', 'cumplimiento', 'indicadores'],
    respuesta:
      '📊 Los reportes de cumplimiento miden:\n' +
      '• Exportaciones proyectadas (%).\n' +
      '• Empleo nacional (%).\n' +
      '• Inversión mínima cumplida.\n' +
      'Puedes verlos en la sección **Reportes de Cumplimiento**.'
  },
  {
    palabras: ['estado', 'estatus', 'mi solicitud', 'en qué va', 'aprobación', 'rechazo'],
    respuesta:
      '🔍 Puedes consultar el estado de tu solicitud en la sección **Solicitudes**. ' +
      'Los estados posibles son: pendiente, en revisión, aprobada o rechazada.'
  },
  {
    palabras: ['ayuda', 'auxilio', 'no entiendo', 'qué puedes hacer'],
    respuesta:
      '🤖 Puedo ayudarte con:\n' +
      '• Cómo llenar el formulario.\n' +
      '• Requerimientos y documentos.\n' +
      '• Reportes de cumplimiento.\n' +
      '• Estado de tu solicitud.'
  },
  {
    palabras: ['gracias', 'muchas gracias', 'te agradezco'],
    respuesta: '¡Con gusto! 😊 Estoy aquí si necesitas algo más.'
  },
  {
    palabras: ['adiós', 'chao', 'hasta luego', 'nos vemos'],
    respuesta: '¡Hasta pronto! Recuerda revisar el estado de tu solicitud en la plataforma. 👋'
  }
];

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')                 // separa acentos: "días" -> "dias"
    .replace(/[\u0300-\u036f]/g, '') // elimina los acentos
    .trim();
}

export function responderPorPalabraClave(mensajeUsuario) {
  const mensaje = normalizar(mensajeUsuario);
  if (!mensaje) return null;

  for (const regla of REGLAS) {
    for (const palabra of regla.palabras) {
      if (mensaje.includes(normalizar(palabra))) {
        return regla.respuesta;
      }
    }
  }

  return null; // no se encontró ninguna coincidencia
}

// Exportar también por si quieres mostrar las sugerencias en la UI del chat.
export const PALABRAS_CLAVE = REGLAS.flatMap((r) => r.palabras);
