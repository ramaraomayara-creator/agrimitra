/* AgriMitra — Detailed Crop Guide (?crop=) : overview, price, weather, markets, duration, seeds */
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

  const FALLBACK = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=700&q=80';

  /* ---------------- Crop data (general / educational, no chemical guarantees) ---------------- */
  const CROPS = {
    rice: {
      name: 'Rice', cat: 'Cereals', climate: 'Hot & humid, high rainfall', soil: 'Clay / clay-loam, pH 5.5–7.0',
      season: 'Kharif · Jun–Jul', duration: 'Approximately 120–150 days depending on variety and growing conditions.',
      img: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=700&q=80',
      seed: { variety: 'Common types: Samba Mahsuri, Swarna, IR64 (choose local recommended variety)', method: 'Nursery + transplanting of 21–25 day seedlings, or direct seeding', season: 'June–July with monsoon onset', requirement: '25–30 kg/ha (transplanted)', germination: '4–7 days', harvest: '120–150 days from sowing' },
      timeline: [
        ['🌱', 'Seed / Sowing', 'Nursery sowing or direct seeding in puddled, levelled field.', 'Day 0'],
        ['🌿', 'Germination', 'Seedlings emerge; keep nursery moist but not flooded.', 'Days 4–7'],
        ['🌾', 'Vegetative Growth', 'Tillering stage — maximum tillers decide yield potential.', 'Days 15–70'],
        ['🌼', 'Flowering', 'Panicle emergence and pollination; avoid water stress.', 'Days 70–95'],
        ['🌾', 'Maturity', 'Grains fill and turn golden; drain field gradually.', 'Days 95–125'],
        ['🚜', 'Harvesting', 'Cut when ~80% grains are golden; dry before storage.', 'Days 120–150']
      ]
    },
    wheat: {
      name: 'Wheat', cat: 'Cereals', climate: 'Cool, dry winter with sunshine', soil: 'Well-drained loam, pH 6.0–7.5',
      season: 'Rabi · Oct–Dec', duration: 'Approximately 110–130 days depending on variety and sowing time.',
      img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=80',
      seed: { variety: 'Common types: HD-2967, PBW-550, Lok-1 (choose local recommended variety)', method: 'Line sowing with seed drill, depth 4–5 cm, ~20 cm rows', season: 'October–December; timely sowing yields best', requirement: '100 kg/ha', germination: '4–6 days', harvest: '110–130 days from sowing' },
      timeline: [
        ['🌱', 'Seed / Sowing', 'Sow in prepared, levelled seedbed at right depth.', 'Day 0'],
        ['🌿', 'Germination', 'Seedlings emerge evenly with adequate soil moisture.', 'Days 4–6'],
        ['🌾', 'Vegetative Growth', 'Tillering + crown-root stage — first irrigation ~day 21 is critical.', 'Days 15–65'],
        ['🌼', 'Flowering', 'Ear emergence and grain setting; avoid heat stress.', 'Days 65–85'],
        ['🌾', 'Maturity', 'Grains harden, straw turns golden.', 'Days 85–110'],
        ['🚜', 'Harvesting', 'Combine when grain moisture is ~12%.', 'Days 110–130']
      ]
    },
    maize: {
      name: 'Maize', cat: 'Cereals', climate: 'Warm with full sun', soil: 'Well-drained loam, pH 5.8–7.5',
      season: 'Kharif · Jun–Jul', duration: 'Approximately 90–110 days depending on variety and season.',
      img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=700&q=80',
      seed: { variety: 'Common types: hybrid corn (e.g. DHM, Ganga hybrids — use local recommendation)', method: 'Dibbling at 60×20 cm spacing, 2–3 cm deep', season: 'June–July (Kharif); Oct–Nov Rabi in south', requirement: '20–25 kg/ha', germination: '4–7 days', harvest: '90–110 days from sowing' },
      timeline: [
        ['🌱', 'Seed / Sowing', 'Sow in fine tilth with proper spacing.', 'Day 0'],
        ['🌿', 'Germination', 'Quick even emergence with warm soil.', 'Days 4–7'],
        ['🌾', 'Vegetative Growth', 'Knee-high to tasseling — irrigate at knee-high stage.', 'Days 12–55'],
        ['🌼', 'Flowering', 'Tasseling and silking; moisture stress here cuts yield.', 'Days 55–70'],
        ['🌾', 'Maturity', 'Grains harden, husk dries.', 'Days 70–95'],
        ['🚜', 'Harvesting', 'Pick when husk turns brown; dry cobs before shelling.', 'Days 90–110']
      ]
    },
    cotton: {
      name: 'Cotton', cat: 'Commercial Crops', climate: 'Warm, 200+ frost-free days', soil: 'Deep black (regur) soil, pH 6–8',
      season: 'Kharif · Apr–Jun', duration: 'Approximately 160–200 days depending on variety and climate.',
      img: 'https://images.unsplash.com/photo-1592056570638-2e716f990a90?auto=format&fit=crop&w=700&q=80',
      seed: { variety: 'Bt hybrids recommended locally; deep-rooted long-duration types', method: 'Dibbling at 90×60 cm on ridges', season: 'April–June with monsoon onset', requirement: '1–1.5 kg/ha hybrid seed', germination: '5–10 days', harvest: '160–200 days; multiple pickings' },
      timeline: [
        ['🌱', 'Seed / Sowing', 'Sow quality hybrid seed on prepared ridges.', 'Day 0'],
        ['🌿', 'Germination', 'Seedlings establish; gap-fill within 10 days.', 'Days 5–10'],
        ['🌾', 'Vegetative Growth', 'Squaring begins; balanced nutrition matters.', 'Days 15–70'],
        ['🌼', 'Flowering', 'Flowering and boll formation — protect from sucking pests.', 'Days 70–130'],
        ['🌾', 'Maturity', 'Bolls burst open in flushes.', 'Days 130–170'],
        ['🚜', 'Harvesting', '2–4 pickings as bolls burst; keep kapas dry and clean.', 'Days 160–200']
      ]
    },
    groundnut: {
      name: 'Groundnut', cat: 'Commercial Crops', climate: 'Warm with moderate rain', soil: 'Sandy loam, well-drained, pH 6–7',
      season: 'Kharif · Jun–Jul', duration: 'Approximately 100–120 days depending on variety.',
      img: 'https://images.unsplash.com/photo-1567892737950-30c4db37cd89?auto=format&fit=crop&w=700&q=80',
      seed: { variety: 'Common types: TAG-24, JL-24, Kadiri (use local recommendation)', method: 'Line sowing 30×10 cm, 4–5 cm deep', season: 'June–July', requirement: '100–120 kg/ha kernels', germination: '5–10 days', harvest: '100–120 days from sowing' },
      timeline: [
        ['🌱', 'Seed / Sowing', 'Sow bold treated kernels in fine seedbed.', 'Day 0'],
        ['🌿', 'Germination', 'Seedlings emerge; ensure good drainage.', 'Days 5–10'],
        ['🌾', 'Vegetative Growth', 'Canopy builds; gypsum at flowering helps pods.', 'Days 12–40'],
        ['🌼', 'Flowering', 'Flowering + pegging into soil — critical irrigation window.', 'Days 40–70'],
        ['🌾', 'Maturity', 'Leaves yellow, pods rattle inside.', 'Days 70–100'],
        ['🚜', 'Harvesting', 'Lift pods promptly and dry quickly.', 'Days 100–120']
      ]
    },
    chilli: {
      name: 'Chilli', cat: 'Vegetables', climate: 'Warm, humid-free air', soil: 'Well-drained loam rich in organic matter, pH 6–7',
      season: 'Nursery Jun–Jul', duration: 'Approximately 150–180 days depending on variety.',
      img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=700&q=80',
      seed: { variety: 'Common types: Guntur Teja, Byadgi, local hybrids (use local recommendation)', method: 'Nursery + transplant 30–35 day seedlings at 60×45 cm', season: 'Nursery June–July', requirement: '1–1.25 kg/ha nursery seed', germination: '7–12 days', harvest: '150–180 days; pickings continue' },
      timeline: [
        ['🌱', 'Seed / Sowing', 'Raise healthy nursery on raised beds.', 'Day 0'],
        ['🌿', 'Germination', 'Slow even germination; shade nursery lightly.', 'Days 7–12'],
        ['🌾', 'Vegetative Growth', 'Transplant + establish; mulch reduces weeds.', 'Days 30–70'],
        ['🌼', 'Flowering', 'Continuous flowering; sticky traps help monitor pests.', 'Days 70–110'],
        ['🌾', 'Maturity', 'Fruits turn green then red.', 'Days 110–150'],
        ['🚜', 'Harvesting', 'Pick every 8–10 days, green or red ripe.', 'Days 150–180+']
      ]
    },
    tomato: {
      name: 'Tomato', cat: 'Vegetables', climate: 'Mild, frost-free', soil: 'Well-drained loam rich in compost, pH 6–7',
      season: 'Year-round (avoid peak frost)', duration: 'Approximately 90–120 days depending on variety and season.',
      img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=700&q=80',
      seed: { variety: 'Common hybrids: Arka, Pusa, private hybrids (use local recommendation)', method: 'Nursery + transplant ~25 day seedlings at 60×45 cm with staking', season: 'Nursery most months except extreme frost/heat', requirement: '80–100 g/ha hybrid seed', germination: '5–8 days', harvest: '90–120 days; pickings from ~65 days' },
      timeline: [
        ['🌱', 'Seed / Sowing', 'Raise seedlings in nursery or pro-trays.', 'Day 0'],
        ['🌿', 'Germination', 'Fast emergence in warm media.', 'Days 5–8'],
        ['🌾', 'Vegetative Growth', 'Transplant + stake; drip irrigation ideal.', 'Days 25–50'],
        ['🌼', 'Flowering', 'Cluster flowering and fruit set begins.', 'Days 50–65'],
        ['🌾', 'Maturity', 'Fruits size up, mature-green to breaker stage.', 'Days 65–85'],
        ['🚜', 'Harvesting', 'Pick every 3–4 days at required ripeness.', 'Days 90–120']
      ]
    },
    sugarcane: {
      name: 'Sugarcane', cat: 'Commercial Crops', climate: 'Long sunny season', soil: 'Deep loam / clay-loam, pH 6–7.5',
      season: 'Feb–Mar / Oct', duration: 'Approximately 300–365 days (10–12 months) depending on planting season.',
      img: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=700&q=80',
      seed: { variety: 'Common types: Co-86032, CoM-0265 (use mill-zone recommendation)', method: 'Three-bud setts in 90 cm furrows', season: 'Feb–Mar (spring), Oct (autumn in north)', requirement: '~75,000 setts/ha', germination: 'Sprouting in 15–25 days', harvest: '300–365 days from planting' },
      timeline: [
        ['🌱', 'Seed / Sowing', 'Plant treated setts in fertilised furrows.', 'Day 0'],
        ['🌿', 'Germination', 'Buds sprout; maintain moisture.', 'Days 15–25'],
        ['🌾', 'Vegetative Growth', 'Tillering then grand growth — peak water/nutrient need.', 'Days 30–240'],
        ['🌼', 'Flowering', 'Flowering (arrowing) may occur; not the harvest signal.', 'Days ~240–270'],
        ['🌾', 'Maturity', 'Sucrose accumulates; reduce irrigation before harvest.', 'Days 270–330'],
        ['🚜', 'Harvesting', 'Cut at 10–12 months close to ground; ratoon for next crop.', 'Days 300–365']
      ]
    },
    banana: {
      name: 'Banana', cat: 'Fruits', climate: 'Warm humid, sheltered from wind', soil: 'Deep rich loam, pH 6–7.5',
      season: 'Jun–Jul / Feb–Mar', duration: 'Approximately 330–360 days (11–12 months) to first harvest.',
      img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=700&q=80',
      seed: { variety: 'Tissue-culture Grand Naine, Robusta, Nendran (use local recommendation)', method: 'Pit planting 45×45×45 cm at 2×2 m with compost + drip', season: 'June–July or Feb–March', requirement: '1,800–2,500 plants/ha', germination: 'Establishment 60–90 days', harvest: '330–360 days to first bunch' },
      timeline: [
        ['🌱', 'Seed / Sowing', 'Plant disease-free tissue-culture saplings in pits.', 'Day 0'],
        ['🌿', 'Germination', 'Establishment — regular light irrigation.', 'Days 0–90'],
        ['🌾', 'Vegetative Growth', 'Leaf production + desuckering; monthly nutrition.', 'Days 90–240'],
        ['🌼', 'Flowering', 'Shooting (bunch emergence).', 'Days ~240–270'],
        ['🌾', 'Maturity', 'Bunch filling over 90–120 days; propping prevents toppling.', 'Days 270–350'],
        ['🚜', 'Harvesting', 'Cut at 75–80% maturity; ratoon followers continue.', 'Days 330–360']
      ]
    },
    mango: {
      name: 'Mango', cat: 'Fruits', climate: 'Dry flowering season, hot ripening', soil: 'Deep well-drained loam / laterite, pH 5.5–7.5',
      season: 'Planting Jun–Aug', duration: 'Perennial orchard — first commercial fruits from year 3–4; annual cycle ~120–150 days flowering to harvest.',
      img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=700&q=80',
      seed: { variety: 'Grafted Alphonso, Kesar, Dasheri, Langra (use local recommendation)', method: 'Grafted plants in 1×1×1 m pits, 10×10 m (or high-density 5×5 m)', season: 'Plant June–August', requirement: '100–200 grafts/ha', germination: 'Graft establishment in weeks; orchard built over years', harvest: 'Annual harvest Apr–Jun from year 3–4' },
      timeline: [
        ['🌱', 'Seed / Sowing', 'Plant grafted saplings with compost + staking.', 'Year 0'],
        ['🌿', 'Germination', 'Graft establishment and first flushes.', 'Months 0–6'],
        ['🌾', 'Vegetative Growth', 'Canopy building + training/pruning (years 1–3).', 'Years 1–3'],
        ['🌼', 'Flowering', 'Annual flowering flush (typically Feb–Mar).', 'Annual'],
        ['🌾', 'Maturity', 'Fruit set, marble to mature-hard stage.', 'Annual'],
        ['🚜', 'Harvesting', 'Pick mature-hard; ripen off-tree (Apr–Jun).', 'Annual']
      ]
    }
  };

  /* Resolve crop */
  const params = new URLSearchParams(window.location.search);
  let cropId = (params.get('crop') || '').toLowerCase();
  if (!CROPS[cropId]) {
    try { cropId = (localStorage.getItem('agrimitra_crop') || '').toLowerCase(); } catch (e) {}
  }
  if (!CROPS[cropId]) { window.location.replace('crop-selection.html'); return; }
  const crop = CROPS[cropId];
  try { localStorage.setItem('agrimitra_crop', cropId); } catch (e) {}

  /* Header + overview */
  $('#gdName').textContent = crop.name;
  $('#crumbCrop').textContent = crop.name;
  document.title = 'AgriMitra — ' + crop.name + ' Complete Guide';
  const gimg = $('#gdImg');
  gimg.src = crop.img; gimg.alt = crop.name;
  gimg.onerror = () => { gimg.src = FALLBACK; };
  $('#ovGrid').innerHTML = [
    ['Crop Name', crop.name], ['Crop Category', crop.cat],
    ['Suitable Climate', crop.climate], ['Suitable Soil', crop.soil],
    ['Growing Season', crop.season], ['Approx. Duration', crop.duration.split('.')[0] + '.']
  ].map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('');
  const mpBtn = $('#gdMarketPageBtn');
  if (mpBtn) mpBtn.href = 'crop.html?crop=' + cropId;
  const backBtn = $('#backGuideBtn');
  if (backBtn) backBtn.href = 'crop-guide.html?crop=' + cropId;

  /* Tabs */
  $$('#gdTabs .gd-tab').forEach(t => t.addEventListener('click', () => {
    $$('#gdTabs .gd-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const tab = t.dataset.tab;
    $$('.gd-panel[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== tab; });
  }));
  window.__gdGoTab = function (tab) {
    const btn = document.querySelector(`#gdTabs .gd-tab[data-tab="${tab}"]`);
    if (btn) btn.click();
  };

  /* ---------- Markets dashboard: State → District → Mandal → live prices ---------- */
  const fmt = n => '₹' + Number(n).toLocaleString('en-IN');
  // Mirror of backend mandal reference (dropdowns work offline; prices need backend)
  const MANDALS = {
    'Andhra Pradesh': {
      Krishna: ['Vijayawada Urban', 'Vijayawada Rural', 'Penamaluru', 'Kankipadu', 'Gannavaram', 'Gudivada', 'Nuzvid', 'Machilipatnam', 'Vuyyuru', 'Kaikalur'],
      Guntur: ['Guntur East', 'Guntur West', 'Tenali', 'Ponnur', 'Tadikonda', 'Mangalagiri', 'Prathipadu', 'Vatticherukuru'],
      Eluru: ['Eluru', 'Denduluru', 'Bhimadole'],
      Kakinada: ['Kakinada Urban', 'Kakinada Rural', 'Samalkota', 'Pithapuram', 'Peddapuram'],
      Visakhapatnam: ['Visakhapatnam Urban', 'Pendurthi', 'Gopalapatnam']
    }
  };
  const STATES = ['Andhra Pradesh', 'Maharashtra', 'Punjab', 'Uttar Pradesh', 'Rajasthan', 'Haryana', 'Gujarat'];
  const DISTRICTS = {
    'Andhra Pradesh': ['Krishna', 'Guntur', 'Eluru', 'Kakinada', 'Visakhapatnam'],
    'Maharashtra': ['Nashik', 'Pune'],
    'Punjab': ['Ludhiana', 'Amritsar'],
    'Uttar Pradesh': ['Lucknow', 'Agra'],
    'Rajasthan': ['Bikaner', 'Jodhpur', 'Hanumangarh', 'Sri Ganganagar'],
    'Haryana': ['Hisar', 'Sirsa', 'Bhiwani'],
    'Gujarat': ['Banaskantha', 'Patan', 'Mehsana']
  };
  let dashRows = [], dashSource = '', dashUpdated = null, dashMandal = 'all';

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function contactCell(c) {
    if (!c || (!c.phone && !c.email)) return '<span class="no-contact">—</span>';
    let h = '';
    if (c.phone) h += `<div><i class="fa-solid fa-phone"></i> ${esc(c.phone)}</div>`;
    if (c.email) h += `<div><i class="fa-solid fa-envelope"></i> ${esc(c.email)}</div>`;
    return h;
  }
  function dashShow(which) {
    // exactly one of: prompt | loading | error | empty | table
    ['mkPrompt', 'mkSkeleton', 'mkError', 'mkEmpty', 'mkTableWrap'].forEach(id => {
      document.getElementById(id).hidden = id !== which;
    });
    if (which !== 'table') $('#mkLiveBadge').hidden = true;
  }
  function paintDash() {
    const q = ($('#mkSearch').value || '').trim().toLowerCase();
    const cf = $('#mkCommodity').value;
    const rows = dashRows.filter(r => {
      if (dashMandal !== 'all' && (r.mandal || '') !== dashMandal) return false;
      const hay = `${r.market} ${r.district} ${r.mandal || ''} ${r.commodity}`.toLowerCase();
      return (!q || hay.includes(q)) && (!cf || (r.commodity || '') === cf);
    });
    if (!rows.length) {
      dashShow('empty');
      return false;
    }
    $('#mkDashBody').innerHTML = rows.map((r, i) => {
      const unit = r.unit || 'Quintal';
      const upd = r.arrivalDate || (dashUpdated ? new Date(dashUpdated).toLocaleDateString('en-IN') : '—');
      return `<tr><td><button class="mk-name-btn" data-i="${dashRows.indexOf(r)}">${esc(r.market)}</button></td>` +
        `<td>${esc([r.district, r.state].filter(Boolean).join(', '))}</td>` +
        `<td>${esc(r.commodity || crop.name)}</td>` +
        `<td>${esc(r.variety || '—')}</td>` +
        `<td class="price-cell"><strong>${r.modalPrice != null ? fmt(r.modalPrice) : '—'}</strong></td>` +
        `<td>${r.minPrice != null ? fmt(r.minPrice) : '—'}</td>` +
        `<td>${r.maxPrice != null ? fmt(r.maxPrice) : '—'}</td>` +
        `<td>${esc(unit)}</td>` +
        `<td>${esc(upd)}</td><td>${contactCell(r.contact)}</td></tr>`;
    }).join('');
    $$('#mkDashBody .mk-name-btn').forEach(b => b.addEventListener('click', () => showDetails(dashRows[Number(b.dataset.i)])));
    const src = $('#mkSource');
    if (src) src.innerHTML = '<i class="fa-solid fa-circle-info"></i> Data Source: ' + esc(dashSource || '—') +
      (dashUpdated ? ' · Last Updated: ' + new Date(dashUpdated).toLocaleString('en-IN') : '');
    return true;
  }
  function buildCommodityOptions() {
    const sel = $('#mkCommodity');
    const cur = sel.value;
    const list = [...new Set(dashRows.map(r => r.commodity).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">All Commodities</option>' +
      list.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    if (list.includes(cur)) sel.value = cur;
  }
  function showDetails(r) {
    if (!r) return;
    const box = $('#mkDetails');
    const sameMarket = dashRows.filter(x =>
      String(x.market).toLowerCase() === String(r.market).toLowerCase() &&
      String(x.district) === String(r.district));
    const commodities = [...new Set(sameMarket.map(x => x.commodity).filter(Boolean))];
    const town = String(r.market || '').split('(')[0].trim();
    const notListed = '<span class="not-listed">Not listed in official data</span>';
    box.innerHTML = `
      <div class="md-head"><h3><i class="fa-solid fa-store"></i> ${esc(r.market)} — Market Details</h3>
      <button class="modal-close" id="mkDetailsClose" aria-label="Close details"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="cg-detail-grid">
        <div class="cg-fact"><span>Market Name</span><p>${esc(r.market)}</p></div>
        <div class="cg-fact"><span>Market / AMC Name</span><p>${esc(r.market)} ${notListedSmall()}</p></div>
        <div class="cg-fact"><span>Village / Town</span><p>${esc(town || '—')}</p></div>
        <div class="cg-fact"><span>Mandal</span><p>${esc(r.mandal || '—')}</p></div>
        <div class="cg-fact"><span>District</span><p>${esc(r.district || '—')}</p></div>
        <div class="cg-fact"><span>State</span><p>${esc(r.state || '—')}</p></div>
        <div class="cg-fact"><span>PIN Code</span><p>${notListed}</p></div>
        <div class="cg-fact"><span>Market Working Days</span><p>${notListed}</p></div>
        <div class="cg-fact full"><span>Market Timings</span><p>${notListed}</p></div>
        <div class="cg-fact full"><span>Available Commodities</span><p>${commodities.length ? commodities.map(esc).join(', ') : '—'}</p></div>
      </div>
      <h4 class="md-sub"><i class="fa-solid fa-tags"></i> Current Prices here</h4>
      <div class="market-table-wrap"><table class="market-table"><thead><tr><th>Commodity</th><th>Variety</th><th>Min</th><th>Modal</th><th>Max</th><th>Unit</th><th>Arrival</th></tr></thead>
      <tbody>${sameMarket.map(x => `<tr><td>${esc(x.commodity || '—')}</td><td>${esc(x.variety || '—')}</td><td>${x.minPrice != null ? fmt(x.minPrice) : '—'}</td><td><strong>${x.modalPrice != null ? fmt(x.modalPrice) : '—'}</strong></td><td>${x.maxPrice != null ? fmt(x.maxPrice) : '—'}</td><td>${esc(x.unit || 'Quintal')}</td><td>${esc(x.arrivalDate || '—')}</td></tr>`).join('')}</tbody></table></div>
      <h4 class="md-sub"><i class="fa-solid fa-user-tie"></i> Market Manager / Market Officer Contact</h4>
      <div class="cg-detail-grid"><div class="cg-fact full"><span>Verified contact</span><p>${managerHTML(r.contact)}</p></div></div>`;
    box.hidden = false;
    $('#mkDetailsClose').addEventListener('click', () => { box.hidden = true; });
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function notListedSmall() {
    return '<small class="not-listed"> (AMC name not listed)</small>';
  }
  function managerHTML(c) {
    if (c && (c.phone || c.email)) {
      return `${c.phone ? 'Official Phone: ' + esc(c.phone) + '<br>' : ''}${c.email ? 'Official Email: ' + esc(c.email) : ''}`;
    }
    return 'No verified contact details available in official data. Farmer helpline (toll-free): <strong>1800-180-1551</strong> (Kisan Call Centre).';
  }
  async function loadMarkets(force) {
    const st = $('#mkState').value, dt = $('#mkDistrict').value;
    if (!st || !dt) { $('#guarPanel').hidden = true; dashShow('prompt'); return; }
    dashShow('loading');
    $('#mkUpdated').textContent = '';
    $('#mkDetails').hidden = true;
    loadGuar(st, dt, force);
    try {
      const q = new URLSearchParams({ crop: cropId, state: st, district: dt });
      if (force) q.set('refresh', '1');
      const [pr, dr] = await Promise.all([
        fetch('/api/market-prices?' + q.toString(), { headers: { Accept: 'application/json' } }).then(r => r.json().catch(() => null)),
        fetch('/api/markets?crop=' + encodeURIComponent(cropId), { headers: { Accept: 'application/json' } }).then(r => r.json().catch(() => null)).catch(() => null)
      ]);
      if (!pr || pr.success !== true || !Array.isArray(pr.markets)) {
        const msg = (pr && pr.success === false && pr.message) ? pr.message : 'Market data service is temporarily unavailable.';
        $('#mkErrorTitle').textContent = msg;
        $('#mkErrorText').textContent = 'Use Refresh Prices above to try again, or choose a different location.';
        dashShow('error');
        return;
      }
      const contacts = {};
      const dirList = dr && dr.success === true && dr.data && Array.isArray(dr.data.markets) ? dr.data.markets : [];
      dirList.forEach(m => { if (m && m.market) contacts[String(m.market).toLowerCase()] = m.contact || null; });
      dashSource = pr.source || '';
      dashUpdated = pr.lastUpdated || null;
      dashRows = pr.markets.map(r => ({ ...r, contact: contacts[String(r.market || '').toLowerCase()] || null }));
      if (!dashRows.length) { dashShow('empty'); return; }
      buildCommodityOptions();
      dashShow('table');
      if (!paintDash()) return; // search/mandal filter emptied it
      $('#mkLiveBadge').hidden = false;
      $('#mkUpdated').textContent = dashUpdated ? 'Updated: ' + new Date(dashUpdated).toLocaleString('en-IN') : '';
    } catch (e) {
      $('#mkErrorTitle').textContent = 'Market data service is temporarily unavailable.';
      $('#mkErrorText').textContent = 'Use Refresh Prices above to try again, or choose a different location.';
      dashShow('error');
    }
  }
  /* ---------- Guar Seed live example (official API only, never hardcoded) ---------- */
  function money(v) {
    return v != null && Number.isFinite(Number(v)) ? fmt(v) : '—';
  }
  async function loadGuar(st, dt, force) {
    const panel = $('#guarPanel'), L = $('#guarLoading'), D = $('#guarData'), E = $('#guarEmpty');
    panel.hidden = false; L.hidden = false; D.hidden = true; E.hidden = true;
    try {
      const q = new URLSearchParams({ crop: 'guar', state: st, district: dt });
      if (force) q.set('refresh', '1');
      const res = await fetch('/api/market-prices?' + q.toString(), { headers: { Accept: 'application/json' } });
      const body = await res.json().catch(() => null);
      const pick = body && body.success === true && Array.isArray(body.markets) && body.markets.length
        ? body.markets[0] : null;
      if (!pick || pick.modalPrice == null) throw new Error('empty');
      const unit = pick.unit || 'Quintal';
      $('#guarGrid').innerHTML = [
        ['Market Name', pick.market || '—', 0],
        ['State', pick.state || st, 0],
        ['District', pick.district || dt, 0],
        ['Market Place', [pick.district, pick.state].filter(Boolean).join(', ') || '—', 0],
        ['Commodity', 'Guar Seed (Cluster Beans Seed)', 0],
        ['Variety', pick.variety || '—', 0],
        ['Minimum Price', money(pick.minPrice), 0],
        ['Current / Modal Price', money(pick.modalPrice), 0],
        ['Maximum Price', money(pick.maxPrice), 0],
        ['Unit', '₹/' + String(unit).toLowerCase(), 0],
        ['Date', pick.arrivalDate || '—', 0],
        ['Last Updated', body.lastUpdated ? new Date(body.lastUpdated).toLocaleString('en-IN') : '—', 0]
      ].map(([k, v]) => `<div class="cg-fact"><span>${k}</span><p>${v}</p></div>`).join('');
      const src = $('#guarSource');
      if (src) src.innerHTML = '<i class="fa-solid fa-circle-info"></i> Data Source: Official market-price data (Government of India - Data.gov.in)' +
        (body.lastUpdated ? ' · Last Updated: ' + new Date(body.lastUpdated).toLocaleString('en-IN') : '');
      L.hidden = true; D.hidden = false; E.hidden = true;
    } catch (e) {
      L.hidden = true; D.hidden = true; E.hidden = false;
    }
  }
  function fillDistricts() {
    const st = $('#mkState').value;
    const dSel = $('#mkDistrict'), mSel = $('#mkMandal');
    dSel.innerHTML = '<option value="">Select District</option>';
    mSel.innerHTML = '<option value="">Select Mandal</option>';
    mSel.disabled = true;
    dashMandal = 'all';
    if (!st || !DISTRICTS[st]) { dSel.disabled = true; $('#guarPanel').hidden = true; dashShow('prompt'); return; }
    dSel.disabled = false;
    DISTRICTS[st].forEach(d => {
      const o = document.createElement('option'); o.value = d; o.textContent = d; dSel.appendChild(o);
    });
    dashShow('prompt');
  }
  function fillMandals() {
    const st = $('#mkState').value, dt = $('#mkDistrict').value;
    const mSel = $('#mkMandal');
    mSel.innerHTML = '';
    const list = (MANDALS[st] && MANDALS[st][dt]) || [];
    const backendFirst = mandalBackendCache;
    const merged = [...new Set([...(backendFirst || []), ...list])];
    const all = document.createElement('option'); all.value = 'all'; all.textContent = 'All Mandals'; mSel.appendChild(all);
    merged.forEach(m => {
      const o = document.createElement('option'); o.value = m; o.textContent = m; mSel.appendChild(o);
    });
    mSel.disabled = false;
    dashMandal = 'all';
    loadMarkets(false);
  }
  let mandalBackendCache = null;
  async function refreshMandalList() {
    // Prefer backend mandal list; fall back to embedded reference
    mandalBackendCache = null;
    const st = $('#mkState').value, dt = $('#mkDistrict').value;
    if (!st || !dt) return;
    try {
      const res = await fetch('/api/locations?state=' + encodeURIComponent(st) + '&district=' + encodeURIComponent(dt),
        { headers: { Accept: 'application/json' } });
      const body = await res.json().catch(() => null);
      if (body && body.success === true && body.data && Array.isArray(body.data.mandals) && body.data.mandals.length) {
        mandalBackendCache = body.data.mandals;
      }
    } catch (e) { /* embedded fallback */ }
  }
  $('#mkState').addEventListener('change', fillDistricts);
  $('#mkDistrict').addEventListener('change', async () => { await refreshMandalList(); fillMandals(); });
  $('#mkMandal').addEventListener('change', () => {
    dashMandal = $('#mkMandal').value || 'all';
    if (!dashRows.length) { loadMarkets(false); return; }
    dashShow('table');
    paintDash();
  });
  $('#mkRefresh').addEventListener('click', () => loadMarkets(true));
  $('#mkSearch').addEventListener('input', () => { if (dashRows.length) { dashShow('table'); paintDash(); } });
  $('#mkCommodity').addEventListener('change', () => { if (dashRows.length) { dashShow('table'); paintDash(); } });
  (function initLocation() {
    const sSel = $('#mkState');
    STATES.forEach(s => {
      const o = document.createElement('option'); o.value = s; o.textContent = s; sSel.appendChild(o);
    });
    // Preselect Andhra Pradesh → Krishna → All Mandals for a one-tap start
    sSel.value = 'Andhra Pradesh';
    fillDistricts();
    $('#mkDistrict').value = 'Krishna';
    refreshMandalList().then(fillMandals);
  })();

  /* ---------- Weather (live via backend Open-Meteo adapter, never faked) ---------- */
  const STATE_COORDS = {
    'Andhra Pradesh': [15.91, 79.74], 'Maharashtra': [19.75, 75.71],
    'Punjab': [31.15, 75.34], 'Uttar Pradesh': [26.85, 80.95]
  };
  const DEFAULT_COORDS = { lat: 28.61, lon: 77.20, label: 'New Delhi (default)' };
  const wxState = $('#wxState');
  if (wxState) {
    Object.keys(STATE_COORDS).forEach(s => {
      const o = document.createElement('option'); o.value = s; o.textContent = s; wxState.appendChild(o);
    });
    wxState.addEventListener('change', () => loadWeather());
  }
  const wxGeoBtn = $('#wxGeo');
  if (wxGeoBtn) wxGeoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) { toast('Location not supported — please select a state.'); return; }
    toast('Requesting location (one-time, never tracked)…');
    navigator.geolocation.getCurrentPosition(
      pos => loadWeather(pos.coords.latitude, pos.coords.longitude, 'Your location'),
      () => { toast('Location denied — showing manual selection.'); loadWeather(); },
      { timeout: 10000 }
    );
  });
  function toast(m) {
    const t = $('#toast'); if (!t) return;
    t.textContent = m; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
  async function loadWeather(lat, lon, label) {
    const L = $('#gdWxLoading'), U = $('#gdWxUnav'), D = $('#gdWxData');
    L.hidden = false; U.hidden = true; D.hidden = true;
    if (lat == null || lon == null) {
      const st = wxState && wxState.value;
      if (st && STATE_COORDS[st]) { lat = STATE_COORDS[st][0]; lon = STATE_COORDS[st][1]; label = st; }
      else { lat = DEFAULT_COORDS.lat; lon = DEFAULT_COORDS.lon; label = DEFAULT_COORDS.label; }
    }
    try {
      const res = await fetch('/api/weather?lat=' + lat + '&lon=' + lon, { headers: { Accept: 'application/json' } });
      const body = await res.json().catch(() => null);
      if (!body || body.success !== true || !body.data) throw new Error('empty');
      const cur = body.data.current || {};
      if (cur.tempC == null && cur.humidity == null) throw new Error('empty');
      L.hidden = true; U.hidden = true; D.hidden = false;
      $('#wxTemp').textContent = cur.tempC != null ? cur.tempC + ' °C' : '—';
      $('#wxHum').textContent = cur.humidity != null ? cur.humidity + ' %' : '—';
      $('#wxRain').textContent = (cur.rainfallMm != null ? cur.rainfallMm + ' mm' : '—') +
        (cur.precipProb != null ? ' (' + cur.precipProb + '% chance)' : '');
      $('#wxWind').textContent = cur.windKmh != null ? cur.windKmh + ' km/h' : '—';
      let cond = cur.condition || '—';
      if (cur.sunrise || cur.sunset) {
        const f = s => { try { return new Date(s).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); } catch (e) { return s; } };
        cond += ' · Sunrise ' + (cur.sunrise ? f(cur.sunrise) : '—') + ' / Sunset ' + (cur.sunset ? f(cur.sunset) : '—');
      }
      $('#wxCond').textContent = cond;
      const src = $('#wxSource');
      if (src) {
        const upd = body.lastUpdated ? new Date(body.lastUpdated).toLocaleString('en-IN') : '—';
        const loc = (body.data.location && body.data.location.name) || label || '';
        src.textContent = `Showing: ${loc} · Source: ${body.source || '—'} · Last updated: ${upd}`;
      }
    } catch (e) {
      L.hidden = true; U.hidden = false; D.hidden = true;
    }
  }
  $('#gdWxRetry').addEventListener('click', () => loadWeather());

  /* ---------- Duration timeline + stages ---------- */
  $('#gdDuration').textContent = crop.duration;
  $('#gdTimeline').innerHTML = crop.timeline.map(([ico, title, text, days]) => `
    <li><span class="t-ico">${ico}</span><strong>${title}</strong><p>${text}</p><span class="t-days">${days}</span></li>`).join('');
  const stageLabels = ['Germination period', 'Vegetative growth period', 'Flowering period', 'Maturity period', 'Harvesting period', 'Total crop duration'];
  const stageVals = [
    crop.timeline[1].slice(2).join(' — '),
    crop.timeline[2].slice(2).join(' — '),
    crop.timeline[3].slice(2).join(' — '),
    crop.timeline[4].slice(2).join(' — '),
    crop.timeline[5].slice(2).join(' — '),
    crop.duration
  ];
  $('#gdStages').innerHTML = stageLabels.map((l, i) => `<div class="cg-fact"><span>${l}</span><p>${stageVals[i]}</p></div>`).join('');

  /* ---------- Seed details + farmer summary (crop-specific, educational) ---------- */
  const EXTRA = {
    rice: { seedType: 'Certified paddy seed', treatment: 'Use dealer-treated or certified seed; follow packet and extension guidance.', spacing: '20×15 cm (transplanted)', germRate: 'Approx. 85–90% with quality seed', water: 'High — standing water 2–5 cm most of the season', harvestPeriod: 'October–December (Kharif)', conditions: 'Hot humid weather, assured water, levelled puddled field' },
    wheat: { seedType: 'Certified wheat seed', treatment: 'Use treated certified seed from authorized dealers; follow label directions.', spacing: '20 cm rows, 4–5 cm deep', germRate: 'Approx. 85–90% with quality seed', water: 'Medium — 4–6 irrigations, crown-root stage critical', harvestPeriod: 'March–April', conditions: 'Cool dry winter with bright sunshine' },
    maize: { seedType: 'Hybrid maize seed (fresh every season)', treatment: 'Buy pre-treated hybrid seed; do not save hybrid grain for sowing.', spacing: '60×20 cm', germRate: 'Approx. 85–95% with quality seed', water: 'Medium — critical at knee-high, tasseling and grain-filling', harvestPeriod: 'September–October (Kharif)', conditions: 'Warm full sun, well-drained soil' },
    cotton: { seedType: 'Bt hybrid cotton seed', treatment: 'Coated hybrid seed from licensed sellers; follow packet guidance.', spacing: '90×60 cm on ridges', germRate: 'Approx. 75–80% field emergence (hybrid)', water: 'Medium — protective irrigation at flowering and boll formation', harvestPeriod: 'November–February (multiple pickings)', conditions: 'Long warm frost-free season, moisture-retentive black soil' },
    groundnut: { seedType: 'Bold graded kernels', treatment: 'Use fresh kernels; treat only with approved products per label guidance.', spacing: '30×10 cm, 4–5 cm deep', germRate: 'Approx. 80–85% with bold fresh kernels', water: 'Low–Medium — critical at flowering and pegging', harvestPeriod: 'October–November', conditions: 'Warm weather, light well-drained soil, no waterlogging' },
    chilli: { seedType: 'Hybrid / open-pollinated chilli seed', treatment: 'Healthy nursery stock matters most; use approved nursery practices.', spacing: '60×45 cm after transplanting', germRate: 'Approx. 70–80% (slow, 7–12 days)', water: 'Medium — light frequent irrigation, drip ideal', harvestPeriod: 'November–March (repeated pickings)', conditions: 'Warm air, rich drained soil, shelter from heavy rain' },
    tomato: { seedType: 'F1 hybrid tomato seed', treatment: 'Sterile nursery media + healthy seedlings; harden before transplant.', spacing: '60×45 cm with staking', germRate: 'Approx. 80–90% in warm nursery', water: 'Medium–High — drip every 2–3 days', harvestPeriod: 'Rolling pickings from ~65 days after transplant', conditions: 'Mild frost-free weather, compost-rich drained beds' },
    sugarcane: { seedType: 'Three-bud setts from healthy canes', treatment: 'Select disease-free setts; sett treatment per mill-zone guidance.', spacing: '90 cm furrows', germRate: 'Approx. 70–80% bud sprouting', water: 'High — every 7–10 days in summer', harvestPeriod: 'December–March (peak sucrose)', conditions: 'Long sunshine, deep rich soil, assured irrigation' },
    banana: { seedType: 'Tissue-culture plantlets', treatment: 'Disease-free lab plantlets; disinfect pits and tools.', spacing: '2×2 m pits', germRate: 'Approx. 95%+ establishment with tissue culture', water: 'High — frequent light irrigation, drip saves ~40%', harvestPeriod: 'Year-round; first bunch at 11–12 months', conditions: 'Warm humid air, wind shelter, rich deep soil' },
    mango: { seedType: 'Grafted saplings (not seedlings)', treatment: 'Grafts from registered nurseries; protect graft joint.', spacing: '10×10 m (5×5 m high-density)', germRate: 'Approx. 70–80% graft success in nurseries', water: 'Low for bearing trees; regular for young plants', harvestPeriod: 'April–June every year', conditions: 'Dry flowering season followed by hot ripening weather' }
  };
  const ex = EXTRA[cropId] || {};
  const s = crop.seed;
  $('#gdSeed').innerHTML = [
    ['Seed Type', ex.seedType || '—', 0],
    ['Recommended Variety', s.variety, 1],
    ['Seed Treatment Information', ex.treatment || '—', 1],
    ['Sowing Method', s.method, 0],
    ['Sowing Season', s.season, 0],
    ['Spacing', ex.spacing || '—', 0],
    ['Approximate Seed Requirement', s.requirement, 0],
    ['Germination Period', s.germination, 0],
    ['Expected Germination Rate (approx.)', ex.germRate || '—', 0],
    ['Expected Days: Sowing to Harvest', s.harvest, 0]
  ].map(([k, v, full]) => `<div class="cg-fact${full ? ' full' : ''}"><span>${k}</span><p>${v}</p></div>`).join('');

  /* ---------- Quick farming summary ---------- */
  $('#gdSummary').innerHTML = [
    ['Best Season', crop.season, 0],
    ['Suitable Soil', crop.soil, 0],
    ['Water Requirement', ex.water || '—', 0],
    ['Crop Duration', crop.duration.split('.')[0] + '.', 0],
    ['Expected Harvest Period', ex.harvestPeriod || '—', 0],
    ['Major Growing Conditions', ex.conditions || crop.climate, 1]
  ].map(([k, v, full]) => `<div class="cg-fact${full ? ' full' : ''}"><span>${k}</span><p>${v}</p></div>`).join('');

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

  /* Init — location chain above already triggers the first load */
  loadWeather();
})();
