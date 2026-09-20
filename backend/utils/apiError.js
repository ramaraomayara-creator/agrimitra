'use strict';

/** Normalized API envelope — every endpoint uses this shape. */
function ok(data, source) {
  return {
    success: true,
    data,
    source: source || null,
    lastUpdated: new Date().toISOString(),
    error: null
  };
}

function fail(code, message, httpStatus) {
  return {
    status: httpStatus || 502,
    body: {
      success: false,
      data: null,
      source: null,
      lastUpdated: null,
      error: { code, message }
    }
  };
}

const notConfigured = (what) =>
  fail('NOT_CONFIGURED', `${what} is not configured.`, 503);

module.exports = { ok, fail, notConfigured };
