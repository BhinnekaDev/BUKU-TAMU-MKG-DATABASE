const pool = require("@/db");
const UAParser = require("ua-parser-js");

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress?.replace("::ffff:", "") ||
    "UNKNOWN"
  );
}

async function logActivity({ id, role, action, description, req }) {
  const parser = new UAParser();
  parser.setUA(req.headers["user-agent"] || "unknown");
  const ua = parser.getResult();
  const userAgentInfo = `${ua.browser.name} ${ua.browser.version} / ${ua.os.name} ${ua.os.version}`;

  const columnName =
    role === "admin" || role === "superadmin" ? "ID_Admin" : "ID_Pengunjung";

  await pool.query(
    `INSERT INTO "Activity_Log" ("${columnName}", "IP_Address", "Description", "Action", "User_Agent")
     VALUES ($1, $2, $3, $4, $5)`,
    [id, getClientIp(req), description, action, userAgentInfo]
  );
}

module.exports = logActivity;
