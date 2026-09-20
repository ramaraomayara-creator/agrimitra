'use strict';

const { ok, fail } = require('../utils/apiError');
const { isValidLat, isValidLon, isValidName } = require('../utils/validate');
const weatherService = require('../services/weatherService');

async function byCoords(req, res) {
  const lat = isValidLat(req.query.lat);
  const lon = isValidLon(req.query.lon);
  if (lat === null || lon === null) {
    const e = fail('INVALID_LOCATION', 'Valid query params required: lat (-90…90), lon (-180…180).', 400);
    return res.status(e.status).json(e.body);
  }
  try {
    const data = await weatherService.getByCoords(lat, lon);
    res.json(ok(data, weatherService.providerName));
  } catch (err) {
    const e = fail('UPSTREAM_ERROR', 'Live data temporarily unavailable. Please try again.', 502);
    res.status(e.status).json(e.body);
  }
}

async function byCity(req, res) {
  const city = isValidName(req.query.city);
  if (!city) {
    const e = fail('INVALID_LOCATION', 'Valid query param required: city.', 400);
    return res.status(e.status).json(e.body);
  }
  try {
    const loc = await weatherService.geocodeCity(city);
    if (!loc) {
      const e = fail('NOT_FOUND', 'City not found.', 404);
      return res.status(e.status).json(e.body);
    }
    const data = await weatherService.getByCoords(loc.lat, loc.lon, loc.name);
    res.json(ok(data, weatherService.providerName));
  } catch (err) {
    const e = fail('UPSTREAM_ERROR', 'Live data temporarily unavailable. Please try again.', 502);
    res.status(e.status).json(e.body);
  }
}

module.exports = { byCoords, byCity };
