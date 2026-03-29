const db = require('../config/db');

exports.getStations = (req, res) => {
  const { search, lat, lng } = req.query;

  let selectClause = "SELECT *";
  let fromClause = "FROM stations";
  let whereClause = "";
  let orderClause = "";
  let params = [];

  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    const haversine = `(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))))`;
    selectClause += `, ${haversine} AS distance`;
    params.push(lat, lng, lat);
    orderClause = "ORDER BY (latitude IS NULL) ASC, distance ASC";
  }

  if (search) {
    whereClause = "WHERE location LIKE ? OR name LIKE ?";
    params.push(`%${search}%`, `%${search}%`);
  }

  const sql = `${selectClause} ${fromClause} ${whereClause} ${orderClause}`.trim();

  db.query(sql, params, (err, result) => {
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
