const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all users
exports.getAllUsers = (req, res) => {
  const sql = "SELECT id, name, email, role, phone FROM users WHERE role = 'user' ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

// Get all staff
exports.getStaff = (req, res) => {
  const sql = "SELECT id, name, email, role, phone FROM users WHERE role = 'staff' ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

// Add new staff
exports.addStaff = async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const sql = "INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, 'staff')";
    db.query(sql, [name, email, hashedPassword, phone || null], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: "Email already exists" });
        }
        return res.status(500).json(err);
      }
      res.status(201).json({ message: "Staff added successfully", staffId: result.insertId });
    });
  } catch (error) {
    res.status(500).json({ message: "Error encrypting password" });
  }
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

// Delete user
exports.deleteUser = (req, res) => {
  const userId = req.params.userId;

  // First delete associated bookings
  const deleteBookings = "DELETE FROM bookings WHERE user_id = ?";
  db.query(deleteBookings, [userId], (err) => {
    if (err) console.error("Error deleting user bookings:", err);
    
    // Then delete the user
    const deleteUserSql = "DELETE FROM users WHERE id = ?";
    db.query(deleteUserSql, [userId], (err2, result) => {
      if (err2) return res.status(500).json(err2);
      if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
      
      res.json({ message: "User deleted successfully" });
    });
  });
};

// Add station
exports.addStation = (req, res) => {
  const { name, location, latitude, longitude, total_slots } = req.body;
  if (!name || !location || !total_slots) {
    return res.status(400).json({ message: "Name, location, and total_slots are required" });
  }

  const sql = `INSERT INTO stations (name, location, latitude, longitude, total_slots, available_slots, staff_id) VALUES (?, ?, ?, ?, ?, ?, NULL)`;
  
  db.query(sql, [name, location, latitude || null, longitude || null, total_slots, total_slots], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Station added successfully", stationId: result.insertId });
  });
};
