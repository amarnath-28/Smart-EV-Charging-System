const express = require('express');
const router = express.Router();
const { verifyStaff } = require('../middleware/authMiddleware');
const staffController = require('../controllers/staffController');

// All staff routes must pass verifyStaff middleware
router.use(verifyStaff);

// Station Routes
router.get('/station', staffController.getStation);
router.put('/station', staffController.updateStation);

// Slot Routes
router.get('/slots', staffController.getSlots);
router.post('/slots', staffController.addSlot);
router.put('/slots/:id', staffController.updateSlot);
router.delete('/slots/:id', staffController.deleteSlot);

// Booking Routes
router.get('/bookings', staffController.getBookings);
router.put('/bookings/:id/status', staffController.updateBookingStatus); // Put :id first to match controller logic more securely or use req.body

module.exports = router;
