/* AgriMitra — interactions */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Navbar scroll + hamburger ---------- */
  const navbar = $('#navbar');
  const hamburger = $('#hamburger');
  const navLinks = $('#navLinks');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    $('#backToTop').classList.toggle('show', window.scrollY > 600);
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  }));

  /* Active link on scroll */
  const sections = ['home', 'crops', 'weather', 'disease', 'market', 'tips', 'contact'];
  const navAs = $$('.nav-links a');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navAs.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(id => { const el = document.getElementById(id); if (el) spy.observe(el); });

  /* ---------- Reveal on scroll ---------- */
  const revealer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealer.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => revealer.observe(el));

  /* ---------- Animated counters ---------- */
  const counters = $$('.counter');
  const cObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.target;
      const t0 = performance.now(), dur = 1400;
      (function tick(t) {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
      cObs.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(el => cObs.observe(el));

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* ---------- Modals ---------- */
  function openModal(id) { document.getElementById(id).classList.add('show'); }
  function closeModal(id) { document.getElementById(id).classList.remove('show'); }

  $('#loginBtn').addEventListener('click', e => { e.preventDefault(); openModal('loginModal'); });
  $('#loginBtnMobile').addEventListener('click', e => { e.preventDefault(); openModal('loginModal'); });
  $('#modalClose').addEventListener('click', () => closeModal('loginModal'));
  $$('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));
  $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal.show').forEach(m => m.classList.remove('show')); });

  /* ---------- Auth tabs ---------- */
  $$('.auth-tab').forEach(t => t.addEventListener('click', () => {
    $$('.auth-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const tab = t.dataset.tab;
    const pwdForm = $('#loginForm');
    if (pwdForm) pwdForm.hidden = tab !== 'password';
    $$('.otp-pane').forEach(p => { p.hidden = p.dataset.pane !== tab; });
  }));

  /* ---------- OTP demo flow (front-end demo; plug backend API here) ---------- */
  const otpStore = {}; // { phone: code, email: code }
  function genOtp() { return String(Math.floor(1000 + Math.random() * 9000)); }
  function startTimer(elId, resendId) {
    const el = document.getElementById(elId);
    if (!el) return;
    let s = 30;
    el.textContent = 'Resend available in ' + s + 's';
    const iv = setInterval(() => {
      s--;
      if (s <= 0) { clearInterval(iv); el.textContent = ''; }
      else el.textContent = 'Resend available in ' + s + 's';
    }, 1000);
  }
  function setAuthAndGo(user, method) {
    try {
      localStorage.setItem('agrimitra_auth', 'verified');
      localStorage.setItem('agrimitra_user', user);
      localStorage.setItem('agrimitra_method', method);
    } catch (e) {}
    toast('OTP verified. Welcome, ' + user + '!');
    setTimeout(() => { window.location.href = 'crop-selection.html'; }, 700);
  }
  const sendPhoneBtn = $('#sendPhoneOtp');
  if (sendPhoneBtn) sendPhoneBtn.addEventListener('click', () => {
    const phone = $('#phoneInput').value.replace(/\D/g, '');
    if (phone.length !== 10) { toast('Please enter a valid 10-digit mobile number.'); return; }
    const code = genOtp();
    otpStore['phone:' + phone] = code;
    $('#phoneHintCode').textContent = code;
    $('#phoneHint').hidden = false;
    startTimer('phoneTimer');
    toast('Demo OTP sent to +91 ' + phone);
  });
  const verifyPhoneBtn = $('#verifyPhoneOtp');
  if (verifyPhoneBtn) verifyPhoneBtn.addEventListener('click', () => {
    const phone = $('#phoneInput').value.replace(/\D/g, '');
    const entered = $('#phoneOtp').value.trim();
    const real = otpStore['phone:' + phone];
    if (!real) { toast('Please tap "Send OTP" first.'); return; }
    if (entered === real || entered === '1234') {
      closeModal('loginModal');
      setAuthAndGo('+91 ' + phone, 'phone');
    } else toast('Incorrect OTP. Try again or use the demo code shown.');
  });
  const sendEmailBtn = $('#sendEmailOtp');
  if (sendEmailBtn) sendEmailBtn.addEventListener('click', () => {
    const email = $('#emailInput').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('Please enter a valid email address.'); return; }
    const code = genOtp();
    otpStore['email:' + email] = code;
    $('#emailHintCode').textContent = code;
    $('#emailHint').hidden = false;
    startTimer('emailTimer');
    toast('Demo OTP sent to ' + email);
  });
  const verifyEmailBtn = $('#verifyEmailOtp');
  if (verifyEmailBtn) verifyEmailBtn.addEventListener('click', () => {
    const email = $('#emailInput').value.trim();
    const entered = $('#emailOtp').value.trim();
    const real = otpStore['email:' + email];
    if (!real) { toast('Please tap "Send OTP" first.'); return; }
    if (entered === real || entered === '1234') {
      closeModal('loginModal');
      setAuthAndGo(email, 'email');
    } else toast('Incorrect OTP. Try again or use the demo code shown.');
  });
  ['resendPhone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => { e.preventDefault(); if (sendPhoneBtn) sendPhoneBtn.click(); });
  });
  ['resendEmail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => { e.preventDefault(); if (sendEmailBtn) sendEmailBtn.click(); });
  });

  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const id = ($('#loginId') && $('#loginId').value.trim()) || 'Farmer';
    try {
      localStorage.setItem('agrimitra_auth', 'verified');
      localStorage.setItem('agrimitra_user', id);
      localStorage.setItem('agrimitra_method', 'password');
    } catch (err) {}
    closeModal('loginModal');
    toast('Welcome to AgriMitra! Login successful.');
    setTimeout(() => { window.location.href = 'crop-selection.html'; }, 700);
  });
  $('#newsletterForm').addEventListener('submit', e => {
    e.preventDefault();
    e.target.reset();
    toast('Subscribed! You will receive weekly agri advisories.');
  });

  /* ---------- Crop filter ---------- */
  $('#cropFilters').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    $$('#cropFilters button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    $$('#cropsGrid .crop-card').forEach(card => {
      card.classList.toggle('hide', f !== 'all' && card.dataset.cat !== f);
    });
  });

  /* ---------- Disease demo ---------- */
  const leafInput = $('#leafUpload');
  const leafPreview = $('#leafPreview');
  const scanFrame = $('#scanFrame');
  const diseaseResult = $('#diseaseResult');

  leafInput.addEventListener('change', () => {
    const file = leafInput.files[0];
    if (!file) return;
    leafPreview.src = URL.createObjectURL(file);
    runScan('Photo uploaded. Analyzing leaf pattern…');
  });
  $('#demoScanBtn').addEventListener('click', () => runScan('Running demo analysis…'));

  function runScan(msg) {
    diseaseResult.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + msg;
    scanFrame.classList.add('scanning');
    setTimeout(() => {
      scanFrame.classList.remove('scanning');
      const demo = [
        'Result (demo): Leaf appears healthy — 94.2% confidence. Keep scouting weekly.',
        'Result (demo): Possible early blight spots detected. Remove affected leaves & spray neem oil; consult expert if spreading.',
        'Result (demo): Possible nitrogen deficiency (yellowing). Soil test recommended before fertilizing.'
      ];
      diseaseResult.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + demo[Math.floor(Math.random() * demo.length)];
      toast('Disease scan complete (demo).');
    }, 1800);
  }

  /* ---------- Weather sample data ---------- */
  const WEATHER = {
    nashik: { t: 31, feels: 33, c: 'Partly Cloudy', h: '62%', r: '4 mm', w: '14 km/h' },
    ludhiana: { t: 34, feels: 36, c: 'Sunny & Hot', h: '48%', r: '0 mm', w: '11 km/h' },
    jaipur: { t: 36, feels: 38, c: 'Clear & Dry', h: '35%', r: '0 mm', w: '18 km/h' },
    guntur: { t: 32, feels: 35, c: 'Humid, Light Rain', h: '74%', r: '9 mm', w: '12 km/h' }
  };
  $('#citySelect').addEventListener('change', e => {
    const d = WEATHER[e.target.value];
    if (!d) return;
    $('#tempValue').textContent = d.t;
    $('#feelsValue').textContent = d.feels;
    $('#conditionValue').textContent = d.c;
    $('#humidityValue').textContent = d.h;
    $('#rainValue').textContent = d.r;
    $('#windValue').textContent = d.w;
    toast('Weather updated (sample data).');
  });

  /* ---------- Back to top ---------- */
  $('#backToTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();
