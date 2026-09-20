'use strict';

const { ok, fail } = require('../utils/apiError');
const { isValidName } = require('../utils/validate');
const locationService = require('../services/locationService');

function directory(req, res) {
  const { state, district } = req.query;
  if (state !== undefined && !isValidName(state)) {
    const e = fail('INVALID_LOCATION', 'Invalid state value.', 400);
    return res.status(e.status).json(e.body);
  }
  if (district !== undefined && !isValidName(district)) {
    const e = fail('INVALID_LOCATION', 'Invalid district value.', 400);
    return res.status(e.status).json(e.body);
  }
  if (state && district) {
    return res.json(ok(
      {
        state,
        district,
        mandals: locationService.mandals(state, district),
        markets: locationService.markets(state, district),
        level: 'mandal-reference',
        note: 'Mandal list is administrative reference; live price data is available at State/District/Market level.'
      },
      'AgriMitra market directory'
    ));
  }
  if (state) {
    return res.json(ok(
      { state, districts: locationService.districts(state) },
      'AgriMitra market directory'
    ));
  }
  res.json(ok({ states: locationService.states() }, 'AgriMitra market directory'));
}

module.exports = { directory };
