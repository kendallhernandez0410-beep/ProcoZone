import { t } from '../utils/translations.js';

/* ============================================
   ProcoZone — HeroBanner (landing)
   Carrusel de imágenes aéreas con fade + tarjetas
   de categorías, estilo hero PROCOMER.com
   ============================================ */

/* Imágenes locales desde /src/assets/hero/ (hero-1.jpg, hero-2.jpg, …).
   Se ordenan numéricamente para respetar la secuencia. */
const imagenesLocales = Object.entries(
  import.meta.glob('../assets/hero/hero-*.{jpg,jpeg,png,webp}', {
    eager: true,
    query: '?url',
    import: 'default'
  })
)
  .sort(([a], [b]) => a.localeCompare(b, 'es', { numeric: true }))
  .map(([, url]) => url);

/* Respaldo mientras no se coloquen los archivos locales */
const IMAGENES_RESPALDO = [
  'https://images.unsplash.com/photo-1536147116438-62679a5e01f2?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1920&q=80'
];

const imagenes = imagenesLocales.length ? imagenesLocales : IMAGENES_RESPALDO;

const DURACION_SLIDE = 5500;

let intervaloSlides = null;

function categorias() {
  return [
    { clave: 'companies', icono: 'fa-building' },
    { clave: 'analysts', icono: 'fa-magnifying-glass-chart' },
    { clave: 'zones', icono: 'fa-map-location-dot' }
  ];
}

export function renderHeroBanner() {
  const slides = imagenes
    .map((src, i) => `
      <div class="hero-banner__slide${i === 0 ? ' is-active' : ''}">
        <img src="${src}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}" />
      </div>
    `)
    .join('');

  const dots = imagenes
    .map((_, i) => `
      <button class="hero-banner__dot${i === 0 ? ' is-active' : ''}" type="button"
        data-slide="${i}" aria-label="${t('hero_goto_slide')} ${i + 1}"></button>
    `)
    .join('');

  const cards = categorias()
    .map((cat, i) => `
      <article class="hero-category" style="background-image:
        linear-gradient(rgba(8, 20, 15, 0.62), rgba(8, 20, 15, 0.62)),
        url('${imagenes[(i + 1) % imagenes.length]}');">
        <i class="fa-solid ${cat.icono}"></i>
        <h3>${t(`cat_${cat.clave}`)}</h3>
        <p>${t(`cat_${cat.clave}_desc`)}</p>
        <a class="btn btn-primary btn-sm" href="#/login">${t('explore')} <i class="fa-solid fa-arrow-right"></i></a>
      </article>
    `)
    .join('');

  return `
    <section class="hero-banner" aria-label="${t('landing_title')}">
      <div class="hero-banner__media" aria-hidden="true">
        ${slides}
        <div class="hero-banner__overlay"></div>
      </div>

      <div class="hero-banner__inner">
        <div class="landing-copy">
          <p class="eyebrow"><span></span> ${t('landing_eyebrow')}</p>
          <h1>${t('landing_title')}</h1>
          <p class="landing-lead">${t('landing_lead')}</p>
          <div class="landing-actions">
            <a class="btn btn-primary btn-lg" href="#/login">${t('access_platform')} <i class="fa-solid fa-arrow-right"></i></a>
            <a class="text-link" href="#landing-features" data-scroll-features>${t('know_system')} <i class="fa-solid fa-arrow-down"></i></a>
          </div>
          <div class="landing-trust"><i class="fa-solid fa-shield-halved"></i> ${t('landing_trust')}</div>
        </div>

        ${imagenes.length > 1 ? `<div class="hero-banner__dots" role="group" aria-label="${t('hero_slides_label')}">${dots}</div>` : ''}
      </div>

      <div class="hero-banner__categories">${cards}</div>
    </section>
  `;
}

function activarSlide(indice) {
  document.querySelectorAll('.hero-banner__slide').forEach((slide, i) => {
    slide.classList.toggle('is-active', i === indice);
  });
  document.querySelectorAll('.hero-banner__dot').forEach((dot, i) => {
    dot.classList.toggle('is-active', i === indice);
    dot.setAttribute('aria-current', i === indice ? 'true' : 'false');
  });
}

function iniciarRotacion(desde = 0) {
  detenerRotacion();
  if (imagenes.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let actual = desde;
  intervaloSlides = setInterval(() => {
    actual = (actual + 1) % imagenes.length;
    activarSlide(actual);
  }, DURACION_SLIDE);
}

function detenerRotacion() {
  if (intervaloSlides) {
    clearInterval(intervaloSlides);
    intervaloSlides = null;
  }
}

export function iniciarHeroBanner() {
  const banner = document.querySelector('.hero-banner');
  if (!banner) return;

  iniciarRotacion();

  banner.querySelectorAll('.hero-banner__dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const indice = Number(dot.dataset.slide) || 0;
      activarSlide(indice);
      iniciarRotacion(indice);
    });
  });

  /* Scroll interno: evita que el hash-router interprete el ancla como ruta */
  const enlaceFeatures = banner.querySelector('[data-scroll-features]');
  if (enlaceFeatures) {
    enlaceFeatures.addEventListener('click', event => {
      event.preventDefault();
      document.getElementById('landing-features')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

export function destruirHeroBanner() {
  detenerRotacion();
}
