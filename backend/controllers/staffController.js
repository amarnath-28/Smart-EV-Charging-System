const db = require('../config/db');

exports.getStation = async (req, res) => {
    try {
        const sql = `
            SELECT 
                s.id, s.name, s.location, s.latitude, s.longitude, s.staff_id,
                (SELECT COUNT(*) FROM slots WHERE station_id = s.id) AS total_slots,
                (SELECT COUNT(*) FROM slots WHERE station_id = s.id AND status = 'available') AS available_slots
            FROM stations s
        `;
        db.query(sql, (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.updateStation = async (req, res) => {
    try {
        const { id, name, location, total_slots } = req.body;
        if (!id) return res.status(400).json({ message: "Station ID required." });

        const sql = "UPDATE stations SET name=?, location=?, total_slots=? WHERE id=?";
        db.query(sql, [name, location, total_slots, id], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Station updated successfully" });
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getSlots = async (req, res) => {
    try {
        const sql = `
            SELECT sl.*, st.name as station_name 
            FROM slots sl
            JOIN stations st ON sl.station_id = st.id
            ORDER BY st.name ASC, sl.slot_time
        `;
        db.query(sql, (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.addSlot = async (req, res) => {
    try {
        const { station_id, slot_time, status } = req.body;
        if (!station_id) return res.status(400).json({ message: "Station ID required." });

        db.query("INSERT INTO slots (station_id, slot_time, status) VALUES (?, ?, ?)", [station_id, slot_time, status || 'available'], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Slot added successfully", id: result.insertId });
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.updateSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const { slot_time, status } = req.body;
        
        db.query("UPDATE slots SET slot_time=?, status=? WHERE id=?", [slot_time, status, id], (err, result) => {
            if (err) return res.status(500).json(err);
            if (result.affectedRows === 0) return res.status(404).json({ message: "Slot not found." });
            res.json({ message: "Slot updated successfully" });
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.deleteSlot = async (req, res) => {
    try {
        const { id } = req.params;

        db.query("DELETE FROM slots WHERE id=?", [id], (err, result) => {
            if (err) return res.status(500).json(err);
            if (result.affectedRows === 0) return res.status(404).json({ message: "Slot not found." });
            res.json({ message: "Slot deleted successfully" });
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getBookings = async (req, res) => {
    try {
        const sql = `
            SELECT b.id, b.booking_date, b.status, u.name as user_name, u.email as user_email, s.slot_time, st.name as station_name
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN slots s ON b.slot_id = s.id
            JOIN stations st ON b.station_id = st.id
            ORDER BY b.booking_date DESC
        `;

        db.query(sql, (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.updateBookingStatus = async (req, res) => {
     try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        db.query("UPDATE bookings SET status=? WHERE id=?", [status, id], (err, result) => {
            if (err) return res.status(500).json(err);
            if (result.affectedRows === 0) return res.status(404).json({ message: "Booking not found." });
            res.json({ message: "Booking status updated successfully" });
        });
    } catch (error) {
        res.status(500).json(error);
    }
};
