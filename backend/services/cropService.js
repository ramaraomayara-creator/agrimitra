'use strict';

/** Crop library backed by local JSON (long-lived data → long cache). */
const path = require('path');
const fs = require('fs');
const cache = require('../utils/cache');
const config = require('../config/apiConfig');

const DATA_FILE = path.join(__dirname, '..', 'data', 'cropData.json');
let crops = [];
try {
  crops = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')).crops || [];
} catch (e) {
  crops = [];
}

function summary(c) {
  return { id: c.id, name: c.name, sub: c.sub, cat: c.cat, img: c.img };
}

function search(query) {
  const key = 'crops:search:' + (query || 'all');
  const hit = cache.get(key);
  if (hit) return { results: hit, cached: true };
  const q = (query || '').toLowerCase();
  const results = crops
    .filter(c => !q || c.name.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q))
    .map(summary);
  cache.set(key, results, config.cacheTtlSeconds.crops);
  return { results, cached: false };
}

function getById(id) {
  const key = 'crops:id:' + id;
  const hit = cache.get(key);
  if (hit) return { crop: hit, cached: true };
  const crop = crops.find(c => c.id === id) || null;
  if (crop) cache.set(key, crop, config.cacheTtlSeconds.crops);
  return { crop, cached: false };
}

module.exports = { search, getById, count: () => crops.length };
