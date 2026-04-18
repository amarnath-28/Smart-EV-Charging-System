const db = require('./config/db');
const bcrypt = require('bcrypt');

const email = 'staff@evcharge.com';
const password = 'staff';

async function setupStaff() {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 1. Check if user exists
        let userId;
        const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length > 0) {
            console.log('Staff user already exists');
            userId = users[0].id;
        } else {
            // Create user
            const [result] = await db.promise().query(
                "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, 'staff', ?)",
                ['Station Staff', email, hashedPassword, '1234567890']
            );
            userId = result.insertId;
            console.log('Staff user created successfully with ID:', userId);
        }

        // 2. Check if a station exists for this staff
        const [stations] = await db.promise().query('SELECT * FROM stations WHERE staff_id = ?', [userId]);

        if (stations.length > 0) {
            console.log('Station already assigned to staff.');
        } else {
            // Assign a station
            await db.promise().query(
                "INSERT INTO stations (name, location, latitude, longitude, total_slots, available_slots, staff_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ['Downtown Fast Charger', '123 Main St, City Center', 12.9715, 77.5945, 10, 10, userId]
            );
            console.log('New station created and assigned to staff.');
        }

        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

setupStaff();
