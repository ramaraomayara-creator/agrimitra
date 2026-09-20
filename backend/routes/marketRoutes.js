'use strict';

const express = require('express');
const marketController = require('../controllers/marketController');

const router = express.Router();

router.get('/market-prices', marketController.prices);
router.get('/markets', marketController.markets);

module.exports = router;
