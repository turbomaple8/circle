#!/usr/bin/env node
/**
 * CircleStay pSEO Generator
 * Generates 27 static HTML pages from JSON data files.
 * Pure Node.js — no dependencies.
 *
 * Usage: node tools/generate-pseo.js
 * Run from the website/ directory.
 */

const fs = require('fs');
const path = require('path');

// ── Paths ──────────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(__dirname, 'data');

const neighborhoods = JSON.parse(fs.readFileSync(path.join(DATA, 'neighborhoods.json'), 'utf8')).neighborhoods;
const universities  = JSON.parse(fs.readFileSync(path.join(DATA, 'universities.json'), 'utf8')).universities;
const properties    = JSON.parse(fs.readFileSync(path.join(DATA, 'properties.json'), 'utf8')).properties;
const themes        = JSON.parse(fs.readFileSync(path.join(DATA, 'themes.json'), 'utf8')).themes;

// ── Helpers ────────────────────────────────────────────────────────────────────
function pickVariant(slug, variants) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0;
  }
  return variants[Math.abs(hash) % variants.length];
}

function getProp(slug) {
  return properties.find(p => p.slug === slug);
}

function getNeighborhood(slug) {
  return neighborhoods.find(n => n.slug === slug);
}

function getTheme(slug) {
  return themes.find(t => t.slug === slug);
}

function propImage(slug) {
  const map = {
    'the-york': '/building-york.jpg',
    'the-queen': '/building-queen.webp',
    'the-yonge': '/building-yonge.jpg',
    'the-maddox': '/building-maddox.jpg'
  };
  return map[slug] || '/building-york.jpg';
}

function propImageAlt(prop) {
  return `${prop.name} co-living residence in ${prop.neighborhood_name}, Toronto`;
}

function formatPrice(w) { return `C$${w}`; }
function formatMonthly(w) { return `C$${w * 4}`; }

/** Fill template variables in a string */
function fillTemplate(str, vars) {
  return str
    .replace(/\{location\}/g, vars.location || '')
    .replace(/\{property\}/g, vars.property || '')
    .replace(/\{price\}/g, vars.price || '')
    .replace(/\{monthly\}/g, vars.monthly || '')
    .replace(/\{address\}/g, vars.address || '')
    .replace(/\{room_count\}/g, vars.room_count || '')
    .replace(/\{neighborhood_vibe\}/g, vars.neighborhood_vibe || '')
    .replace(/\{transit_highlight\}/g, vars.transit_highlight || '')
    .replace(/\{amenities_list\}/g, vars.amenities_list || '')
    .replace(/\{top_amenities\}/g, vars.top_amenities || '')
    .replace(/\{safety_description\}/g, vars.safety_description || '')
    .replace(/\{nearest_campus\}/g, vars.nearest_campus || '')
    .replace(/\{campus_distance\}/g, vars.campus_distance || '')
    .replace(/\{campus_distance_text\}/g, vars.campus_distance_text || '')
    .replace(/\{transit_route\}/g, vars.transit_route || '')
    .replace(/\{transit_detail\}/g, vars.transit_detail || '')
    .replace(/\{price_to\}/g, vars.price_to || '')
    .replace(/\{key_inclusions\}/g, vars.key_inclusions || '')
    .replace(/\{furniture_list\}/g, vars.furniture_list || '')
    .replace(/\{study_space_answer\}/g, vars.study_space_answer || '')
    .replace(/\{location_preposition\}/g, vars.location_preposition || 'in');
}

/** Build template vars object for a property + neighborhood combo */
function buildVars(prop, hood) {
  const nearestUni = prop.nearest_universities && prop.nearest_universities[0];
  const uniObj = nearestUni ? universities.find(u => u.slug === nearestUni.slug) : null;
  const transitFirst = prop.transit[0];
  const studyAmenities = prop.amenities.filter(a => /co-work|lounge|fitness/i.test(a));

  return {
    location: hood.name,
    property: prop.name,
    price: formatPrice(prop.price_from_weekly),
    monthly: formatMonthly(prop.price_from_weekly),
    address: prop.address,
    room_count: String(prop.rooms.length),
    neighborhood_vibe: hood.vibe,
    transit_highlight: transitFirst ? `${transitFirst.name} (${transitFirst.distance_min} min)` : '',
    amenities_list: prop.amenities.join(', '),
    top_amenities: prop.amenities.slice(0, 4).join(', '),
    safety_description: hood.safety_description,
    nearest_campus: uniObj ? uniObj.name : '',
    campus_distance: nearestUni ? `${nearestUni.distance_min} minutes` : '',
    campus_distance_text: nearestUni ? `${nearestUni.distance_min} minutes` : '',
    transit_route: nearestUni ? nearestUni.transit_route : '',
    transit_detail: nearestUni ? `Take ${nearestUni.transit_route} — about ${nearestUni.distance_min} minutes door to door` : '',
    price_to: formatPrice(prop.price_to_weekly),
    key_inclusions: 'bed, desk, wardrobe, WiFi, and all utilities',
    furniture_list: 'bed, desk, chair, wardrobe, and linens',
    study_space_answer: studyAmenities.length > 0 ? `Yes — ${prop.name} features ${studyAmenities.join(', ')}` : `${prop.name} has quiet common areas ideal for studying`,
    location_preposition: 'in'
  };
}

// ── Shared HTML fragments ──────────────────────────────────────────────────────
const HEAD_TRACKING = `  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-PP74JQ4B');</script>
  <!-- End Google Tag Manager -->
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-W99H70QH6H"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-W99H70QH6H');
  </script>
  <!-- Meta Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '3281828161984067');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=3281828161984067&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Meta Pixel Code -->`;

const GTM_NOSCRIPT = `  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PP74JQ4B"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->`;

function navHTML(lang) {
  if (lang === 'fr') {
    return `  <nav class="nav">
    <div class="nav__inner">
      <a href="/" class="nav__logo"><svg class="nav__logo-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 3C10.6 3 3 10.6 3 20s7.6 17 17 17 17-7.6 17-17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="20" r="5.5" fill="currentColor" opacity="0.18"/><circle cx="20" cy="20" r="2" fill="currentColor"/></svg><span class="nav__logo-text">circle</span></a>
      <div class="nav__links">
        <a href="/locations" class="nav__link">Chambres</a>
        <a href="/#community" class="nav__link">Communaut&eacute;</a>
        <a href="/locations" class="nav__link">Emplacements</a>
        <a href="/blog" class="nav__link">Blogue</a>
        <a href="/#faq" class="nav__link">FAQ</a>
      </div>
      <div class="nav__actions">
        <a href="/locations" class="nav__cta nav__cta--outline">Explorer &rarr;</a>
        <a href="#" class="nav__cta nav__cta--primary" data-modal="apply">Postuler</a>
      </div>
      <button class="nav__hamburger" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="nav__mobile-menu">
      <a href="/locations">Chambres</a>
      <a href="/#community">Communaut&eacute;</a>
      <a href="/locations">Emplacements</a>
      <a href="/blog">Blogue</a>
      <a href="/#faq">FAQ</a>
      <a href="#" data-modal="tour">R&eacute;server une visite</a>
      <a href="#" data-modal="apply">Postuler</a>
    </div>
  </nav>`;
  }
  return `  <nav class="nav">
    <div class="nav__inner">
      <a href="/" class="nav__logo"><svg class="nav__logo-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 3C10.6 3 3 10.6 3 20s7.6 17 17 17 17-7.6 17-17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="20" r="5.5" fill="currentColor" opacity="0.18"/><circle cx="20" cy="20" r="2" fill="currentColor"/></svg><span class="nav__logo-text">circle</span></a>
      <div class="nav__links">
        <a href="/locations" class="nav__link">Rooms</a>
        <a href="/#community" class="nav__link">Community</a>
        <a href="/locations" class="nav__link">Locations</a>
        <a href="/blog" class="nav__link">Blog</a>
        <a href="/#faq" class="nav__link">FAQ</a>
      </div>
      <div class="nav__actions">
        <a href="/locations" class="nav__cta nav__cta--outline">Explore Rooms &rarr;</a>
        <a href="#" class="nav__cta nav__cta--primary" data-modal="apply">Apply</a>
      </div>
      <button class="nav__hamburger" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="nav__mobile-menu">
      <a href="/locations">Rooms</a>
      <a href="/#community">Community</a>
      <a href="/locations">Locations</a>
      <a href="/blog">Blog</a>
      <a href="/#faq">FAQ</a>
      <a href="#" data-modal="tour">Book a Viewing</a>
      <a href="#" data-modal="apply">Apply</a>
    </div>
  </nav>`;
}

function footerHTML(lang) {
  if (lang === 'fr') {
    return `  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div>
          <div class="footer__brand"><svg class="footer__brand-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 3C10.6 3 3 10.6 3 20s7.6 17 17 17 17-7.6 17-17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="20" r="5.5" fill="currentColor" opacity="0.18"/><circle cx="20" cy="20" r="2" fill="currentColor"/></svg><span class="footer__brand-text">circle</span></div>
          <p class="footer__tagline">Maisons de colocation pour &eacute;tudiants et jeunes professionnels &agrave; Toronto.</p>
          <div class="footer__social">
            <a href="https://www.instagram.com/circlestayca" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
            </a>
            <a href="https://www.facebook.com/circlestayca" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
          </div>
        </div>
        <div>
          <h4 class="footer__heading">Explorer</h4>
          <div class="footer__links">
            <a href="/locations">Chambres</a>
            <a href="/locations">Emplacements</a>
            <a href="/blog">Blogue</a>
            <a href="#" data-modal="apply">Postuler</a>
            <a href="#" data-modal="tour">R&eacute;server une visite</a>
          </div>
        </div>
        <div>
          <h4 class="footer__heading">Entreprise</h4>
          <div class="footer__links">
            <a href="/about">&Agrave; propos</a>
            <a href="/#community">Communaut&eacute;</a>
            <a href="mailto:info@circlestay.ca">Contact</a>
          </div>
        </div>
        <div>
          <h4 class="footer__heading">Soutien</h4>
          <div class="footer__links">
            <a href="/#faq">FAQ</a>
            <a href="/terms">S&eacute;curit&eacute;</a>
            <a href="/privacy">Confidentialit&eacute;</a>
          </div>
        </div>
      </div>
      <div class="footer__bottom">
        <span>&copy; 2026 Circle Co-Living. Tous droits r&eacute;serv&eacute;s.</span>
        <div class="footer__legal">
          <a href="/about">&Agrave; propos</a>
          <a href="/terms">En savoir plus</a>
          <a href="mailto:info@circlestay.ca">Contact</a>
        </div>
      </div>
    </div>
  </footer>`;
  }
  return `  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div>
          <div class="footer__brand"><svg class="footer__brand-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 3C10.6 3 3 10.6 3 20s7.6 17 17 17 17-7.6 17-17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="20" r="5.5" fill="currentColor" opacity="0.18"/><circle cx="20" cy="20" r="2" fill="currentColor"/></svg><span class="footer__brand-text">circle</span></div>
          <p class="footer__tagline">Curated co-living homes for students and young professionals in Toronto.</p>
          <div class="footer__social">
            <a href="https://www.instagram.com/circlestayca" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
            </a>
            <a href="https://www.facebook.com/circlestayca" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
          </div>
        </div>
        <div>
          <h4 class="footer__heading">Explore</h4>
          <div class="footer__links">
            <a href="/locations">Rooms</a>
            <a href="/locations">Locations</a>
            <a href="/blog">Blog</a>
            <a href="#" data-modal="apply">Apply Now</a>
            <a href="#" data-modal="tour">Book a Viewing</a>
          </div>
        </div>
        <div>
          <h4 class="footer__heading">Company</h4>
          <div class="footer__links">
            <a href="/about">About Circle</a>
            <a href="/#community">Community</a>
            <a href="mailto:info@circlestay.ca">Contact</a>
          </div>
        </div>
        <div>
          <h4 class="footer__heading">Support</h4>
          <div class="footer__links">
            <a href="/#faq">FAQ</a>
            <a href="/terms">Safety &amp; Support</a>
            <a href="/privacy">Privacy</a>
          </div>
        </div>
      </div>
      <div class="footer__bottom">
        <span>&copy; 2026 Circle Co-Living. All rights reserved.</span>
        <div class="footer__legal">
          <a href="/about">About Circle</a>
          <a href="/terms">Learn More</a>
          <a href="mailto:info@circlestay.ca">Contact</a>
        </div>
      </div>
    </div>
  </footer>`;
}

