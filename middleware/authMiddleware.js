const jwt = require("jsonwebtoken");
const pool = require("@/db");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ error: "Authorization header tidak ditemukan" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token tidak tersedia" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const userRole = decoded.role?.toLowerCase();

    req.user = decoded;

    let userColumn;
    if (userRole === "admin" || userRole === "superadmin") {
      userColumn = `"ID_Admin"`;
    } else if (userRole === "pengunjung") {
      userColumn = `"ID_Pengunjung"`;
    } else {
      return res.status(403).json({ message: "Role tidak dikenal" });
    }

    const loginResult = await pool.query(
      `SELECT "Created_At" FROM "Activity_Log"
       WHERE ${userColumn} = $1 AND "Action" = 'LOGIN'
       ORDER BY "ID_Activity" DESC LIMIT 1`,
      [userId]
    );

    if (loginResult.rowCount === 0) {
      return res.status(401).json({ message: "Pengguna belum pernah login." });
    }

    const lastLoginTime = loginResult.rows[0].Created_At;

    const logoutResult = await pool.query(
      `SELECT 1 FROM "Activity_Log"
       WHERE ${userColumn} = $1 AND "Action" = 'LOGOUT'
       AND "Created_At" > $2`,
      [userId, lastLoginTime]
    );

    if (logoutResult.rowCount > 0) {
      return res
        .status(401)
        .json({ message: "Token sudah tidak aktif (sudah logout)" });
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
