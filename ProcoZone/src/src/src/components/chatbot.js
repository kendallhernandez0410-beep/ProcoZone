import { obtenerSesion } from '../../utils/auth.js';

/* ============================================
   ProcoZone — Chatbot con IA local simulada
   Motor de coincidencia por similitud (bigramas),
   sinónimos, sugerencias y preguntas rápidas
   ============================================ */

/* ---------- Base de conocimiento ---------- */
const temas = [
  {
    id: 'saludo',
    claves: ['hola', 'holi', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'saludos', 'que tal'],
    respuesta: '¡Hola! Soy el asistente virtual de ProcoZone. Puedo orientarte sobre solicitudes, inversión, empleos, documentos, zonas francas y el estado de tus trámites. ¿Qué necesitas saber?',
    sugerencias: ['¿Cómo creo una solicitud?', '¿Qué documentos necesito?', '¿Cómo consulto el estado de mi solicitud?']
  },
  {
    id: 'solicitud',
    claves: ['solicitud', 'solicitudes', 'nueva solicitud', 'crear solicitud', 'hacer una solicitud', 'tramite', 'instalacion', 'expansion', 'instalarme', 'registrar', 'inscripcion', 'empezar'],
    respuesta: 'Para crear una solicitud entra en "Nueva Solicitud", selecciona tu empresa, indica el tipo de trámite (instalación o expansión) y completa los detalles técnicos: actividad, área solicitada, inversión estimada y empleos nuevos. Un analista validará tu documentación y te notificaremos el resultado por correo y en la plataforma.',
    sugerencias: ['¿Qué documentos necesito?', '¿Cuánto tarda la revisión?', '¿Cómo consulto el estado de mi solicitud?']
  },
  {
    id: 'estado',
    claves: ['estado', 'estatus', 'aprobada', 'rechazada', 'pendiente', 'en revision', 'aprobacion', 'rechazo', 'resultado', 'respuesta', 'cuando responde', 'que paso con mi solicitud'],
    respuesta: 'Puedes consultar el estado de tus solicitudes en la sección "Solicitudes" o en el icono de la campana de alertas. Los estados posibles son: pendiente, en revisión, aprobada o rechazada. Cuando haya una decisión recibirás un correo y una notificación dentro de la plataforma.',
    sugerencias: ['¿Cuánto tarda la revisión?', '¿Qué pasa si mi solicitud es rechazada?']
  },
  {
    id: 'inversion',
    claves: ['inversion', 'invertir', 'invierto', 'capital', 'monto', 'dinero', 'fondos', 'presupuesto', 'cuanto invertir', 'inversion minima'],
    respuesta: 'Tu solicitud debe incluir la inversión proyectada, el sector productivo, los empleos generados y el respaldo legal y fiscal correspondiente. Una inversión significativa y bien documentada mejora la afinidad de tu expediente durante la evaluación.',
    sugerencias: ['¿Qué documentos necesito?', '¿Cómo creo una solicitud?']
  },
  {
    id: 'empleos',
    claves: ['empleo', 'empleos', 'emplear', 'trabajo', 'trabajadores', 'personal', 'colaboradores', 'contrataciones', 'gente'],
    respuesta: 'Indica en tu solicitud la cantidad de empleos nuevos que generará tu empresa y sustenta esa proyección. El régimen valora especialmente el porcentaje de empleo nacional: se recomienda que sea igual o superior al 90%.',
    sugerencias: ['¿Qué documentos necesito?', '¿Qué es el cumplimiento?']
  },
  {
    id: 'documentos',
    claves: ['documento', 'documentos', 'papeles', 'requisitos', 'requerimientos', 'fiscal', 'legal', 'escritura', 'cedula', 'formularios', 'papeleo'],
    respuesta: 'Prepara el respaldo legal y fiscal de la empresa: cédula jurídica, documentación de constitución, certificaciones fiscales al día y la información de inversión y actividad productiva. Si falta algún documento, la alerta de tu solicitud lo indicará como "documento pendiente".',
    sugerencias: ['¿Cómo creo una solicitud?', '¿Qué pasa si mi solicitud es rechazada?']
  },
  {
    id: 'zona-franca',
    claves: ['zona franca', 'zonas francas', 'zona', 'parque', 'regimen', 'regimenes', 'beneficios', 'exoneraciones', 'tributarios', 'impuestos'],
    respuesta: 'Las zonas francas son regímenes especiales con beneficios tributarios para empresas que se instalan en Costa Rica. La plataforma permite registrar solicitudes de instalación o expansión en los parques disponibles, como Zona Franca América, Coyol o Parque Logístico Pacífico.',
    sugerencias: ['¿Cómo creo una solicitud?', '¿Qué beneficios tengo?']
  },
  {
    id: 'cumplimiento',
    claves: ['cumplimiento', 'cumple', 'reportes', 'reporte', 'indicadores', 'metricas', 'auditoria', 'supervision', 'control'],
    respuesta: 'El cumplimiento se mide con indicadores como exportaciones, empleo nacional, inversión mínima y reportes oportunos. Puedes consultar los reportes de cada empresa en la sección "Reportes de Cumplimiento"; si algo incumple, el sistema genera alertas automáticamente.',
    sugerencias: ['¿Qué pasa si incumple mi empresa?', '¿Cómo consulto el estado de mi solicitud?']
  },
  {
    id: 'area-bodega',
    claves: ['bodega', 'bodegas', 'nave', 'local', 'area', 'metros', 'espacio', 'instalaciones', 'terreno', 'modulo'],
    respuesta: 'En tu solicitud debes indicar el área requerida en m². El sistema evalúa solicitudes desde pequeños módulos hasta naves industriales extensas; las áreas muy grandes pasan a verificación especial del analista.',
    sugerencias: ['¿Cómo creo una solicitud?', '¿Qué documentos necesito?']
  },
  {
    id: 'tiempos',
    claves: ['tiempo', 'tarda', 'demora', 'duracion', 'plazo', 'cuando', 'rapido', 'espera', 'dias'],
    respuesta: 'Una vez enviada, tu solicitud queda en estado "pendiente" y pasa a validación de documentación. El tiempo depende de que tu expediente esté completo; cuando la decisión esté lista recibirás un correo y podrás verla en la plataforma.',
    sugerencias: ['¿Qué documentos necesito?', '¿Cómo consulto el estado de mi solicitud?']
  },
  {
    id: 'rechazo',
    claves: ['rechazada', 'rechazo', 'niegan', 'negativa', 'no cumple', 'incumple', 'suspendida', 'suspension'],
    respuesta: 'Si la solicitud es rechazada recibirás la notificación con el motivo y el documento pendiente señalado. Puedes corregir lo observado y presentar una nueva solicitud; el equipo de analistas puede orientarte sobre los requerimientos faltantes.',
    sugerencias: ['¿Qué documentos necesito?', '¿Cómo consulto el estado de mi solicitud?']
  },
  {
    id: 'contacto',
    claves: ['analista', 'humano', 'persona', 'asesor', 'contacto', 'telefono', 'correo', 'email', 'atencion', 'hablar'],
    respuesta: 'Un analista revisará tu expediente y se comunicará contigo si requiere información adicional. También puedes escribir a soporte@procozone.cr o usar el centro de atención de PROCOMER para gestión personalizada.',
    sugerencias: ['¿Cómo creo una solicitud?', '¿Cuánto tarda la revisión?']
  },
  {
    id: 'gracias',
    claves: ['gracias', 'muchas gracias', 'te agradezco', 'genial', 'perfecto', 'excelente', 'ok', 'vale'],
    respuesta: '¡Con gusto! Estoy aquí para ayudarte cuando lo necesites. ¿Te puedo apoyar con algo más sobre tus trámites en ProcoZone?',
    sugerencias: ['¿Cómo creo una solicitud?', '¿Qué es una zona franca?']
  },
  {
    id: 'despedida',
    claves: ['adios', 'chao', 'hasta luego', 'nos vemos', 'bye', 'me voy'],
    respuesta: '¡Hasta pronto! Recuerda que puedes consultar el estado de tus solicitudes en cualquier momento. Que tengas un excelente día.',
    sugerencias: []
  },
  {
    id: 'ayuda',
    claves: ['ayuda', 'ayudame', 'auxilio', 'opciones', 'que puedes hacer', 'funciones', 'temas', 'informacion'],
    respuesta: 'Puedo orientarte sobre: creación de solicitudes, requisitos y documentos, inversión y empleos, zonas francas y beneficios, tiempos de revisión, estados de trámites y reportes de cumplimiento. ¿Sobre cuál tema quieres saber más?',
    sugerencias: ['¿Cómo creo una solicitud?', '¿Qué documentos necesito?', '¿Qué es una zona franca?']
  }
];

