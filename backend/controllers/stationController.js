const db = require('../config/db');

exports.getStations = (req, res) => {
  const { search, lat, lng } = req.query;

  let selectClause = `
    SELECT 
      s.id, s.name, s.location, s.latitude, s.longitude, s.staff_id,
      (SELECT COUNT(*) FROM slots WHERE station_id = s.id) AS total_slots,
      (SELECT COUNT(*) FROM slots WHERE station_id = s.id AND status = 'available') AS available_slots
  `;
  let fromClause = "FROM stations s";
  let whereClause = "";
  let orderClause = "";
  let params = [];

  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    const haversine = `(6371 * acos(cos(radians(?)) * cos(radians(s.latitude)) * cos(radians(s.longitude) - radians(?)) + sin(radians(?)) * sin(radians(s.latitude))))`;
    selectClause += `, ${haversine} AS distance`;
    params.push(lat, lng, lat);
    orderClause = "ORDER BY (s.latitude IS NULL) ASC, distance ASC";
  }

  if (search) {
    whereClause = "WHERE s.location LIKE ? OR s.name LIKE ?";
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

  const sql = `
    SELECT 
      s.id, s.name, s.location, s.latitude, s.longitude, s.staff_id,
      (SELECT COUNT(*) FROM slots WHERE station_id = s.id) AS total_slots,
      (SELECT COUNT(*) FROM slots WHERE station_id = s.id AND status = 'available') AS available_slots
    FROM stations s 
    WHERE s.id = ?
  `;
  db.query(sql, [stationId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) return res.status(404).json({ message: "Station not found" });

    res.json(result[0]);
  });
};
