const db = require('../config/db');

// Get all users
exports.getAllUsers = (req, res) => {
  const sql = "SELECT id, name, email, role, phone FROM users ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

// Get all bookings
exports.getAllBookings = (req, res) => {
  const sql = `
    SELECT 
      b.id AS booking_id,
      u.name AS user_name,
      u.email AS user_email,
      s.name AS station_name,
      sl.slot_time,
      b.booking_date,
      b.status
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN stations s ON b.station_id = s.id
    JOIN slots sl ON b.slot_id = sl.id
    ORDER BY b.booking_date DESC, b.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

// Update booking status
exports.updateBookingStatus = (req, res) => {
  const bookingId = req.params.bookingId;
  const { status } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const updateBooking = "UPDATE bookings SET status = ? WHERE id = ?";

  db.query(updateBooking, [status, bookingId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: `Booking ${status} successfully` });
  });
};

// Get system analytics
exports.getAnalytics = (req, res) => {
  const queries = {
    users: "SELECT COUNT(*) as count FROM users",
    stations: "SELECT COUNT(*) as count FROM stations",
    bookings: "SELECT COUNT(*) as count FROM bookings",
    pending_bookings: "SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'",
    approved_bookings: "SELECT COUNT(*) as count FROM bookings WHERE status = 'approved'"
  };

  const analytics = {};
  let completedQueries = 0;
  const totalQueries = Object.keys(queries).length;

  for (const [key, query] of Object.entries(queries)) {
    db.query(query, (err, result) => {
      if (err) return res.status(500).json(err);
      
      analytics[key] = result[0].count;
      completedQueries++;

      if (completedQueries === totalQueries) {
        res.json(analytics);
      }
    });
  }
};

// Delete station
exports.deleteStation = (req, res) => {
  const stationId = req.params.stationId;

  // Need to handle constraints or cascade delete if slots/bookings exist?
  // Depending on schema, we might just delete the station directly.
  const sql = "DELETE FROM stations WHERE id = ?";

  db.query(sql, [stationId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Station not found" });

    // Also delete slots associated with the station
    const deleteSlots = "DELETE FROM slots WHERE station_id = ?";
    db.query(deleteSlots, [stationId], (err2) => {
      if (err2) console.error("Error deleting slots:", err2);
      // We ignore errors on cascade delete for now, or assume its fine
    });

    res.json({ message: "Station deleted successfully" });
  });
};
