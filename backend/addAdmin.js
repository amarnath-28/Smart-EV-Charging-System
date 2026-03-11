const db = require('./config/db');
const bcrypt = require('bcrypt');

const email = 'admin@evcharge.com';
const password = 'admin';

const query = 'SELECT * FROM users WHERE email = ?';

db.query(query, [email], async (err, result) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  if (result.length > 0) {
    console.log('Admin user already exists');
    process.exit(0);
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, 'admin', ?)";
    
    db.query(sql, ['Admin User', email, hashedPassword, '0000000000'], (err, result) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log('Admin user created successfully');
      process.exit(0);
    });
  }
});
