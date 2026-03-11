const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/slots/:stationId', bookingController.getSlots);
router.post('/book', verifyToken, bookingController.bookSlot);
router.get('/my-bookings', verifyToken, bookingController.getMyBookings);
router.put('/cancel/:bookingId', verifyToken, bookingController.cancelBooking);


module.exports = router;
