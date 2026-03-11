const db = require('../config/db');

exports.getStations = (req, res) => {
  const sql = "SELECT * FROM stations";

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};
exports.getStationById = (req, res) => {
  const stationId = req.params.id;

  const sql = "SELECT * FROM stations WHERE id = ?";
  db.query(sql, [stationId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) return res.status(404).json({ message: "Station not found" });

    res.json(result[0]);
  });
};
