'use strict';

const express = require('express');
const weatherController = require('../controllers/weatherController');

const router = express.Router();

router.get('/weather', weatherController.byCoords);
router.get('/weather/location', weatherController.byCity);

module.exports = router;
