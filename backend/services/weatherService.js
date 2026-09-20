'use strict';

/**
 * WeatherProvider — Open-Meteo (free, no key, non-commercial dev use OK).
 * All external calls stay on the backend; frontend never sees provider URLs.
 * Swap this file's internals to change provider without touching routes.
 */
const cache = require('../utils/cache');
const config = require('../config/apiConfig');

const WMO = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow',
  75: 'Heavy snow', 80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
  95: 'Thunderstorm', 96: 'Storm with hail', 99: 'Severe storm'
};

async function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), config.weather.timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function geocodeCity(city) {
  const key = 'geo:' + city.toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;
  const data = await fetchJson(
    'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(city) + '&count=1&language=en&format=json'
  );
  if (!data.results || !data.results.length) return null;
  const r = data.results[0];
  const loc = {
    name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    lat: r.latitude, lon: r.longitude
  };
  cache.set(key, loc, config.cacheTtlSeconds.geocode);
  return loc;
}

async function getByCoords(lat, lon, label) {
  const key = `wx:${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit) return { ...hit, _cached: true };

  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
    '&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m' +
    '&hourly=precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset' +
    '&timezone=auto&forecast_days=4';
  const d = await fetchJson(url);
  const cur = d.current || {};
  const hourlyProb = (d.hourly && d.hourly.precipitation_probability) || [];
  const day = (d.daily || {});

  const result = {
    location: { name: label || `${lat}, ${lon}`, lat, lon, timezone: d.timezone || null },
    current: {
      tempC: cur.temperature_2m ?? null,
      humidity: cur.relative_humidity_2m ?? null,
      rainfallMm: cur.precipitation ?? null,
      precipProb: hourlyProb.length ? hourlyProb[hourlyProb.length - 1] : null,
      windKmh: cur.wind_speed_10m ?? null,
      condition: WMO[cur.weather_code] || '—',
      sunrise: (day.sunrise && day.sunrise[0]) || null,
      sunset: (day.sunset && day.sunset[0]) || null
    },
    forecast: (day.time || []).map((date, i) => ({
      date,
      maxC: day.temperature_2m_max ? day.temperature_2m_max[i] : null,
      minC: day.temperature_2m_min ? day.temperature_2m_min[i] : null,
      condition: WMO[day.weather_code ? day.weather_code[i] : -1] || '—',
      precipProb: day.precipitation_probability_max ? day.precipitation_probability_max[i] : null
    }))
  };
  cache.set(key, result, config.cacheTtlSeconds.weather);
  return result;
}

module.exports = { geocodeCity, getByCoords, providerName: 'Open-Meteo' };
