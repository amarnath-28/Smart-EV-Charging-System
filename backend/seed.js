const db = require('./config/db');

const stationsSql = `INSERT INTO stations (name, location, total_slots, available_slots, staff_id) VALUES 
('GreenCharge Hub', 'MG Road, Bangalore', 5, 5, NULL),
('PowerUp Station', 'Anna Nagar, Chennai', 5, 5, NULL),
('EcoVolt Center', 'Banjara Hills, Hyderabad', 5, 5, NULL)`;

db.query(stationsSql, (err, r) => {
  if (err) {
    console.log('Stations error:', err.message);
  } else {
    console.log('Stations inserted:', r.affectedRows);
  }

  const slotsSql = `INSERT INTO slots (station_id, slot_time, status) VALUES 
(1, '08:00 AM - 09:00 AM', 'available'),
(1, '09:00 AM - 10:00 AM', 'available'),
(1, '10:00 AM - 11:00 AM', 'available'),
(1, '11:00 AM - 12:00 PM', 'available'),
(1, '12:00 PM - 01:00 PM', 'available'),
(2, '08:00 AM - 09:00 AM', 'available'),
(2, '09:00 AM - 10:00 AM', 'available'),
(2, '10:00 AM - 11:00 AM', 'available'),
(2, '11:00 AM - 12:00 PM', 'available'),
(2, '12:00 PM - 01:00 PM', 'available'),
(3, '08:00 AM - 09:00 AM', 'available'),
(3, '09:00 AM - 10:00 AM', 'available'),
(3, '10:00 AM - 11:00 AM', 'available'),
(3, '11:00 AM - 12:00 PM', 'available'),
(3, '12:00 PM - 01:00 PM', 'available')`;

  db.query(slotsSql, (err2, r2) => {
    if (err2) {
      console.log('Slots error:', err2.message);
    } else {
      console.log('Slots inserted:', r2.affectedRows);
    }
    db.end();
  });
});
