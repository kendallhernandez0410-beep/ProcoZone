import { t } from '../utils/translations.js';
import { renderHeroBanner, iniciarHeroBanner, destruirHeroBanner } from '../components/herobanner.js';
import procomerLogo from '../../assets/logos/procomer.svg';

export function render() {
  return `
    <div class="public-page landing-page">
      <nav class="landing-nav">
        <a class="brand-lockup" href="#/landing" aria-label="${t('brand_home')}" title="${t('brand_home')}" >
          <span class="brand-mark"><i class="fa-solid fa-cubes"></i></span>
          <span><strong>ProcoZone</strong><small>ZoFranca CR</small></span>
        </a>
        <a class="btn btn-outline" href="#/login"><i class="fa-solid fa-arrow-right-to-bracket"></i> ${t('login')}</a>
      </nav>

      ${renderHeroBanner()}

      <main class="landing-main">
        <section class="landing-features" id="landing-features">
          <div class="feature-intro"><p class="eyebrow"><span></span> ${t('feature_intro_eyebrow')}</p><h2>${t('feature_intro_title')}</h2></div>
          <div class="feature-list">
            <article><i class="fa-solid fa-file-circle-check"></i><div><h3>${t('feature1_title')}</h3><p>${t('feature1_text')}</p></div></article>
            <article><i class="fa-solid fa-chart-line"></i><div><h3>${t('feature2_title')}</h3><p>${t('feature2_text')}</p></div></article>
            <article><i class="fa-solid fa-wand-magic-sparkles"></i><div><h3>${t('feature3_title')}</h3><p>${t('feature3_text')}</p></div></article>
          </div>
        </section>
      </main>

      <footer class="landing-footer">
        <div class="footer-main">
          <span><strong>ProcoZone</strong></span>
          <span>${t('landing_footer_tagline')}</span>
          <span>© 2026 ProcoZone — ZoFranca CR</span>
        </div>
        <div class="footer-regulatory">
          <span class="footer-regulatory__label">${t('footer_regulatory_label')}</span>
          <img class="footer-regulatory__logo" src="${procomerLogo}" alt="PROCOMER" loading="lazy" />
          <small class="footer-regulatory__note">${t('footer_regulatory_note')}</small>
        </div>
      </footer>
    </div>
  `;
}

export function init() {
  iniciarHeroBanner();
}

export function destroy() {
  destruirHeroBanner();
}
