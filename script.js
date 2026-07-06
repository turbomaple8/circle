/* ========================================
   CIRCLE — Co-Living in Toronto
   Main JavaScript
======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initModals();
  initMobileMenu();
  initSmoothScroll();
  initBlogTOC();
  initConversionTracking();
});

/* ========================================
   Conversion Tracking — Google Ads + GA4 + Meta Pixel
   Events: application_submit (PRIMARY), application_start,
           viewing_request, phone_call, page_scroll_50, location_card_click
   GTM: GTM-PP74JQ4B | GA4: G-W99H70QH6H | Meta Pixel: 3281828161984067
======================================== */
window.dataLayer = window.dataLayer || [];

function trackEvent(eventName, params, meta) {
  try {
    window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
  } catch (_) {}
  if (typeof window.gtag === 'function') {
    try { window.gtag('event', eventName, params || {}); } catch (_) {}
  }
  if (meta && meta.event && typeof window.fbq === 'function') {
    try { window.fbq('track', meta.event, meta.params || {}); } catch (_) {}
  }
}

function initConversionTracking() {
  // phone_call — global delegation on tel: links (forward-compatible for when phone is added)
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href^="tel:"]');
    if (!a) return;
    trackEvent('phone_call', { value: 30, currency: 'CAD' }, { event: 'Contact' });
  });

  // location_card_click — property card clicks on homepage / locations page
  document.addEventListener('click', function (e) {
    var card = e.target && e.target.closest && e.target.closest('.location-card');
    if (!card) return;
    var nameEl = card.querySelector('.location-card__name');
    var propertyName = nameEl ? nameEl.textContent.trim() : '';
    trackEvent('location_card_click', {
      property_name: propertyName,
      destination: card.getAttribute('href') || ''
    }, { event: 'ViewContent', params: { content_name: propertyName, content_type: 'property' } });
  });

  // page_scroll_50 — engagement signal (GA4 only, not imported to Ads)
  var scrollFired = false;
  window.addEventListener('scroll', function () {
    if (scrollFired) return;
    var scrolled = window.scrollY + window.innerHeight;
    var total = document.documentElement.scrollHeight;
    if (total > 0 && scrolled / total >= 0.5) {
      scrollFired = true;
      trackEvent('page_scroll_50', { scroll_depth: 50 });
    }
  }, { passive: true });
}

/* ---- Navigation Scroll Effect ---- */
function initNavigation() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  function handleScroll() {
    if (window.scrollY > 40) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* ---- Mobile Menu ---- */
function initMobileMenu() {
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileMenu = document.querySelector('.nav__mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      hamburger.classList.remove('active');
    });
  });
}

/* ---- Scroll Animations ---- */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/* ---- Smooth Scroll for Anchor Links ---- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const id = this.getAttribute('href');
      if (id === '#' || id.startsWith('#modal')) return;

      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ---- Modals ---- */
function initModals() {
  // Tour modal
  document.querySelectorAll('[data-modal="tour"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('tourModal');
    });
  });

  // Apply modal
  document.querySelectorAll('[data-modal="apply"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // application_start — fires when user initiates application
      trackEvent('application_start', {
        location_preference: btn.getAttribute('data-property') || '',
        room_type: btn.getAttribute('data-room-type') || '',
        source_page: window.location.pathname
      }, { event: 'InitiateCheckout', params: { content_category: 'application' } });
      openModal('applyModal');
    });
  });

  // Reserve modal — pass property/room context from data attributes
  document.querySelectorAll('[data-modal="reserve"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const property = btn.getAttribute('data-reserve-property') || '';
      const room = btn.getAttribute('data-reserve-room') || '';

      // Set hidden inputs
      const propInput = document.getElementById('reservePropertyInput');
      const roomInput = document.getElementById('reserveRoomInput');
      if (propInput) propInput.value = property;
      if (roomInput) roomInput.value = room;

      // Show context block
      const ctx = document.getElementById('reserveContext');
      const propLabel = document.getElementById('reservePropertyLabel');
      const roomLabel = document.getElementById('reserveRoomLabel');
      if (ctx && (property || room)) {
        ctx.style.display = 'block';
        if (propLabel) propLabel.textContent = property;
        if (roomLabel) roomLabel.textContent = room;
      } else if (ctx) {
        ctx.style.display = 'none';
      }

      openModal('reserveModal');
    });
  });

  // Close modals
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAllModals();
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  document.body.style.overflow = '';
}