const MODALS_HTML = `
  <!-- Tour Modal -->
  <div class="modal-overlay" id="tourModal">
    <div class="modal" style="position: relative;">
      <button class="modal__close" data-close-modal>&times;</button>
      <div class="modal__header">
        <h3 class="modal__title">Book a Viewing</h3>
        <p class="modal__subtitle">Visit one of our homes in person. We'll arrange a private walkthrough at your convenience.</p>
      </div>
      <div class="modal__body">
        <form onsubmit="handleTourForm(event)">
          <input type="hidden" name="_captcha" value="false">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" name="name" required placeholder="Your full name">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" required placeholder="you@email.com">
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" placeholder="+1 (___) ___-____">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Preferred Location</label>
              <select name="property">
                <option value="">Select a location</option>
                <option value="The York - Waterfront">The York - Waterfront</option>
                <option value="The Queen - Queen West">The Queen - Queen West</option>
                <option value="The Yonge - 197 Yonge">The Yonge - 197 Yonge</option>
                <option value="The Maddox - Sherbourne">The Maddox - Sherbourne</option>
              </select>
            </div>
            <div class="form-group">
              <label>Preferred Date</label>
              <input type="date" name="date">
            </div>
          </div>
          <div class="form-group">
            <label>Additional Notes</label>
            <textarea name="message" rows="3" placeholder="Anything we should know before your visit?"></textarea>
          </div>
          <button type="submit" class="btn btn--primary btn--full btn--lg">Request Viewing</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Apply Modal -->
  <div class="modal-overlay" id="applyModal">
    <div class="modal" style="position: relative;">
      <button class="modal__close" data-close-modal>&times;</button>
      <div class="modal__header">
        <h3 class="modal__title">Apply for a Room</h3>
        <p class="modal__subtitle">Begin your application. Our team will follow up within 48 hours.</p>
      </div>
      <div class="modal__body">
        <form onsubmit="handleApplyForm(event)">
          <input type="hidden" name="_captcha" value="false">
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input type="text" name="firstName" required placeholder="First name">
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input type="text" name="lastName" required placeholder="Last name">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" required placeholder="you@email.com">
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" placeholder="+1 (___) ___-____">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Preferred Location</label>
              <select name="property">
                <option value="">Select a location</option>
                <option value="The York - Waterfront">The York - Waterfront</option>
                <option value="The Queen - Queen West">The Queen - Queen West</option>
                <option value="The Yonge - 197 Yonge">The Yonge - 197 Yonge</option>
                <option value="The Maddox - Sherbourne">The Maddox - Sherbourne</option>
              </select>
            </div>
            <div class="form-group">
              <label>Room Type</label>
              <select name="roomType">
                <option value="">Select type</option>
                <option value="Private Basic">Private Basic</option>
                <option value="Deluxe Room">Deluxe Suite</option>
                <option value="Flex Premium">Flex Premium</option>
                <option value="Master Suite">Master Suite</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Move-in Date</label>
              <input type="date" name="moveIn">
            </div>
            <div class="form-group">
              <label>Anticipated Duration</label>
              <select name="duration">
                <option value="">Select duration</option>
                <option value="1-3 months">1 - 3 months</option>
                <option value="3-6 months">3 - 6 months</option>
                <option value="6-12 months">6 - 12 months</option>
                <option value="12+ months">12+ months</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Tell Us About Yourself</label>
            <textarea name="message" rows="3" placeholder="A brief introduction - your school, program, why Toronto, etc."></textarea>
          </div>
          <button type="submit" class="btn btn--primary btn--full btn--lg">Submit Application</button>
        </form>
      </div>
    </div>
  </div>`;

// ── Room cards HTML builder ────────────────────────────────────────────────────
function roomCardsHTML(prop) {
  let html = '';
  prop.rooms.forEach(room => {
    const features = room.features.map(f => `<li>${f}</li>`).join('\n                ');
    html += `
          <div class="room-card fade-in" style="background: var(--cream); border-radius: 12px; padding: 2rem; flex: 1; min-width: 240px;">
            <h3 style="font-family: var(--font-heading); font-size: 1.4rem; margin-bottom: 0.5rem;">${room.type}</h3>
            <p style="font-size: 1.8rem; font-weight: 700; color: var(--accent); margin-bottom: 1rem;">${formatPrice(room.price_weekly)}<span style="font-size: 0.9rem; font-weight: 400; color: var(--text);">/week</span></p>
            <ul style="list-style: none; padding: 0; margin: 0;">
                ${features}
            </ul>
          </div>`;
  });
  return html;
}

// ── All-properties room comparison for room-type pages ─────────────────────────
function roomTypeComparisonHTML(roomTypeName) {
  let rows = '';
  properties.forEach(prop => {
    const matchingRoom = prop.rooms.find(r => r.type.toLowerCase().includes(roomTypeName.toLowerCase()));
    if (matchingRoom) {
      const hood = getNeighborhood(prop.neighborhood_slug);
      rows += `
          <div class="fade-in" style="background: var(--cream); border-radius: 12px; padding: 2rem; display: flex; flex-wrap: wrap; gap: 2rem; align-items: center; margin-bottom: 1.5rem;">
            <img src="${propImage(prop.slug)}" alt="${propImageAlt(prop)}" loading="lazy" decoding="async" style="width: 200px; height: 140px; object-fit: cover; border-radius: 8px;">
            <div style="flex: 1; min-width: 240px;">
              <h3 style="font-family: var(--font-heading); font-size: 1.4rem; margin-bottom: 0.25rem;"><a href="/property-${prop.slug.replace('the-', '')}" style="color: var(--primary); text-decoration: none;">${prop.name}</a></h3>
              <p style="color: var(--accent); margin-bottom: 0.25rem;">${prop.neighborhood_name}</p>
              <p style="margin-bottom: 0.5rem;">${prop.address}</p>
              <p style="font-size: 1.6rem; font-weight: 700; color: var(--accent);">${formatPrice(matchingRoom.price_weekly)}<span style="font-size: 0.9rem; font-weight: 400; color: var(--text);">/week</span></p>
              <ul style="list-style: none; padding: 0; margin: 0.5rem 0 0 0; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${matchingRoom.features.map(f => `<li style="background: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">${f}</li>`).join('\n                ')}
              </ul>
            </div>
          </div>`;
    }
  });
  return rows;
}

// ── Neighborhood info section ──────────────────────────────────────────────────
function neighborhoodInfoHTML(hood, lang) {
  const headingTransit = lang === 'fr' ? 'Transport en commun' : 'Transit & Getting Around';
  const headingDining = lang === 'fr' ? 'Restaurants et caf&eacute;s' : 'Dining & Cafes';
  const headingParks = lang === 'fr' ? 'Parcs et espaces verts' : 'Parks & Green Spaces';
  const headingGrocery = lang === 'fr' ? '&Eacute;piceries' : 'Grocery & Essentials';

  return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 2rem;">
        <div class="fade-in">
          <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 1rem;">${headingTransit}</h3>
          <ul style="list-style: none; padding: 0;">
            ${hood.transit_stations.map(t => `<li style="padding: 0.4rem 0;">&#128652; ${t}</li>`).join('\n            ')}
          </ul>
        </div>
        <div class="fade-in">
          <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 1rem;">${headingDining}</h3>
          <ul style="list-style: none; padding: 0;">
            ${hood.restaurants.map(r => `<li style="padding: 0.4rem 0;">&#127860; ${r}</li>`).join('\n            ')}
            ${hood.cafes.map(c => `<li style="padding: 0.4rem 0;">&#9749; ${c}</li>`).join('\n            ')}
          </ul>
        </div>
        <div class="fade-in">
          <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 1rem;">${headingParks}</h3>
          <ul style="list-style: none; padding: 0;">
            ${hood.parks.map(p => `<li style="padding: 0.4rem 0;">&#127795; ${p}</li>`).join('\n            ')}
          </ul>
        </div>
        <div class="fade-in">
          <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 1rem;">${headingGrocery}</h3>
          <ul style="list-style: none; padding: 0;">
            ${hood.grocery.map(g => `<li style="padding: 0.4rem 0;">&#128722; ${g}</li>`).join('\n            ')}
          </ul>
        </div>
      </div>`;
}

// ── FAQ section builder ────────────────────────────────────────────────────────
function faqSectionHTML(faqs, vars, pageSlug) {
  // Pick 4 FAQs deterministically from pool
  if (!faqs || faqs.length === 0) return '';
  const selected = [];
  const pool = [...faqs];
  for (let i = 0; i < 4 && pool.length > 0; i++) {
    const idx = Math.abs(pickVariantIdx(pageSlug + '-faq-' + i)) % pool.length;
    selected.push(pool.splice(idx, 1)[0]);
  }
  let items = '';
  selected.forEach(faq => {
    const q = fillTemplate(faq.q, vars);
    const a = fillTemplate(faq.a, vars);
    items += `
        <details class="faq-item fade-in" style="background: var(--cream); border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 0.75rem;">
          <summary style="font-family: var(--font-heading); font-size: 1.15rem; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center;">${q}<span style="font-size: 1.5rem; transition: transform 0.3s;">+</span></summary>
          <p style="margin-top: 1rem; line-height: 1.7;">${a}</p>
        </details>`;
  });
  return items;
}

function pickVariantIdx(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// ── FAQ JSON-LD ────────────────────────────────────────────────────────────────
function faqJsonLd(faqs, vars, pageSlug) {
  if (!faqs || faqs.length === 0) return '';
  const pool = [...faqs];
  const selected = [];
  for (let i = 0; i < 4 && pool.length > 0; i++) {
    const idx = Math.abs(pickVariantIdx(pageSlug + '-faq-' + i)) % pool.length;
    selected.push(pool.splice(idx, 1)[0]);
  }
  const entities = selected.map(faq => {
    const q = fillTemplate(faq.q, vars);
    const a = fillTemplate(faq.a, vars);
    return `      {
        "@type": "Question",
        "name": ${JSON.stringify(q)},
        "acceptedAnswer": {
          "@type": "Answer",
          "text": ${JSON.stringify(a)}
        }
      }`;
  });
  return `,
      {
        "@type": "FAQPage",
        "mainEntity": [
${entities.join(',\n')}
        ]
      }`;
}

// ── CTA section ────────────────────────────────────────────────────────────────
function ctaSectionHTML(lang) {
  if (lang === 'fr') {
    return `
  <section class="section" style="text-align: center; padding: 4rem 1.5rem;">
    <div class="container fade-in">
      <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin-bottom: 1rem;">Pr&ecirc;t &agrave; rejoindre le cercle?</h2>
      <p style="max-width: 600px; margin: 0 auto 2rem; font-size: 1.1rem; color: #666;">Postulez en 2 minutes. Approbation en 48 heures. Emm&eacute;nagez cette semaine.</p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="#" class="btn btn--primary" data-modal="apply" style="padding: 1rem 2.5rem; font-size: 1.1rem;">Postuler maintenant</a>
        <a href="#" class="btn btn--outline" data-modal="tour" style="padding: 1rem 2.5rem; font-size: 1.1rem;">R&eacute;server une visite</a>
      </div>
    </div>
  </section>`;
  }
  return `
  <section class="section" style="text-align: center; padding: 4rem 1.5rem;">
    <div class="container fade-in">
      <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin-bottom: 1rem;">Ready to Join the Circle?</h2>
      <p style="max-width: 600px; margin: 0 auto 2rem; font-size: 1.1rem; color: #666;">Apply in 2 minutes. Get approved within 48 hours. Move in this week.</p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="#" class="btn btn--primary" data-modal="apply" style="padding: 1rem 2.5rem; font-size: 1.1rem;">Apply Now</a>
        <a href="#" class="btn btn--outline" data-modal="tour" style="padding: 1rem 2.5rem; font-size: 1.1rem;">Book a Viewing</a>
      </div>
    </div>
  </section>`;
}

// ── University distance table for a property ───────────────────────────────────
function uniDistanceTable(prop) {
  let rows = '';
  if (prop.nearest_universities) {
    prop.nearest_universities.forEach(nu => {
      const uni = universities.find(u => u.slug === nu.slug);
      if (uni) {
        rows += `
            <tr>
              <td style="padding: 0.75rem; font-weight: 600;">${uni.name}</td>
              <td style="padding: 0.75rem;">${nu.distance_min} min</td>
              <td style="padding: 0.75rem;">${nu.transit_route}</td>
            </tr>`;
      }
    });
  }
  return rows ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--accent);">
              <th style="padding: 0.75rem; text-align: left; font-family: var(--font-heading);">Campus</th>
              <th style="padding: 0.75rem; text-align: left; font-family: var(--font-heading);">Travel Time</th>
              <th style="padding: 0.75rem; text-align: left; font-family: var(--font-heading);">Route</th>
            </tr>
          </thead>
          <tbody>${rows}
          </tbody>
        </table>` : '';
}

// ── All properties comparison table for a university ───────────────────────────
function allPropsForUniHTML(uni) {
  let cards = '';
  properties.forEach(prop => {
    const dist = uni.all_properties_distance[prop.slug];
    if (!dist) return;
    const hood = getNeighborhood(prop.neighborhood_slug);
    cards += `
          <div class="fade-in" style="background: var(--cream); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem;">
            <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center;">
              <img src="${propImage(prop.slug)}" alt="${propImageAlt(prop)}" loading="lazy" decoding="async" style="width: 180px; height: 120px; object-fit: cover; border-radius: 8px;">
              <div style="flex: 1; min-width: 200px;">
                <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 0.25rem;"><a href="/property-${prop.slug.replace('the-', '')}" style="color: var(--primary); text-decoration: none;">${prop.name}</a></h3>
                <p style="color: var(--accent); margin-bottom: 0.25rem;">${prop.neighborhood_name}</p>
                <p style="margin-bottom: 0.5rem;"><strong>${dist.minutes} min</strong> via ${dist.route}</p>
                <p style="font-size: 1.4rem; font-weight: 700; color: var(--accent);">From ${formatPrice(prop.price_from_weekly)}<span style="font-size: 0.85rem; font-weight: 400; color: var(--text);">/week</span></p>
                <p style="margin-top: 0.5rem; font-size: 0.9rem;">${prop.rooms.length} room types: ${prop.rooms.map(r => r.type).join(', ')}</p>
              </div>
            </div>
          </div>`;
  });
  return cards;
}

