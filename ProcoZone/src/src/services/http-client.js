/* ============================================
   ProcoZone — Cliente HTTP con async/await
   Manejo centralizado de peticiones, errores
   y estados de carga
   ============================================ */
import { API_BASE_URL } from '../utils/constantes.js';

/**
 * Cliente HTTP basado en fetch con soporte para async/await.
 * Toda comunicación con json-server pasa por aquí.
 */
class HttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Método genérico para peticiones HTTP
   * @param {string} endpoint - Ruta relativa al baseUrl
   * @param {object} opciones - Opciones de fetch
   * @returns {Promise<any>} Datos parseados de la respuesta
   */
  async request(endpoint, opciones = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...opciones.headers
      },
      ...opciones
    };

    try {
      const response = await fetch(url, config);

      // Manejar errores HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new HttpError(
          errorData.message || `Error ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      // Manejar respuestas vacías (DELETE, etc.)
      const text = await response.text();
      return text ? JSON.parse(text) : null;

    } catch (error) {
      // Re-lanzar errores HTTP ya formateados
      if (error instanceof HttpError) throw error;
      // Error de red u otro
      throw new HttpError(
        `Error de conexión: ${error.message}`,
        0,
        null
      );
    }
  }

  /** GET - Obtener recurso(s) */
  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url);
  }

  /** GET por ID */
  async getById(endpoint, id) {
    return this.request(`${endpoint}/${id}`);
  }

  /** POST - Crear recurso */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** PUT - Actualizar recurso completo */
  async put(endpoint, id, data) {
    return this.request(`${endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** PATCH - Actualización parcial */
  async patch(endpoint, id, data) {
    return this.request(`${endpoint}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /** DELETE - Eliminar recurso */
  async delete(endpoint, id) {
    return this.request(`${endpoint}/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Ejecuta múltiples peticiones en paralelo usando Promise.all
   * @param {Array<{endpoint: string, id?: number}>} peticiones
   * @returns {Promise<Array>} Resultados en el mismo orden
   */
  async getAll(peticiones) {
    const promesas = peticiones.map(p =>
      p.id ? this.getById(p.endpoint, p.id) : this.get(p.endpoint)
    );
    return Promise.all(promesas);
  }
}

/** Error HTTP personalizado */
class HttpError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

// Instancia singleton del cliente
export const http = new HttpClient(API_BASE_URL);
export {HttpError };
