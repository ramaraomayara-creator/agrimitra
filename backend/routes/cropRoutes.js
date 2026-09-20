'use strict';

const express = require('express');
const cropController = require('../controllers/cropController');

const router = express.Router();

router.get('/crops', cropController.list);
router.get('/crops/:crop', cropController.detail);

module.exports = router;
