import { crearZonaFranca, listarZonasFrancas } from '../services/zonas-francas-service.js';
import { toast } from '../services/notificacion-service.js';
import { t } from '../utils/translations.js';

export function render() { return `<div class="page-enter" id="zonasPage"><div class="loading-overlay"><span class="spinner"></span>${t('loading_default')}</div></div>`; }

export async function init() {
  const container = document.getElementById('zonasPage');
  async function cargar() {
    try {
      const zonas = await listarZonasFrancas();
      container.innerHTML = `<div class="section-header"><div><h1>${t('zones_title')}</h1><p>${t('zones_intro')}</p></div></div><div class="card" style="margin-bottom:var(--space-6)"><h2>${t('register_zone')}</h2><form id="zonaForm" class="form-grid" style="margin-top:var(--space-4)" novalidate><div class="form-group"><label class="form-label" for="zonaNombre">${t('zone_name')}</label><input class="form-input" id="zonaNombre" required></div><div class="form-group"><label class="form-label" for="zonaInversion">${t('zone_min_investment')}</label><input class="form-input" id="zonaInversion" type="number" min="1" required></div><div class="form-group"><label class="form-label" for="zonaEmpleos">${t('zone_min_jobs')}</label><input class="form-input" id="zonaEmpleos" type="number" min="1" required></div><div class="form-group form-group--full"><label class="form-label" for="zonaSectores">${t('zone_allowed_sectors')}</label><input class="form-input" id="zonaSectores" placeholder="${t('zone_sectors_placeholder')}" required></div><div class="form-group form-group--full"><button class="btn btn-primary">${t('register_zone_btn')}</button></div></form></div><div class="cumplimiento-grid">${zonas.map((zona) => `<article class="card"><h2>${zona.nombre}</h2><p><strong>${t('min_investment_label')}</strong> ${zona.inversionMinima}</p><p><strong>${t('min_jobs_label')}</strong> ${zona.empleosMinimos}</p><p><strong>${t('sectors_label')}</strong> ${zona.sectoresPermitidos.join(', ')}</p></article>`).join('')}</div>`;
      document.getElementById('zonaForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!event.target.checkValidity()) { event.target.reportValidity(); return; }
        const boton = event.submitter;
        boton.disabled = true;
        try {
          await crearZonaFranca({ nombre: document.getElementById('zonaNombre').value.trim(), inversionMinima: Number(document.getElementById('zonaInversion').value), empleosMinimos: Number(document.getElementById('zonaEmpleos').value), sectoresPermitidos: document.getElementById('zonaSectores').value.split(',').map((sector) => sector.trim()).filter(Boolean) });
          toast.success(t('zone_registered_title'), t('zone_registered_msg'));
          await cargar();
        } catch (error) {
          toast.error(t('zone_register_error'), error.message);
          boton.disabled = false;
        }
      });
    } catch (error) {
      console.error(error);
      container.innerHTML = `<div class="empty-state"><h2>${t('zones_load_error')}</h2><button id="retryZonas" class="btn btn-primary">${t('retry')}</button></div>`;
      document.getElementById('retryZonas').addEventListener('click', cargar);
    }
  }
  await cargar();
}