// ══════════════════════════════════════════════════════════════════════════════════
// FULL PAGE GENERATOR
// ══════════════════════════════════════════════════════════════════════════════════

function generatePage(opts) {
  const {
    filename, title, metaDesc, canonical, h1, subtitle, priceBadge,
    introText, bodyContent, faqHTML, ctaHTML, breadcrumbJsonLd, extraJsonLd,
    lang, hreflangTags, ogImage
  } = opts;

  const langAttr = lang || 'en';
  const cssPath = lang === 'fr' ? '/styles.css' : '/styles.css';
  const jsPath = lang === 'fr' ? '/script.js' : '/script.js';
  const rpPath = lang === 'fr' ? '/reserve-popup.js' : '/reserve-popup.js';

  const html = `<!DOCTYPE html>
<html lang="${langAttr}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${metaDesc}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:image" content="${ogImage || 'https://circlestay.ca/building-york.jpg'}">
  <meta property="og:site_name" content="Circle Co-Living">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${metaDesc}">
  <meta name="twitter:image" content="${ogImage || 'https://circlestay.ca/building-york.jpg'}">
${hreflangTags || ''}
${HEAD_TRACKING}
  <link rel="stylesheet" href="${cssPath}">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>C</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://circlestay.ca/#organization",
        "name": "Circle Co-Living",
        "url": "https://circlestay.ca",
        "description": "Curated co-living homes for students and young professionals in Toronto.",
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "info@circlestay.ca",
          "contactType": "customer service"
        },
        "sameAs": [
          "https://www.instagram.com/circlestayca",
          "https://www.facebook.com/circlestayca"
        ]
      },
${breadcrumbJsonLd}${extraJsonLd || ''}
    ]
  }
  </script>
</head>
<body>
${GTM_NOSCRIPT}

${navHTML(lang)}

  <!-- Hero -->
  <section class="section" style="padding: 6rem 1.5rem 3rem; text-align: center;">
    <div class="container fade-in">
      ${priceBadge ? `<span style="display: inline-block; background: var(--accent); color: white; padding: 0.4rem 1.2rem; border-radius: 20px; font-size: 0.9rem; margin-bottom: 1.5rem;">${priceBadge}</span>` : ''}
      <h1 style="font-family: var(--font-heading); font-size: clamp(2rem, 5vw, 3rem); max-width: 800px; margin: 0 auto 1rem;">${h1}</h1>
      ${subtitle ? `<p style="font-size: 1.15rem; max-width: 650px; margin: 0 auto; color: #555;">${subtitle}</p>` : ''}
    </div>
  </section>

  <!-- Intro -->
  <section class="section section--cream">
    <div class="container fade-in" style="max-width: 800px;">
      <p style="font-size: 1.1rem; line-height: 1.8;">${introText}</p>
    </div>
  </section>

${bodyContent}

  <!-- FAQ -->
  <section class="section" id="faq" style="padding: 4rem 1.5rem;">
    <div class="container" style="max-width: 800px;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 2rem; text-align: center; margin-bottom: 2rem;">${lang === 'fr' ? 'Questions fr&eacute;quentes' : 'Frequently Asked Questions'}</h2>
${faqHTML}
    </div>
  </section>

${ctaHTML}

${footerHTML(lang)}

${MODALS_HTML}

  <script src="${jsPath}"></script>
  <script src="${rpPath}"></script>
</body>
</html>`;

  const outPath = path.join(ROOT, filename);
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
  return filename;
}

// ── Breadcrumb JSON-LD builder ─────────────────────────────────────────────────
function breadcrumb(items) {
  // items = [{name, url}]
  const list = items.map((item, i) => {
    const entry = { "@type": "ListItem", "position": i + 1, "name": item.name };
    if (item.url) entry.item = item.url;
    return entry;
  });
  return `      {
        "@type": "BreadcrumbList",
        "itemListElement": ${JSON.stringify(list, null, 10).split('\n').map((l, i) => i === 0 ? l : '        ' + l).join('\n')}
      }`;
}

// ══════════════════════════════════════════════════════════════════════════════════
// TEMPLATE 1 — Neighborhood Co-Living (4 pages)
// ══════════════════════════════════════════════════════════════════════════════════
function generateNeighborhoodPages() {
  const theme = getTheme('coliving');
  const generated = [];

  neighborhoods.forEach(hood => {
    const prop = getProp(hood.property_slug);
    const vars = buildVars(prop, hood);
    const pageSlug = `co-living-in-${hood.slug}`;
    const filename = `${pageSlug}.html`;
    const canonical = `https://circlestay.ca/${pageSlug}`;

    const h1 = fillTemplate(pickVariant(pageSlug, theme.h1_variants), vars);
    const metaTitle = fillTemplate(theme.meta_title_template, vars);
    const metaDesc = fillTemplate(theme.meta_description_template, vars);
    const intro = fillTemplate(pickVariant(pageSlug, theme.intro_variants), vars);

    const bodyContent = `
  <!-- Property Highlight -->
  <section class="section">
    <div class="container">
      <div class="fade-in" style="display: flex; flex-wrap: wrap; gap: 2rem; align-items: center; margin-bottom: 3rem;">
        <img src="${propImage(prop.slug)}" alt="${propImageAlt(prop)}" loading="lazy" decoding="async" style="width: 100%; max-width: 500px; border-radius: 12px; object-fit: cover;">
        <div style="flex: 1; min-width: 280px;">
          <h2 style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 0.5rem;">${prop.name}</h2>
          <p style="color: var(--accent); font-size: 1.1rem; margin-bottom: 0.5rem;">${prop.address} &mdash; ${hood.name}</p>
          <p style="margin-bottom: 1rem;">${hood.description}</p>
          <p style="margin-bottom: 1rem;"><strong>Best for:</strong> ${hood.best_for.join(', ')}</p>
          <p style="font-size: 1.1rem;"><strong>Safety:</strong> ${hood.safety_description}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Room Types -->
  <section class="section section--cream">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">Room Types at ${prop.name}</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center;">
${roomCardsHTML(prop)}
      </div>
      <p class="fade-in" style="text-align: center; margin-top: 1.5rem; font-size: 0.95rem; color: #666;">All rooms fully furnished. WiFi, utilities, and amenities included. Flexible leases from 1 month.</p>
    </div>
  </section>

  <!-- Campus Proximity -->
  <section class="section">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 1rem;">Nearby Campuses</h2>
      ${uniDistanceTable(prop)}
    </div>
  </section>

  <!-- Neighborhood Guide -->
  <section class="section section--cream">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 0.5rem;">Living in ${hood.name}</h2>
      <p class="fade-in" style="text-align: center; max-width: 600px; margin: 0 auto 1rem; color: #666;">${hood.vibe}</p>
      ${neighborhoodInfoHTML(hood, 'en')}
    </div>
  </section>

  <!-- Amenities -->
  <section class="section">
    <div class="container" style="text-align: center;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 2rem;">What's Included</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; max-width: 700px; margin: 0 auto;">
        ${prop.amenities.map(a => `<span class="fade-in" style="background: var(--cream); padding: 0.6rem 1.2rem; border-radius: 20px; font-size: 0.95rem;">${a}</span>`).join('\n        ')}
      </div>
    </div>
  </section>`;

    const faq = faqSectionHTML(theme.faq_pool, vars, pageSlug);
    const faqLd = faqJsonLd(theme.faq_pool, vars, pageSlug);

    generated.push(generatePage({
      filename,
      title: metaTitle,
      metaDesc,
      canonical,
      h1,
      subtitle: `${hood.vibe} Starting from ${formatPrice(prop.price_from_weekly)}/week at ${prop.name}.`,
      priceBadge: `From ${formatPrice(prop.price_from_weekly)}/week`,
      introText: intro,
      bodyContent,
      faqHTML: faq,
      ctaHTML: ctaSectionHTML('en'),
      breadcrumbJsonLd: breadcrumb([
        { name: 'Home', url: 'https://circlestay.ca/' },
        { name: 'Locations', url: 'https://circlestay.ca/locations' },
        { name: `Co-Living in ${hood.name}` }
      ]),
      extraJsonLd: `,
      {
        "@type": "LodgingBusiness",
        "name": "${prop.name} — Circle Co-Living",
        "description": "Co-living in ${hood.name}, Toronto. Furnished rooms from ${formatPrice(prop.price_from_weekly)}/week.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "${prop.address}",
          "addressLocality": "Toronto",
          "addressRegion": "ON",
          "addressCountry": "CA"
        },
        "priceRange": "${formatPrice(prop.price_from_weekly)} - ${formatPrice(prop.price_to_weekly)} per week",
        "url": "${canonical}"
      }` + faqLd,
      lang: 'en',
      hreflangTags: `  <link rel="alternate" hreflang="en" href="${canonical}">\n  <link rel="alternate" hreflang="fr" href="https://circlestay.ca/fr/colocation-${hood.slug}">`,
      ogImage: `https://circlestay.ca${propImage(prop.slug)}`
    }));
  });
  return generated;
}

// ══════════════════════════════════════════════════════════════════════════════════
// TEMPLATE 2 — University Proximity (6 pages)
// ══════════════════════════════════════════════════════════════════════════════════
function generateUniversityPages() {
  const theme = getTheme('student-housing');
  const generated = [];

  universities.forEach(uni => {
    const nearestProp = getProp(uni.nearest_property);
    const nearestHood = getNeighborhood(nearestProp.neighborhood_slug);
    const dist = uni.all_properties_distance[nearestProp.slug];
    const pageSlug = `co-living-near-${uni.slug}`;
    const filename = `${pageSlug}.html`;
    const canonical = `https://circlestay.ca/${pageSlug}`;

    const vars = buildVars(nearestProp, nearestHood);
    vars.location = uni.name;
    vars.nearest_campus = uni.name;
    vars.campus_distance = `${dist.minutes} minutes`;
    vars.campus_distance_text = `${dist.minutes} minutes`;
    vars.transit_route = dist.route;
    vars.transit_detail = `Take ${dist.route} — about ${dist.minutes} minutes door to door`;
    vars.transit_highlight = `${dist.route} (${dist.minutes} min to campus)`;
    vars.location_preposition = 'near';

    const h1Variants = [
      `Co-Living Near ${uni.name}: Rooms from ${formatPrice(nearestProp.price_from_weekly)}/Week`,
      `Student Housing Near ${uni.short_name} — Furnished & All-Inclusive from ${formatPrice(nearestProp.price_from_weekly)}/wk`,
      `Live Near ${uni.short_name}: Co-Living Rooms in Toronto from ${formatPrice(nearestProp.price_from_weekly)}/Week`
    ];
    const h1 = pickVariant(pageSlug, h1Variants);

    const metaTitle = `Co-Living Near ${uni.name}, Toronto | From ${formatPrice(nearestProp.price_from_weekly)}/wk | Circle`;
    const metaDesc = fillTemplate(theme.meta_description_template, vars);
    const intro = fillTemplate(pickVariant(pageSlug, theme.intro_variants), vars);

    const bodyContent = `
  <!-- University Info -->
  <section class="section">
    <div class="container">
      <div class="fade-in" style="background: var(--cream); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
        <h2 style="font-family: var(--font-heading); font-size: 1.6rem; margin-bottom: 1rem;">About ${uni.name}</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
          <div>
            <p style="color: var(--accent); font-weight: 600; margin-bottom: 0.25rem;">Campus</p>
            <p>${uni.campus}</p>
          </div>
          <div>
            <p style="color: var(--accent); font-weight: 600; margin-bottom: 0.25rem;">Students</p>
            <p>${uni.student_population}</p>
          </div>
          <div>
            <p style="color: var(--accent); font-weight: 600; margin-bottom: 0.25rem;">International Students</p>
            <p>${uni.international_student_pct}</p>
          </div>
          <div>
            <p style="color: var(--accent); font-weight: 600; margin-bottom: 0.25rem;">Known For</p>
            <p>${uni.programs_known_for.join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- All Properties Distance -->
  <section class="section section--cream">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">Circle Properties Near ${uni.short_name}</h2>
${allPropsForUniHTML(uni)}
    </div>
  </section>

  <!-- Nearest Property Detail -->
  <section class="section">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 0.5rem;">Closest: ${nearestProp.name}</h2>
      <p class="fade-in" style="text-align: center; color: var(--accent); margin-bottom: 2rem;">${dist.minutes} minutes from ${uni.short_name} via ${dist.route}</p>
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center;">
${roomCardsHTML(nearestProp)}
      </div>
    </div>
  </section>

  <!-- Neighborhood -->
  <section class="section section--cream">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 0.5rem;">The Neighborhood: ${nearestHood.name}</h2>
      <p class="fade-in" style="text-align: center; max-width: 600px; margin: 0 auto 1rem; color: #666;">${nearestHood.vibe}</p>
      ${neighborhoodInfoHTML(nearestHood, 'en')}
    </div>
  </section>

  <!-- Why Co-Living for Students -->
  <section class="section">
    <div class="container" style="max-width: 800px;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">Why ${uni.short_name} Students Choose Co-Living</h2>
      <div class="fade-in" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem;">
        <div style="text-align: center; padding: 1.5rem;">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">&#128176;</p>
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 0.5rem;">Save 38-60%</h3>
          <p style="font-size: 0.95rem; color: #666;">Compared to a solo apartment. All utilities and WiFi included in one price.</p>
        </div>
        <div style="text-align: center; padding: 1.5rem;">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">&#128218;</p>
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 0.5rem;">Study-Friendly</h3>
          <p style="font-size: 0.95rem; color: #666;">Quiet hours, fast WiFi, and dedicated study areas. Designed for academic success.</p>
        </div>
        <div style="text-align: center; padding: 1.5rem;">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">&#127758;</p>
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 0.5rem;">International Welcome</h3>
          <p style="font-size: 0.95rem; color: #666;">No credit check, no guarantor needed. ${uni.international_student_pct} of ${uni.short_name} students are international.</p>
        </div>
      </div>
    </div>
  </section>`;

    const faq = faqSectionHTML(theme.faq_pool, vars, pageSlug);
    const faqLd = faqJsonLd(theme.faq_pool, vars, pageSlug);

    generated.push(generatePage({
      filename,
      title: metaTitle,
      metaDesc,
      canonical,
      h1,
      subtitle: `${dist.minutes} minutes from campus. Furnished rooms, all-inclusive, no credit check.`,
      priceBadge: `From ${formatPrice(nearestProp.price_from_weekly)}/week`,
      introText: intro,
      bodyContent,
      faqHTML: faq,
      ctaHTML: ctaSectionHTML('en'),
      breadcrumbJsonLd: breadcrumb([
        { name: 'Home', url: 'https://circlestay.ca/' },
        { name: 'Student Housing', url: 'https://circlestay.ca/student-housing-toronto' },
        { name: `Near ${uni.name}` }
      ]),
      extraJsonLd: faqLd,
      lang: 'en',
      ogImage: `https://circlestay.ca${propImage(nearestProp.slug)}`
    }));
  });
  return generated;
}

