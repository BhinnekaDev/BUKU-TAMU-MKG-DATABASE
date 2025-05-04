const pool = require('../db');
const bcrypt = require('bcrypt');

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const result = await pool.query(`SELECT * FROM "Admin" WHERE "ID_Admin" = $1`, [id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const {
      Nama_Depan_Admin,
      Nama_Belakang_Admin,
      Email_Admin,
      No_Telepon_Admin,
      Kata_Sandi_Admin
    } = req.body;

    const updates = [];
    const values = [];

    if (Nama_Depan_Admin) {
      updates.push(`"Nama_Depan_Admin" = $${updates.length + 1}`);
      values.push(Nama_Depan_Admin);
    }

    if (Nama_Belakang_Admin) {
      updates.push(`"Nama_Belakang_Admin" = $${updates.length + 1}`);
      values.push(Nama_Belakang_Admin);
    }

    if (Email_Admin) {
      updates.push(`"Email_Admin" = $${updates.length + 1}`);
      values.push(Email_Admin);
    }

    if (No_Telepon_Admin) {
      updates.push(`"No_Telepon_Admin" = $${updates.length + 1}`);
      values.push(No_Telepon_Admin);
    }

    if (Kata_Sandi_Admin) {
      const hashed = await bcrypt.hash(Kata_Sandi_Admin, 10);
      updates.push(`"Kata_Sandi_Admin" = $${updates.length + 1}`);
      values.push(hashed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Tidak ada data yang diberikan untuk diperbarui' });
    }

    values.push(id);

    const query = `
      UPDATE "Admin"
      SET ${updates.join(', ')}
      WHERE "ID_Admin" = $${values.length}
    `;

    await pool.query(query, values);
    res.json({ message: 'Profil admin berhasil diperbarui' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
