const iconos = {
	success: 'fa-circle-check',
	warning: 'fa-triangle-exclamation',
	error: 'fa-circle-xmark'
};

function mostrar(tipo, titulo, mensaje) {
	const contenedor = document.getElementById('toast-container');
	if (!contenedor) return;

	const toastElement = document.createElement('div');
	toastElement.className = `toast toast--${tipo}`;
	toastElement.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
	toastElement.innerHTML = `
		<i class="fa-solid ${iconos[tipo]}" aria-hidden="true"></i>
		<div>
			<strong>${titulo}</strong>
			<p>${mensaje}</p>
		</div>
		<button type="button" class="toast__close" aria-label="Cerrar notificación">&times;</button>
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