// ══════════════════════════════════════════════════════════════════════════════════
// TEMPLATE 3 — Audience Segments (4 pages)
// ══════════════════════════════════════════════════════════════════════════════════
function generateAudiencePages() {
  const generated = [];
  const lowestPrice = Math.min(...properties.map(p => p.price_from_weekly));

  const audiences = [
    {
      slug: 'student-housing-toronto',
      h1: 'Student Housing in Toronto: All-Inclusive Furnished Rooms from C$240/Week',
      title: 'Student Housing in Toronto | Furnished Rooms from C$240/wk | Circle Co-Living',
      metaDesc: 'Student housing in Toronto from C$240/week. Fully furnished, no credit check, flexible leases from 1 month. 4 downtown locations near major campuses. Apply now.',
      subtitle: 'Fully furnished rooms near UofT, TMU, George Brown, OCAD and more. No credit check, flexible leases, all-inclusive.',
      intro: `Finding student housing in Toronto can be overwhelming — especially if you're arriving from abroad or navigating the city's expensive rental market for the first time. Circle Co-Living makes it simple: 4 downtown locations, fully furnished rooms from C$240/week, and everything included in one price. No credit check, no guarantor, no furniture shopping. Just apply online, get approved within 48 hours, and move in with nothing more than a suitcase. Our community includes students from UofT, TMU, George Brown, OCAD, and colleges across the GTA. Whether you need housing for a single semester, a summer internship, or a full academic year, our flexible leases start at just 1 month. Every room comes with a bed, desk, wardrobe, high-speed WiFi, and all utilities. Shared kitchens, common areas, and building amenities are included. Toronto's average studio apartment costs $1,800-2,500/month unfurnished — at Circle, you pay a fraction of that and get more.`,
      bodyExtra: 'student',
      faqTheme: 'student-housing'
    },
    {
      slug: 'young-professional-housing-toronto',
      h1: 'Young Professional Housing in Toronto: Co-Living from C$240/Week',
      title: 'Young Professional Housing Toronto | Co-Living from C$240/wk | Circle',
      metaDesc: 'Young professional housing in Toronto from C$240/week. Furnished rooms, flexible leases, built-in community. Near Bay Street and downtown. Apply now.',
      subtitle: 'Skip the solo apartment grind. Furnished rooms, built-in community, and all-inclusive pricing near Toronto\'s business core.',
      intro: `Starting your career in Toronto is exciting — but finding affordable housing near your office shouldn't be the hardest part. Circle Co-Living offers young professionals a smarter alternative to overpriced studio apartments: furnished private rooms in curated co-living homes from C$240/week, all-inclusive. Our four downtown Toronto locations put you within minutes of Bay Street, the Financial District, Queen West's creative agencies, and downtown's tech hubs. Each room comes fully furnished with a desk, fast WiFi, and everything you need to work from home when needed. But co-living isn't just about saving money — it's about building genuine connections. Our community of students and young professionals values focus during the week and connection on weekends. Quiet hours, professional management, and community events create the right balance. No long leases required: start with just 1 month and extend as you settle in. No credit check means newcomers to Toronto can move in quickly. Compare our all-inclusive weekly rates to the $1,800-2,500/month you'd pay for a bare studio apartment, and the choice is clear.`,
      bodyExtra: 'professional',
      faqTheme: 'coliving'
    },
    {
      slug: 'exchange-student-housing-toronto',
      h1: 'Exchange Student Housing in Toronto: Short-Term from C$240/Week',
      title: 'Exchange Student Housing Toronto | Short-Term from C$240/wk | Circle',
      metaDesc: 'Exchange student housing in Toronto from C$240/week. 1-month minimum lease, fully furnished, no credit check. Near UofT, TMU, George Brown. Apply online.',
      subtitle: 'Short-term, furnished, and hassle-free housing for exchange students coming to Toronto. No Canadian credit history needed.',
      intro: `Coming to Toronto on exchange? You need housing that works on your timeline — not a 12-month lease for a 4-month stay. Circle Co-Living offers exchange students furnished rooms from C$240/week with a minimum stay of just 1 month. No Canadian credit history required, no guarantor needed, and you can apply from anywhere in the world. Our four downtown locations put you near UofT (15 min from The York), TMU (5 min from The Yonge), George Brown (10-12 min), and OCAD (8 min from The Queen). Every room is move-in ready with furniture, linens, WiFi, and all utilities included. Just arrive with your suitcase. The co-living community at Circle includes fellow international students, Canadian students, and young professionals. It's the fastest way to build a social network in a new city — no awkward Kijiji roommate situations, no isolation in a solo apartment. Our properties are professionally managed with secure access and 24/7 support, so your parents can rest easy knowing you're in safe hands.`,
      bodyExtra: 'exchange',
      faqTheme: 'student-housing'
    },
    {
      slug: 'intern-housing-toronto',
      h1: 'Intern Housing in Toronto: Flexible Short-Term Rooms from C$240/Week',
      title: 'Intern Housing Toronto | Short-Term from C$240/wk | Circle Co-Living',
      metaDesc: 'Intern housing in Toronto from C$240/week. 1-month minimum, fully furnished, near Bay Street. No long lease required. Apply online and move in this week.',
      subtitle: 'Don\'t sign a 12-month lease for a 3-month internship. Flexible, furnished rooms near Toronto\'s business district.',
      intro: `Interning in Toronto this summer? The last thing you need is the stress of finding affordable short-term housing in one of Canada's most expensive cities. Circle Co-Living solves this: furnished rooms from C$240/week with a 1-month minimum lease. No 12-month commitments, no furniture shopping, no utility setup. Just apply online, get approved within 48 hours, and focus on your internship — not your living situation. Our four downtown locations are strategically positioned near Toronto's major employment hubs. The York (Waterfront/Financial District) puts you 2 minutes from Union Station and direct PATH access to Bay Street. The Queen (Queen West) is in the heart of Toronto's creative and media district. The Yonge is central to everything via Dundas Station. And The Maddox offers the most affordable entry point from just C$240/week. Every room comes fully furnished with a bed, desk, wardrobe, high-speed WiFi, and all utilities included. Shared kitchens mean you can cook instead of eating out every meal. And the built-in community of fellow interns, students, and young professionals means you won't spend your Toronto summer in isolation.`,
      bodyExtra: 'intern',
      faqTheme: 'intern-housing'
    }
  ];

  audiences.forEach(aud => {
    const pageSlug = aud.slug;
    const filename = `${pageSlug}.html`;
    const canonical = `https://circlestay.ca/${pageSlug}`;
    const theme = getTheme(aud.faqTheme);

    // Build all-properties overview
    let allPropsHTML = '';
    properties.forEach(prop => {
      const hood = getNeighborhood(prop.neighborhood_slug);
      allPropsHTML += `
          <div class="fade-in" style="background: var(--cream); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
            <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center;">
              <img src="${propImage(prop.slug)}" alt="${propImageAlt(prop)}" loading="lazy" decoding="async" style="width: 200px; height: 140px; object-fit: cover; border-radius: 8px;">
              <div style="flex: 1; min-width: 240px;">
                <h3 style="font-family: var(--font-heading); font-size: 1.4rem; margin-bottom: 0.25rem;"><a href="/property-${prop.slug.replace('the-', '')}" style="color: var(--primary); text-decoration: none;">${prop.name}</a></h3>
                <p style="color: var(--accent); margin-bottom: 0.25rem;">${hood.name}</p>
                <p style="margin-bottom: 0.5rem;">${prop.address}</p>
                <p style="font-size: 1.4rem; font-weight: 700; color: var(--accent);">From ${formatPrice(prop.price_from_weekly)}<span style="font-size: 0.85rem; font-weight: 400; color: var(--text);">/week</span></p>
                <p style="margin-top: 0.5rem; font-size: 0.9rem;">${prop.rooms.length} room types | ${prop.amenities.slice(0, 3).join(', ')}</p>
              </div>
            </div>
          </div>`;
    });

    const bodyContent = `
  <!-- All Properties -->
  <section class="section">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">Our 4 Toronto Locations</h2>
${allPropsHTML}
    </div>
  </section>

  <!-- Why Choose Circle -->
  <section class="section section--cream">
    <div class="container" style="max-width: 900px;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">Why Choose Circle Co-Living?</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
        <div class="fade-in" style="text-align: center; padding: 1.5rem;">
          <p style="font-size: 2.5rem; margin-bottom: 0.75rem;">&#128176;</p>
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 0.5rem;">Save 38-60%</h3>
          <p style="font-size: 0.95rem; color: #666;">vs. solo apartment rent. All utilities and WiFi included — no hidden costs.</p>
        </div>
        <div class="fade-in" style="text-align: center; padding: 1.5rem;">
          <p style="font-size: 2.5rem; margin-bottom: 0.75rem;">&#128197;</p>
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 0.5rem;">Flexible Leases</h3>
          <p style="font-size: 0.95rem; color: #666;">1-month minimum. No long-term commitment required. Stay as short or long as you need.</p>
        </div>
        <div class="fade-in" style="text-align: center; padding: 1.5rem;">
          <p style="font-size: 2.5rem; margin-bottom: 0.75rem;">&#9989;</p>
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 0.5rem;">No Credit Check</h3>
          <p style="font-size: 0.95rem; color: #666;">Apply online in 2 minutes. Approval within 48 hours. No guarantor needed.</p>
        </div>
        <div class="fade-in" style="text-align: center; padding: 1.5rem;">
          <p style="font-size: 2.5rem; margin-bottom: 0.75rem;">&#127968;</p>
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 0.5rem;">Move-In Ready</h3>
          <p style="font-size: 0.95rem; color: #666;">Fully furnished rooms. Just bring your suitcase and personal items.</p>
        </div>
        <div class="fade-in" style="text-align: center; padding: 1.5rem;">
          <p style="font-size: 2.5rem; margin-bottom: 0.75rem;">&#129309;</p>
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 0.5rem;">Built-In Community</h3>
          <p style="font-size: 0.95rem; color: #666;">A curated community of students and young professionals. Not random roommates.</p>
        </div>
        <div class="fade-in" style="text-align: center; padding: 1.5rem;">
          <p style="font-size: 2.5rem; margin-bottom: 0.75rem;">&#128274;</p>
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 0.5rem;">Safe & Secure</h3>
          <p style="font-size: 0.95rem; color: #666;">Secure building access, professional management, and 24/7 support at every location.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Price Comparison -->
  <section class="section">
    <div class="container" style="max-width: 700px;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">Circle vs. Solo Apartment</h2>
      <table class="fade-in" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid var(--accent);">
            <th style="padding: 1rem; text-align: left; font-family: var(--font-heading);"></th>
            <th style="padding: 1rem; text-align: center; font-family: var(--font-heading); color: var(--accent);">Circle Co-Living</th>
            <th style="padding: 1rem; text-align: center; font-family: var(--font-heading);">Solo Apartment</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem;">Monthly Rent</td>
            <td style="padding: 0.75rem; text-align: center; font-weight: 600; color: var(--accent);">From C$960/mo</td>
            <td style="padding: 0.75rem; text-align: center;">C$1,800-2,500/mo</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem;">Furniture</td>
            <td style="padding: 0.75rem; text-align: center; color: var(--accent);">Included</td>
            <td style="padding: 0.75rem; text-align: center;">C$2,000-5,000 upfront</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem;">WiFi & Utilities</td>
            <td style="padding: 0.75rem; text-align: center; color: var(--accent);">Included</td>
            <td style="padding: 0.75rem; text-align: center;">C$150-250/mo extra</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem;">Minimum Lease</td>
            <td style="padding: 0.75rem; text-align: center; color: var(--accent);">1 month</td>
            <td style="padding: 0.75rem; text-align: center;">12 months</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem;">Credit Check</td>
            <td style="padding: 0.75rem; text-align: center; color: var(--accent);">Not required</td>
            <td style="padding: 0.75rem; text-align: center;">Required</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem;">Community</td>
            <td style="padding: 0.75rem; text-align: center; color: var(--accent);">Built-in</td>
            <td style="padding: 0.75rem; text-align: center;">On your own</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>`;

    // Use lowest-price property for FAQ vars
    const cheapest = properties.reduce((a, b) => a.price_from_weekly < b.price_from_weekly ? a : b);
    const cheapHood = getNeighborhood(cheapest.neighborhood_slug);
    const vars = buildVars(cheapest, cheapHood);
    vars.location = 'Toronto';

    const faq = faqSectionHTML(theme ? theme.faq_pool : [], vars, pageSlug);
    const faqLd = faqJsonLd(theme ? theme.faq_pool : [], vars, pageSlug);

    generated.push(generatePage({
      filename,
      title: aud.title,
      metaDesc: aud.metaDesc,
      canonical,
      h1: aud.h1,
      subtitle: aud.subtitle,
      priceBadge: `From C$${lowestPrice}/week`,
      introText: aud.intro,
      bodyContent,
      faqHTML: faq,
      ctaHTML: ctaSectionHTML('en'),
      breadcrumbJsonLd: breadcrumb([
        { name: 'Home', url: 'https://circlestay.ca/' },
        { name: aud.h1.split(':')[0] }
      ]),
      extraJsonLd: faqLd,
      lang: 'en'
    }));
  });
  return generated;
}

