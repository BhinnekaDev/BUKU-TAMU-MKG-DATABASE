const pool = require("@/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supabase = require("@/lib/supabaseClient");
const { isStillLoggedInSession } = require("@/utils/sessionValidator");
const logActivity = require("@/helpers/logActivity");

// ====================== REGISTER ======================
exports.registerPengunjung = async (req, res) => {
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
    const emailCheck = await pool.query(
      `SELECT 1 FROM "Pengunjung" WHERE "Email_Pengunjung" = $1`,
      [Email_Pengunjung]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

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

    const insertedPengunjung = result.rows[0];

    await logActivity({
      id: insertedPengunjung.ID_Pengunjung,
      role: "pengunjung",
      action: "REGISTER",
      description: "Registrasi akun pengunjung baru",
      req,
    });

    res.status(201).json({
      message: "Register pengunjung sukses",
      user: insertedPengunjung,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ====================== LOGIN ======================
exports.loginPengunjung = async (req, res) => {
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

    const alreadyLoggedIn = await isStillLoggedInSession(
      "pengunjung",
      user.ID_Pengunjung
    );
    if (alreadyLoggedIn) {
      return res.status(403).json({
        message: "Pengunjung sudah login, harap logout terlebih dahulu.",
      });
    }

    const token = jwt.sign(
      { id: user.ID_Pengunjung, role: "pengunjung" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await logActivity({
      id: user.ID_Pengunjung,
      role: "pengunjung",
      action: "LOGIN",
      description: "Pengunjung berhasil login",
      req,
    });

    res.json({ message: "Login pengunjung sukses", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ====================== LOGOUT ======================
exports.logoutPengunjung = async (req, res) => {
  const pengunjungId = req.user.id;

  try {
    await logActivity({
      id: pengunjungId,
      role: "pengunjung",
      action: "LOGOUT",
      description: "Pengunjung melakukan logout",
      req,
    });

    res.json({ message: "Logout pengunjung sukses." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    if (!isStillLoggedInSession(req)) {
      return res
        .status(401)
        .json({ message: "Sesi tidak ditemukan. Silakan login kembali." });
    }

    const { id } = req.user;
    const result = await pool.query(
      `SELECT * FROM "Pengunjung" WHERE "ID_Pengunjung" = $1`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (!isStillLoggedInSession(req)) {
      return res
        .status(401)
        .json({ message: "Sesi tidak ditemukan. Silakan login kembali." });
    }

    const { id } = req.user;
    const {
      Nama_Depan_Pengunjung,
      Nama_Belakang_Pengunjung,
      Email_Pengunjung,
      No_Telepon_Pengunjung,
      Kata_Sandi_Pengunjung,
      ID_Alamat,
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
          message: "Nomor telepon harus terdiri dari 10 hingga 13 digit angka",
        });
      }
      updates.push(`"No_Telepon_Pengunjung" = $${updates.length + 1}`);
      values.push(No_Telepon_Pengunjung);
    }

    if (Kata_Sandi_Pengunjung) {
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
      if (!passwordRegex.test(Kata_Sandi_Pengunjung)) {
        return res.status(400).json({
          message:
            "Password minimal 8 karakter dan harus mengandung huruf dan angka",
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
      return res
        .status(400)
        .json({ message: "Tidak ada data yang diberikan untuk diperbarui" });
    }

    values.push(id);

    const query = `
      UPDATE "Pengunjung"
      SET ${updates.join(", ")}
      WHERE "ID_Pengunjung" = $${values.length}
    `;

    await pool.query(query, values);

    await logActivity({
      id,
      role: "pengunjung",
      action: "UPDATE_PROFILE",
      description: "Pengunjung memperbarui profil",
      req,
    });

    res.json({ message: "Profil pengunjung berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// exports.uploadProfilePicture = async (req, res) => {
//   try {
//     if (!isStillLoggedInSession(req)) {
//       return res.status(401).json({ message: "Sesi tidak ditemukan. Silakan login kembali." });
//     }

//     const { id } = req.user;
//     const { file } = req;

//     if (!file) {
//       return res.status(400).json({ message: "Tidak ada file yang diunggah" });
//     }

//     const { data, error } = await supabase.storage
//       .from("profile-pictures")
//       .upload(`pengunjung/${id}/${file.originalname}`, file.buffer, {
//         contentType: file.mimetype,
//         upsert: true,
//       });

//     if (error) {
//       return res.status(500).json({ error: error.message });
//     }

//     const imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${data.Key}`;

//     await pool.query(
//       `UPDATE "Pengunjung" SET "Foto_Pengunjung" = $1 WHERE "ID_Pengunjung" = $2`,
//       [imageUrl, id]
//     );

//     await logActivity({
//       id,
//       role: "pengunjung",
//       action: "UPLOAD_PROFILE_PICTURE",
//       description: "Pengunjung mengunggah foto profil",
//       req,
//     });

//     res.json({ message: "Foto profil berhasil diunggah", imageUrl });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.deleteProfilePicture = async (req, res) => {
//   try {
//     if (!isStillLoggedInSession(req)) {
//       return res.status(401).json({ message: "Sesi tidak ditemukan. Silakan login kembali." });
//     }

//     const { id } = req.user;

//     const { data, error } = await supabase.storage
//       .from("profile-pictures")
//       .remove([`pengunjung/${id}`]);

//     if (error) {
//       return res.status(500).json({ error: error.message });
//     }

//     await pool.query(
//       `UPDATE "Pengunjung" SET "Foto_Pengunjung" = NULL WHERE "ID_Pengunjung" = $1`,
//       [id]
//     );

//     await logActivity({
//       id,
//       role: "pengunjung",
//       action: "DELETE_PROFILE_PICTURE",
//       description: "Pengunjung menghapus foto profil",
//       req,
//     });

//     res.json({ message: "Foto profil berhasil dihapus" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

exports.buatKunjunganTamu = async (req, res) => {
  try {
    if (!isStillLoggedInSession(req)) {
      return res
        .status(401)
        .json({ message: "Sesi tidak ditemukan. Silakan login kembali." });
    }

    const { Tujuan, ID_Stasiun } = req.body;
    const { id: ID_Pengunjung } = req.user;

    if (!Tujuan || !ID_Stasiun || !req.file) {
      return res.status(400).json({
        message: "Tujuan, ID_Stasiun, dan Tanda_Tangan wajib diisi",
      });
    }

    const file = req.file;
    const filePath = `tanda_tangan/${Date.now()}_${file.originalname}`;

    // Upload ke Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("buku-tamu-mkg")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      return res.status(500).json({
        error: "Upload tanda tangan gagal",
        detail: uploadError.message,
      });
    }

    // Ambil public URL dari file
    const { data: publicUrlData } = supabase.storage
      .from("buku-tamu-mkg")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;

    // Simpan ke tabel Buku_Tamu
    const { error: insertError } = await supabase.from("Buku_Tamu").insert({
      ID_Pengunjung,
      ID_Stasiun,
      Tujuan,
      Tanggal_Pengisian: new Date().toISOString(),
      Tanda_Tangan: publicUrl,
    });

    if (insertError) {
      return res.status(500).json({
        error: "Gagal menyimpan data ke database",
        detail: insertError.message,
      });
    }

    // Log aktivitas
    await logActivity({
      id: ID_Pengunjung,
      role: "pengunjung",
      action: "CREATE_KUNJUNGAN",
      description: "Pengunjung mengisi buku tamu",
      req,
    });

    res.status(201).json({ message: "Data kunjungan berhasil disimpan" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Terjadi kesalahan server", detail: err.message });
  }
};
