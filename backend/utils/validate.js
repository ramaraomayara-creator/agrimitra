'use strict';

/**
 * Input validation — blocks arbitrary values / external URLs from users.
 * Providers are allow-listed server-side only; the frontend can never
 * supply an external URL.
 */
const KNOWN_CROPS = [
  'rice', 'wheat', 'maize', 'cotton', 'groundnut',
  'chilli', 'tomato', 'sugarcane', 'banana', 'mango'
];

// Extra tradable commodities allowed for market-price queries only
// (no crop-guide page exists for these).
const EXTRA_COMMODITIES = ['guar'];

function isValidCommodity(v) {
  const c = cleanText(v, 30).toLowerCase();
  return (KNOWN_CROPS.includes(c) || EXTRA_COMMODITIES.includes(c)) ? c : null;
}

function cleanText(v, max = 60) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function isValidCrop(v) {
  const c = cleanText(v, 30).toLowerCase();
  return KNOWN_CROPS.includes(c) ? c : null;
}

function isValidName(v) {
  // states / districts / markets / cities: letters, spaces, dots, hyphens
  const c = cleanText(v, 60);
  return /^[A-Za-z][A-Za-z .\-()]{1,59}$/.test(c) ? c : null;
}

function isValidLat(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= -90 && n <= 90 ? n : null;
}

function isValidLon(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= -180 && n <= 180 ? n : null;
}

function isValidSearch(v) {
  const c = cleanText(v, 30);
  return /^[A-Za-z ]{1,30}$/.test(c) ? c.toLowerCase() : null;
}

module.exports = { KNOWN_CROPS, EXTRA_COMMODITIES, cleanText, isValidCrop, isValidCommodity, isValidName, isValidLat, isValidLon, isValidSearch };