// ══════════════════════════════════════════════════════════════════════════════════
// TEMPLATE 4 — Furnished Rooms (4 pages)
// ══════════════════════════════════════════════════════════════════════════════════
function generateFurnishedPages() {
  const theme = getTheme('furnished-rooms-on-rent');
  const generated = [];

  neighborhoods.forEach(hood => {
    const prop = getProp(hood.property_slug);
    const vars = buildVars(prop, hood);
    const pageSlug = `furnished-rooms-${hood.slug}`;
    const filename = `${pageSlug}.html`;
    const canonical = `https://circlestay.ca/${pageSlug}`;

    const h1 = fillTemplate(pickVariant(pageSlug, theme.h1_variants), vars);
    const metaTitle = fillTemplate(theme.meta_title_template, vars);
    const metaDesc = fillTemplate(theme.meta_description_template, vars);
    const intro = fillTemplate(pickVariant(pageSlug, theme.intro_variants), vars);

    const bodyContent = `
  <!-- What's in Every Room -->
  <section class="section">
    <div class="container" style="max-width: 800px;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">What's in Every Furnished Room</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
        <div class="fade-in" style="background: var(--cream); border-radius: 8px; padding: 1.5rem; text-align: center;">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">&#128716;</p>
          <p style="font-weight: 600;">Bed & Linens</p>
          <p style="font-size: 0.9rem; color: #666;">Single, queen, or king depending on room type</p>
        </div>
        <div class="fade-in" style="background: var(--cream); border-radius: 8px; padding: 1.5rem; text-align: center;">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">&#128187;</p>
          <p style="font-weight: 600;">Desk & Chair</p>
          <p style="font-size: 0.9rem; color: #666;">Work-from-home ready workspace</p>
        </div>
        <div class="fade-in" style="background: var(--cream); border-radius: 8px; padding: 1.5rem; text-align: center;">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">&#128084;</p>
          <p style="font-size: 0.9rem; color: #666;">Full wardrobe or closet space</p>
          <p style="font-weight: 600;">Wardrobe</p>
        </div>
        <div class="fade-in" style="background: var(--cream); border-radius: 8px; padding: 1.5rem; text-align: center;">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">&#128246;</p>
          <p style="font-weight: 600;">WiFi & Utilities</p>
          <p style="font-size: 0.9rem; color: #666;">High-speed internet, hydro, water, heat</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Room Types -->
  <section class="section section--cream">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">Furnished Room Types at ${prop.name}</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center;">
${roomCardsHTML(prop)}
      </div>
    </div>
  </section>

  <!-- Property Image -->
  <section class="section">
    <div class="container">
      <div class="fade-in" style="display: flex; flex-wrap: wrap; gap: 2rem; align-items: center;">
        <img src="${propImage(prop.slug)}" alt="${propImageAlt(prop)}" loading="lazy" decoding="async" style="width: 100%; max-width: 500px; border-radius: 12px; object-fit: cover;">
        <div style="flex: 1; min-width: 280px;">
          <h2 style="font-family: var(--font-heading); font-size: 1.6rem; margin-bottom: 0.5rem;">${prop.name} in ${hood.name}</h2>
          <p style="color: var(--accent); margin-bottom: 0.5rem;">${prop.address}</p>
          <p style="margin-bottom: 1rem;">${hood.description}</p>
          <p style="margin-bottom: 0.5rem;"><strong>Amenities:</strong> ${prop.amenities.join(', ')}</p>
          <p><strong>Transit:</strong> ${prop.transit.map(t => `${t.name} (${t.distance_min} min${t.note ? ' — ' + t.note : ''})`).join(', ')}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Neighborhood -->
  <section class="section section--cream">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 0.5rem;">${hood.name} Neighborhood Guide</h2>
      ${neighborhoodInfoHTML(hood, 'en')}
    </div>
  </section>`;

    // furnished-rooms-on-rent theme has no faq_pool, fall back to coliving
    const faqTheme = theme.faq_pool ? theme : getTheme('coliving');
    const faq = faqSectionHTML(faqTheme.faq_pool, vars, pageSlug);
    const faqLd = faqJsonLd(faqTheme.faq_pool, vars, pageSlug);

    generated.push(generatePage({
      filename,
      title: metaTitle,
      metaDesc,
      canonical,
      h1,
      subtitle: `Move-in ready furnished rooms at ${prop.name}. Everything included from ${formatPrice(prop.price_from_weekly)}/week.`,
      priceBadge: `From ${formatPrice(prop.price_from_weekly)}/week`,
      introText: intro,
      bodyContent,
      faqHTML: faq,
      ctaHTML: ctaSectionHTML('en'),
      breadcrumbJsonLd: breadcrumb([
        { name: 'Home', url: 'https://circlestay.ca/' },
        { name: 'Rooms', url: 'https://circlestay.ca/locations' },
        { name: `Furnished Rooms in ${hood.name}` }
      ]),
      extraJsonLd: `,
      {
        "@type": "LodgingBusiness",
        "name": "${prop.name} — Circle Co-Living",
        "description": "Furnished rooms on rent in ${hood.name}, Toronto from ${formatPrice(prop.price_from_weekly)}/week.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "${prop.address}",
          "addressLocality": "Toronto",
          "addressRegion": "ON",
          "addressCountry": "CA"
        },
        "priceRange": "${formatPrice(prop.price_from_weekly)} - ${formatPrice(prop.price_to_weekly)} per week",
        "url": "${canonical}"
      }` + faqLd,
      lang: 'en',
      ogImage: `https://circlestay.ca${propImage(prop.slug)}`
    }));
  });
  return generated;
}

