'use strict';

/**
 * MarketProvider adapters — official/open govt data first, optional backup.
 * NEVER returns fake numbers: missing credentials/failure → throws
 * Error('NOT_CONFIGURED' | 'UPSTREAM_ERROR'), controllers map to clean JSON.
 *
 * Primary: data.gov.in "Current Daily Price of Various Commodities
 * from Various Markets (Mandi)" — free API key from https://data.gov.in
 * (register → My Account → API keys). Set DATA_GOV_API_KEY in .env.
 *
 * Backup: generic MARKET_API_URL (GET ?crop=&state=&district=&market=).
 */
const cache = require('../utils/cache');
const config = require('../config/apiConfig');
const locationService = require('./locationService');

// data.gov.in commodity names for our crops (frontend id -> dataset value)
const COMMODITY = {
  rice: 'Paddy', wheat: 'Wheat', maize: 'Maize', cotton: 'Cotton',
  groundnut: 'Groundnut', chilli: 'Chilli', tomato: 'Tomato',
  sugarcane: 'Sugarcane', banana: 'Banana', mango: 'Mango',
  guar: 'Guar Seed'
};

// Display labels for query ids
const CROP_LABELS = {
  guar: 'Guar Seed (Cluster Beans Seed)'
};

// Loose aliases for client-side fallback matching (dataset spellings vary)
const ALIASES = {
  rice: ['rice', 'paddy', 'dhan'],
  wheat: ['wheat', 'gehun'],
  maize: ['maize', 'makka', 'corn', 'bhutta'],
  cotton: ['cotton', 'kapas'],
  groundnut: ['groundnut', 'mungfali', 'peanut'],
  chilli: ['chilli', 'chillies', 'mirch', 'red chilli'],  tomato: ['tomato', 'tamatar'],
  sugarcane: ['sugarcane', 'ganna'],
  banana: ['banana', 'kela'],
  mango: ['mango', 'aam'],
  guar: ['guar', 'guar seed', 'guarseed', 'cluster bean', 'clusterbean', 'gawar', 'guar gum']
};

const SOURCE = 'Government of India - Data.gov.in';

