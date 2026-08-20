export function renderLoading(mensaje = 'Cargando...') {
	return `
		<div class="loading-overlay" role="status" aria-live="polite">
			<div class="spinner" aria-hidden="true"></div>
			<span>${mensaje}</span>
		</div>
	`;
}

export function renderError(mensaje = 'No se pudo cargar la información.') {
	return `
		<div class="empty-state error-state" role="alert">
			<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
			<h3>Algo salió mal</h3>
			<p>${mensaje}</p>
			<button class="btn btn-primary" type="button">
				<i class="fa-solid fa-rotate-right" aria-hidden="true"></i> Reintentar
			</button>
		</div>
	`;
}

export function renderSkeletonCards(cantidad = 4) {
	return `
		<div class="solicitudes-grid" aria-busy="true" aria-label="Cargando solicitudes">
			${Array.from({ length: cantidad }, () => `
				<div class="card skeleton-card">
					<div class="skeleton skeleton-line skeleton-line--wide"></div>
					<div class="skeleton skeleton-line"></div>
					<div class="skeleton skeleton-line skeleton-line--short"></div>
				</div>
			`).join('')}
		</div>
	`;
}

export function renderSkeletonRows(cantidad = 5) {
	return `
		<div class="table-wrapper" aria-busy="true" aria-label="Cargando empresas">
			${Array.from({ length: cantidad }, () => `
				<div class="skeleton-table-row">
					<div class="skeleton skeleton-line skeleton-line--wide"></div>
					<div class="skeleton skeleton-line"></div>
					<div class="skeleton skeleton-line skeleton-line--short"></div>
				</div>
			`).join('')}
		</div>
	`;
}
