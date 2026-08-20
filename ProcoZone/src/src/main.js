/* ============================================
   ProcoZone — Punto de entrada principal
   ============================================ */

// Estilos
import './styles/main.css';
import './styles/dashboard.css';
import './styles/solicitudes.css';
import './styles/empresas.css';
import './styles/cumplimiento.css';

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  import('./app.js').then(({ iniciarApp }) => {
    iniciarApp();
  }).catch(error => {
    console.error('Error crítico al iniciar ProcoZone:', error);
    document.getElementById('app').innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 1rem; color: #EF4444;">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem;"></i>
        <h2>Error al iniciar la aplicación</h2>
        <p style="color: #64748B;">${error.message}</p>
        <button onclick="location.reload()" style="padding: 8px 20px; background: #0EA5A0; color: white; border: none; border-radius: 8px; cursor: pointer;">Reintentar</button>
      </div>
    `;
  });
});