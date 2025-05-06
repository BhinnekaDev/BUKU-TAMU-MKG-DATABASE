const jwt = require("jsonwebtoken");
const pool = require("../db");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token tidak tersedia di header" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const result = await pool.query(
      `SELECT * FROM "Loginlog" WHERE "Token_Akses" = $1 AND "Timestamp_Logout" IS NULL`,
      [token]
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Token sudah logout / tidak aktif" });
    }

    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res.status(403).json({ message: "Token rusak atau tidak valid" });
  }
}

function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user.role.toLowerCase();
    const normalizedRoles = allowedRoles.map((role) => role.toLowerCase());
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Akses ditolak" });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRole };
