/* AgriMitra — Crop Guide logic (search, filter, details, auth guard) */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Double-check login protection ---------- */
  try {
    if (localStorage.getItem('agrimitra_auth') !== 'verified') {
      window.location.replace('index.html');
      return;
    }
  } catch (e) { window.location.replace('index.html'); return; }

  /* ---------- Crop data (sample / educational) ---------- */
  const CROPS = [
    {
      id: 'rice', name: 'Rice', sub: 'Paddy · Kharif staple', cat: 'Cereals',
      img: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&q=80',
      desc: 'India’s most important food crop. Thrives in warm, water-rich conditions with puddled fields.',
      soil: 'Clay / clay-loam, good water retention, pH 5.5–7.0', climate: 'Hot & humid, high rainfall',
      temp: '20–35°C', sowing: 'Jun–Jul (nursery) · transplant 21–25 days seedlings',
      seed: '25–30 kg/ha (transplanted) · 60–75 kg/ha (direct seeded)',
      land: 'Puddle the field twice, level well for uniform standing water.',
      irrigation: 'Keep 2–5 cm standing water till tillering; drain before harvest.',
      fertilizer: 'Balanced NPK + zinc as per soil health card; split nitrogen doses.',
      diseases: 'Blast, bacterial leaf blight, sheath blight, tungro',
      pest: 'Stem borer, leaf folder, BPH — use traps, neem-based options first; consult extension officer before chemicals.',
      harvest: 'When 80% grains turn golden; moisture ~20–22%.', duration: '120–150 days'
    },
    {
      id: 'wheat', name: 'Wheat', sub: 'Rabi staple', cat: 'Cereals',
      img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
      desc: 'Cool-season cereal. Needs well-drained loam and timely irrigation at crown-root stage.',
      soil: 'Well-drained loam, pH 6.0–7.5', climate: 'Cool, dry winter with sunshine',
      temp: '15–25°C', sowing: 'Oct–Dec (timely sowing gives best yield)',
      seed: '100 kg/ha, depth 4–5 cm, row spacing ~20 cm',
      land: 'One deep plough + 2 harrowings; levelled seedbed.',
      irrigation: '4–6 irrigations; crown-root (21 days) and flowering are critical.',
      fertilizer: 'NPK as per soil test in split doses; add organic manure.',
      diseases: 'Rust (yellow/brown), powdery mildew, loose smut',
      pest: 'Aphids, termites — seed treatment + timely sowing help; seek local advice for sprays.',
      harvest: 'Grains hard, straw golden; combine at ~12% moisture.', duration: '110–130 days'
    },
    {
      id: 'maize', name: 'Maize', sub: 'Corn · versatile', cat: 'Cereals',
      img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
      desc: 'Fast-growing cereal for food, feed and industry. Loves sunshine and drains well.',
      soil: 'Well-drained loam, pH 5.8–7.5', climate: 'Warm with full sun',
      temp: '18–27°C', sowing: 'Jun–Jul (Kharif) · Oct–Nov (Rabi in south)',
      seed: '20–25 kg/ha, spacing 60×20 cm',
      land: 'Fine tilth, ridges for drainage in heavy rain zones.',
      irrigation: 'Irrigate at knee-high, tasseling and grain-filling stages.',
      fertilizer: 'Nitrogen in 2–3 splits + basal P & K per soil test.',
      diseases: 'Turcicum leaf blight, downy mildew, banded leaf sheath blight',
      pest: 'Fall armyworm, stem borer — pheromone traps + scouting; follow extension guidance.',
      harvest: 'Husk brown, grains hard; dry cobs before shelling.', duration: '90–110 days'
    },
    {
      id: 'cotton', name: 'Cotton', sub: 'Cash crop', cat: 'Commercial Crops',
      img: 'https://images.unsplash.com/photo-1592056570638-2e716f990a90?auto=format&fit=crop&w=600&q=80',
      desc: 'Major fibre crop. Needs long frost-free season and moisture-retentive black soils.',
      soil: 'Deep black (regur) soil, pH 6–8', climate: 'Warm, 200+ frost-free days',
      temp: '21–30°C', sowing: 'Apr–Jun with monsoon onset',
      seed: '1–1.5 kg/ha Bt hybrid, spacing 90×60 cm',
      land: 'Deep summer ploughing + farmyard manure; ridges in heavy soils.',
      irrigation: 'Protective irrigation at flowering & boll formation if rains fail.',
      fertilizer: 'Balanced NPK + magnesium/zinc if deficient, per soil test.',
      diseases: 'Bacterial blight, leaf curl virus, grey mildew',
      pest: 'Bollworm complex, whitefly, jassids — IPM with traps & beneficials first.',
      harvest: 'Multiple pickings as bolls burst; keep dry & clean.', duration: '160–200 days'
    },
    {
      id: 'groundnut', name: 'Groundnut', sub: 'Oilseed legume', cat: 'Commercial Crops',
      img: 'https://images.unsplash.com/photo-1567892737950-30c4db37cd89?auto=format&fit=crop&w=600&q=80',
      desc: 'Protein & oil rich legume that fixes nitrogen and likes light soils.',
      soil: 'Sandy loam, well-drained, pH 6–7', climate: 'Warm with moderate rain',
      temp: '25–35°C', sowing: 'Jun–Jul (Kharif)',
      seed: '100–120 kg/ha kernels, spacing 30×10 cm',
      land: 'Fine seedbed; avoid waterlogging; gypsum at flowering helps pods.',
      irrigation: 'Critical at flowering & pegging; avoid excess near harvest.',
      fertilizer: 'Phosphorus + calcium (gypsum); low nitrogen needed (legume).',
      diseases: 'Tikka leaf spot, rust, collar rot',
      pest: 'Aphids, thrips, white grub — crop rotation + traps help.',
      harvest: 'Leaves yellow, pods rattle (~100–120 days); dry quickly.', duration: '100–120 days'
    },
    {
      id: 'chilli', name: 'Chilli', sub: 'Spice · high value', cat: 'Vegetables',
      img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
      desc: 'High-value spice crop. Nursery + transplanting with steady warmth gives best pungency.',
      soil: 'Well-drained loam, rich in organic matter, pH 6–7', climate: 'Warm, humid-free air',
      temp: '20–32°C', sowing: 'Nursery Jun–Jul · transplant at 30–35 days',
      seed: '1–1.25 kg/ha nursery; spacing 60×45 cm',
      land: 'Raised beds + mulch reduce disease and weeds.',
      irrigation: 'Light frequent irrigation; drip ideal; avoid waterlogging.',
      fertilizer: 'Well-rotted manure + balanced NPK in splits per soil test.',
      diseases: 'Leaf curl virus, anthracnose, powdery mildew',
      pest: 'Thrips, mites, fruit borer — yellow/blue sticky traps + neem first.',
      harvest: 'Green or red ripe; multiple pickings every 8–10 days.', duration: '150–180 days'
    },
    {
      id: 'tomato', name: 'Tomato', sub: 'Short-duration veg', cat: 'Vegetables',
      img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
      desc: 'Quick returns with staking + drip. Sensitive to frost and excess rain.',
      soil: 'Well-drained loam, pH 6–7, rich in compost', climate: 'Mild, frost-free',
      temp: '20–30°C', sowing: 'Nursery then transplant at ~25 days',
      seed: '80–100 g/ha hybrid; spacing 60×45 cm with staking',
      land: 'Raised beds, mulch, support stakes/trellis.',
      irrigation: 'Drip every 2–3 days; reduce before harvest for firmness.',
      fertilizer: 'Compost + NPK splits; calcium helps prevent blossom-end rot.',
      diseases: 'Early/late blight, leaf curl, bacterial wilt',
      pest: 'Fruit borer, whitefly — nets, traps, crop hygiene first.',
      harvest: 'Mature-green to red stages; pick every 3–4 days.', duration: '90–120 days'
    },
    {
      id: 'sugarcane', name: 'Sugarcane', sub: 'Long-duration cash', cat: 'Commercial Crops',
      img: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80',
      desc: 'High-biomass cash crop needing long sunshine, rich soil and assured water.',
      soil: 'Deep loam/clay-loam, pH 6–7.5', climate: 'Long sunny season',
      temp: '20–35°C', sowing: 'Feb–Mar (spring) · Oct (autumn in north)',
      seed: '75,000 three-bud setts/ha; treat setts before planting',
      land: 'Deep ploughing + furrows 90 cm apart; trash mulching.',
      irrigation: 'Every 7–10 days in summer; critical at tillering & grand growth.',
      fertilizer: 'Heavy feeder — manure + NPK in splits per soil test.',
      diseases: 'Red rot, smut, grassy shoot, wilt',
      pest: 'Early shoot borer, top borer, white grub — trash mulching + traps.',
      harvest: 'At 10–12 months when sucrose peaks; cut close to ground.', duration: '300–365 days'
    },
    {
      id: 'banana', name: 'Banana', sub: 'Plantation fruit', cat: 'Fruits',
      img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
      desc: 'Fast fruit returns with tissue-culture plants, drip and wind protection.',
      soil: 'Deep rich loam, pH 6–7.5, no waterlogging', climate: 'Warm humid, sheltered from wind',
      temp: '22–32°C', sowing: 'Jun–Jul or Feb–Mar with tissue-culture saplings',
      seed: '1,800–2,500 plants/ha (2×2 m); desucker regularly',
      land: 'Pits 45×45×45 cm with compost; drip + mulch.',
      irrigation: 'Frequent light irrigation; drip saves 40% water.',
      fertilizer: 'Heavy potassium feeder — splits monthly + organic manure.',
      diseases: 'Panama wilt, Sigatoka leaf spot, bunchy top virus',
      pest: 'Rhizome weevil, nematodes — clean planting material + rotation.',
      harvest: '75–80% maturity; bunches 11–12 months after planting.', duration: '330–360 days'
    },
    {
      id: 'mango', name: 'Mango', sub: 'King of fruits', cat: 'Fruits',
      img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
      desc: 'Long-life orchard. Grafted plants, pruning and flowering management decide income.',
      soil: 'Deep well-drained loam/laterite, pH 5.5–7.5', climate: 'Dry flowering season, hot ripening',
      temp: '24–32°C', sowing: 'Jun–Aug grafted plants (Alphonso, Kesar, Dasheri)',
      seed: '100–200 grafts/ha (10×10 m to 5×5 m high-density)',
      land: 'Pits 1×1×1 m with compost; windbreaks on borders.',
      irrigation: 'Young plants regular; bearing trees at flowering & fruit set.',
      fertilizer: 'Annual manure + NPK rings per age; micronutrients if needed.',
      diseases: 'Powdery mildew, anthracnose, mango malformation',
      pest: 'Hoppers, fruit fly, mealy bug — orchard sanitation + traps.',
      harvest: 'Mature-hard stage; ripen off-tree for market.', duration: 'Perennial (fruits from year 3–4)'
    },
    {
      id: 'chickpea', name: 'Chickpea', sub: 'Chana · protein pulse', cat: 'Pulses',
      img: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=600&q=80',
      desc: 'Cool-season pulse that enriches soil nitrogen and needs minimal water.',
      soil: 'Well-drained loam, pH 6–7.5', climate: 'Cool dry winter',
      temp: '15–30°C', sowing: 'Oct–Nov (Rabi)',
      seed: '60–80 kg/ha, spacing 30×10 cm; Rhizobium seed treatment helps',
      land: 'Rough seedbed fine; avoid waterlogged patches.',
      irrigation: 'Usually rainfed; one irrigation at flowering if dry.',
      fertilizer: 'Starter nitrogen + phosphorus; low input needs.',
      diseases: 'Wilt, Ascochyta blight, collar rot',
      pest: 'Pod borer — bird perches + pheromone traps; avoid late sowing.',
      harvest: 'Plants dry & brown (~100–120 days); thresh quickly.', duration: '100–120 days'
    },
    {
      id: 'pigeonpea', name: 'Pigeon Pea', sub: 'Tur / Arhar', cat: 'Pulses',
      img: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=600&q=80',
      desc: 'Hardy long-duration pulse, great for intercropping and drylands.',
      soil: 'Well-drained loam, pH 6–7.5', climate: 'Warm with moderate rain',
      temp: '20–35°C', sowing: 'Jun–Jul with monsoon',
      seed: '12–15 kg/ha, spacing 90×30 cm',
      land: 'Ridges in heavy soils; intercrop with soybean/groundnut.',
      irrigation: 'Mostly rainfed; drain excess water quickly.',
      fertilizer: 'Phosphorus basal + organic manure; fixes own nitrogen.',
      diseases: 'Sterility mosaic, wilt, Phytophthora blight',
      pest: 'Pod borer & pod fly — traps + timely harvest reduce loss.',
      harvest: '80% pods brown (~150–180 days); multiple pickings for long types.', duration: '150–180 days'
    }
  ];

  const grid = $('#cropGrid');
  const searchInput = $('#cropSearch');
  const clearBtn = $('#clearSearch');
  const emptyState = $('#emptyState');
  const countEl = $('#cropCount');
  let activeCat = 'all';

  function cardHTML(c) {
    return `
      <article class="cg-card" data-id="${c.id}" data-name="${c.name.toLowerCase()}" data-cat="${c.cat}">
        <div class="cg-img">
          <img src="${c.img}" alt="${c.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80'" />
          <span class="crop-tag">${c.cat}</span>
        </div>
        <div class="cg-body">
          <h3>${c.name}<small>${c.sub}</small></h3>
          <p class="cg-desc">${c.desc}</p>
          <p class="cg-meta"><span><i class="fa-solid fa-temperature-half"></i>${c.temp}</span><span><i class="fa-solid fa-calendar"></i>${c.duration}</span></p>
          <a class="btn btn-outline btn-sm" href="crop-guide-details.html?crop=${c.id}">View Guide <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </article>`;
  }

  function render() {
    grid.innerHTML = CROPS.map(cardHTML).join('');
    applyFilters();
  }

  function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    let shown = 0;
    $$('.cg-card', grid).forEach(card => {
      const matchQ = !q || card.dataset.name.includes(q) || card.querySelector('.cg-desc').textContent.toLowerCase().includes(q);
      const matchC = activeCat === 'all' || card.dataset.cat === activeCat;
      const show = matchQ && matchC;
      card.classList.toggle('hide', !show);
      if (show) shown++;
    });
    emptyState.hidden = shown !== 0;
    clearBtn.hidden = !q;
    countEl.textContent = shown === 0 ? '' : `Showing ${shown} of ${CROPS.length} crops${q ? ` for “${searchInput.value.trim()}”` : ''}`;
  }

  searchInput.addEventListener('input', applyFilters);
  clearBtn.addEventListener('click', () => { searchInput.value = ''; applyFilters(); searchInput.focus(); });

  $('#catPills').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    $$('#catPills button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCat = btn.dataset.cat;
    applyFilters();
  });

  $('#resetFilters').addEventListener('click', () => {
    searchInput.value = '';
    activeCat = 'all';
    $$('#catPills button').forEach(b => b.classList.toggle('active', b.dataset.cat === 'all'));
    applyFilters();
  });

  /* Deep link ?crop=xxx jumps straight to the full details page */
  function deepLink() {
    const id = new URLSearchParams(window.location.search).get('crop');
    if (id && CROPS.some(c => c.id === id.toLowerCase())) {
      window.location.replace('crop-guide-details.html?crop=' + id.toLowerCase());
    }
  }

  /* ---------- Navbar / logout / misc ---------- */
  function logout(e) {
    if (e) e.preventDefault();
    try { localStorage.removeItem('agrimitra_auth'); } catch (err) {}
    window.location.href = 'index.html';
  }
  const lo1 = $('#logoutBtn'), lo2 = $('#logoutBtnMobile');
  if (lo1) lo1.addEventListener('click', logout);
  if (lo2) lo2.addEventListener('click', logout);

  const nb = $('#navbar'), hb = $('#hamburger'), nl = $('#navLinks');
  if (hb) hb.addEventListener('click', () => { hb.classList.toggle('open'); nl.classList.toggle('open'); });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => { if (hb) hb.classList.remove('open'); if (nl) nl.classList.remove('open'); }));
  window.addEventListener('scroll', () => {
    if (nb) nb.classList.toggle('scrolled', window.scrollY > 20);
    const btt = $('#backToTop');
    if (btt) btt.classList.toggle('show', window.scrollY > 600);
  }, { passive: true });
  const btt = $('#backToTop');
  if (btt) btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  render();
  deepLink();
})();