// ══════════════════════════════════════════════════════════════════════════════════
// TEMPLATE 5 — French Pages (5 pages: 4 neighborhood + 1 student)
// ══════════════════════════════════════════════════════════════════════════════════
function generateFrenchPages() {
  const generated = [];

  // 4 neighborhood pages
  neighborhoods.forEach(hood => {
    const prop = getProp(hood.property_slug);
    const vars = buildVars(prop, hood);
    vars.location = hood.name_fr;
    const pageSlug = `fr/colocation-${hood.slug}`;
    const filename = `fr/colocation-${hood.slug}.html`;
    const canonical = `https://circlestay.ca/fr/colocation-${hood.slug}`;
    const enCanonical = `https://circlestay.ca/co-living-in-${hood.slug}`;

    const h1 = `Colocation ${hood.name_fr} : Chambres meubl&eacute;es d&egrave;s ${formatPrice(prop.price_from_weekly)}/semaine`;
    const metaTitle = `Colocation ${hood.name_fr}, Toronto | D&egrave;s ${formatPrice(prop.price_from_weekly)}/sem | Circle`;
    const metaDesc = `Colocation ${hood.name_fr}, Toronto. Chambres meubl&eacute;es tout compris d&egrave;s ${formatPrice(prop.price_from_weekly)}/semaine. Baux flexibles, pas de v&eacute;rification de cr&eacute;dit. Postulez maintenant.`;

    const intro = `Vous cherchez une colocation ${hood.name_fr.toLowerCase()} &agrave; Toronto? ${prop.name} offre des chambres meubl&eacute;es d&egrave;s ${formatPrice(prop.price_from_weekly)}/semaine, tout compris : meubles, WiFi, services publics et une communaut&eacute; d'&eacute;tudiants et de jeunes professionnels. Pas de v&eacute;rification de cr&eacute;dit, baux flexibles &agrave; partir d'un mois. ${hood.vibe_fr} Chaque chambre est pr&ecirc;te &agrave; emm&eacute;nager avec lit, bureau, garde-robe et linge de maison. Les espaces communs comprennent une cuisine &eacute;quip&eacute;e, des salons et des commodit&eacute;s du b&acirc;timent. Postulez en ligne en 2 minutes et emm&eacute;nagez cette semaine.`;

    const bodyContent = `
  <!-- Propri&eacute;t&eacute; -->
  <section class="section">
    <div class="container">
      <div class="fade-in" style="display: flex; flex-wrap: wrap; gap: 2rem; align-items: center;">
        <img src="${propImage(prop.slug)}" alt="${propImageAlt(prop)}" loading="lazy" decoding="async" style="width: 100%; max-width: 500px; border-radius: 12px; object-fit: cover;">
        <div style="flex: 1; min-width: 280px;">
          <h2 style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 0.5rem;">${prop.name}</h2>
          <p style="color: var(--accent); font-size: 1.1rem; margin-bottom: 0.5rem;">${prop.address}</p>
          <p style="margin-bottom: 1rem;">${hood.vibe_fr}</p>
          <p><strong>Transport :</strong> ${hood.transit_stations.join(', ')}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Types de chambres -->
  <section class="section section--cream">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">Types de chambres</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center;">
${roomCardsHTML(prop)}
      </div>
      <p class="fade-in" style="text-align: center; margin-top: 1.5rem; font-size: 0.95rem; color: #666;">Toutes les chambres sont meubl&eacute;es. WiFi, services publics et commodit&eacute;s inclus. Baux flexibles &agrave; partir d'un mois.</p>
    </div>
  </section>

  <!-- Quartier -->
  <section class="section">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 0.5rem;">Vivre dans ${hood.name_fr}</h2>
      ${neighborhoodInfoHTML(hood, 'fr')}
    </div>
  </section>

  <!-- Commodit&eacute;s -->
  <section class="section section--cream">
    <div class="container" style="text-align: center;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 2rem;">Ce qui est inclus</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; max-width: 700px; margin: 0 auto;">
        ${prop.amenities.map(a => `<span class="fade-in" style="background: white; padding: 0.6rem 1.2rem; border-radius: 20px; font-size: 0.95rem;">${a}</span>`).join('\n        ')}
      </div>
    </div>
  </section>`;

    // French FAQ
    const frFaqs = [
      { q: `Qu'est-ce que la colocation ${hood.name_fr}?`, a: `La colocation chez Circle est un concept de logement moderne o&ugrave; vous louez une chambre priv&eacute;e meubl&eacute;e dans une maison partag&eacute;e et g&eacute;r&eacute;e professionnellement. &Agrave; ${prop.name} dans ${hood.name_fr}, cela comprend votre propre chambre plus cuisine partag&eacute;e, espaces communs et commodit&eacute;s &mdash; le tout inclus dans un prix hebdomadaire &agrave; partir de ${formatPrice(prop.price_from_weekly)}.` },
      { q: `Combien co&ucirc;te la colocation ${hood.name_fr}?`, a: `Les chambres au ${prop.name} commencent &agrave; ${formatPrice(prop.price_from_weekly)}/semaine (${formatMonthly(prop.price_from_weekly)}/mois). Tous les services publics, WiFi et ameublement sont inclus. C'est 38-60% moins cher qu'un appartement solo dans le m&ecirc;me quartier.` },
      { q: `Ai-je besoin d'un historique de cr&eacute;dit canadien?`, a: `Non. Circle Co-Living n'exige pas d'historique de cr&eacute;dit canadien. Postulez en ligne, approbation en 48 heures. Id&eacute;al pour les &eacute;tudiants internationaux et les nouveaux arrivants.` },
      { q: `Quelle est la dur&eacute;e minimale du bail?`, a: `Un mois seulement. Nous offrons des baux flexibles de 1 &agrave; 12+ mois. Parfait pour les &eacute;tudiants, stagiaires et professionnels en transition.` }
    ];

    let faqItems = '';
    frFaqs.forEach(faq => {
      faqItems += `
        <details class="faq-item fade-in" style="background: var(--cream); border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 0.75rem;">
          <summary style="font-family: var(--font-heading); font-size: 1.15rem; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center;">${faq.q}<span style="font-size: 1.5rem; transition: transform 0.3s;">+</span></summary>
          <p style="margin-top: 1rem; line-height: 1.7;">${faq.a}</p>
        </details>`;
    });

    const faqLdEntities = frFaqs.map(faq => `      {
        "@type": "Question",
        "name": ${JSON.stringify(faq.q)},
        "acceptedAnswer": {
          "@type": "Answer",
          "text": ${JSON.stringify(faq.a)}
        }
      }`);

    const faqLd = `,
      {
        "@type": "FAQPage",
        "mainEntity": [
${faqLdEntities.join(',\n')}
        ]
      }`;

    generated.push(generatePage({
      filename,
      title: metaTitle,
      metaDesc,
      canonical,
      h1,
      subtitle: `${hood.vibe_fr} D&egrave;s ${formatPrice(prop.price_from_weekly)}/semaine au ${prop.name}.`,
      priceBadge: `D&egrave;s ${formatPrice(prop.price_from_weekly)}/semaine`,
      introText: intro,
      bodyContent,
      faqHTML: faqItems,
      ctaHTML: ctaSectionHTML('fr'),
      breadcrumbJsonLd: breadcrumb([
        { name: 'Accueil', url: 'https://circlestay.ca/' },
        { name: 'Emplacements', url: 'https://circlestay.ca/locations' },
        { name: `Colocation ${hood.name_fr}` }
      ]),
      extraJsonLd: `,
      {
        "@type": "LodgingBusiness",
        "name": "${prop.name} — Circle Co-Living",
        "description": "Colocation ${hood.name_fr}, Toronto. Chambres meubl&eacute;es d&egrave;s ${formatPrice(prop.price_from_weekly)}/semaine.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "${prop.address}",
          "addressLocality": "Toronto",
          "addressRegion": "ON",
          "addressCountry": "CA"
        },
        "priceRange": "${formatPrice(prop.price_from_weekly)} - ${formatPrice(prop.price_to_weekly)} par semaine",
        "url": "${canonical}"
      }` + faqLd,
      lang: 'fr',
      hreflangTags: `  <link rel="alternate" hreflang="en" href="${enCanonical}">\n  <link rel="alternate" hreflang="fr" href="${canonical}">`,
      ogImage: `https://circlestay.ca${propImage(prop.slug)}`
    }));
  });

  // 1 student page in French
  {
    const cheapest = properties.reduce((a, b) => a.price_from_weekly < b.price_from_weekly ? a : b);
    const pageSlug = 'fr/logement-etudiant-toronto';
    const filename = 'fr/logement-etudiant-toronto.html';
    const canonical = 'https://circlestay.ca/fr/logement-etudiant-toronto';

    const h1 = `Logement &eacute;tudiant &agrave; Toronto : Chambres meubl&eacute;es d&egrave;s C$${cheapest.price_from_weekly}/semaine`;
    const metaTitle = `Logement &eacute;tudiant Toronto | D&egrave;s C$${cheapest.price_from_weekly}/sem | Circle Co-Living`;
    const metaDesc = `Logement &eacute;tudiant &agrave; Toronto d&egrave;s C$${cheapest.price_from_weekly}/semaine. Meubl&eacute;, tout compris, pas de v&eacute;rification de cr&eacute;dit. 4 emplacements au centre-ville. Postulez maintenant.`;

    const intro = `Trouver un logement &eacute;tudiant &agrave; Toronto peut &ecirc;tre stressant, surtout pour les &eacute;tudiants internationaux. Circle Co-Living simplifie tout : 4 r&eacute;sidences au centre-ville, chambres meubl&eacute;es d&egrave;s C$${cheapest.price_from_weekly}/semaine, tout inclus dans un seul prix. Pas de v&eacute;rification de cr&eacute;dit canadien, pas de garant, baux flexibles &agrave; partir d'un mois. Nos r&eacute;sidences sont situ&eacute;es pr&egrave;s de l'UofT (15 min), TMU (5 min), George Brown (10 min) et OCAD (8 min). Chaque chambre est pr&ecirc;te &agrave; emm&eacute;nager avec meubles, WiFi haut d&eacute;bit et tous les services publics inclus. La communaut&eacute; Circle comprend des &eacute;tudiants canadiens et internationaux, ainsi que de jeunes professionnels qui valorisent le calme, le respect et la connexion v&eacute;ritable. Postulez en 2 minutes et emm&eacute;nagez cette semaine.`;

    let allPropsHTML = '';
    properties.forEach(prop => {
      const hood = getNeighborhood(prop.neighborhood_slug);
      allPropsHTML += `
          <div class="fade-in" style="background: var(--cream); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
            <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center;">
              <img src="${propImage(prop.slug)}" alt="${propImageAlt(prop)}" loading="lazy" decoding="async" style="width: 200px; height: 140px; object-fit: cover; border-radius: 8px;">
              <div style="flex: 1; min-width: 240px;">
                <h3 style="font-family: var(--font-heading); font-size: 1.4rem; margin-bottom: 0.25rem;"><a href="/property-${prop.slug.replace('the-', '')}" style="color: var(--primary); text-decoration: none;">${prop.name}</a></h3>
                <p style="color: var(--accent); margin-bottom: 0.25rem;">${hood.name_fr}</p>
                <p style="margin-bottom: 0.5rem;">${prop.address}</p>
                <p style="font-size: 1.4rem; font-weight: 700; color: var(--accent);">D&egrave;s ${formatPrice(prop.price_from_weekly)}<span style="font-size: 0.85rem; font-weight: 400; color: var(--text);">/semaine</span></p>
                <p style="margin-top: 0.5rem; font-size: 0.9rem;">${prop.rooms.length} types de chambres</p>
              </div>
            </div>
          </div>`;
    });

    const bodyContent = `
  <section class="section">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">Nos 4 emplacements &agrave; Toronto</h2>
${allPropsHTML}
    </div>
  </section>

  <section class="section section--cream">
    <div class="container" style="max-width: 900px;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">Pourquoi choisir Circle?</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
        <div class="fade-in" style="text-align: center; padding: 1.5rem;">
          <p style="font-size: 2.5rem; margin-bottom: 0.75rem;">&#128176;</p>
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 0.5rem;">&Eacute;conomisez 38-60%</h3>
          <p style="font-size: 0.95rem; color: #666;">Par rapport &agrave; un appartement solo. Tous les services publics et WiFi inclus.</p>
        </div>
        <div class="fade-in" style="text-align: center; padding: 1.5rem;">
          <p style="font-size: 2.5rem; margin-bottom: 0.75rem;">&#128197;</p>
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 0.5rem;">Baux flexibles</h3>
          <p style="font-size: 0.95rem; color: #666;">Minimum 1 mois. Pas d'engagement &agrave; long terme.</p>
        </div>
        <div class="fade-in" style="text-align: center; padding: 1.5rem;">
          <p style="font-size: 2.5rem; margin-bottom: 0.75rem;">&#9989;</p>
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 0.5rem;">Pas de cr&eacute;dit requis</h3>
          <p style="font-size: 0.95rem; color: #666;">Postulez en 2 minutes. Approbation en 48 heures.</p>
        </div>
      </div>
    </div>
  </section>`;

    const frFaqs = [
      { q: 'Combien co&ucirc;te le logement &eacute;tudiant &agrave; Toronto?', a: `Les chambres chez Circle commencent &agrave; C$${cheapest.price_from_weekly}/semaine (C$${cheapest.price_from_weekly * 4}/mois), tout compris. Meubles, WiFi, services publics et commodit&eacute;s du b&acirc;timent sont inclus.` },
      { q: 'Faut-il un historique de cr&eacute;dit canadien?', a: 'Non. Circle Co-Living n\'exige pas d\'historique de cr&eacute;dit. Les &eacute;tudiants internationaux et les nouveaux arrivants sont les bienvenus. Postulez en ligne, approbation en 48 heures.' },
      { q: 'Quelle est la dur&eacute;e minimale du bail?', a: 'Un mois. Que vous ayez besoin d\'un logement pour un trimestre d\'&eacute;t&eacute;, un semestre ou une ann&eacute;e compl&egrave;te, nous avons des options flexibles.' },
      { q: 'Les chambres sont-elles meubl&eacute;es?', a: 'Oui. Chaque chambre est enti&egrave;rement meubl&eacute;e avec lit, bureau, chaise, garde-robe et linge de maison. Les espaces partag&eacute;s comprennent une cuisine &eacute;quip&eacute;e et des aires communes.' }
    ];

    let faqItems = '';
    frFaqs.forEach(faq => {
      faqItems += `
        <details class="faq-item fade-in" style="background: var(--cream); border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 0.75rem;">
          <summary style="font-family: var(--font-heading); font-size: 1.15rem; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center;">${faq.q}<span style="font-size: 1.5rem; transition: transform 0.3s;">+</span></summary>
          <p style="margin-top: 1rem; line-height: 1.7;">${faq.a}</p>
        </details>`;
    });

    generated.push(generatePage({
      filename,
      title: metaTitle,
      metaDesc,
      canonical,
      h1,
      subtitle: `Meubl&eacute;, tout compris, pas de v&eacute;rification de cr&eacute;dit. 4 emplacements au centre-ville de Toronto.`,
      priceBadge: `D&egrave;s C$${cheapest.price_from_weekly}/semaine`,
      introText: intro,
      bodyContent,
      faqHTML: faqItems,
      ctaHTML: ctaSectionHTML('fr'),
      breadcrumbJsonLd: breadcrumb([
        { name: 'Accueil', url: 'https://circlestay.ca/' },
        { name: 'Logement &eacute;tudiant Toronto' }
      ]),
      extraJsonLd: '',
      lang: 'fr',
      hreflangTags: `  <link rel="alternate" hreflang="en" href="https://circlestay.ca/student-housing-toronto">\n  <link rel="alternate" hreflang="fr" href="${canonical}">`
    }));
  }

  return generated;
}

