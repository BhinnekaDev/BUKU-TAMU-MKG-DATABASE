const pool = require('../db');
const bcrypt = require('bcrypt');

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const result = await pool.query(`SELECT * FROM "Pengunjung" WHERE "ID_Pengunjung" = $1`, [id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const {
      Nama_Depan_Pengunjung,
      Nama_Belakang_Pengunjung,
      Email_Pengunjung,
      No_Telepon_Pengunjung,
      Kata_Sandi_Pengunjung,
      ID_Alamat
    } = req.body;

    const updates = [];
    const values = [];

    if (Nama_Depan_Pengunjung) {
      updates.push(`"Nama_Depan_Pengunjung" = $${updates.length + 1}`);
      values.push(Nama_Depan_Pengunjung);
    }

    if (Nama_Belakang_Pengunjung) {
      updates.push(`"Nama_Belakang_Pengunjung" = $${updates.length + 1}`);
      values.push(Nama_Belakang_Pengunjung);
    }

    if (Email_Pengunjung) {
      updates.push(`"Email_Pengunjung" = $${updates.length + 1}`);
      values.push(Email_Pengunjung);
    }

    if (No_Telepon_Pengunjung) {
      const phoneRegex = /^\d{10,13}$/;
      if (!phoneRegex.test(No_Telepon_Pengunjung)) {
        return res.status(400).json({
          message: 'Nomor telepon harus terdiri dari 10 hingga 13 digit angka'
        });
      }
      updates.push(`"No_Telepon_Pengunjung" = $${updates.length + 1}`);
      values.push(No_Telepon_Pengunjung);
    }    

    if (Kata_Sandi_Pengunjung) {
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
      if (!passwordRegex.test(Kata_Sandi_Pengunjung)) {
        return res.status(400).json({
          message: 'Password minimal 8 karakter dan harus mengandung huruf dan angka'
        });
      }
      const hashed = await bcrypt.hash(Kata_Sandi_Pengunjung, 10);
      updates.push(`"Kata_Sandi_Pengunjung" = $${updates.length + 1}`);
      values.push(hashed);
    }

    if (ID_Alamat) {
      updates.push(`"ID_Alamat" = $${updates.length + 1}`);
      values.push(ID_Alamat);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Tidak ada data yang diberikan untuk diperbarui' });
    }

    values.push(id);

    const query = `
      UPDATE "Pengunjung"
      SET ${updates.join(', ')}
      WHERE "ID_Pengunjung" = $${values.length}
    `;

    await pool.query(query, values);
    res.json({ message: 'Profil pengunjung berhasil diperbarui' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};