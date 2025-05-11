const pool = require("@/db");

async function isStillLoggedInSession(role, userId) {
  try {
    let userColumn;
    const normalizedRole = role.toLowerCase();

    if (normalizedRole === "admin" || normalizedRole === "superadmin") {
      userColumn = `"ID_Admin"`;
    } else if (normalizedRole === "pengunjung") {
      userColumn = `"ID_Pengunjung"`;
    } else {
      throw new Error("Role tidak dikenali");
    }

    const loginResult = await pool.query(
      `SELECT "Created_At" FROM "Activity_Log"
       WHERE ${userColumn} = $1 AND "Action" = 'LOGIN'
       ORDER BY "ID_Activity" DESC LIMIT 1`,
      [userId]
    );

    if (loginResult.rowCount === 0) return false;

    const lastLoginTime = loginResult.rows[0].Created_At;

    const logoutResult = await pool.query(
      `SELECT 1 FROM "Activity_Log"
       WHERE ${userColumn} = $1 AND "Action" = 'LOGOUT'
       AND "Created_At" > $2`,
      [userId, lastLoginTime]
    );

    return logoutResult.rowCount === 0;
  } catch (err) {
    console.error("isStillLoggedInSession error:", err.message);
    return false;
  }
}

module.exports = { isStillLoggedInSession };
