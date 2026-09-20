'use strict';

const { ok, fail } = require('../utils/apiError');
const { isValidSearch } = require('../utils/validate');
const cropService = require('../services/cropService');

function list(req, res) {
  const q = req.query.search;
  if (q !== undefined && isValidSearch(q) === null) {
    const e = fail('INVALID_QUERY', 'Search must be 1–30 letters/spaces.', 400);
    return res.status(e.status).json(e.body);
  }
  const { results } = cropService.search(q ? isValidSearch(q) : '');
  res.json(ok(results, 'AgriMitra crop library'));
}

function detail(req, res) {
  const id = String(req.params.crop || '').toLowerCase();
  const { crop } = cropService.getById(id);
  if (!crop) {
    const e = fail('NOT_FOUND', 'Crop not found.', 404);
    return res.status(e.status).json(e.body);
  }
  res.json(ok(crop, 'AgriMitra crop library'));
}

module.exports = { list, detail };
