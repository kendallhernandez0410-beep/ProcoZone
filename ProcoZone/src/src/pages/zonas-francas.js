import { crearZonaFranca, listarZonasFrancas } from '../services/zonas-francas-service.js';
import { toast } from '../services/notificacion-service.js';

export function render() { return `<div class="page-enter" id="zonasPage"><div class="loading-overlay"><span class="spinner"></span>Cargando zonas francas...</div></div>`; }

export async function init() {
  const container = document.getElementById('zonasPage');
  async function cargar() {
    try {
      const zonas = await listarZonasFrancas();
      container.innerHTML = `<div class="section-header"><div><h1>Zonas francas</h1><p>Administre criterios para la evaluación de solicitudes.</p></div></div><div class="card" style="margin-bottom:var(--space-6)"><h2>Registrar zona franca</h2><form id="zonaForm" class="form-grid" style="margin-top:var(--space-4)"><div class="form-group"><label class="form-label">Nombre *</label><input class="form-input" id="zonaNombre" required></div><div class="form-group"><label class="form-label">Inversión mínima *</label><input class="form-input" id="zonaInversion" type="number" min="1" required></div><div class="form-group"><label class="form-label">Empleos mínimos *</label><input class="form-input" id="zonaEmpleos" type="number" min="1" required></div><div class="form-group form-group--full"><label class="form-label">Sectores permitidos *</label><input class="form-input" id="zonaSectores" placeholder="Separe los sectores con comas" required></div><div class="form-group form-group--full"><button class="btn btn-primary">Registrar zona</button></div></form></div><div class="cumplimiento-grid">${zonas.map((zona) => `<article class="card"><h2>${zona.nombre}</h2><p><strong>Inversión mínima:</strong> ${zona.inversionMinima}</p><p><strong>Empleos mínimos:</strong> ${zona.empleosMinimos}</p><p><strong>Sectores:</strong> ${zona.sectoresPermitidos.join(', ')}</p></article>`).join('')}</div>`;
      document.getElementById('zonaForm').addEventListener('submit', async (event) => { event.preventDefault(); const boton = event.submitter; boton.disabled = true; try { await crearZonaFranca({ nombre: document.getElementById('zonaNombre').value.trim(), inversionMinima: Number(document.getElementById('zonaInversion').value), empleosMinimos: Number(document.getElementById('zonaEmpleos').value), sectoresPermitidos: document.getElementById('zonaSectores').value.split(',').map((sector) => sector.trim()).filter(Boolean) }); toast.success('Zona registrada', 'Los criterios ya están disponibles para nuevas solicitudes.'); await cargar(); } catch (error) { toast.error('No se pudo registrar la zona', error.message); boton.disabled = false; } });
    } catch (error) { console.error(error); container.innerHTML = `<div class="empty-state"><h2>No fue posible cargar las zonas</h2><button id="retryZonas" class="btn btn-primary">Reintentar</button></div>`; document.getElementById('retryZonas').addEventListener('click', cargar); }
  }
  await cargar();
}
