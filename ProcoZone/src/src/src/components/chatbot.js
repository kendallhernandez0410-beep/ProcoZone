import { obtenerSesion } from '../../utils/auth.js';

const respuestas = [
  { claves: ['hola', 'ola', 'holi', 'hol', 'buenas', 'buenos dias', 'buenas tardes', 'hey', 'saludo'], texto: '¡Hola! Soy el asistente de ProcoZone. Puedo ayudarte con solicitudes, inversión, empleos y documentos legales o fiscales.' },
  { claves: ['inversion', 'invertir'], texto: 'La solicitud debe incluir la inversión proyectada, el sector productivo, los empleos generados y el respaldo legal y fiscal.' },
  { claves: ['empleo', 'empleos'], texto: 'Indica en la solicitud la cantidad de empleos nuevos que generará tu empresa y sustenta esa proyección.' },
  { claves: ['documento', 'documentos', 'fiscal', 'legal'], texto: 'Prepara el respaldo legal y fiscal de la empresa junto con la información de inversión y actividad productiva.' },
  { claves: ['solicitud', 'instalar', 'instalación'], texto: 'Para iniciar, entra en Nueva Solicitud, selecciona tu empresa, indica el tipo de trámite y completa los detalles técnicos.' },
  { claves: ['zona franca', 'zona'], texto: 'La plataforma permite registrar solicitudes de instalación o expansión en las zonas francas disponibles.' }
];

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/(.)\1{2,}/g, '$1')
    .trim();
}

function responder(pregunta) {
  const texto = normalizarTexto(pregunta);
  return respuestas.find(respuesta => respuesta.claves.some(clave => texto.includes(clave)))?.texto
    || 'Puedo orientarte sobre solicitudes, inversión, empleos, documentos legales y fiscales para ingresar a una Zona Franca.';
}

export function iniciarChatbot() {
  if (document.getElementById('chatbot')) return;
  const nombre = obtenerSesion()?.nombre || 'empresa';
  document.body.insertAdjacentHTML('beforeend', `
    <section class="chatbot" id="chatbot" aria-label="Chatbot de consultas">
      <button class="chatbot__toggle" id="chatbotToggle" type="button" aria-label="Abrir consultas"><i class="fa-solid fa-robot"></i><span>Consultas</span></button>
      <div class="chatbot__panel" id="chatbotPanel" hidden>
        <header><div><strong>Asistente ProcoZone</strong><small>Hola, ${nombre}</small></div><button id="chatbotClose" type="button" aria-label="Cerrar chatbot">&times;</button></header>
        <div class="chatbot__messages" id="chatbotMessages"><div class="chatbot__message chatbot__message--bot">¿En qué puedo ayudarte sobre tu solicitud?</div></div>
        <form id="chatbotForm"><input id="chatbotInput" type="text" placeholder="Escribe tu consulta..." required><button type="submit" aria-label="Enviar consulta"><i class="fa-solid fa-paper-plane"></i></button></form>
      </div>
    </section>
  `);
  const panel = document.getElementById('chatbotPanel');
  document.getElementById('chatbotToggle').addEventListener('click', () => { panel.hidden = !panel.hidden; });
  document.getElementById('chatbotClose').addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    panel.hidden = true;
  });
  document.getElementById('chatbotForm').addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('chatbotInput');
    const messages = document.getElementById('chatbotMessages');
    messages.insertAdjacentHTML('beforeend', `<div class="chatbot__message chatbot__message--user">${input.value}</div><div class="chatbot__message chatbot__message--bot">${responder(input.value)}</div>`);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
  });
}