// ══════════════════════════════════════════════════════════════════════════════════
// TEMPLATE 6 — Room Type (4 pages)
// ══════════════════════════════════════════════════════════════════════════════════
function generateRoomTypePages() {
  const generated = [];

  const roomTypes = [
    {
      slug: 'basic-rooms-toronto',
      displayName: 'Basic Rooms',
      searchTerm: 'basic',
      h1: 'Basic Rooms in Toronto: Affordable Co-Living from C$240/Week',
      title: 'Basic Rooms in Toronto | From C$240/wk All-Inclusive | Circle Co-Living',
      metaDesc: 'Basic rooms in Toronto from C$240/week. Furnished, all-inclusive, no credit check. Compare basic rooms across 4 downtown locations. Apply now.',
      subtitle: 'Our most affordable room type. Single bed, desk, wardrobe, and shared bathroom. Everything included.',
      intro: 'Basic rooms at Circle Co-Living are the most affordable way to live in downtown Toronto. Starting from just C$240/week at The Maddox, basic rooms include a single bed, desk, wardrobe, and access to shared bathrooms and common areas. All utilities, WiFi, and building amenities are included in one simple weekly price. Basic rooms are available at The York (C$330/week in the Financial District), The Yonge (C$305/week in the Downtown Core), and The Maddox (C$240/week in the Garden District). Each location offers a different neighborhood vibe and price point, but every basic room comes with the same Circle standards: fully furnished, professionally managed, secure access, and a built-in community of students and young professionals. No credit check required, no guarantor needed, and leases start at just 1 month. Whether you are a student on a tight budget, an intern looking for short-term housing, or a newcomer to Toronto, basic rooms offer genuine downtown living at a fraction of solo apartment prices.'
    },
    {
      slug: 'private-rooms-toronto',
      displayName: 'Private Rooms',
      searchTerm: 'private',
      h1: 'Private Rooms in Toronto: All-Inclusive Co-Living from C$290/Week',
      title: 'Private Rooms in Toronto | All-Inclusive from C$290/wk | Circle Co-Living',
      metaDesc: 'Private rooms in Toronto from C$290/week. Enhanced furnishings, all utilities included. 4 downtown locations. No credit check. Apply online.',
      subtitle: 'Enhanced furnishings and extra space. Perfect for longer stays and those who want a bit more comfort.',
      intro: 'Private rooms at Circle Co-Living offer enhanced comfort and furnishings for residents who want a step up from basic accommodations. Available across our Toronto locations, private rooms feature flexible layouts, enhanced furnishings, and premium touches that make your space feel like home. At The Maddox, Flex Plus and Flex Premium rooms start from C$290/week, with some including a private balcony. These rooms offer flexible layouts with enhanced furnishings and shared bathrooms. The Maddox is located in the Garden District with the 505 Dundas Streetcar right at your door. Private rooms are ideal for residents staying longer term who want more personal space without jumping to a deluxe or master suite. Every private room includes furniture, WiFi, all utilities, kitchen access, and building amenities. Leases start at 1 month with no credit check required. Apply online in 2 minutes and move in within a week.'
    },
    {
      slug: 'deluxe-rooms-toronto',
      displayName: 'Deluxe Rooms',
      searchTerm: 'deluxe',
      h1: 'Deluxe Rooms in Toronto: Premium Co-Living from C$315/Week',
      title: 'Deluxe Rooms in Toronto | Premium from C$315/wk | Circle Co-Living',
      metaDesc: 'Deluxe rooms in Toronto from C$315/week. Queen bed, large desk, premium wardrobe. Available at all 4 downtown locations. Apply now.',
      subtitle: 'Queen bed, large desk, and premium wardrobe. Our most popular room type across all locations.',
      intro: 'Deluxe rooms are Circle Co-Living\'s most popular room type, available at all four Toronto locations. Each deluxe room features a queen bed, large desk, and premium wardrobe in a spacious layout designed for comfort and productivity. At The Maddox in the Garden District, deluxe rooms start from C$315/week. The York in the Financial District offers deluxe rooms from C$370/week with access to premium amenities including a fitness centre, indoor pool, and sauna. The Queen in Queen West and The Yonge in the Downtown Core both offer deluxe rooms at C$385/week. Every deluxe room comes fully furnished with all utilities and WiFi included. Shared bathrooms are professionally maintained with regular cleaning. You also get full access to building amenities, common areas, and shared kitchens. Deluxe rooms are the sweet spot between affordability and comfort — more space and premium furnishings compared to basic rooms, at a price point that is still 40-55% less than a solo apartment in the same neighborhood. No credit check, flexible leases from 1 month, and professional management at every property.'
    },
    {
      slug: 'master-suite-rooms-toronto',
      displayName: 'Master Suite Rooms',
      searchTerm: 'master',
      h1: 'Master Suite Rooms in Toronto: Ensuite Co-Living from C$455/Week',
      title: 'Master Suite Rooms in Toronto | Ensuite from C$455/wk | Circle Co-Living',
      metaDesc: 'Master suite rooms in Toronto from C$455/week. King bed, private ensuite bathroom. Maximum privacy in a co-living community. Apply now.',
      subtitle: 'King bed and private ensuite bathroom. Maximum privacy with all the benefits of co-living community.',
      intro: 'Master suite rooms are the premium option at Circle Co-Living — your own king bed, large desk, premium wardrobe, and a private ensuite bathroom. Available at The York (C$465/week) and The Queen (C$455/week), master suites combine the privacy of your own apartment with the community, convenience, and value of co-living. At The York in the Financial District, the master suite puts you 2 minutes from Union Station with access to the PATH network, indoor pool, fitness centre, and sauna. At The Queen on Queen West, you are in the heart of Toronto\'s cultural and entertainment district, steps from Osgoode Station and the 501 streetcar. Master suites are ideal for young professionals who want maximum privacy, couples considering co-living, or anyone who values their own bathroom space. Even at the premium price point, master suites are significantly cheaper than comparable studio apartments in the same neighborhoods, which typically run C$2,000-2,800/month unfurnished. All utilities, WiFi, and amenities are included in one weekly price. Flexible leases from 1 month, no credit check required.'
    }
  ];

  roomTypes.forEach(rt => {
    const pageSlug = rt.slug;
    const filename = `${pageSlug}.html`;
    const canonical = `https://circlestay.ca/${pageSlug}`;

    const bodyContent = `
  <!-- Room Type Comparison -->
  <section class="section">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">${rt.displayName} Across Toronto</h2>
${roomTypeComparisonHTML(rt.searchTerm)}
    </div>
  </section>

  <!-- What's Included -->
  <section class="section section--cream">
    <div class="container" style="max-width: 800px;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">What's Included in Every Room</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
        <div class="fade-in" style="background: white; border-radius: 8px; padding: 1.5rem; text-align: center;">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">&#128716;</p>
          <p style="font-weight: 600;">Furnished Room</p>
          <p style="font-size: 0.9rem; color: #666;">Bed, desk, chair, wardrobe, linens</p>
        </div>
        <div class="fade-in" style="background: white; border-radius: 8px; padding: 1.5rem; text-align: center;">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">&#128246;</p>
          <p style="font-weight: 600;">WiFi & Utilities</p>
          <p style="font-size: 0.9rem; color: #666;">High-speed internet, hydro, water, heat</p>
        </div>
        <div class="fade-in" style="background: white; border-radius: 8px; padding: 1.5rem; text-align: center;">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">&#127858;</p>
          <p style="font-weight: 600;">Shared Kitchen</p>
          <p style="font-size: 0.9rem; color: #666;">Fully equipped kitchen access</p>
        </div>
        <div class="fade-in" style="background: white; border-radius: 8px; padding: 1.5rem; text-align: center;">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">&#128274;</p>
          <p style="font-weight: 600;">Secure Access</p>
          <p style="font-size: 0.9rem; color: #666;">Key-fob entry, 24/7 support</p>
        </div>
      </div>
    </div>
  </section>

  <!-- How to Apply -->
  <section class="section">
    <div class="container" style="max-width: 700px;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">How to Get Your Room</h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; text-align: center;">
        <div class="fade-in">
          <div style="width: 48px; height: 48px; background: var(--accent); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 700; margin: 0 auto 1rem;">1</div>
          <h3 style="font-family: var(--font-heading); font-size: 1.1rem; margin-bottom: 0.5rem;">Apply Online</h3>
          <p style="font-size: 0.9rem; color: #666;">Takes 2 minutes. No credit check.</p>
        </div>
        <div class="fade-in">
          <div style="width: 48px; height: 48px; background: var(--accent); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 700; margin: 0 auto 1rem;">2</div>
          <h3 style="font-family: var(--font-heading); font-size: 1.1rem; margin-bottom: 0.5rem;">Get Approved</h3>
          <p style="font-size: 0.9rem; color: #666;">Within 48 hours. No guarantor needed.</p>
        </div>
        <div class="fade-in">
          <div style="width: 48px; height: 48px; background: var(--accent); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 700; margin: 0 auto 1rem;">3</div>
          <h3 style="font-family: var(--font-heading); font-size: 1.1rem; margin-bottom: 0.5rem;">Move In</h3>
          <p style="font-size: 0.9rem; color: #666;">Room is ready. Bring your suitcase.</p>
        </div>
      </div>
    </div>
  </section>`;

    // Use coliving FAQ pool for room type pages
    const theme = getTheme('coliving');
    const cheapest = properties.reduce((a, b) => a.price_from_weekly < b.price_from_weekly ? a : b);
    const cheapHood = getNeighborhood(cheapest.neighborhood_slug);
    const vars = buildVars(cheapest, cheapHood);
    vars.location = 'Toronto';

    const faq = faqSectionHTML(theme.faq_pool, vars, pageSlug);
    const faqLd = faqJsonLd(theme.faq_pool, vars, pageSlug);

    generated.push(generatePage({
      filename,
      title: rt.title,
      metaDesc: rt.metaDesc,
      canonical,
      h1: rt.h1,
      subtitle: rt.subtitle,
      priceBadge: rt.h1.match(/C\$\d+/)?.[0] ? `From ${rt.h1.match(/C\$\d+/)[0]}/week` : null,
      introText: rt.intro,
      bodyContent,
      faqHTML: faq,
      ctaHTML: ctaSectionHTML('en'),
      breadcrumbJsonLd: breadcrumb([
        { name: 'Home', url: 'https://circlestay.ca/' },
        { name: 'Rooms', url: 'https://circlestay.ca/locations' },
        { name: rt.displayName }
      ]),
      extraJsonLd: faqLd,
      lang: 'en'
    }));
  });
  return generated;
}

// ══════════════════════════════════════════════════════════════════════════════════
// GENERIC THEME-BASED GENERATORS (for all 16 themes)
// ══════════════════════════════════════════════════════════════════════════════════

/** Internal linking section */
function internalLinksHTML(currentSlug, hood, themeSlug) {
  const links = [];
  // Link to property page
  const prop = getProp(hood.property_slug);
  if (prop) {
    links.push(`<a href="/property-${prop.slug.replace('the-', '')}" class="btn btn--outline" style="text-align: center;">${prop.name} — From ${formatPrice(prop.price_from_weekly)}/wk</a>`);
  }
  // Link to 2-3 related theme pages in same neighborhood
  const otherThemes = themes.filter(t => t.slug !== themeSlug).slice(0, 3);
  otherThemes.forEach(t => {
    const url = t.url_pattern_neighborhood.replace('{neighborhood}', hood.slug);
    const name = t.display_name + ' in ' + hood.name.split(' /')[0];
    links.push(`<a href="${url}" class="btn btn--outline" style="text-align: center;">${name}</a>`);
  });
  // Link to a blog post
  const blogLinks = [
    { url: '/blog/co-living-toronto-complete-guide', name: 'Co-Living Guide' },
    { url: '/blog/student-housing-toronto-guide', name: 'Student Housing Guide' },
    { url: '/blog/co-living-vs-apartment-toronto', name: 'Co-Living vs Apartment' }
  ];
  const blogPick = blogLinks[Math.abs(pickVariantIdx(currentSlug)) % blogLinks.length];
  links.push(`<a href="${blogPick.url}" class="btn btn--outline" style="text-align: center;">${blogPick.name}</a>`);

  return `
  <section class="section section--cream">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 1.5rem;">Explore More</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; max-width: 900px; margin: 0 auto;">
        ${links.join('\n        ')}
      </div>
    </div>
  </section>`;
}

