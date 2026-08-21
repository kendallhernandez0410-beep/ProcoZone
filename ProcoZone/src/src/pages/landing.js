import { t } from '../utils/translations.js';

const DURACION_SLIDE = 6000;
let intervaloSlides = null;

export function render() {
  return `
    <div class="public-page landing-page">
      <nav class="landing-nav">
        <a class="brand-lockup" href="#/landing" aria-label="ProcoZone inicio">
          <span class="brand-mark"><i class="fa-solid fa-cubes"></i></span>
          <span><strong>ProcoZone</strong><small>PROCOMER</small></span>
        </a>
        <a class="btn btn-outline" href="#/login"><i class="fa-solid fa-arrow-right-to-bracket"></i> ${t('login')}</a>
      </nav>

      <main class="landing-main">
        <section class="landing-hero landing-hero--media">
          <div class="hero-media" aria-hidden="true">
            <div class="hero-media__slide is-active">
              <img src="https://images.unsplash.com/photo-1536147116438-62679a5e01f2?auto=format&fit=crop&w=1920&q=80" alt="" loading="eager" />
              <span class="hero-media__caption"><i class="fa-solid fa-leaf"></i> ${t('caption_green')}</span>
            </div>
            <div class="hero-media__slide">
              <img src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1920&q=80" alt="" loading="lazy" />
              <span class="hero-media__caption"><i class="fa-solid fa-warehouse"></i> ${t('caption_warehouse')}</span>
            </div>
            <div class="hero-media__slide">
              <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1920&q=80" alt="" loading="lazy" />
              <span class="hero-media__caption"><i class="fa-solid fa-industry"></i> ${t('caption_industry')}</span>
            </div>
            <div class="hero-media__overlay"></div>
          </div>

          <div class="landing-copy">
            <p class="eyebrow"><span></span> ${t('landing_eyebrow')}</p>
            <h1>${t('landing_title')}</h1>
            <p class="landing-lead">${t('landing_lead')}</p>
            <div class="landing-actions">
              <a class="btn btn-primary btn-lg" href="#/login">${t('access_platform')} <i class="fa-solid fa-arrow-right"></i></a>
              <a class="text-link" href="#landing-features">${t('know_system')} <i class="fa-solid fa-arrow-down"></i></a>
            </div>
            <div class="landing-trust"><i class="fa-solid fa-shield-halved"></i> ${t('landing_trust')}</div>
          </div>
          <div class="landing-visual" aria-label="Resumen de gestión ProcoZone">
            <div class="visual-grid"></div>
            <div class="visual-panel visual-panel--main">
              <div class="visual-panel__top"><span>${t('operational_summary')}</span><span class="status-dot">${t('updated')}</span></div>
              <div class="visual-score"><strong>92%</strong><span>${t('avg_compliance_short')}<br>&nbsp;</span></div>
              <div class="visual-bars"><span style="width: 92%"></span><span style="width: 76%"></span><span style="width: 84%"></span></div>
              <div class="visual-labels"><span>${t('active_companies_short')}</span><strong>24</strong><span>${t('requests_in_review')}</span><strong>08</strong></div>
            </div>
            <div class="visual-panel visual-panel--float"><i class="fa-solid fa-circle-check"></i><span>${t('processed_request')}</span><strong>+24%</strong></div>
          </div>
        </section>

        <section class="landing-features" id="landing-features">
          <div class="feature-intro"><p class="eyebrow"><span></span> ${t('feature_intro_eyebrow')}</p><h2>${t('feature_intro_title')}</h2></div>
          <div class="feature-list">
            <article><i class="fa-solid fa-file-circle-check"></i><div><h3>${t('feature1_title')}</h3><p>${t('feature1_text')}</p></div></article>
            <article><i class="fa-solid fa-chart-line"></i><div><h3>${t('feature2_title')}</h3><p>${t('feature2_text')}</p></div></article>
            <article><i class="fa-solid fa-wand-magic-sparkles"></i><div><h3>${t('feature3_title')}</h3><p>${t('feature3_text')}</p></div></article>
          </div>
        </section>
      </main>
      <footer class="landing-footer"><span>ProcoZone</span><span>${t('landing_footer_tagline')}</span><span>© 2026 PROCOMER</span></footer>
    </div>
  `;
}

export function init() {
  const slides = document.querySelectorAll('.hero-media__slide');
  if (slides.length > 1) {
    let actual = 0;
    intervaloSlides = setInterval(() => {
      slides[actual].classList.remove('is-active');
      actual = (actual + 1) % slides.length;
      slides[actual].classList.add('is-active');
    }, DURACION_SLIDE);
  }
}

export function destroy() {
  if (intervaloSlides) {
    clearInterval(intervaloSlides);
    intervaloSlides = null;
  }
}
