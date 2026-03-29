const db = require('./backend/config/db');

const lat = 12.9715;
const lng = 77.5945;

const haversine = `(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))))`;
const selectClause = `SELECT id, name, latitude, ${haversine} AS distance`;
const fromClause = `FROM stations`;
const orderClause = `ORDER BY (latitude IS NULL) ASC, distance ASC`;
const sql = `${selectClause} ${fromClause} ${orderClause}`;

db.query(sql, [lat, lng, lat], (err, res) => {
  if (err) console.error(err);
  else console.log(res);
  db.end();
});
