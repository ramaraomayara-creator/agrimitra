'use strict';

/**
 * AgriMitra live-data backend.
 *   npm install
 *   npm start        -> http://localhost:5000  (serves ../ frontend + /api/*)
 *   npm run dev      -> nodemon
 *
 * Architecture: Frontend → AgriMitra Backend → External API → normalize → Frontend.
 * The frontend NEVER calls external provider APIs directly.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config/apiConfig');
const db = require('./config/db');
const cache = require('./utils/cache');
const marketService = require('./services/marketService');

const cropRoutes = require('./routes/cropRoutes');
const marketRoutes = require('./routes/marketRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const locationRoutes = require('./routes/locationRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.frontendOrigin === '*' ? '*' : config.frontendOrigin.split(',') }));
app.use(express.json({ limit: '64kb' }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);

/* API routes */
app.use('/api', cropRoutes);
app.use('/api', marketRoutes);
app.use('/api', weatherRoutes);
app.use('/api', locationRoutes);
app.use('/api', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    server: 'AgriMitra',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/providers/status', (req, res) => {
  res.json({
    success: true,
    data: {
      weather: config.weather.provider === 'open_meteo' ? 'available' : 'not_configured',
      market: {
        provider: 'data.gov.in',
        configured: marketService.isConfigured(),
        status: marketService.isConfigured() ? 'available' : 'not_configured'
      },
      database: db.status,
      cache: 'available'
    },
    source: 'AgriMitra backend',
    lastUpdated: new Date().toISOString(),
    error: null
  });
});

/* Serve the existing frontend from the project root */
const frontendDir = path.join(__dirname, '..');
app.use(express.static(frontendDir));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

/* Clean JSON 404 for unknown API paths + crash-safe error handler */
app.use('/api/', (req, res) => {
  res.status(404).json({
    success: false, data: null, source: null, lastUpdated: null,
    error: { code: 'NOT_FOUND', message: 'Unknown API endpoint.' }
  });
});
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('backend error:', err && err.message);
  res.status(500).json({
    success: false, data: null, source: null, lastUpdated: null,
    error: { code: 'SERVER_ERROR', message: 'Live data temporarily unavailable. Please try again.' }
  });
});

app.listen(config.port, () => {
  console.log(`AgriMitra backend running on http://localhost:${config.port}`);
  console.log(`Weather provider: ${config.weather.provider} (available, keyless)`);
  if (!marketService.isConfigured()) {
    console.warn('WARNING: DATA_GOV_API_KEY is not configured.');
  } else {
    console.log('Market provider: data.gov.in (configured)');
  }
  console.log(`Cache entries: ${cache.stats().entries} · DB: ${db.status}`);
});
