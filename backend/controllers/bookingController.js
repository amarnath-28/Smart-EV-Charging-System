const db = require('../config/db');

// Get available slots for a station
exports.getSlots = (req, res) => {
  const stationId = req.params.stationId;

  const sql = "SELECT * FROM slots WHERE station_id = ? AND status = 'available'";
  db.query(sql, [stationId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

const QRCode = require('qrcode');

// Book a slot
exports.bookSlot = (req, res) => {
  const user_id = req.user.id;
  const { slot_id } = req.body;

  const updateSlot = "UPDATE slots SET status='booked' WHERE id=? AND status='available'";

  db.query(updateSlot, [slot_id], async (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Slot already booked or invalid" });
    }

    const getStation = "SELECT station_id FROM slots WHERE id=?";
    
    db.query(getStation, [slot_id], async (err, data) => {
      if (err) return res.status(500).json(err);

      const station_id = data[0].station_id;

      const bookingData = `User:${user_id}, Slot:${slot_id}, Station:${station_id}, Date:${new Date().toISOString()}`;

      // Generate QR as base64 image
      const qrImage = await QRCode.toDataURL(bookingData);

      const insertBooking = `
        INSERT INTO bookings 
        (user_id, slot_id, station_id, booking_date, status, qr_code)
        VALUES (?, ?, ?, CURDATE(), 'approved', ?)`;

      db.query(insertBooking, [user_id, slot_id, station_id, qrImage], (err) => {
        if (err) return res.status(500).json(err);

        res.json({
          message: "Slot booked successfully 🚗⚡",
          qr_code: qrImage
        });
      });
    });
  });
};
// 📄 View My Bookings
exports.getMyBookings = (req, res) => {
  const userId = req.user.id;


  const sql = `
    SELECT 
      b.id AS booking_id,
      s.name AS station_name,
      sl.slot_time,
      b.booking_date,
      b.status,
      b.qr_code
    FROM bookings b
    JOIN stations s ON b.station_id = s.id
    JOIN slots sl ON b.slot_id = sl.id
    WHERE b.user_id = ?
    ORDER BY b.booking_date DESC
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
};
exports.cancelBooking = (req, res) => {
  const bookingId = req.params.bookingId;

  const getBooking = "SELECT slot_id FROM bookings WHERE id=?";

  db.query(getBooking, [bookingId], (err, data) => {
    if (err) return res.status(500).json(err);

    if (data.length === 0) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    const slotId = data[0].slot_id;

    const updateBooking = `
      UPDATE bookings 
      SET status='cancelled' 
      WHERE id=?
    `;

    db.query(updateBooking, [bookingId], (err) => {
      if (err) return res.status(500).json(err);

      const updateSlot = `
        UPDATE slots 
        SET status='available' 
        WHERE id=?
      `;

      db.query(updateSlot, [slotId], (err) => {
        if (err) return res.status(500).json(err);

        res.json({
          message: "Booking cancelled successfully ❌"
        });
      });
    });
  });
};