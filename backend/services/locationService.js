'use strict';

/**
 * Static market directory (names only — never prices).
 * Live prices come from marketService; this only powers dropdowns/tables.
 */
const DIRECTORY = {
  'Andhra Pradesh': { Guntur: ['Guntur', 'Tenali'], Krishna: ['Vijayawada', 'Machilipatnam'] },
  'Maharashtra': { Nashik: ['Nashik', 'Lasalgaon'], Pune: ['Pune', 'Baramati'] },
  'Punjab': { Ludhiana: ['Ludhiana', 'Khanna'], Amritsar: ['Amritsar', 'Jandiala'] },
  'Uttar Pradesh': { Lucknow: ['Lucknow', 'Bakshi Ka Talab'], Agra: ['Agra', 'Fatehabad'] },
  'Rajasthan': { Bikaner: [], Jodhpur: [], Hanumangarh: [], 'Sri Ganganagar': [] },
  'Haryana': { Hisar: [], Sirsa: [], Bhiwani: [] },
  'Gujarat': { Banaskantha: [], Patan: [], Mehsana: [] }
};

function states() {
  return Object.keys(DIRECTORY);
}

function districts(state) {
  if (!state || !DIRECTORY[state]) return [];
  return Object.keys(DIRECTORY[state]);
}

/**
 * Static market directory (names only — never prices).
 * Live prices come from marketService; this only powers dropdowns/tables.
 *
 * CONTACTS holds official market contact info where available.
 * null = not listed (frontend shows "—"). Fill in verified APMC
 * phone/email values here as they are confirmed — never invent numbers.
 */
const CONTACTS = {
  // 'Vijayawada': { phone: '0866-XXXXXXX', email: '' },
};

/**
 * Mandal reference lists (administrative reference for dropdowns).
 * The data.gov.in price API provides State/District/Market level only —
 * mandal is a reference layer, clearly labelled as such in the UI.
 */
const MANDALS = {
  'Andhra Pradesh': {
    Krishna: ['Vijayawada Urban', 'Vijayawada Rural', 'Penamaluru', 'Kankipadu', 'Gannavaram', 'Gudivada', 'Nuzvid', 'Machilipatnam', 'Vuyyuru', 'Kaikalur'],
    Guntur: ['Guntur East', 'Guntur West', 'Tenali', 'Ponnur', 'Tadikonda', 'Mangalagiri', 'Prathipadu', 'Vatticherukuru'],
    Eluru: ['Eluru', 'Denduluru', 'Bhimadole'],
    Kakinada: ['Kakinada Urban', 'Kakinada Rural', 'Samalkota', 'Pithapuram', 'Peddapuram'],
    Visakhapatnam: ['Visakhapatnam Urban', 'Pendurthi', 'Gopalapatnam']
  }
};

// Known market-town -> mandal reference mapping (Andhra Pradesh focus towns)
const TOWN_MANDAL = [
  ['visakhapatnam', 'Visakhapatnam Urban'],
  ['vizag', 'Visakhapatnam Urban'],
  ['vijayawada', 'Vijayawada Urban'],
  ['guntur', 'Guntur East'],
  ['tenali', 'Tenali'],
  ['kakinada', 'Kakinada Urban'],
  ['eluru', 'Eluru'],
  ['machilipatnam', 'Machilipatnam'],
  ['masulipatnam', 'Machilipatnam']
];

function mandals(state, district) {
  if (state && district && MANDALS[state] && MANDALS[state][district]) {
    return MANDALS[state][district];
  }
  return [];
}

function mandalOf(market, district, state) {
  if (state !== 'Andhra Pradesh') return null;
  const m = String(market || '').toLowerCase();
  for (const [town, mandal] of TOWN_MANDAL) {
    if (m.includes(town)) return mandal;
  }
  return null;
}

function contactFor(market) {
  return CONTACTS[market] || null;
}

function markets(state, district) {
  const toObj = (m, d, st) => ({ market: m, district: d, state: st, contact: contactFor(m) });
  if (state && district) return ((DIRECTORY[state] && DIRECTORY[state][district]) || []).map(m => toObj(m, district, state));
  if (state && DIRECTORY[state]) {
    return Object.entries(DIRECTORY[state]).flatMap(([d, ms]) =>
      ms.map(m => toObj(m, d, state)));
  }
  const all = [];
  Object.entries(DIRECTORY).forEach(([st, dists]) =>
    Object.entries(dists).forEach(([d, ms]) =>
      ms.forEach(m => all.push(toObj(m, d, st)))));
  return all;
}

module.exports = { states, districts, markets, mandals, mandalOf };