/** Generate neighborhood pages for a given theme */
function generateThemeNeighborhoodPages(themeSlug) {
  const theme = getTheme(themeSlug);
  if (!theme || !theme.url_pattern_neighborhood) return [];
  const generated = [];

  neighborhoods.forEach(hood => {
    const prop = getProp(hood.property_slug);
    const vars = buildVars(prop, hood);
    const pageSlug = theme.url_pattern_neighborhood.replace('{neighborhood}', hood.slug).replace(/^\//, '');
    const filename = `${pageSlug}.html`;
    const canonical = `https://circlestay.ca/${pageSlug}`;

    // Skip if file already exists (from original templates)
    if (fs.existsSync(path.join(ROOT, filename))) return;

    const h1 = fillTemplate(pickVariant(pageSlug, theme.h1_variants), vars);
    const metaTitle = fillTemplate(theme.meta_title_template, vars);
    const metaDesc = fillTemplate(theme.meta_description_template, vars);
    const intro = fillTemplate(pickVariant(pageSlug, theme.intro_variants), vars);

    const bodyContent = `
  <section class="section">
    <div class="container">
      <div class="fade-in" style="display: flex; flex-wrap: wrap; gap: 2rem; align-items: center; margin-bottom: 3rem;">
        <img src="${propImage(prop.slug)}" alt="${propImageAlt(prop)}" loading="lazy" decoding="async" style="width: 100%; max-width: 500px; border-radius: 12px; object-fit: cover;">
        <div style="flex: 1; min-width: 280px;">
          <h2 style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 0.5rem;">${prop.name}</h2>
          <p style="color: var(--accent); font-size: 1.1rem; margin-bottom: 0.5rem;">${prop.address} &mdash; ${hood.name}</p>
          <p style="margin-bottom: 1rem;">${hood.description}</p>
          <p style="margin-bottom: 1rem;"><strong>Best for:</strong> ${hood.best_for.join(', ')}</p>
          <p style="font-size: 1.1rem;"><strong>Safety:</strong> ${hood.safety_description}</p>
        </div>
      </div>
    </div>
  </section>
  <section class="section section--cream">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">Room Types at ${prop.name}</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center;">
${roomCardsHTML(prop)}
      </div>
      <p class="fade-in" style="text-align: center; margin-top: 1.5rem; font-size: 0.95rem; color: #666;">All rooms fully furnished. WiFi, utilities, and amenities included. Flexible leases from 1 month.</p>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 1rem;">Nearby Campuses</h2>
      ${uniDistanceTable(prop)}
    </div>
  </section>
  <section class="section section--cream">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 0.5rem;">Living in ${hood.name}</h2>
      <p class="fade-in" style="text-align: center; max-width: 600px; margin: 0 auto 1rem; color: #666;">${hood.vibe}</p>
      ${neighborhoodInfoHTML(hood, 'en')}
    </div>
  </section>
  <section class="section">
    <div class="container" style="text-align: center;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 2rem;">What's Included</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; max-width: 700px; margin: 0 auto;">
        ${prop.amenities.map(a => `<span class="fade-in" style="background: var(--cream); padding: 0.6rem 1.2rem; border-radius: 20px; font-size: 0.95rem;">${a}</span>`).join('\n        ')}
      </div>
    </div>
  </section>
${internalLinksHTML(pageSlug, hood, themeSlug)}`;

    const faq = faqSectionHTML(theme.faq_pool, vars, pageSlug);
    const faqLd = faqJsonLd(theme.faq_pool, vars, pageSlug);

    generated.push(generatePage({
      filename, title: metaTitle, metaDesc, canonical, h1,
      subtitle: `${hood.vibe} Starting from ${formatPrice(prop.price_from_weekly)}/week at ${prop.name}.`,
      priceBadge: `From ${formatPrice(prop.price_from_weekly)}/week`,
      introText: intro, bodyContent, faqHTML: faq, ctaHTML: ctaSectionHTML('en'),
      breadcrumbJsonLd: breadcrumb([
        { name: 'Home', url: 'https://circlestay.ca/' },
        { name: theme.display_name + ' Toronto' },
        { name: hood.name }
      ]),
      extraJsonLd: `,
      {
        "@type": "LodgingBusiness",
        "name": "${prop.name} — Circle Co-Living",
        "description": "${theme.display_name} in ${hood.name}, Toronto. Furnished rooms from ${formatPrice(prop.price_from_weekly)}/week.",
        "address": { "@type": "PostalAddress", "streetAddress": "${prop.address}", "addressLocality": "Toronto", "addressRegion": "ON", "addressCountry": "CA" },
        "priceRange": "${formatPrice(prop.price_from_weekly)} - ${formatPrice(prop.price_to_weekly)} per week",
        "url": "${canonical}"
      }` + faqLd,
      lang: 'en', ogImage: `https://circlestay.ca${propImage(prop.slug)}`
    }));
  });
  return generated;
}

/** Generate city-level page for a given theme */
function generateThemeCityPage(themeSlug) {
  const theme = getTheme(themeSlug);
  if (!theme || !theme.url_pattern_city) return [];

  const pageSlug = theme.url_pattern_city.replace(/^\//, '');
  const filename = `${pageSlug}.html`;

  // Skip if already exists (audience segment pages, etc.)
  if (fs.existsSync(path.join(ROOT, filename))) return [];

  const canonical = `https://circlestay.ca/${pageSlug}`;
  const lowestProp = properties.reduce((a, b) => a.price_from_weekly < b.price_from_weekly ? a : b);
  const vars = {
    location: 'Toronto',
    property: 'Circle Co-Living',
    price: formatPrice(lowestProp.price_from_weekly),
    monthly: formatMonthly(lowestProp.price_from_weekly),
    room_count: String(properties.reduce((sum, p) => sum + p.rooms.length, 0)),
    transit_highlight: 'multiple subway stations and streetcar lines',
    amenities_list: 'WiFi, Furnished Rooms, Concierge, Fitness Centre',
    top_amenities: 'WiFi, Furnished Rooms, Concierge, Fitness Centre',
    safety_description: 'All properties feature secure access and professional management',
    location_preposition: 'in'
  };

  const h1 = fillTemplate(pickVariant(pageSlug, theme.h1_variants), vars);
  const metaTitle = fillTemplate(theme.meta_title_template, vars);
  const metaDesc = fillTemplate(theme.meta_description_template, vars);
  const intro = fillTemplate(pickVariant(pageSlug, theme.intro_variants), vars);

  // All properties overview
  let propsHTML = '';
  properties.forEach(prop => {
    const hood = getNeighborhood(prop.neighborhood_slug);
    propsHTML += `
          <div class="fade-in" style="background: var(--cream); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem;">
            <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center;">
              <img src="${propImage(prop.slug)}" alt="${propImageAlt(prop)}" loading="lazy" decoding="async" style="width: 180px; height: 120px; object-fit: cover; border-radius: 8px;">
              <div style="flex: 1; min-width: 200px;">
                <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 0.25rem;"><a href="/property-${prop.slug.replace('the-', '')}" style="color: var(--primary); text-decoration: none;">${prop.name}</a></h3>
                <p style="color: var(--accent); margin-bottom: 0.25rem;">${hood ? hood.name : prop.neighborhood_name}</p>
                <p style="margin-bottom: 0.5rem;">${prop.address}</p>
                <p style="font-size: 1.4rem; font-weight: 700; color: var(--accent);">From ${formatPrice(prop.price_from_weekly)}<span style="font-size: 0.85rem; font-weight: 400; color: var(--text);">/week</span></p>
                <p style="margin-top: 0.5rem; font-size: 0.9rem;">${prop.rooms.length} room types | ${prop.amenities.slice(0, 3).join(', ')}</p>
              </div>
            </div>
          </div>`;
  });

  // Neighborhood links
  let hoodLinks = '';
  neighborhoods.forEach(hood => {
    const url = theme.url_pattern_neighborhood.replace('{neighborhood}', hood.slug);
    hoodLinks += `<a href="${url}" class="btn btn--outline" style="text-align: center;">${theme.display_name} in ${hood.name.split(' /')[0]}</a>\n        `;
  });

  const bodyContent = `
  <section class="section">
    <div class="container">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 2rem;">Our Locations</h2>
      ${propsHTML}
    </div>
  </section>
  <section class="section section--cream">
    <div class="container" style="text-align: center;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 1.5rem;">Browse by Neighbourhood</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; max-width: 900px; margin: 0 auto;">
        ${hoodLinks}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container" style="text-align: center;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 2rem;">What's Included</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; max-width: 700px; margin: 0 auto;">
        ${['Fully Furnished', 'High-Speed WiFi', 'All Utilities', 'Flexible Leases', 'No Credit Check', '24/7 Support'].map(a => `<span class="fade-in" style="background: var(--cream); padding: 0.6rem 1.2rem; border-radius: 20px; font-size: 0.95rem;">${a}</span>`).join('\n        ')}
      </div>
    </div>
  </section>`;

  const faq = faqSectionHTML(theme.faq_pool, vars, pageSlug);
  const faqLd = faqJsonLd(theme.faq_pool, vars, pageSlug);

  return [generatePage({
    filename, title: metaTitle, metaDesc, canonical, h1,
    subtitle: `${properties.length} locations across Toronto. All-inclusive from ${formatPrice(lowestProp.price_from_weekly)}/week.`,
    priceBadge: `From ${formatPrice(lowestProp.price_from_weekly)}/week`,
    introText: intro, bodyContent, faqHTML: faq, ctaHTML: ctaSectionHTML('en'),
    breadcrumbJsonLd: breadcrumb([
      { name: 'Home', url: 'https://circlestay.ca/' },
      { name: theme.display_name + ' Toronto' }
    ]),
    extraJsonLd: faqLd,
    lang: 'en', ogImage: 'https://circlestay.ca/building-york.jpg'
  })];
}

/** Generate university pages for a given theme */
function generateThemeUniversityPages(themeSlug) {
  const theme = getTheme(themeSlug);
  if (!theme || !theme.generate_university_pages || !theme.url_pattern_university) return [];
  const generated = [];

  universities.forEach(uni => {
    const nearestProp = getProp(uni.nearest_property);
    const nearestHood = nearestProp ? getNeighborhood(nearestProp.neighborhood_slug) : neighborhoods[0];
    const vars = buildVars(nearestProp, nearestHood);
    vars.location = `near ${uni.name}`;
    vars.nearest_campus = uni.name;
    const dist = uni.all_properties_distance[nearestProp.slug];
    if (dist) {
      vars.campus_distance = `${dist.minutes} minutes`;
      vars.transit_detail = `Take ${dist.route} — about ${dist.minutes} minutes door to door`;
    }

    const pageSlug = theme.url_pattern_university.replace('{university}', uni.slug).replace(/^\//, '');
    const filename = `${pageSlug}.html`;
    const canonical = `https://circlestay.ca/${pageSlug}`;

    if (fs.existsSync(path.join(ROOT, filename))) return;

    const h1 = fillTemplate(pickVariant(pageSlug, theme.h1_variants), vars);
    const metaTitle = fillTemplate(theme.meta_title_template, vars);
    const metaDesc = fillTemplate(theme.meta_description_template, vars);
    const intro = fillTemplate(pickVariant(pageSlug, theme.intro_variants), vars);

    const bodyContent = `
  <section class="section">
    <div class="container">
      <div class="fade-in" style="text-align: center; margin-bottom: 2rem;">
        <h2 style="font-family: var(--font-heading); font-size: 1.8rem;">${uni.name} (${uni.short_name})</h2>
        <p style="color: var(--text-light);">${uni.campus} &mdash; ${uni.address}</p>
        <p style="margin-top: 0.5rem;"><strong>${uni.student_population}</strong> students | <strong>${uni.international_student_pct}</strong> international</p>
      </div>
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.6rem; margin-bottom: 1.5rem;">All Circle Locations Near ${uni.short_name}</h2>
      ${allPropsForUniHTML(uni)}
    </div>
  </section>
  <section class="section section--cream">
    <div class="container" style="text-align: center;">
      <h2 class="fade-in" style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 2rem;">What's Included</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; max-width: 700px; margin: 0 auto;">
        ${['Fully Furnished', 'High-Speed WiFi', 'All Utilities', 'No Credit Check', 'Flexible Leases', '24/7 Support'].map(a => `<span class="fade-in" style="background: white; padding: 0.6rem 1.2rem; border-radius: 20px; font-size: 0.95rem;">${a}</span>`).join('\n        ')}
      </div>
    </div>
  </section>`;

    const faq = faqSectionHTML(theme.faq_pool, vars, pageSlug);
    const faqLd = faqJsonLd(theme.faq_pool, vars, pageSlug);

    generated.push(generatePage({
      filename, title: metaTitle, metaDesc, canonical, h1,
      subtitle: `${theme.display_name} near ${uni.name}. From ${formatPrice(nearestProp.price_from_weekly)}/week.`,
      priceBadge: `From ${formatPrice(nearestProp.price_from_weekly)}/week`,
      introText: intro, bodyContent, faqHTML: faq, ctaHTML: ctaSectionHTML('en'),
      breadcrumbJsonLd: breadcrumb([
        { name: 'Home', url: 'https://circlestay.ca/' },
        { name: theme.display_name + ' Toronto' },
        { name: `Near ${uni.short_name}` }
      ]),
      extraJsonLd: faqLd,
      lang: 'en', ogImage: `https://circlestay.ca${propImage(nearestProp.slug)}`
    }));
  });
  return generated;
}

// ══════════════════════════════════════════════════════════════════════════════════
// MAIN — Run all generators
// ══════════════════════════════════════════════════════════════════════════════════
console.log('CircleStay pSEO Generator — Full Expansion');
console.log('='.repeat(60));

const all = [];

// Original 6 templates (27 pages — already deployed)
all.push(...generateNeighborhoodPages());
console.log(`  Original Template 1 — Neighborhood Co-Living: 4 pages`);
all.push(...generateUniversityPages());
console.log(`  Original Template 2 — University Proximity:    6 pages`);
all.push(...generateAudiencePages());
console.log(`  Original Template 3 — Audience Segments:       4 pages`);
all.push(...generateFurnishedPages());
console.log(`  Original Template 4 — Furnished Rooms:         4 pages`);
all.push(...generateFrenchPages());
console.log(`  Original Template 5 — French Pages:            5 pages`);
all.push(...generateRoomTypePages());
console.log(`  Original Template 6 — Room Type:               4 pages`);

console.log('');
console.log('  Expanding with all themes from themes.json...');
console.log('');

// Theme-based expansion (all 16 themes × city + neighborhood + university)
let themeTotal = 0;
themes.forEach(theme => {
  const cityPages = generateThemeCityPage(theme.slug);
  const hoodPages = generateThemeNeighborhoodPages(theme.slug);
  const uniPages = generateThemeUniversityPages(theme.slug);
  const count = cityPages.length + hoodPages.length + uniPages.length;
  all.push(...cityPages, ...hoodPages, ...uniPages);
  if (count > 0) {
    const parts = [];
    if (cityPages.length) parts.push(`${cityPages.length} city`);
    if (hoodPages.length) parts.push(`${hoodPages.length} neighborhood`);
    if (uniPages.length) parts.push(`${uniPages.length} university`);
    console.log(`  Theme: ${theme.display_name.padEnd(28)} ${String(count).padStart(3)} pages (${parts.join(', ')})`);
    themeTotal += count;
  }
});

console.log('');
console.log('='.repeat(60));
console.log(`Original templates: 27 pages`);
console.log(`Theme expansion:    ${themeTotal} pages`);
console.log(`Total generated:    ${all.length} pages`);
console.log('');
console.log('Generated files:');
all.forEach(f => console.log(`  ${f}`));
console.log('');
console.log('Done.');
