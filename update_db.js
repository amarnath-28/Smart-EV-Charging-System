const db = require('./backend/config/db');

async function updateDb() {
  try {
    console.log("Adding columns latitude and longitude...");
    await new Promise((resolve, reject) => {
      db.query("ALTER TABLE stations ADD COLUMN latitude DECIMAL(10, 8), ADD COLUMN longitude DECIMAL(11, 8)", (err, res) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') return reject(err);
        resolve(res);
      });
    });

    console.log("Updating stations with coordinates...");
    
    // GreenCharge Hub: 'MG Road, Bangalore'
    await new Promise((resolve, reject) => {
      db.query("UPDATE stations SET latitude = 12.9715987, longitude = 77.5945627 WHERE name = 'GreenCharge Hub'", (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    // PowerUp Station: 'Anna Nagar, Chennai'
    await new Promise((resolve, reject) => {
      db.query("UPDATE stations SET latitude = 13.0850022, longitude = 80.2100466 WHERE name = 'PowerUp Station'", (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    // EcoVolt Center: 'Banjara Hills, Hyderabad'
    await new Promise((resolve, reject) => {
      db.query("UPDATE stations SET latitude = 17.4156066, longitude = 78.4396349 WHERE name = 'EcoVolt Center'", (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    console.log("Database update successful!");
  } catch (error) {
    console.error("Error updating DB:", error);
  } finally {
    db.end();
  }
}

updateDb();
