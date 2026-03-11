const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

router.get('/', stationController.getStations);
router.get('/:id', stationController.getStationById);


module.exports = router;

