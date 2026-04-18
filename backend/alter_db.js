const db = require('./config/db');

db.query("ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid'", (err, result) => {
  if (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.log('Error adding column:', err.message);
    }
  } else {
    console.log('Added payment_status column!');
  }
  process.exit();
});
