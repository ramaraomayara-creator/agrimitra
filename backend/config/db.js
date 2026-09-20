'use strict';

/**
 * Database handle — PostgreSQL-ready, optional.
 * The backend runs fully WITHOUT a database (crop/location data is local,
 * weather+market data is live from providers). Set DATABASE_URL to enable
 * persistence later; no code changes needed elsewhere.
 *
 * Supported later: postgres via `pg` (add dependency when needed).
 */
const config = require('./apiConfig');

let status = 'not_configured';

if (config.databaseUrl) {
  status = 'configured';
}

module.exports = {
  status,
  connectionString: config.databaseUrl || null
};
