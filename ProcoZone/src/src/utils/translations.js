const translations = {
  es: {
    dashboard: 'Dashboard',
    applications: 'Solicitudes',
    compliance: 'Cumplimiento',
    alerts: 'Alertas',
    companies: 'Empresas',
    new_application: 'Nueva Solicitud',
    principal: 'Principal',
    logout: 'Cerrar sesión',
    user: 'Usuario',
    viewer: 'Consulta',
    search_placeholder: 'Buscar...',
    language: 'Idioma',
    theme: 'Tema',
    dark_mode: 'Modo oscuro',
    light_mode: 'Modo claro',
    spanish: 'Español',
    english: 'English',
    dashboard_subtitle: 'Gestión de Zonas Francas — PROCOMER',
    all: 'Todas',
    critical: 'Críticas',
    warnings: 'Advertencias',
    info: 'Informativas',
    pending_applications: 'Solicitudes Pendientes',
    active_companies: 'Empresas Activas',
    average_compliance: 'Cumplimiento Promedio',
    open_alerts: 'Alertas Abiertas',
    recent_applications: 'Solicitudes Recientes',
    view_all: 'Ver todas',
    risk_companies: 'Empresas en Riesgo',
    see_compliance: 'Ver cumplimiento',
    recent_alerts: 'Alertas Recientes',
    no_recent_applications: 'No hay solicitudes recientes.',
    no_risk_companies: 'No hay empresas en riesgo actualmente.',
    loading_dashboard: 'Cargando datos del dashboard...',
    no_alerts: 'Sin alertas',
    no_alerts_message: 'No hay alertas del tipo seleccionado.',
    auth_user: 'Usuario',
    search_companies_placeholder: 'Buscar por nombre, cédula o zona franca...',
    no_results: 'No se encontraron resultados.',
    filter_all: 'Todos',
    pending: 'Pendientes',
    in_review: 'En Revisión',
    approved: 'Aprobadas',
    rejected: 'Rechazadas',
    no_applications: 'No hay solicitudes',
    no_application_message: 'No se encontraron solicitudes con el filtro seleccionado.',
    loading_applications: 'Cargando solicitudes...',
    loading_alerts: 'Cargando alertas...',
    loading_reports: 'Cargando reportes de cumplimiento...',
    loading_companies: 'Cargando empresas...',
    request_description: 'Complete el formulario para registrar una nueva solicitud de instalación o expansión.',
    compliance_description: 'Evaluación trimestral del cumplimiento de las empresas operando bajo el régimen de Zonas Francas.',
    alerts_description: 'Notificaciones de incumplimiento y situaciones que requieren atención.',
    search_companies: 'Buscar por nombre, cédula o zona franca...',
    no_companies: 'No se encontraron empresas',
    no_companies_message: 'Intente con un término de búsqueda diferente.',
    no_requests: 'No hay solicitudes',
    no_requests_message: 'No se encontraron solicitudes con el filtro seleccionado.',
    compliance_reports: 'Reportes de Cumplimiento',
    new_request: 'Nueva Solicitud',
    request_type: 'Tipo de Solicitud',
    description: 'Descripción de la Solicitud',
    cancel: 'Cancelar',
    submit_request: 'Enviar Solicitud'
    ,landing_eyebrow: 'Plataforma institucional PROCOMER'
    ,landing_title: 'Gestión clara para el régimen de Zonas Francas.'
    ,landing_lead: 'Centraliza solicitudes, cumplimiento y alertas en un solo espacio de trabajo para tomar decisiones con trazabilidad.'
    ,login: 'Ingresar'
    ,login_title: 'Bienvenido de nuevo'
    ,login_subtitle: 'Ingresa tus credenciales para continuar.'
    ,username: 'Usuario'
    ,password: 'Contraseña'
  },
  en: {
    dashboard: 'Dashboard',
    applications: 'Applications',
    compliance: 'Compliance',
    alerts: 'Alerts',
    companies: 'Companies',
    new_application: 'New Application',
    principal: 'Main',
    logout: 'Log out',
    user: 'User',
    viewer: 'Consultant',
    search_placeholder: 'Search...',
    language: 'Language',
    theme: 'Theme',
    dark_mode: 'Dark mode',
    light_mode: 'Light mode',
    spanish: 'Español',
    english: 'English',
    dashboard_subtitle: 'Free Zone Management — PROCOMER',
    all: 'All',
    critical: 'Critical',
    warnings: 'Warnings',
    info: 'Info',
    pending_applications: 'Pending Applications',
    active_companies: 'Active Companies',
    average_compliance: 'Average Compliance',
    open_alerts: 'Open Alerts',
    recent_applications: 'Recent Applications',
    view_all: 'View all',
    risk_companies: 'At-Risk Companies',
    see_compliance: 'View compliance',
    recent_alerts: 'Recent Alerts',
    no_recent_applications: 'No recent applications.',
    no_risk_companies: 'No companies at risk right now.',
    loading_dashboard: 'Loading dashboard data...',
    no_alerts: 'No alerts',
    no_alerts_message: 'There are no alerts for the selected type.',
    auth_user: 'User',
    search_companies_placeholder: 'Search by name, ID, or free zone...',
    no_results: 'No results found.',
    filter_all: 'All',
    pending: 'Pending',
    in_review: 'In Review',
    approved: 'Approved',
    rejected: 'Rejected',
    no_applications: 'No applications',
    no_application_message: 'No applications were found for the selected filter.',
    loading_applications: 'Loading applications...',
    loading_alerts: 'Loading alerts...',
    loading_reports: 'Loading compliance reports...',
    loading_companies: 'Loading companies...',
    request_description: 'Complete the form to register a new installation or expansion request.',
    compliance_description: 'Quarterly assessment of companies operating under the Free Trade Zone regime.',
    alerts_description: 'Notifications about non-compliance and situations requiring attention.',
    search_companies: 'Search by name, ID, or free zone...',
    no_companies: 'No companies found',
    no_companies_message: 'Try a different search term.',
    no_requests: 'No requests',
    no_requests_message: 'No requests were found for the selected filter.',
    compliance_reports: 'Compliance Reports',
    new_request: 'New Request',
    request_type: 'Request Type',
    description: 'Request Description',
    cancel: 'Cancel',
    submit_request: 'Submit Request'
    ,landing_eyebrow: 'PROCOMER institutional platform'
    ,landing_title: 'Clear management for the Free Trade Zone regime.'
    ,landing_lead: 'Centralize applications, compliance, and alerts in one workspace to make traceable decisions.'
    ,login: 'Sign in'
    ,login_title: 'Welcome back'
    ,login_subtitle: 'Enter your credentials to continue.'
    ,username: 'Username'
    ,password: 'Password'
  }
};

export function getLanguage() {
  const value = localStorage.getItem('procozone_language');
  return value === 'en' ? 'en' : 'es';
}

export function setLanguage(language) {
  const next = language === 'en' ? 'en' : 'es';
  localStorage.setItem('procozone_language', next);
  document.documentElement.lang = next;
  window.dispatchEvent(new CustomEvent('languagechange'));
}

export function t(key, fallback = '') {
  const lang = getLanguage();
  const text = translations[lang]?.[key] ?? translations.es[key] ?? fallback ?? key;
  return text;
}

export { translations };