/* Sinónimos: expanden la consulta del usuario antes de comparar */
const sinonimos = {
  dinero: 'inversion', plata: 'inversion', capital: 'inversion', billetes: 'inversion',
  trabajo: 'empleos', trabajos: 'empleos', trabajadores: 'empleos', empleados: 'empleos', personal: 'empleos', gente: 'empleos', colaboradores: 'empleos', puesto: 'empleos', puestos: 'empleos',
  papeles: 'documentos', papel: 'documentos', papeleo: 'documentos', permisos: 'documentos', formularios: 'documentos',
  bodega: 'bodega', nave: 'bodega', galera: 'bodega', local: 'bodega', espacio: 'bodega',
  tramite: 'solicitud', tramites: 'solicitud', proceso: 'solicitud', petitorio: 'solicitud',
  compania: 'empresa', compañia: 'empresa', negocio: 'empresa',
  demora: 'tarda', duracion: 'tarda', lapso: 'tarda',
  beneficios: 'beneficios', exoneraciones: 'beneficios', ventajas: 'beneficios',
  estatus: 'estado', situacion: 'estado', avance: 'estado'
};

const UMBRAL_ACIERTO = 0.5;
const UMBRAL_RELACION = 0.26;

/* ---------- Utilidades de texto ---------- */
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/(.)\1{2,}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function escaparHtml(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatearRespuesta(texto) {
  return escaparHtml(texto).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/* Similitud de bigramas (coeficiente de Sørensen–Dice) */
function bigramas(texto) {
  const limpio = texto.replace(/\s+/g, ' ');
  if (limpio.length < 2) return limpio ? [limpio] : [];
  const pares = [];
  for (let i = 0; i < limpio.length - 1; i++) pares.push(limpio.slice(i, i + 2));
  return pares;
}

function similitud(a, b) {
  const A = bigramas(a);
  const B = bigramas(b);
  if (!A.length || !B.length) return 0;
  const conteo = new Map();
  A.forEach(par => conteo.set(par, (conteo.get(par) || 0) + 1));
  let interseccion = 0;
  B.forEach(par => {
    const disponible = conteo.get(par) || 0;
    if (disponible > 0) {
      interseccion++;
      conteo.set(par, disponible - 1);
    }
  });
  return (2 * interseccion) / (A.length + B.length);
}

function expandirSinonimos(texto) {
  const palabras = texto.split(' ');
  const expandidas = palabras.map(palabra => sinonimos[palabra] || palabra);
  return `${palabras.join(' ')} ${expandidas.join(' ')}`.trim();
}

/* ---------- Motor de coincidencia IA ---------- */
function clasificarConsulta(pregunta) {
  const normalizada = normalizarTexto(pregunta);
  if (!normalizada) return null;

  const expandida = expandirSinonimos(normalizada);

  const puntajes = temas.map(tema => {
    let mejor = 0;
    let claveGanadora = '';
    for (const clave of tema.claves) {
      const claveNorm = normalizarTexto(clave);
      let puntaje = Math.max(
        similitud(expandida, claveNorm),
        similitud(normalizada, claveNorm)
      );
      // Coincidencia directa de palabra clave dentro de la consulta
      if (normalizada.includes(claveNorm) || claveNorm.includes(normalizada)) {
        puntaje = Math.max(puntaje, 0.92);
      }
      if (puntaje > mejor) {
        mejor = puntaje;
        claveGanadora = clave;
      }
    }
    return { tema, puntaje: mejor, clave: claveGanadora };
  }).sort((a, b) => b.puntaje - a.puntaje);

  return puntajes[0] || null;
}

function responder(pregunta) {
  const resultado = clasificarConsulta(pregunta);
  if (!resultado) {
    return {
      texto: 'No estoy seguro de haber entendido. ¿Podrías reformularla? Estas son algunas preguntas frecuentes:',
      sugerencias: ['¿Cómo creo una solicitud?', '¿Qué documentos necesito?', '¿Qué es una zona franca?']
    };
  }
  if (resultado.puntaje >= UMBRAL_ACIERTO) {
    return { texto: resultado.tema.respuesta, sugerencias: resultado.tema.sugerencias };
  }
  if (resultado.puntaje >= UMBRAL_RELACION) {
    return {
      texto: `Quizás te refieres a "${resultado.clave}". ${resultado.tema.respuesta}`,
      sugerencias: resultado.tema.sugerencias
    };
  }
  return {
    texto: 'Mi especialidad son los trámites de zonas francas: solicitudes, documentos, inversión, empleos y estados de trámite. ¿Quizás quisiste preguntar por:',
    sugerencias: ['¿Cómo creo una solicitud?', '¿Qué documentos necesito?', '¿Cómo consulto el estado de mi solicitud?']
  };
}

/* ---------- Interfaz del chatbot ---------- */
export function iniciarChatbot() {
  if (document.getElementById('chatbot')) return;
  const nombre = obtenerSesion()?.nombre || 'empresa';
  document.body.insertAdjacentHTML('beforeend', `
    <section class="chatbot" id="chatbot" aria-label="Chatbot de consultas">
      <button class="chatbot__toggle" id="chatbotToggle" type="button" aria-label="Abrir consultas"><i class="fa-solid fa-robot"></i><span>Consultas</span></button>
      <div class="chatbot__panel" id="chatbotPanel" hidden>
        <header><div><strong>Asistente Virtual ProcoZone</strong><small>Hola, ${escaparHtml(nombre)}</small></div><button id="chatbotClose" type="button" aria-label="Cerrar chatbot">&times;</button></header>
        <div class="chatbot__messages" id="chatbotMessages"></div>
        <form id="chatbotForm"><input id="chatbotInput" type="text" placeholder="Escribe tu consulta..." autocomplete="off" required><button type="submit" aria-label="Enviar consulta"><i class="fa-solid fa-paper-plane"></i></button></form>
      </div>
    </section>
  `);

  const panel = document.getElementById('chatbotPanel');
  const messages = document.getElementById('chatbotMessages');
  const input = document.getElementById('chatbotInput');

  function desplazarAbajo() {
    messages.scrollTop = messages.scrollHeight;
  }

  function agregarMensaje(html, tipo) {
    messages.insertAdjacentHTML('beforeend', `<div class="chatbot__message chatbot__message--${tipo}">${html}</div>`);
    desplazarAbajo();
  }

  function agregarChips(sugerencias) {
    if (!sugerencias?.length) return;
    const chips = sugerencias.map(s => `<button type="button" class="chatbot__chip">${escaparHtml(s)}</button>`).join('');
    messages.insertAdjacentHTML('beforeend', `<div class="chatbot__chips">${chips}</div>`);
    desplazarAbajo();
    messages.lastElementChild.querySelectorAll('.chatbot__chip').forEach(chip => {
      chip.addEventListener('click', () => procesarConsulta(chip.textContent));
    });
  }

  function mostrarEscribiendo() {
    messages.insertAdjacentHTML('beforeend', `
      <div class="chatbot__message chatbot__message--bot chatbot__typing" id="chatbotTyping">
        <span></span><span></span><span></span>
      </div>
    `);
    desplazarAbajo();
  }

  function quitarEscribiendo() {
    document.getElementById('chatbotTyping')?.remove();
  }

  function procesarConsulta(consulta) {
    const limpia = consulta.trim();
    if (!limpia) return;
    agregarMensaje(escaparHtml(limpia), 'user');
    input.value = '';
    mostrarEscribiendo();

    // Pequeña pausa para simular el "pensamiento" del modelo
    setTimeout(() => {
      quitarEscribiendo();
      const respuesta = responder(limpia);
      agregarMensaje(formatearRespuesta(respuesta.texto), 'bot');
      agregarChips(respuesta.sugerencias);
    }, 500 + Math.random() * 700);
  }

  // Mensaje de bienvenida
  agregarMensaje(formatearRespuesta(`¡Hola! Soy el asistente virtual de ProcoZone. Puedo ayudarte con solicitudes, documentos, inversión, empleos y estados de trámite. Selecciona una pregunta o escríbeme tu consulta.`), 'bot');
  agregarChips(['¿Cómo creo una solicitud?', '¿Qué documentos necesito?', '¿Cómo consulto el estado de mi solicitud?']);

  document.getElementById('chatbotToggle').addEventListener('click', () => { panel.hidden = !panel.hidden; });
  document.getElementById('chatbotClose').addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    panel.hidden = true;
  });
  document.getElementById('chatbotForm').addEventListener('submit', event => {
    event.preventDefault();
    procesarConsulta(input.value);
  });
}
