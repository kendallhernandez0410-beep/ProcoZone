/* ============================================
   ProcoZone — Aviso de cookies (estilo PROCOMER)
   ============================================ */

const CLAVE_COOKIES = 'procozone-cookies';

export function mostrarCookieConsent() {
  let decision = null;
  try {
    decision = localStorage.getItem(CLAVE_COOKIES);
  } catch {
    decision = null;
  }
  if (decision || document.getElementById('cookieConsent')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <section class="cookie-consent" id="cookieConsent" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
      <div class="cookie-consent__icon"><i class="fa-solid fa-cookie-bite"></i></div>
      <div class="cookie-consent__body">
        <strong>Este sitio utiliza cookies</strong>
        <p>Podemos utilizar cookies para el análisis de los datos de nuestros visitantes, para mejorar nuestro sitio web, mostrar contenido personalizado y brindarle una excelente experiencia en el sitio web.</p>
      </div>
      <div class="cookie-consent__actions">
        <button type="button" class="btn btn-primary btn-sm" id="cookieAceptar">Aceptar</button>
        <button type="button" class="btn btn-outline btn-sm" id="cookieRechazar">Rechazar</button>
      </div>
    </section>
  `);

  const cerrar = valor => {
    try {
      localStorage.setItem(CLAVE_COOKIES, valor);
    } catch {
      /* almacenamiento no disponible */
    }
    document.getElementById('cookieConsent')?.remove();
  };

  document.getElementById('cookieAceptar')?.addEventListener('click', () => cerrar('aceptadas'));
  document.getElementById('cookieRechazar')?.addEventListener('click', () => cerrar('rechazadas'));
}
