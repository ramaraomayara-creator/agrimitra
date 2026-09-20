/* AgriMitra — Selected Crop page (reads ?crop=, fetches live prices from backend) */
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

  /* Known crops (id → display + image). No prices here — prices come only from backend. */
  const CROPS = {
    rice: { name: 'Rice', img: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=700&q=80' },
    wheat: { name: 'Wheat', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=80' },
    maize: { name: 'Maize', img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=700&q=80' },
    cotton: { name: 'Cotton', img: 'https://images.unsplash.com/photo-1592056570638-2e716f990a90?auto=format&fit=crop&w=700&q=80' },
    groundnut: { name: 'Groundnut', img: 'https://images.unsplash.com/photo-1567892737950-30c4db37cd89?auto=format&fit=crop&w=700&q=80' },
    chilli: { name: 'Chilli', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=700&q=80' },
    tomato: { name: 'Tomato', img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=700&q=80' },
    sugarcane: { name: 'Sugarcane', img: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=700&q=80' },
    banana: { name: 'Banana', img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=700&q=80' },
    mango: { name: 'Mango', img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=700&q=80' }
  };
  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=700&q=80';

  /* Resolve selected crop */
  const params = new URLSearchParams(window.location.search);
  let cropId = (params.get('crop') || '').toLowerCase();
  if (!CROPS[cropId]) {
    try { cropId = (localStorage.getItem('agrimitra_crop') || '').toLowerCase(); } catch (e) {}
  }
  if (!CROPS[cropId]) {
    window.location.replace('crop-selection.html');
    return;
  }
  const crop = CROPS[cropId];
  try { localStorage.setItem('agrimitra_crop', cropId); } catch (e) {}

  /* Render crop identity */
  $('#cropTitle').textContent = crop.name;
  $('#cropTitle2').textContent = crop.name;
  $('#crumbCrop').textContent = crop.name;
  $('#priceHeading').textContent = crop.name.toUpperCase() + ' MARKET PRICE';
  const img = $('#cropImg');
  img.src = crop.img; img.alt = crop.name;
  img.onerror = () => { img.src = FALLBACK_IMG; };
  document.title = 'AgriMitra — ' + crop.name + ' Market Price';
  const guideBtn = $('#cropGuideBtn');
  if (guideBtn) guideBtn.href = 'crop-guide-details.html?crop=' + cropId;
  const guideLink = $('#guideLink');
  if (guideLink) guideLink.href = 'crop-guide-details.html?crop=' + cropId;

  /* ---------- Location filters (static names only — not prices) ---------- */
  const LOCATIONS = {
    'Andhra Pradesh': { 'Guntur': ['Guntur', 'Tenali'], 'Krishna': ['Vijayawada', 'Machilipatnam'] },
    'Maharashtra': { 'Nashik': ['Nashik', 'Lasalgaon'], 'Pune': ['Pune', 'Baramati'] },
    'Punjab': { 'Ludhiana': ['Ludhiana', 'Khanna'], 'Amritsar': ['Amritsar', 'Jandiala'] },
    'Uttar Pradesh': { 'Lucknow': ['Lucknow', 'Bakshi Ka Talab'], 'Agra': ['Agra', 'Fatehabad'] }
  };
  const stateSel = $('#stateSel'), districtSel = $('#districtSel'), marketSel = $('#marketSel');
  Object.keys(LOCATIONS).forEach(s => {
    const o = document.createElement('option'); o.value = s; o.textContent = s;
    stateSel.appendChild(o);
  });
  stateSel.addEventListener('change', () => {
    districtSel.innerHTML = '<option value="">Select District</option>';
    marketSel.innerHTML = '<option value="">Select Market</option>';
    marketSel.disabled = true;
    const st = stateSel.value;
    if (!st) { districtSel.disabled = true; }
    else {
      districtSel.disabled = false;
      Object.keys(LOCATIONS[st]).forEach(d => {
        const o = document.createElement('option'); o.value = d; o.textContent = d;
        districtSel.appendChild(o);
      });
    }
    fetchPrices();
  });
  districtSel.addEventListener('change', () => {
    marketSel.innerHTML = '<option value="">Select Market</option>';
    const st = stateSel.value, dt = districtSel.value;
    if (!dt) { marketSel.disabled = true; }
    else {
      marketSel.disabled = false;
      LOCATIONS[st][dt].forEach(m => {
        const o = document.createElement('option'); o.value = m; o.textContent = m;
        marketSel.appendChild(o);
      });
    }
    fetchPrices();
  });
  marketSel.addEventListener('change', fetchPrices);

  /* ---------- Fetch live prices from backend (never hard-coded) ---------- */
  const loadingEl = $('#priceLoading'), unavEl = $('#priceUnavailable'), dataEl = $('#priceData');
  const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

  function showLoading() {
    loadingEl.hidden = false; unavEl.hidden = true; dataEl.hidden = true;
  }
  function freshnessLabel(updated, source) {
    // Never call daily/cached data "live" — always "Latest available" + timestamp
    if (!updated) return 'UNAVAILABLE';
    return 'Latest available' + (source ? ' · ' + source : '');
  }
  function showUnavailable(detail) {
    loadingEl.hidden = true; unavEl.hidden = false; dataEl.hidden = true;
    $('#liveLabel').textContent = 'UNAVAILABLE';
    if (detail) $('#unavDetail').textContent = detail;
  }
  function showData(d) {
    loadingEl.hidden = true; unavEl.hidden = true; dataEl.hidden = false;
    $('#liveLabel').textContent = freshnessLabel(d.updatedAt, d.source);
    $('#pdCrop').textContent = d.crop || crop.name;
    $('#pdMarket').textContent = [d.market, d.district, d.state].filter(Boolean).join(', ') || '—';
    $('#pdMin').textContent = fmt(d.minPrice);
    $('#pdMax').textContent = fmt(d.maxPrice);
    $('#pdModal').textContent = fmt(d.modalPrice);
    const unit = d.unit ? '/ ' + d.unit : '/ Quintal';
    $('#pdUnit1').textContent = unit; $('#pdUnit2').textContent = unit; $('#pdUnit3').textContent = unit;
    $('#pdUpdated').textContent = d.updatedAt
      ? new Date(d.updatedAt).toLocaleString('en-IN') + (d.arrivalDate ? ' · Arrival: ' + d.arrivalDate : '')
      : '—';
  }

  async function fetchPrices() {
    showLoading();
    const q = new URLSearchParams({ crop: cropId });
    if (stateSel.value) q.set('state', stateSel.value);
    if (districtSel.value) q.set('district', districtSel.value);
    if (marketSel.value) q.set('market', marketSel.value);
    try {
      const res = await fetch('/api/market-prices?' + q.toString(), { headers: { Accept: 'application/json' } });
      const body = await res.json().catch(() => null);
      let markets = null, source = '', updated = null, errMsg = null, cropName = null;
      if (body && body.success === true && Array.isArray(body.markets)) {
        // current backend format (data.gov.in)
        markets = body.markets;
        source = body.source || '';
        updated = body.lastUpdated || null;
        cropName = body.crop || null;
      } else if (body && body.success === true && body.data) {
        // older enveloped backend format
        markets = body.data.markets || [];
        source = body.source || '';
        updated = body.lastUpdated || null;
        cropName = body.data.crop || null;
      } else if (body && body.success === false) {
        errMsg = body.message || (body.error && body.error.message) || 'Live market price is currently unavailable.';
      } else if (body && body.minPrice != null) {
        // legacy backend shape (pre-envelope)
        markets = [{ market: body.market, district: '', state: '', minPrice: body.minPrice, maxPrice: body.maxPrice, modalPrice: body.modalPrice, unit: body.unit, arrivalDate: null }];
        source = 'Backend';
        updated = body.updatedAt || null;
      }
      const pick = markets && markets.length ? markets[0] : null;
      if (!pick || pick.minPrice == null || pick.maxPrice == null || pick.modalPrice == null) {
        showUnavailable(errMsg || 'Live market price is currently unavailable.');
        return;
      }
      showData({
        crop: cropName || crop.name,
        market: pick.market, district: pick.district, state: pick.state,
        minPrice: pick.minPrice, maxPrice: pick.maxPrice, modalPrice: pick.modalPrice,
        unit: pick.unit, arrivalDate: pick.arrivalDate, updatedAt: updated, source
      });
    } catch (err) {
      showUnavailable('Market data service is temporarily unavailable.');
    }
  }
  $('#retryBtn').addEventListener('click', fetchPrices);

  /* ---------- Nav / logout ---------- */
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

  fetchPrices();
})();
