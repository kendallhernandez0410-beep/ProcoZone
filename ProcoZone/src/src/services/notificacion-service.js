import { t } from '../utils/translations.js';

const iconos = {
	success: 'fa-circle-check',
	warning: 'fa-triangle-exclamation',
	error: 'fa-circle-xmark'
};

/* Control anti-duplicados: una misma alerta (tipo + título + mensaje)
   solo se muestra una vez por interacción, aunque varios eventos
   (click + focus, doble submit, etc.) la disparen casi a la vez. */
const VENTANA_DEDUPLICACION_MS = 1200;
const ultimoToastPorClave = new Map();

function mostrar(tipo, titulo, mensaje) {
	const contenedor = document.getElementById('toast-container');
	if (!contenedor) return;

	const clave = `${tipo}|${titulo}|${mensaje}`;
	const ahora = Date.now();
	if (ahora - (ultimoToastPorClave.get(clave) || 0) < VENTANA_DEDUPLICACION_MS) return;
	ultimoToastPorClave.set(clave, ahora);

	const toastElement = document.createElement('div');
	toastElement.className = `toast toast--${tipo}`;
	toastElement.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
	toastElement.innerHTML = `
		<i class="fa-solid ${iconos[tipo]}" aria-hidden="true"></i>
		<div>
			<strong>${titulo}</strong>
			<p>${mensaje}</p>
		</div>
		<button type="button" class="toast__close" aria-label="${t('close_notification')}">&times;</button>
	`;

	toastElement.querySelector('.toast__close').addEventListener('click', () => toastElement.remove());
	contenedor.appendChild(toastElement);
	window.setTimeout(() => toastElement.remove(), 5000);
}

export const toast = {
	success: (titulo, mensaje) => mostrar('success', titulo, mensaje),
	warning: (titulo, mensaje) => mostrar('warning', titulo, mensaje),
	error: (titulo, mensaje) => mostrar('error', titulo, mensaje),
	info: (titulo, mensaje) => mostrar('success', titulo, mensaje)
};