/* ---- Backend API (handles email + dashboard) ---- */
const BACKEND_API_URL = 'https://coliville-backend-626057356331.us-east1.run.app';
const BACKEND_PROJECT_ID = 'circle';

function sendToBackend(endpoint, payload) {
  fetch(`${BACKEND_API_URL}/v1/public/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Project-Id': BACKEND_PROJECT_ID },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

/* ---- Form Handling ---- */

function handleTourForm(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const nameParts = (data.get('name') || '').trim().split(/\s+/);

  sendToBackend('tour-requests', {
    firstName: nameParts[0] || '', lastName: nameParts.slice(1).join(' ') || '',
    email: data.get('email'), phone: data.get('phone') || null,
    property: data.get('property') || null, date: data.get('date') || '',
    time: 'morning', notes: data.get('message') || null,
    sourceWebsite: 'circlestay.ca', city: 'Toronto'
  });

  // viewing_request — conversion event (value: 50 CAD)
  trackEvent('viewing_request', {
    value: 50,
    currency: 'CAD',
    location: data.get('property') || '',
    preferred_date: data.get('date') || ''
  }, { event: 'Schedule', params: { value: 50, currency: 'CAD' } });

  form.innerHTML = `
    <div class="success-message">
      <div class="success-message__icon">&#10003;</div>
      <h3>Viewing Scheduled</h3>
      <p style="color: var(--text-light); margin-top: 0.5rem;">We'll be in touch within 24 hours to confirm your visit.</p>
    </div>
  `;
}

function handleApplyForm(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  sendToBackend('applications', {
    fullName: `${data.get('firstName') || ''} ${data.get('lastName') || ''}`.trim(),
    email: data.get('email'), phone: data.get('phone') || null,
    property: data.get('property') || null, roomType: data.get('roomType') || null,
    moveInDate: data.get('moveIn') || null, leaseDuration: data.get('duration') || null,
    aboutYou: data.get('message') || null,
    sourceWebsite: 'circlestay.ca', city: 'Toronto'
  });

  // application_submit — PRIMARY CONVERSION (value: 100 CAD)
  // This event must be marked as a Conversion in GA4 for Google Ads import
  trackEvent('application_submit', {
    value: 100,
    currency: 'CAD',
    location_preference: data.get('property') || '',
    room_type: data.get('roomType') || '',
    duration: data.get('duration') || '',
    move_in_date: data.get('moveIn') || ''
  }, { event: 'Lead', params: { value: 100, currency: 'CAD', content_category: 'application' } });

  form.innerHTML = `
    <div class="success-message">
      <div class="success-message__icon">&#10003;</div>
      <h3>Application Received</h3>
      <p style="color: var(--text-light); margin-top: 0.5rem;">Our team will review your details and respond within 48 hours.</p>
    </div>
  `;
}

function handleReserveForm(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  const fullName = `${data.get('firstName') || ''} ${data.get('lastName') || ''}`.trim();
  const email = data.get('email');
  const phone = data.get('phone');
  const moveIn = data.get('moveIn');
  const property = data.get('reserveProperty') || '';
  const room = data.get('reserveRoom') || '';

  sendToBackend('reservations', {
    fullName, email, phone: phone || null, moveInDate: moveIn || null,
    property: property || null,
    propertySlug: property ? property.toLowerCase().replace('the ', '').replace(/\s+/g, '-') : null,
    roomName: room || null, sourceWebsite: 'circlestay.ca', city: 'Toronto'
  });

  // reserve_no_payment — PRIMARY CONVERSION (24h hold, no payment charged)
  // Deepest funnel intent: user picked specific property + room + move-in date.
  // Value parameter intentionally omitted — to be calibrated after first conversion data.
  // This event must be marked as a Conversion in GA4 for Google Ads import.
  trackEvent('reserve_no_payment', {
    location_preference: property || '',
    room_name: room || '',
    move_in_date: moveIn || ''
  }, { event: 'Lead', params: { content_category: 'reservation' } });

  // Show success with context
  const ctx = document.getElementById('reserveContext');
  if (ctx) ctx.style.display = 'none';

  form.parentElement.innerHTML = `
    <div style="text-align: center; padding: 1.5rem 0;">
      <div style="width: 56px; height: 56px; border-radius: 50%; background: #ecfdf5; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>
      </div>
      <h3 style="margin: 0 0 0.25rem;">You're all set!</h3>
      <p style="color: var(--accent, #b08968); font-weight: 500; margin: 0 0 1rem;">Your room is reserved for 24 hours.</p>
      ${property ? '<div style="background: var(--cream, #f5f0eb); border-radius: 8px; padding: 0.6rem 1rem; margin-bottom: 1rem;"><strong>' + property + '</strong>' + (room ? '<br><span style="font-size: 0.85rem; color: var(--text-light, #888);">' + room + '</span>' : '') + '</div>' : ''}
      <p style="color: var(--text-light, #888); font-size: 0.9rem;">No payment was charged. A member of our team will reach out shortly to help you complete your booking.</p>
      <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 0.5rem 1rem; margin-top: 0.75rem;">
        <p style="font-size: 0.75rem; color: #92400e; margin: 0;">This hold expires in 24 hours. If not confirmed, the room is automatically released.</p>
      </div>
    </div>
  `;
}

/* ---- Blog Table of Contents ---- */
function initBlogTOC() {
  // Support both manual TOC (.blog-toc) and auto-inject for blog-post pages
  const post = document.querySelector('.blog-post');
  const manualToc = document.querySelector('.blog-toc');

  if (post && !manualToc) {
    // Auto-inject hero image from og:image meta tag
    const ogImage = document.querySelector('meta[property="og:image"]');
    const postHeader = post.querySelector('.post-header, header') || post.querySelector('h1');
    if (ogImage && postHeader && !post.querySelector('.post-hero-image')) {
      const hero = document.createElement('img');
      hero.src = ogImage.content;
      hero.alt = (document.querySelector('meta[property="og:title"]') || {}).content || '';
      hero.className = 'post-hero-image';
      hero.loading = 'eager';
      hero.decoding = 'async';
      // Insert after header block or after first h1 + its following meta/intro
      const nextSection = postHeader.tagName === 'H1' ? (postHeader.nextElementSibling && postHeader.nextElementSibling.tagName === 'P' ? postHeader.nextElementSibling : postHeader) : postHeader;
      nextSection.after(hero);
    }

    // Auto-inject CTA section if none exists
    if (!post.querySelector('.blog-post-cta') && !post.innerHTML.includes('Ready to Join')) {
      const cta = document.createElement('section');
      cta.className = 'blog-post-cta';
      cta.style.cssText = 'background: #2D2420; border-radius: 14px; padding: 2.5rem; text-align: center; margin: 3rem 0 1rem;';
      cta.innerHTML = '<h3 style="font-family: var(--font-heading); font-size: 1.6rem; margin-bottom: 0.75rem; color: #FFFFFF;">Ready to Find Your Room?</h3>' +
        '<p style="color: rgba(255,255,255,0.75); margin-bottom: 1.5rem;">Fully furnished co-living in Toronto from C$240/week. All-inclusive, no hidden fees.</p>' +
        '<div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">' +
        '<a href="/locations" class="btn" style="padding: 0.8rem 2rem; background: #C4876B; color: #FFFFFF; border-radius: 8px; text-decoration: none; font-weight: 500;">Browse Rooms</a>' +
        '<a href="#" class="btn" data-modal="apply" style="padding: 0.8rem 2rem; background: transparent; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.4); border-radius: 8px; text-decoration: none; font-weight: 500;">Apply Now</a>' +
        '</div>';
      post.appendChild(cta);
    }

    // Auto-inject: wrap post in 2-column layout with sidebar
    const container = post.closest('.container');
    if (container) {
      container.style.maxWidth = '1100px';

      const wrapper = document.createElement('div');
      wrapper.className = 'blog-post-wrapper';

      const sidebar = document.createElement('aside');
      sidebar.className = 'blog-sidebar';
      const toc = document.createElement('nav');
      toc.className = 'blog-toc';
      toc.innerHTML = '<h3 class="blog-toc__title">Content</h3>';
      sidebar.appendChild(toc);

      post.parentNode.insertBefore(wrapper, post);
      wrapper.appendChild(post);
      wrapper.appendChild(sidebar);

      buildTOC(toc, post);
      injectRelatedPosts(wrapper);
    }
  } else if (manualToc) {
    const content = document.querySelector('.blog-article__content') || document.querySelector('.blog-post');
    if (content) buildTOC(manualToc, content);
  }
}

function buildTOC(toc, content) {
  const headings = content.querySelectorAll('h2');
  if (!headings.length) return;

  headings.forEach((h, i) => {
    if (!h.id) {
      const sectionParent = h.closest('section[id]');
      h.id = sectionParent ? sectionParent.id : 'section-' + i;
    }
    const link = document.createElement('a');
    link.href = '#' + h.id;
    link.textContent = h.textContent;
    link.className = 'blog-toc__link';
    link.addEventListener('click', (e) => {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    toc.appendChild(link);
  });

  // Scroll spy
  const links = toc.querySelectorAll('.blog-toc__link');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = toc.querySelector('a[href="#' + id + '"]');
      if (link && entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-80px 0px -75% 0px', threshold: 0 });

  headings.forEach(h => observer.observe(h));
}

/* ---- Related Posts ---- */
function injectRelatedPosts(wrapper) {
  const currentPath = window.location.pathname;
  const allPosts = [
    { url: '/blog/co-living-toronto-complete-guide', title: 'Co-Living in Toronto: The Complete 2026 Guide', excerpt: 'Costs, locations, what to expect, and how to find the right fit.', img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop', read: '15 min', tags: ['co-living', 'guide'] },
    { url: '/blog/student-housing-toronto-guide', title: 'Student Housing in Toronto: Everything You Need to Know', excerpt: 'From dorms and apartments to co-living options near every campus.', img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop', read: '12 min', tags: ['student', 'guide'] },
    { url: '/blog/young-professional-housing-toronto-guide', title: "Moving to Toronto for Work: Young Professional's Housing Guide", excerpt: 'Neighbourhoods, costs, and co-living options for young professionals.', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop', read: '10 min', tags: ['guide'] },
    { url: '/blog/co-living-vs-apartment-toronto', title: 'Co-Living vs Apartment in Toronto: 2026 Cost Comparison', excerpt: 'Real costs — rent, utilities, furniture, and more. Save 38-60% with co-living.', img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop', read: '10 min', tags: ['co-living'] },
    { url: '/blog/international-student-housing-toronto', title: 'International Student Housing in Toronto: A Step-by-Step Guide', excerpt: 'How to find safe, affordable housing without Canadian credit history.', img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop', read: '10 min', tags: ['student'] },
    { url: '/blog/toronto-housing-scam-prevention', title: "How to Avoid Toronto Housing Scams: A Renter's Safety Guide", excerpt: 'Red flags, verification steps, and trusted platforms for finding housing.', img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop', read: '7 min', tags: ['guide', 'student'] },
    { url: '/blog/waterfront-financial-district-guide', title: "Living in Toronto's Waterfront & Financial District", excerpt: 'Transit, restaurants, nightlife, and co-living in a dynamic neighbourhood.', img: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=600&h=400&fit=crop', read: '8 min', tags: ['neighbourhood'] },
    { url: '/blog/queen-west-neighbourhood-guide', title: 'Living in Queen West, Toronto: Your Complete Guide', excerpt: "TIFF, Graffiti Alley, Trinity Bellwoods, and co-living in Toronto's creative hub.", img: 'https://images.unsplash.com/photo-1541336032412-2048a678540d?w=600&h=400&fit=crop', read: '8 min', tags: ['neighbourhood'] },
    { url: '/blog/downtown-yonge-neighbourhood-guide', title: 'Living in Downtown Yonge & Dundas: Your Complete Guide', excerpt: 'Eaton Centre, Dundas Station, TMU, and co-living at the heartbeat of Toronto.', img: 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=600&h=400&fit=crop', read: '8 min', tags: ['neighbourhood'] },
    { url: '/blog/cost-of-living-toronto-students', title: 'Cost of Living in Toronto for Students: 2026 Budget Breakdown', excerpt: 'Housing, food, transit, and three sample monthly budgets.', img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop', read: '10 min', tags: ['student', 'guide'] }
  ];

  // Find current post and get its tags
  const current = allPosts.find(p => currentPath.endsWith(p.url) || currentPath.endsWith(p.url + '/'));
  const currentTags = current ? current.tags : [];

  // Score and sort by tag overlap, exclude current
  const related = allPosts
    .filter(p => !currentPath.endsWith(p.url) && !currentPath.endsWith(p.url + '/'))
    .map(p => ({ ...p, score: p.tags.filter(t => currentTags.includes(t)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (!related.length) return;

  const section = document.createElement('section');
  section.className = 'blog-related';
  section.innerHTML = '<h3 class="blog-related__title">Related Articles</h3><div class="blog-related__grid">' +
    related.map(p =>
      '<a href="' + p.url + '" class="blog-card blog-card--sm">' +
        '<div class="blog-card__image"><img src="' + p.img + '" alt="' + p.title.replace(/"/g, '&quot;') + '" loading="lazy" decoding="async"></div>' +
        '<div class="blog-card__body">' +
          '<h4 class="blog-card__title">' + p.title + '</h4>' +
          '<p class="blog-card__excerpt">' + p.excerpt + '</p>' +
          '<div class="blog-card__meta"><span>' + p.read + ' read</span></div>' +
        '</div>' +
      '</a>'
    ).join('') +
    '</div>';

  wrapper.parentNode.insertBefore(section, wrapper.nextSibling);
}

/* ==========================================================================
   Phone country-code picker (intl-tel-input) — mandatory country code → E.164
   --------------------------------------------------------------------------
   Loads intl-tel-input from a CDN and attaches it to every <input type="tel">
   so the visitor picks a country (default Canada for circle) and the submitted
   phone is rewritten to E.164 (+<cc><national>) before each form's own submit
   handler reads it. A single document-level capture listener runs before those
   handlers. Fully defensive: if the CDN fails to load or the validation utils
   aren't ready yet, the form still submits with the raw number and the backend
   normalizes it — nothing ever blocks a lead.
   ========================================================================== */
(function () {
  var ITI = 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/';
  var DEFAULT_COUNTRY = 'ca'; // circle = Toronto / Canada
  var loading = false, queue = [];

  function ensureLib(cb) {
    if (window.intlTelInput) { cb(); return; }
    queue.push(cb);
    if (loading) return;
    loading = true;
    if (!document.getElementById('iti-css')) {
      var link = document.createElement('link');
      link.id = 'iti-css'; link.rel = 'stylesheet';
      link.href = ITI + 'css/intlTelInput.css';
      document.head.appendChild(link);
    }
    var s = document.createElement('script');
    s.src = ITI + 'js/intlTelInput.min.js';
    s.onload = function () { var q = queue; queue = []; q.forEach(function (f) { f(); }); };
    s.onerror = function () { loading = false; queue = []; }; // CDN blocked → leave inputs as-is
    document.head.appendChild(s);
  }

  function enhance(input) {
    if (!input || input.__itiDone) return;
    ensureLib(function () {
      if (!window.intlTelInput || input.__itiDone) return;
      input.__itiDone = true;
      var iti = window.intlTelInput(input, {
        initialCountry: DEFAULT_COUNTRY,
        separateDialCode: true,
        utilsScript: ITI + 'js/utils.js'
      });
      input.__iti = iti;
      input.__itiReady = false;
      if (iti.promise && iti.promise.then) {
        iti.promise.then(function () { input.__itiReady = true; });
      }
    });
  }

  function enhanceAll(root) {
    (root || document).querySelectorAll('input[type="tel"]').forEach(enhance);
  }

  // One capture-phase listener for the whole document: it fires before any
  // individual form's submit handler, so the rewritten E.164 value is in place
  // by the time that handler reads input.value / FormData.
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    var ti = form.querySelector('input[type="tel"]');
    if (!ti || !ti.__iti) return;
    var val = (ti.value || '').trim();
    if (val === '') return; // empty optional phone — let it through
    if (!ti.__itiReady) return; // utils not loaded yet — backend will normalize
    if (!ti.__iti.isValidNumber()) {
      e.preventDefault();
      e.stopPropagation();
      alert('Please enter a valid phone number, including the country code.');
      return;
    }
    ti.value = ti.__iti.getNumber(); // E.164
  }, true);

  window.CirclePhone = { enhance: enhance, enhanceAll: enhanceAll };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhanceAll(); });
  } else {
    enhanceAll();
  }
})();

/* ========================================
   WhatsApp Floating Button — injected on every page
======================================== */
(function () {
  var WHATSAPP_URL = 'https://wa.me/19177356528';
  var ICON = '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M19.11 17.36c-.29-.15-1.7-.84-1.96-.93-.26-.1-.45-.15-.64.14-.19.29-.74.93-.9 1.12-.17.19-.33.22-.62.07-.29-.14-1.21-.45-2.3-1.42-.85-.76-1.42-1.7-1.59-1.98-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.4 0 1.41 1.03 2.78 1.17 2.97.14.19 2.03 3.1 4.91 4.34.69.3 1.22.47 1.64.61.69.22 1.31.19 1.81.11.55-.08 1.7-.7 1.94-1.37.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34zM16.03 27.06h-.01a10.9 10.9 0 0 1-5.55-1.52l-.4-.24-4.13 1.08 1.1-4.02-.26-.41a10.86 10.86 0 0 1-1.67-5.82c0-6.02 4.9-10.92 10.93-10.92a10.85 10.85 0 0 1 10.91 10.93c0 6.02-4.9 10.92-10.92 10.92zm9.3-20.22A13.06 13.06 0 0 0 16.02 3C8.83 3 3 8.83 3 16.02c0 2.3.6 4.54 1.74 6.52L3 29l6.6-1.73a13.02 13.02 0 0 0 6.42 1.68h.01c7.19 0 13.03-5.84 13.03-13.03 0-3.48-1.36-6.75-3.73-9.08z"/></svg>';

  function injectWhatsAppFab() {
    if (document.querySelector('.whatsapp-fab')) return;
    var a = document.createElement('a');
    a.className = 'whatsapp-fab';
    a.href = WHATSAPP_URL;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Chat with us on WhatsApp');
    a.innerHTML = ICON;
    a.addEventListener('click', function () {
      if (typeof trackEvent === 'function') {
        trackEvent('whatsapp_click', { link_url: WHATSAPP_URL }, { event: 'Contact' });
      }
    });
    document.body.appendChild(a);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWhatsAppFab);
  } else {
    injectWhatsAppFab();
  }
})();
