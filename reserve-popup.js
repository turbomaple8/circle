/* ── Reserve Popup – Circle Coliving ── */
(function () {
  if (sessionStorage.getItem('reservePopupDismissed')) return;

  var BACKEND_API_URL = 'https://coliville-api-626057356331.us-east1.run.app';
  var BACKEND_PROJECT_ID = 'circle';

  var PROPERTIES = [
    { name: 'The Maddox', slug: 'maddox' },
    { name: 'The Queen', slug: 'queen' },
    { name: 'The Yonge', slug: 'yonge' },
    { name: 'The York', slug: 'york' }
  ];

  /* ── Inject CSS ── */
  var style = document.createElement('style');
  style.textContent = '\
    @keyframes rpSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }\
    .rp-overlay { position:fixed; inset:0; z-index:10000; display:flex; align-items:center; justify-content:center; padding:1rem; }\
    .rp-backdrop { position:absolute; inset:0; background:rgba(58,46,38,0.45); }\
    .rp-card { position:relative; width:100%; max-width:380px; border-radius:16px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); background:#fff; animation:rpSlideUp 0.4s ease-out; }\
    .rp-close { position:absolute; right:12px; top:12px; z-index:2; background:none; border:none; cursor:pointer; padding:6px; border-radius:50%; transition:background 0.2s; color:rgba(255,255,255,0.8); }\
    .rp-close:hover { background:rgba(0,0,0,0.1); }\
    .rp-close--dark { color:#999; }\
    .rp-header { padding:20px 24px; text-align:center; color:#fff; background:linear-gradient(135deg,var(--primary,#6B4C3B) 0%,var(--primary-dark,#4A3428) 100%); }\
    .rp-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.15); border-radius:50px; padding:4px 12px; font-size:12px; font-weight:500; margin-bottom:8px; }\
    .rp-pulse { width:6px; height:6px; border-radius:50%; background:#ef4444; animation:rpPulse 2s infinite; }\
    @keyframes rpPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }\
    .rp-title { font-size:18px; font-weight:700; margin:0; }\
    .rp-sub { font-size:14px; margin:4px 0 0; opacity:0.85; }\
    .rp-body { padding:20px 24px; text-align:center; }\
    .rp-body p { font-size:14px; color:#666; line-height:1.6; margin:0; }\
    .rp-body strong { color:#333; }\
    .rp-cta { display:block; width:100%; margin-top:16px; padding:12px; border:none; border-radius:50px; font-size:14px; font-weight:600; color:#fff; background:var(--accent,#C4876B); cursor:pointer; transition:filter 0.2s; }\
    .rp-cta:hover { filter:brightness(1.1); }\
    .rp-hint { font-size:11px; color:#aaa; margin-top:10px; }\
    .rp-options { padding:12px 24px 24px; display:flex; flex-direction:column; gap:12px; }\
    .rp-option { display:flex; align-items:center; gap:14px; padding:14px 18px; border:1px solid #e8e0d8; border-radius:12px; background:#fff; cursor:pointer; text-align:left; transition:box-shadow 0.2s; }\
    .rp-option:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); }\
    .rp-icon { width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }\
    .rp-icon--primary { background:var(--primary,#6B4C3B); color:#fff; }\
    .rp-icon--muted { background:var(--cream,#f5f0eb); color:var(--primary,#6B4C3B); }\
    .rp-option-title { font-size:14px; font-weight:600; color:#333; margin:0; }\
    .rp-option-desc { font-size:12px; color:#999; margin:2px 0 0; }\
    .rp-back { position:absolute; left:12px; top:12px; z-index:2; background:none; border:none; cursor:pointer; padding:6px; border-radius:50%; color:#999; transition:background 0.2s; }\
    .rp-back:hover { background:rgba(0,0,0,0.05); }\
    .rp-list { padding:12px 24px 24px; display:flex; flex-direction:column; gap:8px; }\
    .rp-list-item { display:flex; align-items:center; gap:12px; padding:12px 16px; border:1px solid #e8e0d8; border-radius:12px; background:#fff; cursor:pointer; text-align:left; transition:box-shadow 0.2s; }\
    .rp-list-item:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); }\
    .rp-list-initial { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; background:var(--primary,#6B4C3B); color:#fff; flex-shrink:0; }\
    .rp-list-name { font-size:14px; font-weight:500; color:#333; }\
    .rp-list-arrow { margin-left:auto; color:#ccc; }\
    .rp-center { text-align:center; padding:16px 24px 8px; }\
    .rp-center h3 { font-size:18px; font-weight:700; color:#333; margin:0; }\
    .rp-center p { font-size:13px; color:#999; margin:4px 0 0; }\
    @media (max-width:480px) { .rp-overlay { align-items:flex-end; } }\
  ';
  document.head.appendChild(style);

  var currentStep = 'closed';
  var overlayEl = null;
  var selectedProperty = null;

  function closeSvg() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  }
  function backSvg() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>';
  }
  function arrowSvg() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
  }

  function dismiss() {
    if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    currentStep = 'closed';
    sessionStorage.setItem('reservePopupDismissed', '1');
  }

  function render(html) {
    if (overlayEl) overlayEl.remove();
    overlayEl = document.createElement('div');
    overlayEl.className = 'rp-overlay';
    overlayEl.innerHTML = '<div class="rp-backdrop"></div>' + html;
    document.body.appendChild(overlayEl);
    overlayEl.querySelector('.rp-backdrop').addEventListener('click', dismiss);
    var closeBtn = overlayEl.querySelector('.rp-close');
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
  }

  function showBanner() {
    currentStep = 'banner';
    render('\
      <div class="rp-card">\
        <button class="rp-close" aria-label="Close">' + closeSvg() + '</button>\
        <div class="rp-header">\
          <div class="rp-badge"><span class="rp-pulse"></span> Few rooms left</div>\
          <h3 class="rp-title">Reserve Now</h3>\
          <p class="rp-sub">No payment or signup required.</p>\
        </div>\
        <div class="rp-body">\
          <p>Make an instant reservation in just a few clicks. Your room will be held for <strong>24 hours</strong> — completely free.</p>\
          <button class="rp-cta" id="rpBannerCta">Reserve a Room — Free</button>\
          <p class="rp-hint">Takes less than 30 seconds</p>\
        </div>\
      </div>\
    ');
    document.getElementById('rpBannerCta').addEventListener('click', showChoose);
  }

  function showChoose() {
    currentStep = 'choose';
    render('\
      <div class="rp-card">\
        <button class="rp-close rp-close--dark" aria-label="Close">' + closeSvg() + '</button>\
        <div class="rp-center"><h3>How would you like to reserve?</h3><p>Pick an option to continue</p></div>\
        <div class="rp-options">\
          <button class="rp-option" id="rpAny">\
            <div class="rp-icon rp-icon--primary"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>\
            <div><p class="rp-option-title">Any Room</p><p class="rp-option-desc">We\'ll match you with the best available</p></div>\
          </button>\
          <button class="rp-option" id="rpSelect">\
            <div class="rp-icon rp-icon--muted"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>\
            <div><p class="rp-option-title">Select a Room</p><p class="rp-option-desc">Choose a specific listing to reserve</p></div>\
          </button>\
        </div>\
      </div>\
    ');
    document.getElementById('rpAny').addEventListener('click', function () {
      selectedProperty = null;
      openReserveForm(null);
    });
    document.getElementById('rpSelect').addEventListener('click', showPropertyList);
  }

  function showPropertyList() {
    currentStep = 'selectProperty';
    var items = PROPERTIES.map(function (p) {
      return '<button class="rp-list-item" data-prop="' + p.slug + '" data-name="' + p.name + '"><span class="rp-list-initial">' + p.name.replace('The ', '').charAt(0) + '</span><span class="rp-list-name">' + p.name + '</span><span class="rp-list-arrow">' + arrowSvg() + '</span></button>';
    }).join('');

    render('\
      <div class="rp-card">\
        <button class="rp-back" id="rpBack" aria-label="Back">' + backSvg() + '</button>\
        <button class="rp-close rp-close--dark" aria-label="Close">' + closeSvg() + '</button>\
        <div class="rp-center"><h3>Select a Listing</h3><p>Choose where you\'d like to stay</p></div>\
        <div class="rp-list">' + items + '</div>\
      </div>\
    ');
    document.getElementById('rpBack').addEventListener('click', showChoose);
    overlayEl.querySelectorAll('.rp-list-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedProperty = { name: btn.dataset.name, slug: btn.dataset.prop };
        openReserveForm(selectedProperty);
      });
    });
  }

  function openReserveForm(property) {
    dismiss();
    // If on a property page with existing reserve modal, use it
    var existingModal = document.getElementById('reserveModal');
    if (existingModal) {
      // Set hidden fields if property chosen
      if (property) {
        var propInput = document.getElementById('reservePropertyInput');
        var roomInput = document.getElementById('reserveRoomInput');
        if (propInput) propInput.value = property.name;
        if (roomInput) roomInput.value = '';
        var ctx = document.getElementById('reserveContext');
        var propLabel = document.getElementById('reservePropertyLabel');
        var roomLabel = document.getElementById('reserveRoomLabel');
        if (ctx && propLabel) {
          propLabel.textContent = property.name;
          if (roomLabel) roomLabel.textContent = 'Any Available Room';
          ctx.style.display = 'block';
        }
      } else {
        var propInput2 = document.getElementById('reservePropertyInput');
        var roomInput2 = document.getElementById('reserveRoomInput');
        if (propInput2) propInput2.value = 'Any Property';
        if (roomInput2) roomInput2.value = 'Any Room';
        var ctx2 = document.getElementById('reserveContext');
        var propLabel2 = document.getElementById('reservePropertyLabel');
        var roomLabel2 = document.getElementById('reserveRoomLabel');
        if (ctx2 && propLabel2) {
          propLabel2.textContent = 'Any Property';
          if (roomLabel2) roomLabel2.textContent = 'Any Available Room';
          ctx2.style.display = 'block';
        }
      }
      existingModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      return;
    }

    // Otherwise show standalone modal
    showStandaloneForm(property);
  }

  function showStandaloneForm(property) {
    var propDisplay = property ? property.name : 'Any Property';
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'rpStandaloneReserve';
    overlay.innerHTML = '\
      <div class="modal" style="position:relative;">\
        <button class="modal__close" data-close-rp>&times;</button>\
        <div class="modal__header">\
          <h3 class="modal__title">Reserve Your Room</h3>\
          <p class="modal__subtitle">No payment required. Secure your spot in seconds.</p>\
        </div>\
        <div class="modal__body">\
          <div style="background:var(--cream,#f5f0eb);border-radius:8px;padding:0.75rem 1rem;margin-bottom:1rem;">\
            <strong style="font-size:0.95rem;">' + propDisplay + '</strong>\
            <span style="display:block;font-size:0.85rem;color:var(--text-light,#888);margin-top:0.15rem;">Any Available Room</span>\
          </div>\
          <form id="rpStandaloneForm">\
            <input type="hidden" name="reserveProperty" value="' + propDisplay + '">\
            <input type="hidden" name="reserveRoom" value="Any Room">\
            <div class="form-row">\
              <div class="form-group"><label>First Name</label><input type="text" name="firstName" required placeholder="First name"></div>\
              <div class="form-group"><label>Last Name</label><input type="text" name="lastName" required placeholder="Last name"></div>\
            </div>\
            <div class="form-row">\
              <div class="form-group"><label>Email</label><input type="email" name="email" required placeholder="you@email.com"></div>\
              <div class="form-group"><label>Phone</label><input type="tel" name="phone" required placeholder="+1 (___) ___-____"></div>\
            </div>\
            <div class="form-group"><label>Desired Move-in Date</label><input type="date" name="moveIn"></div>\
            <button type="submit" class="btn btn--reserve btn--full btn--lg" style="border-style:solid;">Reserve – No Payment Required</button>\
            <p style="text-align:center;font-size:0.75rem;color:var(--text-light,#888);margin-top:0.75rem;">24-hour hold, no payment, no obligation.</p>\
          </form>\
        </div>\
      </div>\
    ';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    function closeStandalone() {
      overlay.remove();
      document.body.style.overflow = '';
    }

    overlay.querySelector('[data-close-rp]').addEventListener('click', closeStandalone);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeStandalone(); });

    document.getElementById('rpStandaloneForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var fullName = ((fd.get('firstName') || '') + ' ' + (fd.get('lastName') || '')).trim();
      var propName = fd.get('reserveProperty') || '';
      var propSlug = propName ? propName.toLowerCase().replace('the ', '').replace(/\s+/g, '-') : '';

      fetch(BACKEND_API_URL + '/v1/public/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Project-Id': BACKEND_PROJECT_ID },
        body: JSON.stringify({
          fullName: fullName,
          email: fd.get('email'),
          phone: fd.get('phone') || null,
          moveInDate: fd.get('moveIn') || null,
          property: propName || null,
          propertySlug: propSlug || null,
          roomName: fd.get('reserveRoom') || null,
          sourceWebsite: 'circlestay.ca',
          city: 'Toronto'
        })
      }).catch(function () {});

      e.target.parentElement.innerHTML = '\
        <div style="text-align:center;padding:1.5rem 0;">\
          <div style="width:56px;height:56px;border-radius:50%;background:#ecfdf5;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">\
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>\
          </div>\
          <h3 style="margin:0 0 0.25rem;">You\'re all set!</h3>\
          <p style="color:var(--accent,#C4876B);font-weight:500;margin:0 0 1rem;">Your room is reserved for 24 hours.</p>\
          <div style="background:var(--cream,#f5f0eb);border-radius:8px;padding:0.6rem 1rem;margin-bottom:1rem;"><strong>' + propDisplay + '</strong><br><span style="font-size:0.85rem;color:var(--text-light,#888);">Any Available Room</span></div>\
          <p style="color:var(--text-light,#888);font-size:0.9rem;">No payment was charged. A member of our team will reach out shortly.</p>\
          <div style="background:#fffbeb;border:1px solid #fef3c7;border-radius:8px;padding:0.5rem 1rem;margin-top:0.75rem;"><p style="font-size:0.75rem;color:#92400e;margin:0;">This hold expires in 24 hours.</p></div>\
        </div>\
      ';
    });
  }

  /* ── Init: show after 10 seconds ── */
  setTimeout(showBanner, 10000);
})();
