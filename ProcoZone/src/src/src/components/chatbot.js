import { obtenerSesion, esEmpresa } from '../../utils/auth.js';
import { t, getLanguage } from '../../utils/translations.js';
import { responderPorPalabraClave } from '../../utils/chatbot-keywords-respuestas.js';

/* ============================================
   ProcoZone — Chatbot con IA local simulada
   Motor de coincidencia por similitud (bigramas),
   sinónimos, sugerencias y preguntas rápidas
   ============================================ */

/* ---------- Base de conocimiento bilingüe ---------- */
const temas = [
  {
    id: 'saludo',
    claves: ['hola', 'holi', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'saludos', 'que tal', 'hello', 'hi', 'good morning', 'good afternoon', 'greetings'],
    respuesta: {
      es: '¡Hola! Soy el asistente virtual de ProcoZone. Puedo orientarte sobre solicitudes, inversión, empleos, documentos, zonas francas y el estado de tus trámites. ¿Qué necesitas saber?',
      en: "Hello! I'm the ProcoZone virtual assistant. I can help you with applications, investment, jobs, documents, free zones, and the status of your procedures. What would you like to know?"
    },
    sugerencias: {
      es: ['¿Cómo creo una solicitud?', '¿Qué documentos necesito?', '¿Cómo consulto el estado de mi solicitud?'],
      en: ['How do I create an application?', 'What documents do I need?', 'How do I check my application status?']
    }
  },
  {
    id: 'solicitud',
    claves: ['solicitud', 'solicitudes', 'nueva solicitud', 'crear solicitud', 'hacer una solicitud', 'tramite', 'instalacion', 'expansion', 'instalarme', 'registrar', 'inscripcion', 'empezar', 'application', 'applications', 'new application', 'create application', 'procedure', 'installation', 'expansion', 'register'],
    respuesta: {
      es: 'Para crear una solicitud entra en "Nueva Solicitud", selecciona tu empresa, indica el tipo de trámite (instalación o expansión) y completa los detalles técnicos: actividad, área solicitada, inversión estimada y empleos nuevos. Un analista validará tu documentación y te notificaremos el resultado por correo y en la plataforma.',
      en: 'To create an application go to "New Application", select your company, choose the procedure type (installation or expansion) and complete the technical details: activity, requested area, estimated investment, and new jobs. An analyst will validate your documentation and we will notify you of the result by email and on the platform.'
    },
    sugerencias: {
      es: ['¿Qué documentos necesito?', '¿Cuánto tarda la revisión?', '¿Cómo consulto el estado de mi solicitud?'],
      en: ['What documents do I need?', 'How long does the review take?', 'How do I check my application status?']
    }
  },
  {
    id: 'estado',
    claves: ['estado', 'estatus', 'aprobada', 'pendiente', 'en revision', 'aprobacion', 'rechazo', 'resultado', 'respuesta', 'cuando responde', 'que paso con mi solicitud', 'status', 'approved', 'pending', 'under review', 'rejected', 'result', 'response', 'application status'],
    respuesta: {
      es: 'Puedes consultar el estado de tus solicitudes en la sección "Solicitudes" o en el icono de la campana de alertas. Los estados posibles son: pendiente, en revisión, aprobada o rechazada. Cuando haya una decisión recibirás un correo y una notificación dentro de la plataforma.',
      en: 'You can check the status of your applications in the "Applications" section or via the alerts bell icon. Possible statuses are: pending, under review, approved, or rejected. When there is a decision you will receive an email and a notification inside the platform.'
    },
    sugerencias: {
      es: ['¿Cuánto tarda la revisión?', '¿Qué pasa si mi solicitud es rechazada?'],
      en: ['How long does the review take?', 'What if my application is rejected?']
    }
  },
  {
    id: 'inversion',
    claves: ['inversion', 'invertir', 'invierto', 'monto', 'dinero', 'fondos', 'presupuesto', 'cuanto invertir', 'inversion minima', 'investment', 'invest', 'capital', 'amount', 'money', 'funds', 'budget', 'minimum investment'],
    respuesta: {
      es: 'Tu solicitud debe incluir la inversión proyectada, el sector productivo, los empleos generados y el respaldo legal y fiscal correspondiente. Una inversión significativa y bien documentada mejora la afinidad de tu expediente durante la evaluación.',
      en: 'Your application must include the projected investment, the productive sector, jobs generated, and the corresponding legal and fiscal backing. A significant and well-documented investment improves the affinity of your file during evaluation.'
    },
    sugerencias: {
      es: ['¿Qué documentos necesito?', '¿Cómo creo una solicitud?'],
      en: ['What documents do I need?', 'How do I create an application?']
    }
  },
  {
    id: 'empleos',
    claves: ['empleo', 'empleos', 'emplear', 'trabajo', 'trabajadores', 'personal', 'colaboradores', 'contrataciones', 'gente', 'jobs', 'employment', 'workers', 'staff', 'hiring', 'people'],
    respuesta: {
      es: 'Indica en tu solicitud la cantidad de empleos nuevos que generará tu empresa y sustenta esa proyección. El régimen valora especialmente el porcentaje de empleo nacional: se recomienda que sea igual o superior al 90%.',
      en: 'State in your application the number of new jobs your company will generate and support that projection. The regime especially values the percentage of local employment: it is recommended to be equal to or greater than 90%.'
    },
    sugerencias: {
      es: ['¿Qué documentos necesito?', '¿Qué es el cumplimiento?'],
      en: ['What documents do I need?', 'What is compliance?']
    }
  },
  {
    id: 'documentos',
    claves: ['documento', 'documentos', 'papeles', 'requisitos', 'requerimientos', 'fiscal', 'legal', 'escritura', 'cedula', 'formularios', 'papeleo', 'documents', 'requirements', 'fiscal records', 'forms', 'paperwork'],
    respuesta: {
      es: 'Prepara el respaldo legal y fiscal de la empresa: cédula jurídica, documentación de constitución, certificaciones fiscales al día y la información de inversión y actividad productiva. Si falta algún documento, la alerta de tu solicitud lo indicará como "documento pendiente".',
      en: 'Prepare the legal and fiscal backing of the company: legal ID, incorporation documents, up-to-date tax certifications, and investment and productive activity information. If any document is missing, the alert on your application will flag it as a "pending document".'
    },
    sugerencias: {
      es: ['¿Cómo creo una solicitud?', '¿Qué pasa si mi solicitud es rechazada?'],
      en: ['How do I create an application?', 'What if my application is rejected?']
    }
  },
  {
    id: 'zona-franca',
    claves: ['zona franca', 'zonas francas', 'zona', 'parque', 'regimen', 'regimenes', 'beneficios', 'exoneraciones', 'tributarios', 'impuestos', 'free zone', 'free zones', 'park', 'regime', 'benefits', 'tax exemptions', 'taxes'],
    respuesta: {
      es: 'Las zonas francas son regímenes especiales con beneficios tributarios para empresas que se instalan en Costa Rica. La plataforma permite registrar solicitudes de instalación o expansión en los parques disponibles, como Zona Franca América, Coyol o Parque Logístico Pacífico.',
      en: 'Free zones are special regimes with tax benefits for companies operating in Costa Rica. The platform allows you to register installation or expansion applications in the available parks, such as Zona Franca América, Coyol, or Parque Logístico Pacífico.'
    },
    sugerencias: {
      es: ['¿Cómo creo una solicitud?', '¿Qué beneficios tengo?'],
      en: ['How do I create an application?', 'What benefits do I get?']
    }
  },
  {
    id: 'cumplimiento',
    claves: ['cumplimiento', 'cumple', 'reportes', 'reporte', 'indicadores', 'metricas', 'auditoria', 'supervision', 'control', 'compliance', 'reports', 'indicators', 'metrics', 'audit', 'oversight'],
    respuesta: {
      es: 'El cumplimiento se mide con indicadores como exportaciones, empleo nacional, inversión mínima y reportes oportunos. Puedes consultar los reportes de cada empresa en la sección "Reportes de Cumplimiento"; si algo incumple, el sistema genera alertas automáticamente.',
      en: 'Compliance is measured with indicators such as exports, local employment, minimum investment, and on-time reports. You can check each company\'s reports in the "Compliance Reports" section; if something does not comply, the system generates alerts automatically.'
    },
    sugerencias: {
      es: ['¿Qué pasa si incumple mi empresa?', '¿Cómo consulto el estado de mi solicitud?'],
      en: ['What happens if my company does not comply?', 'How do I check my application status?']
    }
  },
  {
    id: 'area-bodega',
    claves: ['bodega', 'bodegas', 'nave', 'local', 'area', 'metros', 'espacio', 'instalaciones', 'terreno', 'modulo', 'warehouse', 'facility', 'square meters', 'space', 'premises', 'land', 'module'],
    respuesta: {
      es: 'En tu solicitud debes indicar el área requerida en m². El sistema evalúa solicitudes desde pequeños módulos hasta naves industriales extensas; las áreas muy grandes pasan a verificación especial del analista.',
      en: 'In your application you must state the required area in m². The system evaluates applications from small modules to extensive industrial facilities; very large areas go through special verification by the analyst.'
    },
    sugerencias: {
      es: ['¿Cómo creo una solicitud?', '¿Qué documentos necesito?'],
      en: ['How do I create an application?', 'What documents do I need?']
    }
  },
  {
    id: 'tiempos',
    claves: ['tiempo', 'tarda', 'demora', 'duracion', 'plazo', 'cuando', 'rapido', 'espera', 'dias', 'time', 'how long', 'duration', 'deadline', 'wait', 'days'],
    respuesta: {
      es: 'Una vez enviada, tu solicitud queda en estado "pendiente" y pasa a validación de documentación. El tiempo depende de que tu expediente esté completo; cuando la decisión esté lista recibirás un correo y podrás verla en la plataforma.',
      en: 'Once submitted, your application remains "pending" and moves to documentation validation. The time depends on your file being complete; when the decision is ready you will receive an email and can view it on the platform.'
    },
    sugerencias: {
      es: ['¿Qué documentos necesito?', '¿Cómo consulto el estado de mi solicitud?'],
      en: ['What documents do I need?', 'How do I check my application status?']
    }
  },
  {
    id: 'rechazo',
    claves: ['rechazada', 'rechazo', 'niegan', 'negativa', 'no cumple', 'incumple', 'suspendida', 'suspension', 'rejected', 'rejection', 'denied', 'does not meet', 'non-compliance', 'suspended'],
    respuesta: {
      es: 'Si la solicitud es rechazada recibirás la notificación con el motivo y el documento pendiente señalado. Puedes corregir lo observado y presentar una nueva solicitud; el equipo de analistas puede orientarte sobre los requerimientos faltantes.',
      en: 'If the application is rejected you will receive the notification with the reason and the flagged pending document. You can correct what was noted and submit a new application; the analyst team can guide you on missing requirements.'
    },
    sugerencias: {
      es: ['¿Qué documentos necesito?', '¿Cómo consulto el estado de mi solicitud?'],
      en: ['What documents do I need?', 'How do I check my application status?']
    }
  },
  {
    id: 'contacto',
    claves: ['analista', 'humano', 'persona', 'asesor', 'contacto', 'telefono', 'correo', 'email', 'atencion', 'hablar', 'human', 'person', 'advisor', 'contact', 'phone', 'support'],
    respuesta: {
      es: 'Un analista revisará tu expediente y se comunicará contigo si requiere información adicional. También puedes escribir a soporte@procozone.cr o usar el centro de atención de PROCOMER para gestión personalizada.',
      en: 'An analyst will review your file and contact you if additional information is needed. You can also write to soporte@procozone.cr or use the PROCOMER service center for personalized assistance.'
    },
    sugerencias: {
      es: ['¿Cómo creo una solicitud?', '¿Cuánto tarda la revisión?'],
      en: ['How do I create an application?', 'How long does the review take?']
    }
  },
  {
    id: 'gracias',
    claves: ['gracias', 'muchas gracias', 'te agradezco', 'genial', 'perfecto', 'excelente', 'ok', 'vale', 'thank you', 'thanks', 'great', 'perfect', 'excellent'],
    respuesta: {
      es: '¡Con gusto! Estoy aquí para ayudarte cuando lo necesites. ¿Te puedo apoyar con algo más sobre tus trámites en ProcoZone?',
      en: 'You are welcome! I am here to help whenever you need it. Can I assist you with anything else about your procedures in ProcoZone?'
    },
    sugerencias: {
      es: ['¿Cómo creo una solicitud?', '¿Qué es una zona franca?'],
      en: ['How do I create an application?', 'What is a free zone?']
    }
  },
  {
    id: 'despedida',
    claves: ['adios', 'chao', 'hasta luego', 'nos vemos', 'bye', 'me voy', 'goodbye', 'see you later'],
    respuesta: {
      es: '¡Hasta pronto! Recuerda que puedes consultar el estado de tus solicitudes en cualquier momento. Que tengas un excelente día.',
      en: 'See you soon! Remember you can check the status of your applications at any time. Have a great day.'
    },
    sugerencias: { es: [], en: [] }
  },
  {
    id: 'ayuda',
    claves: ['ayuda', 'ayudame', 'auxilio', 'opciones', 'que puedes hacer', 'funciones', 'temas', 'informacion', 'help', 'assist me', 'options', 'what can you do', 'features', 'topics', 'information'],
    respuesta: {
      es: 'Puedo orientarte sobre: creación de solicitudes, requisitos y documentos, inversión y empleos, zonas francas y beneficios, tiempos de revisión, estados de trámites y reportes de cumplimiento. ¿Sobre cuál tema quieres saber más?',
      en: 'I can guide you on: creating applications, requirements and documents, investment and jobs, free zones and benefits, review times, application statuses, and compliance reports. Which topic would you like to know more about?'
    },
    sugerencias: {
      es: ['¿Cómo creo una solicitud?', '¿Qué documentos necesito?', '¿Qué es una zona franca?'],
      en: ['How do I create an application?', 'What documents do I need?', 'What is a free zone?']
    }
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

function idiomaChat() {
  return getLanguage();
}

function responder(pregunta) {
  const lang = idiomaChat();
  const resultado = clasificarConsulta(pregunta);
  if (!resultado) {
    return {
      texto: lang === 'en'
        ? "I'm not sure I understood. Could you rephrase it? Here are some frequently asked questions:"
        : 'No estoy seguro de haber entendido. ¿Podrías reformularla? Estas son algunas preguntas frecuentes:',
      sugerencias: lang === 'en'
        ? ['How do I create an application?', 'What documents do I need?', 'What is a free zone?']
        : ['¿Cómo creo una solicitud?', '¿Qué documentos necesito?', '¿Qué es una zona franca?']
    };
  }
  if (resultado.puntaje >= UMBRAL_ACIERTO) {
    return { texto: resultado.tema.respuesta[lang], sugerencias: resultado.tema.sugerencias[lang] };
  }
  if (resultado.puntaje >= UMBRAL_RELACION) {
    return {
      texto: lang === 'en'
        ? `Maybe you meant "${resultado.clave}". ${resultado.tema.respuesta[lang]}`
        : `Quizás te refieres a "${resultado.clave}". ${resultado.tema.respuesta[lang]}`,
      sugerencias: resultado.tema.sugerencias[lang]
    };
  }
  return {
    texto: lang === 'en'
      ? 'My specialty is free zone procedures: applications, documents, investment, jobs, and statuses. Perhaps you wanted to ask about:'
      : 'Mi especialidad son los trámites de zonas francas: solicitudes, documentos, inversión, empleos y estados de trámite. ¿Quizás quisiste preguntar por:',
    sugerencias: lang === 'en'
      ? ['How do I create an application?', 'What documents do I need?', 'How do I check my application status?']
      : ['¿Cómo creo una solicitud?', '¿Qué documentos necesito?', '¿Cómo consulto el estado de mi solicitud?']
  };
}

/* ---------- Interfaz del chatbot ---------- */
export function iniciarChatbot() {
  if (!esEmpresa()) return;
  if (document.getElementById('chatbot')) return;
  const nombre = obtenerSesion()?.nombre || t('user');
  document.body.insertAdjacentHTML('beforeend', `
    <section class="chatbot" id="chatbot" aria-label="${t('chatbot_open')}">
      <button class="chatbot__toggle" id="chatbotToggle" type="button" aria-label="${t('open_queries')}"><i class="fa-solid fa-robot"></i><span>${t('chatbot_open')}</span></button>
      <div class="chatbot__panel" id="chatbotPanel" hidden>
        <header><div><strong>${t('chatbot_title')}</strong><small>${t('chatbot_hello')}, ${escaparHtml(nombre)}</small></div><button id="chatbotClose" type="button" aria-label="${t('close_chatbot')}">&times;</button></header>
        <div class="chatbot__messages" id="chatbotMessages"></div>
        <form id="chatbotForm"><input id="chatbotInput" type="text" placeholder="${t('chatbot_input_placeholder')}" autocomplete="off" required><button type="submit" aria-label="${t('send_query')}"><i class="fa-solid fa-paper-plane"></i></button></form>
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
      // 1) Diccionario de palabras clave (respuestas guiadas del formulario)
      // 2) Fallback: motor local de similitud (bigramas + sinónimos)
      const respuesta = responderPorPalabraClave(limpia) ?? responder(limpia);
      agregarMensaje(formatearRespuesta(respuesta.texto), 'bot');
      agregarChips(respuesta.sugerencias);
    }, 500 + Math.random() * 700);
  }

  // Mensaje de bienvenida (ES usa el saludo del diccionario de palabras clave)
  const bienvenida = getLanguage() === 'en'
    ? 'Hello! I am the ProcoZone virtual assistant for your installation application. Pick a question or type your query.'
    : (responderPorPalabraClave('hola') ??
      '¡Hola! Soy el asistente virtual de ProcoZone. Selecciona una pregunta o escríbeme tu consulta.');
  agregarMensaje(formatearRespuesta(bienvenida), 'bot');
  agregarChips(getLanguage() === 'en'
    ? ['How do I fill in the form?', 'What documents do I need?', 'How do I check my application status?']
    : ['¿Cómo lleno el formulario?', 'Requerimientos', 'Reportes de cumplimiento', 'Estado de mi solicitud']);

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

/* Elimina el chatbot del DOM (se usa al salir de la página de nueva solicitud) */
export function detenerChatbot() {
  document.getElementById('chatbot')?.remove();
}
