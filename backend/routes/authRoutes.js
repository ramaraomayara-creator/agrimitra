'use strict';

const express = require('express');
const crypto = require('crypto');
const { ok, fail } = require('../utils/apiError');

const router = express.Router();

/**
 * Development-only demo OTP endpoints. The shipped frontend keeps its own
 * client-side demo flow; these routes exist so a real OTP integration
 * (SMS gateway) has a defined place to land later.
 */
const pending = new Map(); // id -> { code, expiresAt }

function makeCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

router.post('/auth/request-otp', (req, res) => {
  const id = String((req.body && (req.body.phone || req.body.email)) || '').trim().slice(0, 80);
  if (!id) {
    const e = fail('INVALID_IDENTITY', 'Provide phone or email.', 400);
    return res.status(e.status).json(e.body);
  }
  const code = makeCode();
  pending.set(id, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  // Demo mode returns the code so development can proceed without an SMS provider.
  res.json(ok({ id, demoCode: code, expiresInSeconds: 300 }, 'AgriMitra auth (demo)'));
});

router.post('/auth/verify-otp', (req, res) => {
  const id = String((req.body && (req.body.phone || req.body.email)) || '').trim().slice(0, 80);
  const code = String((req.body && req.body.code) || '').trim();
  const entry = pending.get(id);
  if (!entry || Date.now() > entry.expiresAt || entry.code !== code) {
    const e = fail('INVALID_OTP', 'Incorrect or expired OTP.', 401);
    return res.status(e.status).json(e.body);
  }
  pending.delete(id);
  res.json(ok(
    { id, token: crypto.randomBytes(16).toString('hex'), verifiedAt: new Date().toISOString() },
    'AgriMitra auth (demo)'
  ));
});

module.exports = router;
