const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./config/db');


// ⭐ JSON middleware MUST come BEFORE routes
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const stationRoutes = require('./routes/stationRoutes');
app.use('/api/stations', stationRoutes);

const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/booking', bookingRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send("EV Charging Server Running 🚗⚡");
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
