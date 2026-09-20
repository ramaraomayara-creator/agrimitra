/* AgriMitra — Crop Selection logic (auth guard + render + select) */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Login protection */
  try {
    if (localStorage.getItem('agrimitra_auth') !== 'verified') {
      window.location.replace('index.html');
      return;
    }
  } catch (e) { window.location.replace('index.html'); return; }

  const CROPS = [
    { id: 'rice', name: 'Rice', sub: 'Paddy · Kharif staple', img: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&q=80' },
    { id: 'wheat', name: 'Wheat', sub: 'Rabi staple', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80' },
    { id: 'maize', name: 'Maize', sub: 'Corn · versatile', img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80' },
    { id: 'cotton', name: 'Cotton', sub: 'Fibre cash crop', img: 'https://images.unsplash.com/photo-1592056570638-2e716f990a90?auto=format&fit=crop&w=600&q=80' },
    { id: 'groundnut', name: 'Groundnut', sub: 'Oilseed legume', img: 'https://images.unsplash.com/photo-1567892737950-30c4db37cd89?auto=format&fit=crop&w=600&q=80' },
    { id: 'chilli', name: 'Chilli', sub: 'Spice · high value', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80' },
    { id: 'tomato', name: 'Tomato', sub: 'Short-duration veg', img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80' },
    { id: 'sugarcane', name: 'Sugarcane', sub: 'Long-duration cash', img: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80' },
    { id: 'banana', name: 'Banana', sub: 'Plantation fruit', img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80' },
    { id: 'mango', name: 'Mango', sub: 'King of fruits', img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80' }
  ];
  const FALLBACK = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';

  const grid = $('#selGrid');
  const search = $('#selSearch');
  const empty = $('#selEmpty');

  grid.innerHTML = CROPS.map((c, i) => `
    <article class="sel-card" data-name="${c.name.toLowerCase()}">
      <div class="sel-img">
        <img src="${c.img}" alt="${c.name}" loading="lazy" onerror="this.src='${FALLBACK}'" />
        <span class="sel-num">${i + 1}</span>
      </div>
      <div class="sel-body">
        <h3>${c.name}<small>${c.sub}</small></h3>
        <button class="btn btn-primary btn-block sel-select" data-id="${c.id}">
          <i class="fa-solid fa-check"></i> Select ${c.name}
        </button>
        <a class="btn btn-outline btn-block sel-guide" href="crop-guide-details.html?crop=${c.id}">
          <i class="fa-solid fa-book-open"></i> View Guide
        </a>
      </div>
    </article>`).join('');

  /* Select → /crop.html?crop=xxx */
  $$('.sel-select', grid).forEach(btn => btn.addEventListener('click', () => {
    try { localStorage.setItem('agrimitra_crop', btn.dataset.id); } catch (e) {}
    window.location.href = 'crop.html?crop=' + encodeURIComponent(btn.dataset.id);
  }));

  /* Search (backend-assisted with offline fallback to local filter) */
  async function filter() {
    const q = search.value.trim().toLowerCase();
    let allowed = null;
    if (q) {
      try {
        const res = await fetch('/api/crops?search=' + encodeURIComponent(q), { headers: { Accept: 'application/json' } });
        const body = await res.json().catch(() => null);
        if (body && body.success === true && Array.isArray(body.data)) {
          allowed = new Set(body.data.map(c => String(c.name).toLowerCase()));
        }
      } catch (e) { allowed = null; }
    }
    let shown = 0;
    $$('.sel-card', grid).forEach(card => {
      const name = card.dataset.name;
      const show = !q || (allowed ? allowed.has(name) : name.includes(q));
      card.classList.toggle('hide', !show);
      if (show) shown++;
    });
    empty.hidden = shown !== 0;
  }
  search.addEventListener('input', filter);
  $('#selReset').addEventListener('click', () => { search.value = ''; filter(); search.focus(); });

  /* User + logout + nav */
  try {
    const u = localStorage.getItem('agrimitra_user');
    if (u) $('#selUser').textContent = u;
  } catch (e) {}
  function logout(e) {
    if (e) e.preventDefault();
    try { localStorage.removeItem('agrimitra_auth'); } catch (err) {}
    window.location.href = 'index.html';
  }
  $('#logoutBtn').addEventListener('click', logout);
  $('#logoutBtnMobile').addEventListener('click', logout);

  const nb = $('#navbar'), hb = $('#hamburger'), nl = $('#navLinks');
  window.addEventListener('scroll', () => nb.classList.toggle('scrolled', window.scrollY > 20), { passive: true });
  hb.addEventListener('click', () => { hb.classList.toggle('open'); nl.classList.toggle('open'); });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => { hb.classList.remove('open'); nl.classList.remove('open'); }));

  let toastT;
  window.__selToast = function (m) {
    const t = $('#toast'); t.textContent = m; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3000);
  };
})();
