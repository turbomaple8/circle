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

/* ---- Backend Forwarding (fire-and-forget) ---- */
const BACKEND_API_URL = 'https://coliville-api-626057356331.us-east1.run.app';
const BACKEND_PROJECT_ID = 'circle';

function forwardToBackend(endpoint, payload) {
  fetch(`${BACKEND_API_URL}/v1/public/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Project-Id': BACKEND_PROJECT_ID
    },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

/* ---- Form Handling ---- */
function handleTourForm(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  const formData = {
    name: data.get('name'),
    email: data.get('email'),
    phone: data.get('phone'),
    property: data.get('property'),
    date: data.get('date'),
    message: data.get('message')
  };

  // FormSubmit.co email
  const formSubmitData = new FormData();
  Object.entries(formData).forEach(([key, value]) => {
    if (value) formSubmitData.append(key, value);
  });
  formSubmitData.append('_subject', 'New Viewing Request — Circle Coliving');
  formSubmitData.append('_template', 'table');

  fetch('https://formsubmit.co/ajax/info@circle.co', {
    method: 'POST',
    body: formSubmitData
  }).catch(() => {});

  // Backend forwarding (fire-and-forget)
  const nameParts = (formData.name || '').trim().split(/\s+/);
  forwardToBackend('tour-requests', {
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    email: formData.email,
    phone: formData.phone || null,
    property: formData.property || null,
    date: formData.date || null,
    time: 'morning',
    notes: formData.message || null,
    sourceWebsite: 'circlestay.ca',
    city: 'Toronto'
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

  const formData = {
    firstName: data.get('firstName'),
    lastName: data.get('lastName'),
    email: data.get('email'),
    phone: data.get('phone'),
    property: data.get('property'),
    roomType: data.get('roomType'),
    moveIn: data.get('moveIn'),
    duration: data.get('duration'),
    message: data.get('message')
  };

  // FormSubmit.co email
  const formSubmitData = new FormData();
  Object.entries(formData).forEach(([key, value]) => {
    if (value) formSubmitData.append(key, value);
  });
  formSubmitData.append('_subject', 'New Application — Circle Coliving');
  formSubmitData.append('_template', 'table');

  fetch('https://formsubmit.co/ajax/info@circle.co', {
    method: 'POST',
    body: formSubmitData
  }).catch(() => {});

  // Backend forwarding (fire-and-forget)
  forwardToBackend('applications', {
    fullName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
    email: formData.email,
    phone: formData.phone || null,
    property: formData.property || null,
    roomType: formData.roomType || null,
    moveInDate: formData.moveIn || null,
    leaseDuration: formData.duration || null,
    aboutYou: formData.message || null,
    sourceWebsite: 'circlestay.ca',
    city: 'Toronto'
  });

  form.innerHTML = `
    <div class="success-message">
      <div class="success-message__icon">&#10003;</div>
      <h3>Application Received</h3>
      <p style="color: var(--text-light); margin-top: 0.5rem;">Our team will review your details and respond within 48 hours.</p>
    </div>
  `;
}
