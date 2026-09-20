'use strict';

const { ok, fail } = require('../utils/apiError');
const { isValidCrop, isValidCommodity, isValidName } = require('../utils/validate');
const marketService = require('../services/marketService');
const locationService = require('../services/locationService');

async function prices(req, res) {
  const SOURCE = 'Government of India - Data.gov.in';
  const crop = isValidCommodity(req.query.crop);
  if (!crop) {
    return res.status(400).json({
      success: false, source: SOURCE,
      message: 'Valid query param required: crop (rice, wheat, maize, cotton, groundnut, chilli, tomato, sugarcane, banana, mango, guar).'
    });
  }
  const state = req.query.state ? isValidName(req.query.state) : '';
  const district = req.query.district ? isValidName(req.query.district) : '';
  const market = req.query.market ? isValidName(req.query.market) : '';
  if ((req.query.state && !state) || (req.query.district && !district) || (req.query.market && !market)) {
    return res.status(400).json({
      success: false, source: SOURCE,
      message: 'State/district/market contain invalid characters.'
    });
  }
  if (!marketService.isConfigured()) {
    return res.status(503).json({
      success: false, source: SOURCE,
      message: 'Market API is not configured. Set DATA_GOV_API_KEY in backend/.env.'
    });
  }
  try {
    const data = await marketService.getPrices(crop, state, district, market, {
      force: req.query.refresh === '1'
    });
    if (!data.markets.length) {
      return res.status(200).json({
        success: false, source: data.source || SOURCE,
        message: 'No market-price data available for this crop/location.'
      });
    }
    return res.status(200).json({
      success: true,
      source: data.source || SOURCE,
      lastUpdated: new Date().toISOString(),
      crop: data.crop,
      markets: data.markets
    });
  } catch (err) {
    const code = err && err.code ? err.code : 'UPSTREAM_ERROR';
    if (code === 'AUTH_FAILED') {
      return res.status(502).json({
        success: false, source: SOURCE,
        message: 'Market data service authentication failed. Please check the backend API configuration.'
      });
    }
    if (code === 'RATE_LIMITED') {
      return res.status(502).json({
        success: false, source: SOURCE,
        message: 'Market data service is temporarily busy. Please try again later.'
      });
    }
    if (code === 'TIMEOUT') {
      return res.status(504).json({
        success: false, source: SOURCE,
        message: 'Market data service is temporarily unavailable.'
      });
    }
    return res.status(502).json({
      success: false, source: SOURCE,
      message: 'Market data service is temporarily unavailable.'
    });
  }
}

function markets(req, res) {
  const crop = req.query.crop ? isValidCommodity(req.query.crop) : '';
  if (req.query.crop && !crop) {
    const e = fail('INVALID_CROP', 'Valid query param: crop (rice, wheat, …).', 400);
    return res.status(e.status).json(e.body);
  }
  const state = req.query.state ? isValidName(req.query.state) : '';
  const district = req.query.district ? isValidName(req.query.district) : '';
  const list = locationService.markets(state || undefined, district || undefined)
    .map(m => ({ ...m, crop: crop || null, price: null, updatedAt: null }));
  res.json(ok(
    { crop: crop || null, markets: list, pricesAvailable: false },
    'AgriMitra market directory'
  ));
}

module.exports = { prices, markets };
