import { t } from './translations.js';

// chatbot-keywords-respuestas.js
// Diccionario de palabras clave y respuestas para el chatbot
// Uso: import { responderPorPalabraClave } from './chatbot-keywords-respuestas.js';
//      responderPorPalabraClave('¿cómo lleno el formulario?')
// Si no encuentra nada, devuelve null (ahí decides si mandas a la IA real o das respuesta por defecto).

const REGLAS = [
  {
    palabras: ['hola', 'buenas', 'buenos días', 'buenas tardes', 'saludos', 'hey'],
    respuesta: () => t('chatbot_keyword_greeting')
  },
  {
    palabras: ['formulario', 'llenar', 'completar', 'campos', 'instalación'],
    respuesta: () => t('chatbot_keyword_form')
  },
  {
    palabras: ['requerimientos', 'requisitos', 'documentos', 'papeles'],
    respuesta: () => t('chatbot_keyword_requirements')
  },
  {
    palabras: ['reporte', 'reportes', 'cumplimiento', 'indicadores'],
    respuesta: () => t('chatbot_keyword_compliance')
  },
  {
    palabras: ['estado', 'estatus', 'mi solicitud', 'en qué va', 'aprobación', 'rechazo'],
    respuesta: () => t('chatbot_keyword_status')
  },
  {
    palabras: ['ayuda', 'auxilio', 'no entiendo', 'qué puedes hacer'],
    respuesta: () => t('chatbot_keyword_help')
  },
  {
    palabras: ['gracias', 'muchas gracias', 'te agradezco'],
    respuesta: () => t('chatbot_keyword_thanks')
  },
  {
    palabras: ['adiós', 'chao', 'hasta luego', 'nos vemos'],
    respuesta: () => t('chatbot_keyword_bye')
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
        return regla.respuesta();
      }
    }
  }

  return null; // no se encontró ninguna coincidencia
}

// Exportar también por si quieres mostrar las sugerencias en la UI del chat.
export const PALABRAS_CLAVE = REGLAS.flatMap((r) => r.palabras);
