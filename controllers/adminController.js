const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supabase = require("../lib/supabaseClient");

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress?.replace("::ffff:", "") ||
    "UNKNOWN"
  );
}

async function isStillLoggedIn(adminIdField, adminIdValue) {
  const result = await pool.query(
    `SELECT * FROM "Loginlog" WHERE "${adminIdField}" = $1 AND "Timestamp_Logout" IS NULL`,
    [adminIdValue]
  );
  return result.rows.length > 0;
}

// =================== REGISTER ADMIN ===================
exports.registerAdmin = async (req, res) => {
  const {
    ID_Stasiun,
    Nama_Depan_Admin,
    Nama_Belakang_Admin,
    Email_Admin,
    Kata_Sandi_Admin,
    Peran,
  } = req.body;

  try {
    if (Peran.toLowerCase() === "superadmin" && ID_Stasiun) {
      return res.status(400).json({
        message: "Superadmin tidak boleh memiliki ID_Stasiun",
      });
    }

    const emailCheck = await pool.query(
      `SELECT 1 FROM "Admin" WHERE "Email_Admin" = $1`,
      [Email_Admin]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ message: "Email admin sudah terdaftar" });
    }

    const hash = await bcrypt.hash(Kata_Sandi_Admin, 10);

    const result = await pool.query(
      `INSERT INTO "Admin" (
        "ID_Stasiun", "Nama_Depan_Admin", "Nama_Belakang_Admin",
        "Email_Admin", "Kata_Sandi_Admin", "Peran"
      ) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        ID_Stasiun || null,
        Nama_Depan_Admin,
        Nama_Belakang_Admin,
        Email_Admin,
        hash,
        Peran,
      ]
    );

    res
      .status(201)
      .json({ message: "Register admin sukses", admin: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =================== LOGIN ADMIN ===================
exports.loginAdmin = async (req, res) => {
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

    // Cek login aktif
    if (await isStillLoggedIn("ID_Admin", admin.ID_Admin)) {
      return res.status(403).json({
        message: "Admin sudah login, harap logout terlebih dahulu.",
      });
    }

    const sessionCheck = await pool.query(
      `SELECT * FROM "Loginlog"
       WHERE "ID_Admin" = $1 AND "Timestamp_Logout" IS NULL
       ORDER BY "ID_Loginlog" DESC LIMIT 1`,
      [admin.ID_Admin]
    );

    if (sessionCheck.rows.length > 0) {
      return res.status(403).json({
        message: "Admin sudah login, harap logout terlebih dahulu.",
      });
    }

    const token = jwt.sign(
      { id: admin.ID_Admin, role: admin.Peran.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await pool.query(
      `INSERT INTO "Loginlog" ("ID_Admin", "IP_Address", "Token_Akses")
       VALUES ($1, $2, $3)`,
      [admin.ID_Admin, getClientIp(req), token]
    );

    res.json({ message: "Login admin sukses", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =================== LOGOUT ADMIN ===================
exports.logoutAdmin = async (req, res) => {
  const adminId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT "ID_Loginlog" FROM "Loginlog"
       WHERE "ID_Admin" = $1 AND "Timestamp_Logout" IS NULL
       ORDER BY "ID_Loginlog" DESC
       LIMIT 1`,
      [adminId]
    );

    const log = result.rows[0];
    if (!log) {
      return res.status(400).json({ message: "Tidak ada sesi login aktif" });
    }

    await pool.query(
      `UPDATE "Loginlog"
       SET "Timestamp_Logout" = CURRENT_TIMESTAMP, "Token_Akses" = NULL
       WHERE "ID_Loginlog" = $1`,
      [log.ID_Loginlog]
    );

    res.json({ message: "Logout admin sukses (token dianggap tidak aktif)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const result = await pool.query(
      `SELECT * FROM "Admin" WHERE "ID_Admin" = $1`,
      [id]
    );
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
      Kata_Sandi_Admin,
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
      return res
        .status(400)
        .json({ message: "Tidak ada data yang diberikan untuk diperbarui" });
    }

    values.push(id);

    const query = `
      UPDATE "Admin"
      SET ${updates.join(", ")}
      WHERE "ID_Admin" = $${values.length}
    `;

    await pool.query(query, values);
    res.json({ message: "Profil admin berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDaftarTamu = async (req, res) => {
  try {
    const { id, role } = req.user;
    const normalizedRole = role.toLowerCase();
    let result;

    if (normalizedRole === "superadmin") {
      result = await pool.query(
        `SELECT * FROM "Buku_Tamu" ORDER BY "Tanggal_Pengisian" DESC`
      );
    } else if (normalizedRole === "admin") {
      const adminData = await pool.query(
        `SELECT "ID_Stasiun" FROM "Admin" WHERE "ID_Admin" = $1`,
        [id]
      );

      if (adminData.rows.length === 0) {
        return res.status(404).json({ message: "Admin tidak ditemukan" });
      }

      const idStasiun = adminData.rows[0].ID_Stasiun;

      result = await pool.query(
        `SELECT * FROM "Buku_Tamu" WHERE "ID_Stasiun" = $1 ORDER BY "Tanggal_Pengisian" DESC`,
        [idStasiun]
      );
    } else {
      return res.status(403).json({ message: "role tidak dikenali" });
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.hapusTamu = async (req, res) => {
  const { role } = req.user;

  if (role.toLowerCase() !== "superadmin") {
    return res.status(403).json({
      message:
        "Akses ditolak: hanya Superadmin yang dapat menghapus data tamu.",
    });
  }

  const { id } = req.params;

  try {
    // Ambil URL tanda tangan dari database
    const result = await pool.query(
      `SELECT "Tanda_Tangan" FROM "Buku_Tamu" WHERE "ID_Buku_Tamu" = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Data tamu tidak ditemukan." });
    }

    const tandaTanganUrl = result.rows[0].Tanda_Tangan;

    // Ekstrak nama file dari URL
    // Contoh URL: http://127.0.0.1:54321/storage/v1/object/public/tanda-tangan/tanda_tangan/1746421162012_Screenshot_1.png
    const match = tandaTanganUrl.match(/tanda_tangan\/(.+)$/);
    if (match && match[1]) {
      const filePath = `tanda_tangan/${match[1]}`;

      const { error: deleteError } = await supabase.storage
        .from("tanda-tangan")
        .remove([filePath]);

      if (deleteError) {
        console.error(
          "Gagal menghapus file dari storage:",
          deleteError.message
        );
        return res.status(500).json({
          message: "Gagal menghapus file tanda tangan dari storage.",
          error: deleteError.message,
        });
      }
    } else {
      console.warn(
        "Format URL tanda tangan tidak valid, file tidak dapat dihapus."
      );
    }

    // Hapus data tamu dari database
    await pool.query(`DELETE FROM "Buku_Tamu" WHERE "ID_Buku_Tamu" = $1`, [id]);

    res.json({ message: "Data tamu dan tanda tangan berhasil dihapus." });
  } catch (err) {
    console.error("Terjadi kesalahan:", err.message);
    res.status(500).json({ error: err.message });
  }
};
