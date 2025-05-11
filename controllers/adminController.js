const pool = require("@/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supabase = require("@/lib/supabaseClient");
const { isStillLoggedInSession } = require("@/utils/sessionValidator");
const logActivity = require("@/helpers/logActivity");

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
      'SELECT 1 FROM "Admin" WHERE "Email_Admin" = $1',
      [Email_Admin]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ message: "Email admin sudah terdaftar" });
    }

    const hash = await bcrypt.hash(Kata_Sandi_Admin, 10);

    const result = await pool.query(
      `INSERT INTO "Admin" (
        "ID_Stasiun", 
        "Nama_Depan_Admin", 
        "Nama_Belakang_Admin",
        "Email_Admin", 
        "Kata_Sandi_Admin", 
        "Peran"
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        ID_Stasiun || null,
        Nama_Depan_Admin,
        Nama_Belakang_Admin,
        Email_Admin,
        hash,
        Peran,
      ]
    );

    await logActivity({
      id: result.rows[0].ID_Admin,
      role: Peran.toLowerCase(),
      action: "REGISTER",
      description: "Admin baru berhasil terdaftar",
      req,
    });

    res.status(201).json({
      message: "Register admin sukses",
      admin: result.rows[0],
    });
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

    const role = admin.Peran.toLowerCase();

    const alreadyLoggedIn = await isStillLoggedInSession(role, admin.ID_Admin);
    if (alreadyLoggedIn) {
      return res.status(403).json({
        message: "Admin sudah login, harap logout terlebih dahulu.",
      });
    }

    const token = jwt.sign(
      { id: admin.ID_Admin, role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await logActivity({
      id: admin.ID_Admin,
      role,
      action: "LOGIN",
      description: `${admin.Peran} berhasil login`,
      req,
    });

    res.json({ message: "Login admin sukses", token });
  } catch (err) {
    console.error("loginAdmin error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// =================== LOGOUT ADMIN ===================
exports.logoutAdmin = async (req, res) => {
  const adminId = req.user.id;

  try {
    const adminResult = await pool.query(
      'SELECT "Peran" FROM "Admin" WHERE "ID_Admin" = $1',
      [adminId]
    );

    const admin = adminResult.rows[0];
    if (!admin) {
      return res.status(404).json({ message: "Admin tidak ditemukan" });
    }

    await logActivity({
      id: adminId,
      role: admin.Peran.toLowerCase(),
      action: "LOGOUT",
      description: `${
        admin.Peran.toLowerCase() === "superadmin" ? "Superadmin" : "Admin"
      } berhasil logout`,
      req,
    });

    res.json({
      message: "Logout admin sukses.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id, role } = req.user;

    if (!(await isStillLoggedInSession("admin", id))) {
      return res
        .status(403)
        .json({ message: "Sesi tidak valid atau sudah berakhir." });
    }

    const loginLog = await pool.query(
      'SELECT * FROM "Activity_Log" WHERE "ID_Admin" = $1 AND "Action" = $2 ORDER BY "Created_At" DESC LIMIT 1',
      [id, "LOGIN"]
    );

    const lastLogin = loginLog.rows[0];
    if (!lastLogin) {
      return res.status(403).json({ message: "Belum ada riwayat login." });
    }

    const logoutCheck = await pool.query(
      'SELECT * FROM "Activity_Log" WHERE "ID_Admin" = $1 AND "Action" = $2 AND "Created_At" > $3',
      [id, "LOGOUT", lastLogin.Created_At]
    );

    if (logoutCheck.rowCount > 0) {
      return res.status(403).json({ message: "Sesi login sudah tidak aktif." });
    }

    const result = await pool.query(
      'SELECT * FROM "Admin" WHERE "ID_Admin" = $1',
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

    if (!(await isStillLoggedInSession("admin", id))) {
      return res
        .status(401)
        .json({ message: "Sesi tidak ditemukan. Silakan login kembali." });
    }

    const {
      Nama_Depan_Admin,
      Nama_Belakang_Admin,
      Email_Admin,
      No_Telepon_Admin,
      Kata_Sandi_Admin,
    } = req.body;

    const sessionCheck = await pool.query(
      'SELECT * FROM "Activity_Log" WHERE "ID_Admin" = $1 AND "Action" = $2 ORDER BY "Created_At" DESC LIMIT 1',
      [id, "LOGIN"]
    );

    const lastLogin = sessionCheck.rows[0];
    if (!lastLogin) {
      return res.status(403).json({ message: "Sesi login tidak ditemukan" });
    }

    const logoutCheck = await pool.query(
      'SELECT * FROM "Activity_Log" WHERE "ID_Admin" = $1 AND "Action" = $2 AND "Created_At" > $3',
      [id, "LOGOUT", lastLogin.Created_At]
    );

    if (logoutCheck.rows.length > 0) {
      return res.status(403).json({ message: "Sesi login sudah tidak aktif" });
    }

    const updates = [];
    const values = [];

    if (Nama_Depan_Admin) {
      updates.push(`"Nama_Depan_Admin" = $${values.length + 1}`);
      values.push(Nama_Depan_Admin);
    }
    if (Nama_Belakang_Admin) {
      updates.push(`"Nama_Belakang_Admin" = $${values.length + 1}`);
      values.push(Nama_Belakang_Admin);
    }
    if (Email_Admin) {
      updates.push(`"Email_Admin" = $${values.length + 1}`);
      values.push(Email_Admin);
    }
    if (No_Telepon_Admin) {
      updates.push(`"No_Telepon_Admin" = $${values.length + 1}`);
      values.push(No_Telepon_Admin);
    }
    if (Kata_Sandi_Admin) {
      const hashed = await bcrypt.hash(Kata_Sandi_Admin, 10);
      updates.push(`"Kata_Sandi_Admin" = $${values.length + 1}`);
      values.push(hashed);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ message: "Tidak ada data yang diberikan untuk diperbarui" });
    }

    values.push(id);

    const query = `UPDATE "Admin" SET ${updates.join(
      ", "
    )} WHERE "ID_Admin" = $${values.length}`;
    await pool.query(query, values);

    const adminResult = await pool.query(
      'SELECT "Peran" FROM "Admin" WHERE "ID_Admin" = $1',
      [id]
    );
    const admin = adminResult.rows[0];

    await logActivity({
      id,
      role: admin.Peran.toLowerCase(),
      action: "UPDATE_PROFILE",
      description: `${
        admin.Peran.toLowerCase() === "superadmin" ? "Superadmin" : "Admin"
      } memperbarui profil`,
      req,
    });

    res.json({ message: "Profil admin berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDaftarTamu = async (req, res) => {
  try {
    const { id, role } = req.user;

    const stillLoggedIn = await isStillLoggedInSession(role, id);
    if (!stillLoggedIn) {
      return res
        .status(401)
        .json({ message: "Sesi tidak ditemukan. Silakan login kembali." });
    }

    let result;

    if (role.toLowerCase() === "superadmin") {
      result = await pool.query(
        `SELECT * FROM "Buku_Tamu" ORDER BY "Tanggal_Pengisian" DESC`
      );
    } else if (role.toLowerCase() === "admin") {
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
      return res.status(403).json({ message: "Role tidak dikenali" });
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.hapusTamu = async (req, res) => {
  const { id: adminId, role } = req.user;

  const stillLoggedIn = await isStillLoggedInSession(role, adminId);
  if (!stillLoggedIn) {
    return res
      .status(401)
      .json({ message: "Sesi tidak valid atau token tidak sah." });
  }

  if (role.toLowerCase() !== "superadmin") {
    return res.status(403).json({
      message:
        "Akses ditolak: hanya Superadmin yang dapat menghapus data tamu.",
    });
  }

  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT "Tanda_Tangan" FROM "Buku_Tamu" WHERE "ID_Buku_Tamu" = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Data tamu tidak ditemukan." });
    }

    const tandaTanganUrl = result.rows[0].Tanda_Tangan;

    const match = tandaTanganUrl.match(/tanda_tangan\/(.+)$/);
    if (match && match[1]) {
      const filePath = `tanda_tangan/${match[1]}`;

      const { error: deleteError } = await supabase.storage
        .from("buku-tamu-mkg")
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

    await pool.query(`DELETE FROM "Buku_Tamu" WHERE "ID_Buku_Tamu" = $1`, [id]);

    await logActivity({
      id: adminId,
      role: role.toLowerCase(),
      action: "HAPUS_TAMU",
      description: `Superadmin menghapus data tamu dengan ID ${id}`,
      req,
    });

    res.json({ message: "Data tamu dan tanda tangan berhasil dihapus." });
  } catch (err) {
    console.error("Terjadi kesalahan:", err.message);
    res.status(500).json({ error: err.message });
  }
};
