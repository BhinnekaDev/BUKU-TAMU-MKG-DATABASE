require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const adminRoutes = require("./routes/adminRoutes");
const pengunjungRoutes = require("./routes/pengunjungRoutes");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/admin", adminRoutes);
app.use("/pengunjung", pengunjungRoutes);

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress?.replace("::ffff:", "") ||
    "UNKNOWN"
  );
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token tidak tersedia" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token tidak valid" });
    req.user = user;
    next();
  });
};

// =================== REGISTER PENGUNJUNG ===================
app.post("/register/pengunjung", async (req, res) => {
  const {
    Nama_Depan_Pengunjung,
    Nama_Belakang_Pengunjung,
    Email_Pengunjung,
    Kata_Sandi_Pengunjung,
    No_Telepon_Pengunjung,
    Asal_Pengunjung,
    Keterangan_Asal_Pengunjung,
    Foto_Pengunjung,
    ID_Alamat,
  } = req.body;

  if (
    !Nama_Depan_Pengunjung ||
    !Nama_Belakang_Pengunjung ||
    !Email_Pengunjung ||
    !Kata_Sandi_Pengunjung ||
    !No_Telepon_Pengunjung ||
    !Asal_Pengunjung ||
    !Keterangan_Asal_Pengunjung ||
    !Foto_Pengunjung ||
    !ID_Alamat
  ) {
    return res.status(400).json({ message: "Semua field wajib diisi" });
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passwordRegex.test(Kata_Sandi_Pengunjung)) {
    return res.status(400).json({
      message:
        "Password minimal 8 karakter dan harus mengandung huruf dan angka",
    });
  }

  const phoneRegex = /^\d{10,13}$/;
  if (!phoneRegex.test(No_Telepon_Pengunjung)) {
    return res.status(400).json({
      message: "Nomor telepon harus terdiri dari 10 hingga 13 digit angka",
    });
  }

  try {
    const hash = await bcrypt.hash(Kata_Sandi_Pengunjung, 10);

    const result = await pool.query(
      `INSERT INTO "Pengunjung" (
        "Nama_Depan_Pengunjung", "Nama_Belakang_Pengunjung", "Email_Pengunjung",
        "Kata_Sandi_Pengunjung", "No_Telepon_Pengunjung", "Asal_Pengunjung",
        "Keterangan_Asal_Pengunjung", "Foto_Pengunjung", "ID_Alamat"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        Nama_Depan_Pengunjung,
        Nama_Belakang_Pengunjung,
        Email_Pengunjung,
        hash,
        No_Telepon_Pengunjung,
        Asal_Pengunjung,
        Keterangan_Asal_Pengunjung,
        Foto_Pengunjung,
        ID_Alamat,
      ]
    );

    res
      .status(201)
      .json({ message: "Register pengunjung sukses", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== LOGIN PENGUNJUNG ===================
app.post("/login/pengunjung", async (req, res) => {
  const { Email_Pengunjung, Kata_Sandi_Pengunjung } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM "Pengunjung" WHERE "Email_Pengunjung" = $1`,
      [Email_Pengunjung]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: "Email salah" });

    const match = await bcrypt.compare(
      Kata_Sandi_Pengunjung,
      user.Kata_Sandi_Pengunjung
    );
    if (!match) return res.status(401).json({ message: "Password salah" });

    // Cek apakah sudah login dan belum logout
    const sessionCheck = await pool.query(
      `
      SELECT * FROM "Loginlog"
      WHERE "ID_Pengunjung" = $1 AND "Timestamp_Logout" IS NULL
      ORDER BY "ID_Loginlog" DESC LIMIT 1
    `,
      [user.ID_Pengunjung]
    );

    if (sessionCheck.rows.length > 0) {
      return res
        .status(403)
        .json({
          message: "Pengunjung sudah login, harap logout terlebih dahulu.",
        });
    }

    const token = jwt.sign(
      { id: user.ID_Pengunjung, role: "pengunjung" },
      process.env.JWT_SECRET
    );

    await pool.query(
      `INSERT INTO "Loginlog" ("ID_Pengunjung", "IP_Address") VALUES ($1, $2)`,
      [user.ID_Pengunjung, getClientIp(req)]
    );

    res.json({ message: "Login pengunjung sukses", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== REGISTER ADMIN ===================
app.post("/register/admin", async (req, res) => {
  const {
    ID_Stasiun,
    Nama_Depan_Admin,
    Nama_Belakang_Admin,
    Email_Admin,
    Kata_Sandi_Admin,
    Peran,
  } = req.body;

  try {
    const hash = await bcrypt.hash(Kata_Sandi_Admin, 10);

    const result = await pool.query(
      `INSERT INTO "Admin" (
        "ID_Stasiun", "Nama_Depan_Admin", "Nama_Belakang_Admin",
        "Email_Admin", "Kata_Sandi_Admin", "Peran"
      ) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        ID_Stasiun,
        Nama_Depan_Admin,
        Nama_Belakang_Admin,
        Email_Admin,
        hash,
        Peran,
      ]
    );

    res
      .status(201)
      .json({ message: "Register admin sukses", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== LOGIN ADMIN ===================
app.post("/login/admin", async (req, res) => {
  const { Email_Admin, Kata_Sandi_Admin } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM "Admin" WHERE "Email_Admin" = $1`,
      [Email_Admin]
    );

    const admin = result.rows[0];
    if (!admin) return res.status(401).json({ message: "Email salah" });

    const match = await bcrypt.compare(
      Kata_Sandi_Admin,
      admin.Kata_Sandi_Admin
    );
    if (!match) return res.status(401).json({ message: "Password salah" });

    // Cek apakah sudah login dan belum logout
    const sessionCheck = await pool.query(
      `
      SELECT * FROM "Loginlog"
      WHERE "ID_Admin" = $1 AND "Timestamp_Logout" IS NULL
      ORDER BY "ID_Loginlog" DESC LIMIT 1
    `,
      [admin.ID_Admin]
    );

    if (sessionCheck.rows.length > 0) {
      return res
        .status(403)
        .json({ message: "Admin sudah login, harap logout terlebih dahulu." });
    }

    const token = jwt.sign(
      { id: admin.ID_Admin, role: admin.Peran.toLowerCase() },
      process.env.JWT_SECRET
    );

    await pool.query(
      `INSERT INTO "Loginlog" ("ID_Admin", "IP_Address") VALUES ($1, $2)`,
      [admin.ID_Admin, getClientIp(req)]
    );

    res.json({ message: "Login admin sukses", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== LOGOUT PENGUNJUNG ===================
app.post("/logout/pengunjung", authenticateToken, async (req, res) => {
  const pengunjungId = req.user.id;

  try {
    // Ambil ID_Loginlog terakhir yang aktif
    const result = await pool.query(
      `
      SELECT "ID_Loginlog" FROM "Loginlog"
      WHERE "ID_Pengunjung" = $1 AND "Timestamp_Logout" IS NULL
      ORDER BY "ID_Loginlog" DESC
      LIMIT 1
    `,
      [pengunjungId]
    );

    const log = result.rows[0];
    if (!log) {
      return res.status(400).json({ message: "Tidak ada sesi login aktif" });
    }

    // Update Timestamp_Logout berdasarkan ID_Loginlog
    await pool.query(
      `
      UPDATE "Loginlog"
      SET "Timestamp_Logout" = CURRENT_TIMESTAMP
      WHERE "ID_Loginlog" = $1
    `,
      [log.ID_Loginlog]
    );

    res.json({
      message: "Logout pengunjung sukses (token dianggap tidak aktif)",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== LOGOUT ADMIN ===================
app.post("/logout/admin", authenticateToken, async (req, res) => {
  const adminId = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT "ID_Loginlog" FROM "Loginlog"
      WHERE "ID_Admin" = $1 AND "Timestamp_Logout" IS NULL
      ORDER BY "ID_Loginlog" DESC
      LIMIT 1
    `,
      [adminId]
    );

    const log = result.rows[0];
    if (!log) {
      return res.status(400).json({ message: "Tidak ada sesi login aktif" });
    }

    await pool.query(
      `
      UPDATE "Loginlog"
      SET "Timestamp_Logout" = CURRENT_TIMESTAMP
      WHERE "ID_Loginlog" = $1
    `,
      [log.ID_Loginlog]
    );

    res.json({ message: "Logout admin sukses (token dianggap tidak aktif)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== TES ENDPOINT ===================
app.get("/", (req, res) => {
  res.send("API server aktif!");
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