// Placeholder values count as "not configured" — never sent upstream
function dataGovKey() {
  const k = (config.market.dataGovKey || '').trim();
  if (!k || /^(YOUR_API_KEY_HERE|YOUR_KEY|XXXX*|test|changeme)$/i.test(k)) return '';
  return k;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

async function fetchJson(url, headers) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), config.market.timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: headers || { Accept: 'application/json' } });
    if (res.status === 401 || res.status === 403) {
      const e = new Error('AUTH_FAILED');
      e.code = 'AUTH_FAILED'; e.status = res.status;
      throw e;
    }
    if (res.status === 429) {
      const e = new Error('RATE_LIMITED');
      e.code = 'RATE_LIMITED'; e.status = 429;
      throw e;
    }
    if (res.status === 404) {
      const e = new Error('NOT_FOUND');
      e.code = 'NOT_FOUND'; e.status = 404;
      throw e;
    }
    if (!res.ok) {
      const e = new Error('HTTP ' + res.status);
      e.code = 'UPSTREAM_ERROR'; e.status = res.status;
      throw e;
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError' || (err.message && err.message.includes('aborted'))) {
      const e = new Error('TIMEOUT');
      e.code = 'TIMEOUT';
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeRecord(r) {
  const min = num(r.min_price ?? r.minPrice ?? r.min);
  const max = num(r.max_price ?? r.maxPrice ?? r.max);
  const modal = num(r.modal_price ?? r.modalPrice ?? r.modal);
  if (min == null || max == null || modal == null) return null;
  return {
    market: r.market || r.mandi || '',
    district: r.district || '',
    state: r.state || '',
    commodity: r.commodity || '',
    variety: r.variety || '',
    minPrice: min, maxPrice: max, modalPrice: modal,
    unit: r.unit || 'Quintal',
    arrivalDate: r.arrival_date || r.arrivalDate || null
  };
}

function matchesCrop(recordCommodity, crop) {
  const c = String(recordCommodity || '').toLowerCase();
  return (ALIASES[crop] || [crop]).some(a => c.includes(a));
}

async function fromDataGov(crop, state, district, market, opts) {
  const skipCommodity = Boolean(opts && opts.skipCommodity);
  const url = new URL(`https://api.data.gov.in/resource/${config.market.dataGovResource}`);
  url.searchParams.set('api-key', dataGovKey());
  url.searchParams.set('format', 'json');
  url.searchParams.set('offset', '0');
  url.searchParams.set('limit', '100');
  if (!skipCommodity) url.searchParams.set('filters[commodity]', COMMODITY[crop] || capitalize(crop));
  // NOTE: per current data.gov.in swagger, State uses the .keyword variant
  if (state) url.searchParams.set('filters[state.keyword]', state);
  if (district) url.searchParams.set('filters[district]', district);
  if (market) url.searchParams.set('filters[market]', market);
  const body = await fetchJson(url.toString());
  let records = (body.records || []).map(normalizeRecord).filter(Boolean);
  if (skipCommodity) records = records.filter(r => matchesCrop(r.commodity, crop));
  return { markets: records, source: SOURCE };
}

async function fromBackupUrl(crop, state, district, market) {
  const url = new URL(config.market.backupUrl);
  url.searchParams.set('crop', crop);
  if (state) url.searchParams.set('state', state);
  if (district) url.searchParams.set('district', district);
  if (market) url.searchParams.set('market', market);
  const headers = { Accept: 'application/json' };
  if (config.market.backupKey) headers.Authorization = 'Bearer ' + config.market.backupKey;
  const body = await fetchJson(url.toString(), headers);
  const list = Array.isArray(body) ? body : body.markets || body.records || [body];
  const markets = list.map(normalizeRecord).filter(Boolean);
  return { markets, source: 'Configured market API' };
}

async function getPrices(crop, state, district, market, opts) {
  const force = Boolean(opts && opts.force);
  const key = `mkt:${crop}|${state || ''}|${district || ''}|${market || ''}`;
  if (!force) {
    const hit = cache.get(key);
    if (hit) return { ...hit, _cached: true };
  }

  const keyPresent = Boolean(dataGovKey());
  let result = null;
  let lastErr = null;
  if (keyPresent) {
    try {
      result = await fromDataGov(crop, state, district, market);
      // Commodity spellings vary — retry unfiltered + match locally on aliases
      if (!result.markets.length) {
        const retry = await fromDataGov(crop, state, district, market, { skipCommodity: true });
        if (retry.markets.length) result = retry;
      }
    } catch (e) { lastErr = e; }
  }
  if (!result && config.market.backupUrl) {
    try {
      result = await fromBackupUrl(crop, state, district, market);
    } catch (e) { lastErr = e; }
  }
  if (!result) {
    if (!keyPresent && !config.market.backupUrl) {
      const e = new Error('NOT_CONFIGURED');
      e.code = 'NOT_CONFIGURED';
      throw e;
    }
    const e = new Error(lastErr && lastErr.code ? lastErr.code : 'UPSTREAM_ERROR');
    e.code = lastErr && lastErr.code ? lastErr.code : 'UPSTREAM_ERROR';
    e.status = lastErr && lastErr.status ? lastErr.status : undefined;
    throw e;
  }
  const payload = {
    crop: CROP_LABELS[crop] || capitalize(crop),
    // Mandal is a reference layer (data.gov.in is market-level); may be null
    markets: result.markets.map(r => ({
      ...r,
      mandal: locationService.mandalOf(r.market, r.district, r.state)
    })),
    source: result.source
  };
  cache.set(key, payload, config.cacheTtlSeconds.markets);
  return payload;
}

module.exports = { getPrices, isConfigured: () => Boolean(dataGovKey() || config.market.backupUrl) };
