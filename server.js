const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());

// ambil IP dari request
const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
};

// =================== REGISTER PENGUNJUNG ===================
app.post('/register/pengunjung', async (req, res) => {
  const {
    Nama_Depan_Pengunjung,
    Nama_Belakang_Pengunjung,
    Email_Pengunjung,
    Kata_Sandi_Pengunjung,
    No_Telepon_Pengunjung,
    Asal_Pengunjung,
    Keterangan_Asal_Pengunjung,
    Foto_Pengunjung,
    ID_Alamat
  } = req.body;

  try {
    const hash = await bcrypt.hash(Kata_Sandi_Pengunjung, 10);

    const result = await pool.query(
      `INSERT INTO "Pengunjung" (
        "Nama_Depan_Pengunjung", "Nama_Belakang_Pengunjung", "Email_Pengunjung",
        "Kata_Sandi_Pengunjung", "No_Telepon_Pengunjung", "Asal_Pengunjung",
        "Keterangan_Asal_Pengunjung", "Foto_Pengunjung", "ID_Alamat"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung, Email_Pengunjung,
        hash, No_Telepon_Pengunjung, Asal_Pengunjung,
        Keterangan_Asal_Pengunjung, Foto_Pengunjung, ID_Alamat
      ]
    );

    res.status(201).json({ message: 'Register sukses', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== LOGIN PENGUNJUNG ===================
app.post('/login/pengunjung', async (req, res) => {
  const { Email_Pengunjung, Kata_Sandi_Pengunjung } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM "Pengunjung" WHERE "Email_Pengunjung" = $1`,
      [Email_Pengunjung]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Email salah' });

    const match = await bcrypt.compare(Kata_Sandi_Pengunjung, user.Kata_Sandi_Pengunjung);
    if (!match) return res.status(401).json({ message: 'Password salah' });

    const token = jwt.sign(
      { id: user.ID_Pengunjung, role: 'pengunjung' },
      process.env.JWT_SECRET
    );

    // Simpan log login
    await pool.query(
      `INSERT INTO "Loginlog" ("ID_Pengunjung", "IP_Address") VALUES ($1, $2)`,
      [user.ID_Pengunjung, getClientIp(req)]
    );

    res.json({ message: 'Login pengunjung sukses', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== REGISTER ADMIN ===================
app.post('/register/admin', async (req, res) => {
  const {
    ID_Stasiun,
    Nama_Depan_Admin,
    Nama_Belakang_Admin,
    Email_Admin,
    Kata_Sandi_Admin,
    Peran
  } = req.body;

  try {
    const hash = await bcrypt.hash(Kata_Sandi_Admin, 10);

    const result = await pool.query(
      `INSERT INTO "Admin" (
        "ID_Stasiun", "Nama_Depan_Admin", "Nama_Belakang_Admin", "Email_Admin", "Kata_Sandi_Admin", "Peran"
      ) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [ID_Stasiun, Nama_Depan_Admin, Nama_Belakang_Admin, Email_Admin, hash, Peran]
    );

    res.status(201).json({ message: 'Register admin sukses', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== LOGIN ADMIN ===================
app.post('/login/admin', async (req, res) => {
  const { Email_Admin, Kata_Sandi_Admin } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM "Admin" WHERE "Email_Admin" = $1`,
      [Email_Admin]
    );

    const admin = result.rows[0];
    if (!admin) return res.status(401).json({ message: 'Email salah' });

    const match = await bcrypt.compare(Kata_Sandi_Admin, admin.Kata_Sandi_Admin);
    if (!match) return res.status(401).json({ message: 'Password salah' });

    const token = jwt.sign(
      { id: admin.ID_Admin, role: admin.Peran },
      process.env.JWT_SECRET
    );

    // Simpan log login
    await pool.query(
      `INSERT INTO "Loginlog" ("ID_Admin", "IP_Address") VALUES ($1, $2)`,
      [admin.ID_Admin, getClientIp(req)]
    );

    res.json({ message: 'Login admin sukses', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== LOGOUT PENGUNJUNG ===================
app.post('/logout/pengunjung', (req, res) => {
  // Hapus token dari penyimpanan lokal
  res.json({ message: 'Logout pengunjung sukses (hapus token di client)' });
});

// =================== LOGOUT ADMIN ===================
app.post('/logout/admin', (req, res) => {
  res.json({ message: 'Logout admin sukses (hapus token di client)' });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running at http://localhost:${process.env.PORT || 3000}`);
});
