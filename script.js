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
});

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
const BACKEND_API_URL = 'https://coliville-api-626057356331.us-east1.run.app';
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
  const toc = document.querySelector('.blog-toc');
  const content = document.querySelector('.blog-article__content');
  if (!toc || !content) return;

  const headings = content.querySelectorAll('h2');
  if (!headings.length) return;

  headings.forEach((h, i) => {
    if (!h.id) h.id = 'section-' + i;
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
      if (link) {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      }
    });
  }, { rootMargin: '-80px 0px -75% 0px', threshold: 0 });

  headings.forEach(h => observer.observe(h));
}
