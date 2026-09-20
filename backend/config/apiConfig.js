'use strict';

/**
 * Central provider + cache configuration. Everything reads from env —
 * no secrets anywhere else in the codebase.
 */
module.exports = {
  port: Number(process.env.PORT || 5000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',

  weather: {
    provider: process.env.WEATHER_PROVIDER || 'open_meteo',
    apiUrl: (process.env.WEATHER_API_URL || '').trim(),
    apiKey: (process.env.WEATHER_API_KEY || '').trim(),
    timeoutMs: 12000
  },

  market: {
    provider: process.env.MARKET_PROVIDER || 'data_gov',
    dataGovKey: (process.env.DATA_GOV_API_KEY || '').trim(),
    dataGovResource: (process.env.DATA_GOV_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070').trim(),
    backupUrl: (process.env.MARKET_API_URL || '').trim(),
    backupKey: (process.env.MARKET_API_KEY || '').trim(),
    timeoutMs: 15000
  },

  databaseUrl: (process.env.DATABASE_URL || '').trim(),

  cacheTtlSeconds: {
    weather: 600,      // 10 min — weather changes fast
    geocode: 86400,    // 1 day — coordinates rarely change
    markets: 3600,     // 1 h — mandi data updates daily
    crops: 86400,      // 1 day — crop info changes rarely
    locations: 86400
  }
};
