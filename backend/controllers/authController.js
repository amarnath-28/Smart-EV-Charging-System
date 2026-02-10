const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, 'user', ?)";
    
    db.query(sql, [name, email, hashedPassword, phone], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "User Registered Successfully" });
    });

  } catch (error) {
    res.status(500).json(error);
  }
};
exports.login = (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) return res.status(404).json({ message: "User not found" });

    const user = result[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong Password" });

    const token = jwt.sign({ id: user.id, role: user.role }, "secretkey", { expiresIn: "1d" });

    res.json({ message: "Login Successful", token });
  });
};
