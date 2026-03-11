const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// All admin routes must pass verifyAdmin middleware
router.use(verifyAdmin);

router.get('/users', adminController.getAllUsers);
router.get('/bookings', adminController.getAllBookings);
router.put('/bookings/:bookingId', adminController.updateBookingStatus);
router.get('/analytics', adminController.getAnalytics);
router.delete('/stations/:stationId', adminController.deleteStation);

module.exports = router;
