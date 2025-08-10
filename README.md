
---

# 📌 Buku Tamu MKG – API

**Backend API untuk pengelolaan buku tamu dan data pengunjung MKG**
Dibangun modular & scalable menggunakan **NestJS** dan **Supabase**.

> Digunakan untuk mencatat kunjungan, mengelola data admin, dan menampilkan statistik dashboard pengunjung.

[![GitHub Repo](https://img.shields.io/badge/github-BhinnekaDev-blue?logo=github\&style=flat-square)](https://github.com/BhinnekaDev/BUKU-TAMU-MKG-DATABASE)
[![Stars](https://img.shields.io/github/stars/BhinnekaDev/BUKU-TAMU-MKG-DATABASE?style=flat-square)](https://github.com/BhinnekaDev/BUKU-TAMU-MKG-DATABASE/stargazers)
[![Forks](https://img.shields.io/github/forks/BhinnekaDev/BUKU-TAMU-MKG-DATABASE?style=flat-square)](https://github.com/BhinnekaDev/BUKU-TAMU-MKG-DATABASE/network/members)
[![Last Commit](https://img.shields.io/github/last-commit/BhinnekaDev/BUKU-TAMU-MKG-DATABASE?style=flat-square)](https://github.com/BhinnekaDev/BUKU-TAMU-MKG-DATABASE/commits/main)

![Platform](https://img.shields.io/badge/platform-API-blue?style=flat-square)
![NestJS](https://img.shields.io/badge/NestJS-9-red?logo=nestjs\&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-4.x-3178C6?logo=typescript\&logoColor=white\&style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase\&style=flat-square)

---

## 🚀 Fitur

| Modul                | Deskripsi                                                                   |
| -------------------- | --------------------------------------------------------------------------- |
| **Pengunjung**       | Mendapatkan data asal, stasiun, jumlah pengunjung, pencarian, isi buku tamu |
| **Admin**            | Login, profil, update profil, reset password                                |
| **Buku Tamu**        | Statistik & daftar buku tamu (filter tanggal/periode)                       |
| **Dashboard**        | Statistik ringkas berdasarkan peran admin                                   |
| **Upload File**      | Upload tanda tangan & foto admin ke Supabase Storage                        |
| **Swagger API Docs** | Dokumentasi API otomatis di `/api`                                          |

---

## ⚙️ Teknologi

| Layer   | Stack                                           |
| ------- | ----------------------------------------------- |
| Backend | NestJS, TypeScript, Supabase (PostgreSQL, Auth) |
| Deploy  | Railway, Docker, Vercel (opsional)              |

---

## 📦 Instalasi

```bash
# Clone repo
git clone https://github.com/BhinnekaDev/BUKU-TAMU-MKG-DATABASE.git
cd BUKU-TAMU-MKG-DATABASE

# Install dependencies
npm install
```

---

## 🔐 Konfigurasi `.env`

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> Ambil kredensial ini dari **Supabase Project Settings**.

---

## 📜 API Endpoint

### 📍 Pengunjung

| Method | Endpoint         | Deskripsi                                  |
| ------ | ---------------- | ------------------------------------------ |
| GET    | `/pengunjung`    | Daftar pengunjung & filter data            |
| POST   | `/isi-buku-tamu` | Isi buku tamu (dengan upload tanda tangan) |

**Contoh Body `multipart/form-data` isi buku tamu:**

```json
{
  "tujuan": "Mengikuti rapat koordinasi",
  "id_stasiun": "b0ae3f1d-901a-4530-a5fb-9c63c872d33e",
  "Nama_Depan_Pengunjung": "Ahmad",
  "Nama_Belakang_Pengunjung": "Hidayat",
  "Email_Pengunjung": "ahmad.hidayat@example.com",
  "No_Telepon_Pengunjung": "081234567890",
  "Asal_Pengunjung": "BMKG",
  "Asal_Instansi": "Dishub Jawa Barat",
  "waktu_kunjungan": "Senin, 10 Juni 2024, 14.30",
  "Alamat_Lengkap": "Jl. Merdeka No.1",
  "tanda_tangan": "(file JPG/PNG)"
}
```

---

### 📍 Admin

| Method | Endpoint          | Deskripsi                                        |
| ------ | ----------------- | ------------------------------------------------ |
| POST   | `/login`          | Login admin                                      |
| GET    | `/profile`        | Profil admin (header: `access_token`, `user_id`) |
| PUT    | `/update-profile` | Update profil + upload foto                      |
| POST   | `/reset-password` | Reset password                                   |

---

### 📍 Buku Tamu

| Method | Endpoint                | Deskripsi                                                                    |
| ------ | ----------------------- | ---------------------------------------------------------------------------- |
| GET    | `/buku-tamu`            | List buku tamu (filter: `period`, `startDate`, `endDate`, `filterStasiunId`) |
| GET    | `/buku-tamu/hari-ini`   | Buku tamu hari ini                                                           |
| GET    | `/buku-tamu/minggu-ini` | Buku tamu minggu ini                                                         |
| GET    | `/buku-tamu/bulan-ini`  | Buku tamu bulan ini                                                          |

---

### 📍 Dashboard

| Method | Endpoint     | Deskripsi                                   |
| ------ | ------------ | ------------------------------------------- |
| GET    | `/dashboard` | Statistik dashboard berdasarkan peran admin |

---

## 🧪 Script Penting

| Perintah            | Fungsi                                    |
| ------------------- | ----------------------------------------- |
| `npm run start`     | Jalankan server dalam mode production     |
| `npm run start:dev` | Jalankan server dalam mode development    |
| `npm run build`     | Build aplikasi ke direktori `/dist`       |
| `npm run lint`      | Periksa dan perbaiki format kode otomatis |
| `npm run test`      | Unit testing                              |
| `npm run test:e2e`  | End-to-end testing                        |

---

## 📜 Lisensi

MIT © 2025 Bhinneka Developer

---
