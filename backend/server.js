const express = require('express');
const app = express();
const db = require('./config/db');

// ⭐ JSON middleware MUST come BEFORE routes
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send("EV Charging Server Running 🚗⚡");
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
