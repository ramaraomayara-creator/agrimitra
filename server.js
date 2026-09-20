/**
 * AgriMitra backend — serves the site + live market-price API.
 *
 * Setup:
 *   npm install
 *   npm start        -> http://localhost:3000
 *
 * Real market data:
 *   Set MARKET_API_URL in .env to your upstream agri market API
 *   (optionally MARKET_API_KEY). The frontend NEVER talks to the
 *   upstream directly — it calls GET /api/market-prices?crop=rice
 *   and this server proxies + normalizes the response.
 *
 * If MARKET_API_URL is empty, the endpoint returns HTTP 503 with
 * { error: "Market price data is currently unavailable." }
 * and the frontend shows that message instead of fake prices.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const MARKET_API_URL = (process.env.MARKET_API_URL || '').trim();
const MARKET_API_KEY = (process.env.MARKET_API_KEY || '').trim();
const WEATHER_API_URL = (process.env.WEATHER_API_URL || '').trim();
const WEATHER_API_KEY = (process.env.WEATHER_API_KEY || '').trim();

app.use(cors());
app.use(express.json());

/* Serve frontend: prefer ./public if it exists, else project root */
const publicDir = fs.existsSync(path.join(__dirname, 'public'))
  ? path.join(__dirname, 'public')
  : __dirname;
app.use(express.static(publicDir));

/* Health check */
app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    marketConfigured: Boolean(MARKET_API_URL),
    weatherConfigured: Boolean(WEATHER_API_URL),
    time: new Date().toISOString()
  });
});

/**
 * GET /api/market-prices?crop=rice&state=&district=&market=
 * Response (when configured):
 * { crop, market, minPrice, maxPrice, modalPrice, unit, updatedAt }
 */
app.get('/api/market-prices', async (req, res) => {
  const crop = String(req.query.crop || '').toLowerCase();
  const { state = '', district = '', market = '' } = req.query;

  if (!crop) return res.status(400).json({ error: 'Missing required query param: crop' });

  if (!MARKET_API_URL) {
    return res.status(503).json({
      error: 'Market price data is currently unavailable.',
      configured: false,
      hint: 'Set MARKET_API_URL in .env to enable live prices.'
    });
  }

  try {
    const url = new URL(MARKET_API_URL);
    url.searchParams.set('crop', crop);
    if (state) url.searchParams.set('state', state);
    if (district) url.searchParams.set('district', district);
    if (market) url.searchParams.set('market', market);

    const headers = { Accept: 'application/json' };
    if (MARKET_API_KEY) headers.Authorization = 'Bearer ' + MARKET_API_KEY;

    const upstream = await fetch(url.toString(), { headers });
    if (!upstream.ok) {
      return res.status(502).json({ error: 'Market price data is currently unavailable.' });
    }
    const raw = await upstream.json();

    /* Normalize common upstream shapes to our contract */
    const data = {
      crop: raw.crop || crop,
      market: raw.market || raw.mandi || market || '',
      minPrice: Number(raw.minPrice ?? raw.min_price ?? raw.min),
      maxPrice: Number(raw.maxPrice ?? raw.max_price ?? raw.max),
      modalPrice: Number(raw.modalPrice ?? raw.modal_price ?? raw.modal),
      unit: raw.unit || 'Quintal',
      updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString()
    };
    if (![data.minPrice, data.maxPrice, data.modalPrice].every(Number.isFinite)) {
      return res.status(502).json({ error: 'Market price data is currently unavailable.' });
    }
    res.json(data);
  } catch (err) {
    console.error('market-prices proxy error:', err.message);
    res.status(502).json({ error: 'Market price data is currently unavailable.' });
  }
});

/**
 * GET /api/weather?crop=rice&state=&district=
 * Proxied live weather when WEATHER_API_URL is set, else 503.
 * Response: { temp, humidity, rainfall, wind, condition, updatedAt }
 */
app.get('/api/weather', async (req, res) => {
  if (!WEATHER_API_URL) {
    return res.status(503).json({
      error: 'Weather information is currently unavailable.',
      configured: false,
      hint: 'Set WEATHER_API_URL in .env to enable live weather.'
    });
  }
  try {
    const url = new URL(WEATHER_API_URL);
    ['crop', 'state', 'district'].forEach(k => {
      if (req.query[k]) url.searchParams.set(k, req.query[k]);
    });
    const headers = { Accept: 'application/json' };
    if (WEATHER_API_KEY) headers.Authorization = 'Bearer ' + WEATHER_API_KEY;
    const upstream = await fetch(url.toString(), { headers });
    if (!upstream.ok) {
      return res.status(502).json({ error: 'Weather information is currently unavailable.' });
    }
    const raw = await upstream.json();
    res.json({
      temp: raw.temp ?? raw.temperature ?? null,
      humidity: raw.humidity ?? null,
      rainfall: raw.rainfall ?? raw.rain ?? null,
      wind: raw.wind ?? raw.windSpeed ?? null,
      condition: raw.condition ?? null,
      updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString()
    });
  } catch (err) {
    console.error('weather proxy error:', err.message);
    res.status(502).json({ error: 'Weather information is currently unavailable.' });
  }
});

/**
 * GET /api/markets?crop=rice
 * Market directory (names only — no prices). Live prices come from
 * /api/market-prices. Structured for a future real market API.
 */
const MARKET_DIRECTORY = {
  'Andhra Pradesh': { Guntur: ['Guntur', 'Tenali'], Krishna: ['Vijayawada', 'Machilipatnam'] },
  'Maharashtra': { Nashik: ['Nashik', 'Lasalgaon'], Pune: ['Pune', 'Baramati'] },
  'Punjab': { Ludhiana: ['Ludhiana', 'Khanna'], Amritsar: ['Amritsar', 'Jandiala'] },
  'Uttar Pradesh': { Lucknow: ['Lucknow', 'Bakshi Ka Talab'], Agra: ['Agra', 'Fatehabad'] }
};
app.get('/api/markets', (req, res) => {
  const crop = String(req.query.crop || '').toLowerCase();
  const markets = [];
  Object.entries(MARKET_DIRECTORY).forEach(([state, districts]) =>
    Object.entries(districts).forEach(([district, names]) =>
      names.forEach(name => markets.push({ name, district, state, crop: crop || null, price: null, updatedAt: null }))));
  res.json({ crop: crop || null, markets, pricesAvailable: false, updatedAt: new Date().toISOString() });
});

/* SPA-ish fallback: unknown non-API routes → index.html */
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AgriMitra server running on http://localhost:${PORT}`);
  console.log(`Market API: ${MARKET_API_URL ? 'configured' : 'NOT configured (503 mode)'}`);
  console.log(`Weather API: ${WEATHER_API_URL ? 'configured' : 'NOT configured (503 mode)'}`);
});
