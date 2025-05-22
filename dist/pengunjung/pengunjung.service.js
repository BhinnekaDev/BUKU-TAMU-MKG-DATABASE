"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PengunjungService = void 0;
const supabase_client_1 = require("../supabase/supabase.client");
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const path_1 = require("path");
const uuid_1 = require("uuid");
let PengunjungService = class PengunjungService {
    async register(dto, ip, userAgent, file) {
        const { email, password, nama_depan_pengunjung, nama_belakang_pengunjung, no_telepon_pengunjung, asal_pengunjung, keterangan_asal_pengunjung, alamat, foto_pengunjung, } = dto;
        let existingUsers;
        try {
            const { data, error } = await supabase_client_1.supabase.auth.admin.listUsers();
            if (error) {
                throw new Error('Gagal ambil daftar user dari Supabase Auth');
            }
            existingUsers = data?.users?.filter((user) => user.email === email);
        }
        catch (err) {
            throw new common_1.BadRequestException('Gagal cek email di Supabase');
        }
        if (existingUsers?.length) {
            throw new common_1.BadRequestException('Email sudah digunakan');
        }
        const { data: userData, error: registerError } = await supabase_client_1.supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });
        if (registerError || !userData?.user?.id) {
            throw new common_1.BadRequestException('Gagal mendaftarkan user ke Supabase Auth');
        }
        const id_pengunjung = userData.user.id;
        let alamatId = null;
        if (alamat) {
            const { data: existingAlamat, error: checkAlamatError } = await supabase_client_1.supabase
                .from('Alamat')
                .select('ID_Alamat')
                .match({
                Provinsi: alamat.Provinsi,
                Kabupaten: alamat.Kabupaten,
                Kecamatan: alamat.Kecamatan,
                Kelurahan: alamat.Kelurahan,
                Kode_Pos: alamat.Kode_Pos,
                RT: alamat.RT,
                RW: alamat.RW,
                Alamat_Jalan: alamat.Alamat_Jalan,
            })
                .single();
            if (checkAlamatError && checkAlamatError.code !== 'PGRST116') {
                throw new common_1.BadRequestException('Gagal mengecek data alamat');
            }
            if (existingAlamat?.ID_Alamat) {
                alamatId = existingAlamat.ID_Alamat;
            }
            else {
                const { error: insertAlamatError, data: alamatData } = await supabase_client_1.supabase
                    .from('Alamat')
                    .insert([alamat])
                    .select('ID_Alamat')
                    .single();
                if (insertAlamatError || !alamatData?.ID_Alamat) {
                    throw new common_1.BadRequestException('Gagal menyimpan data alamat');
                }
                alamatId = alamatData.ID_Alamat;
            }
        }
        let fotoUrl = null;
        if (file) {
            const path = `${id_pengunjung}${(0, path_1.extname)(file.originalname)}`;
            const { error: uploadError } = await supabase_client_1.supabase.storage
                .from('foto-pengunjung')
                .upload(path, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: true,
            });
            if (uploadError) {
                console.error('Upload foto error:', uploadError);
                throw new common_1.BadRequestException('Gagal mengunggah foto pengunjung');
            }
            const { data: urlData } = supabase_client_1.supabase.storage
                .from('foto-pengunjung')
                .getPublicUrl(path);
            fotoUrl = urlData.publicUrl;
        }
        const { error: pengunjungError } = await supabase_client_1.supabase
            .from('Pengunjung')
            .insert({
            ID_Pengunjung: id_pengunjung,
            ID_Alamat: alamatId,
            Nama_Depan_Pengunjung: nama_depan_pengunjung,
            Nama_Belakang_Pengunjung: nama_belakang_pengunjung,
            Email_Pengunjung: email,
            No_Telepon_Pengunjung: no_telepon_pengunjung,
            Asal_Pengunjung: asal_pengunjung,
            Keterangan_Asal_Pengunjung: keterangan_asal_pengunjung,
            Foto_Pengunjung: fotoUrl,
        });
        if (pengunjungError) {
            throw new common_1.BadRequestException('Gagal menyimpan data pengunjung ke database');
        }
        await supabase_client_1.supabase.from('Activity_Log').insert({
            ID_User: id_pengunjung,
            Role: 'Pengunjung',
            Action: 'Register',
            Description: `Pengunjung ${nama_depan_pengunjung} ${nama_belakang_pengunjung} berhasil mendaftar dengan ID: ${id_pengunjung} dan Email: ${email}`,
            IP_Address: ip,
            User_Agent: userAgent,
        });
        return {
            message: 'Registrasi pengunjung berhasil',
            id_pengunjung,
            email,
        };
    }
    async login(dto, ip, userAgent) {
        const { email, password } = dto;
        const { data, error } = await supabase_client_1.supabase.auth.signInWithPassword({
            email,
            password,
        });
        const session = data?.session;
        const user = data?.user;
        if (error || !session?.access_token || !user?.id) {
            console.error('Login error:', error);
            throw new common_1.UnauthorizedException('Email atau password salah');
        }
        const id_pengunjung = user.id;
        await supabase_client_1.supabase.from('Activity_Log').insert({
            ID_User: id_pengunjung,
            Role: 'Pengunjung',
            Action: 'Login',
            Description: `Pengunjung dengan email ${email} berhasil login`,
            IP_Address: ip,
            User_Agent: userAgent,
        });
        return {
            message: 'Login berhasil',
            access_token: session.access_token,
            user: {
                id: id_pengunjung,
                email,
            },
        };
    }
    async logout(token, ip, userAgent) {
        const rawToken = token.startsWith('Bearer ')
            ? token.replace('Bearer ', '')
            : token;
        const { data, error } = await supabase_client_1.supabase.auth.getUser(rawToken);
        if (error || !data?.user?.id) {
            throw new common_1.UnauthorizedException({
                message: 'Token tidak valid atau sudah logout',
                detail: error?.message || null,
            });
        }
        const id_pengunjung = data.user.id;
        const { data: pengunjungData } = await supabase_client_1.supabase
            .from('Pengunjung')
            .select('Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung')
            .eq('ID_Pengunjung', id_pengunjung)
            .single();
        const namaLengkap = pengunjungData
            ? `${pengunjungData.Nama_Depan_Pengunjung} ${pengunjungData.Nama_Belakang_Pengunjung}`
            : 'Pengunjung';
        await supabase_client_1.supabase.from('Activity_Log').insert({
            ID_User: id_pengunjung,
            Role: 'Pengunjung',
            Action: 'Logout',
            Description: `Pengunjung dengan nama: ${namaLengkap} berhasil logout`,
            IP_Address: ip,
            User_Agent: userAgent,
        });
        return {
            message: 'Logout berhasil',
        };
    }
    async getProfile(token) {
        const rawToken = token.startsWith('Bearer ')
            ? token.replace('Bearer ', '')
            : token;
        let payload;
        try {
            const { data, error } = await supabase_client_1.supabase.auth.getUser(rawToken);
            if (error || !data?.user?.id) {
                throw new Error('Token tidak valid atau user tidak ditemukan');
            }
            payload = data.user;
        }
        catch (err) {
            throw new common_1.UnauthorizedException('Token tidak valid');
        }
        const userId = payload.id;
        const { data: pengunjung, error: pengunjungError } = await supabase_client_1.supabase
            .from('Pengunjung')
            .select(`
        ID_Pengunjung,
        Nama_Depan_Pengunjung,
        Nama_Belakang_Pengunjung,
        Email_Pengunjung,
        No_Telepon_Pengunjung,
        Asal_Pengunjung,
        Keterangan_Asal_Pengunjung,
        Foto_Pengunjung,
        Alamat (
          Provinsi,
          Kabupaten,
          Kecamatan,
          Kelurahan,
          Kode_Pos,
          RT,
          RW,
          Alamat_Jalan
        )
      `)
            .eq('ID_Pengunjung', userId)
            .single();
        if (pengunjungError || !pengunjung) {
            throw new common_1.NotFoundException('Data pengunjung tidak ditemukan');
        }
        return pengunjung;
    }
    async updateProfile(token, dto, ip, userAgent, file) {
        const rawToken = token.startsWith('Bearer ')
            ? token.replace('Bearer ', '')
            : token;
        const { data: user, error: verifyError } = await supabase_client_1.supabase.auth.getUser(rawToken);
        if (verifyError || !user?.user?.id) {
            throw new common_1.UnauthorizedException('Token tidak valid');
        }
        const id_pengunjung = user.user.id;
        const { data: existingPengunjung, error: getOldDataError } = await supabase_client_1.supabase
            .from('Pengunjung')
            .select('Foto_Pengunjung')
            .eq('ID_Pengunjung', id_pengunjung)
            .single();
        if (getOldDataError) {
            console.error(getOldDataError);
            throw new common_1.BadRequestException('Gagal mengambil data pengunjung lama');
        }
        if (!existingPengunjung) {
            throw new common_1.NotFoundException('Data pengunjung tidak ditemukan');
        }
        let fotoUrl;
        if (file) {
            if (existingPengunjung?.Foto_Pengunjung) {
                const oldFotoUrl = existingPengunjung.Foto_Pengunjung;
                const storageBaseUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-pengunjung/`;
                const oldPath = oldFotoUrl.replace(storageBaseUrl, '');
                if (oldPath) {
                    const { error: deleteOldFotoError } = await supabase_client_1.supabase.storage
                        .from('foto-pengunjung')
                        .remove([oldPath]);
                    if (deleteOldFotoError) {
                        console.error(`Gagal menghapus foto lama "${oldPath}":`, deleteOldFotoError.message || deleteOldFotoError);
                    }
                }
            }
            const ext = (0, path_1.extname)(file.originalname);
            const uniqueName = `${id_pengunjung}-${(0, crypto_1.randomUUID)()}${ext}`;
            const path = `${uniqueName}`;
            const { error: uploadError } = await supabase_client_1.supabase.storage
                .from('foto-pengunjung')
                .upload(path, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false,
            });
            if (uploadError) {
                console.error('Upload foto error:', uploadError);
                throw new common_1.BadRequestException('Gagal mengunggah foto pengunjung');
            }
            const { data: urlData } = supabase_client_1.supabase.storage
                .from('buku-tamu-mkg')
                .getPublicUrl(path);
            fotoUrl = urlData.publicUrl;
        }
        if (dto.password) {
            const { error: updateAuthError } = await supabase_client_1.supabase.auth.admin.updateUserById(id_pengunjung, {
                ...(dto.password && { password: dto.password }),
            });
            if (updateAuthError) {
                throw new common_1.BadRequestException('Gagal mengupdate akun Auth');
            }
        }
        let alamatId = null;
        if (dto.alamat) {
            const { data: existingAlamat, error: checkAlamatError } = await supabase_client_1.supabase
                .from('Alamat')
                .select('ID_Alamat')
                .match(Object.fromEntries(Object.entries(dto.alamat).filter(([_, value]) => value !== undefined)))
                .single();
            if (checkAlamatError && checkAlamatError.code !== 'PGRST116') {
                throw new common_1.BadRequestException('Gagal mengecek data alamat');
            }
            if (existingAlamat?.ID_Alamat) {
                alamatId = existingAlamat.ID_Alamat;
            }
            else {
                const { data: alamatData, error: insertAlamatError } = await supabase_client_1.supabase
                    .from('Alamat')
                    .insert([dto.alamat])
                    .select('ID_Alamat')
                    .single();
                if (insertAlamatError) {
                    throw new common_1.BadRequestException('Gagal menyimpan data alamat');
                }
                alamatId = alamatData.ID_Alamat;
            }
        }
        const updateData = {
            ...(dto.nama_depan_pengunjung && {
                Nama_Depan_Pengunjung: dto.nama_depan_pengunjung,
            }),
            ...(dto.nama_belakang_pengunjung && {
                Nama_Belakang_Pengunjung: dto.nama_belakang_pengunjung,
            }),
            ...(dto.no_telepon_pengunjung && {
                No_Telepon_Pengunjung: dto.no_telepon_pengunjung,
            }),
            ...(dto.keterangan_asal_pengunjung && {
                Keterangan_Asal_Pengunjung: dto.keterangan_asal_pengunjung,
            }),
            ...(alamatId !== null ? { ID_Alamat: alamatId } : {}),
            ...(fotoUrl && { Foto_Pengunjung: fotoUrl }),
        };
        const { error: pengunjungUpdateError } = await supabase_client_1.supabase
            .from('Pengunjung')
            .update(updateData)
            .eq('ID_Pengunjung', id_pengunjung);
        if (pengunjungUpdateError) {
            throw new common_1.BadRequestException('Gagal mengupdate data pengunjung');
        }
        const { error: logError } = await supabase_client_1.supabase.from('Activity_Log').insert([
            {
                ID_User: id_pengunjung,
                Role: 'Pengunjung',
                Action: 'Update Profile',
                Description: `Pengunjung dengan ID: ${id_pengunjung} berhasil memperbarui profil`,
                IP_Address: ip,
                User_Agent: userAgent,
            },
        ]);
        if (logError) {
            console.error('Gagal mencatat aktivitas:', logError);
        }
        return {
            message: 'Profil berhasil diperbarui',
        };
    }
    async resetPasswordPengunjung(dto, ip, userAgent) {
        const { email, new_password } = dto;
        const { data: userList, error: listError } = await supabase_client_1.supabase.auth.admin.listUsers();
        if (listError) {
            throw new common_1.BadRequestException('Gagal mengambil data pengguna');
        }
        const user = userList.users.find((u) => u.email === email);
        if (!user) {
            throw new common_1.NotFoundException('Email tidak ditemukan');
        }
        const { data: pengunjungData, error: pengunjungError } = await supabase_client_1.supabase
            .from('Pengunjung')
            .select('ID_Pengunjung')
            .eq('ID_Pengunjung', user.id)
            .single();
        if (pengunjungError || !pengunjungData) {
            throw new common_1.BadRequestException('Email bukan milik pengunjung');
        }
        const { error: updateError } = await supabase_client_1.supabase.auth.admin.updateUserById(user.id, {
            password: new_password,
        });
        if (updateError) {
            throw new common_1.BadRequestException('Gagal mengubah password');
        }
        await supabase_client_1.supabase.from('Activity_Log').insert({
            ID_User: user.id,
            Role: 'Pengunjung',
            Action: 'Reset Password',
            Description: `Pengunjung dengan email ${email} berhasil reset password`,
            IP_Address: ip,
            User_Agent: userAgent,
        });
        return {
            message: 'Password berhasil direset',
        };
    }
    async isiBukuTamu(dto, file, ip, userAgent, token) {
        const { tujuan, id_stasiun: idStasiun } = dto;
        if (!file) {
            throw new common_1.BadRequestException('Tanda tangan (gambar) wajib diunggah');
        }
        const rawToken = token.startsWith('Bearer ')
            ? token.replace('Bearer ', '')
            : token;
        const { data: userData, error } = await supabase_client_1.supabase.auth.getUser(rawToken);
        if (error || !userData?.user) {
            console.error('Token tidak valid:', error);
            throw new common_1.UnauthorizedException('Token tidak valid');
        }
        const user = userData.user;
        const id_pengunjung = user.id;
        const email = user.email;
        const { data: pengunjungData, error: pengunjungError } = await supabase_client_1.supabase
            .from('Pengunjung')
            .select('Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung')
            .eq('ID_Pengunjung', id_pengunjung)
            .single();
        if (pengunjungError) {
            console.error('Error ambil data pengunjung:', pengunjungError);
        }
        const namaLengkap = pengunjungData
            ? `${pengunjungData.Nama_Depan_Pengunjung} ${pengunjungData.Nama_Belakang_Pengunjung}`
            : 'Pengunjung';
        if (!tujuan || !idStasiun) {
            throw new common_1.BadRequestException('Tujuan dan ID stasiun wajib diisi');
        }
        const path = `${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`;
        const { error: uploadError } = await supabase_client_1.supabase.storage
            .from('tanda-tangan')
            .upload(path, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false,
        });
        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new common_1.BadRequestException('Gagal mengunggah tanda tangan');
        }
        const urlData = supabase_client_1.supabase.storage.from('tanda-tangan').getPublicUrl(path);
        const fileUrl = urlData.data?.publicUrl;
        if (!fileUrl) {
            console.error('Gagal mendapatkan URL publik');
            throw new common_1.BadRequestException('Gagal mendapatkan URL tanda tangan');
        }
        const { error: insertError } = await supabase_client_1.supabase.from('Buku_Tamu').insert({
            ID_Pengunjung: id_pengunjung,
            ID_Stasiun: idStasiun,
            Tujuan: tujuan,
            Tanda_Tangan: fileUrl,
        });
        if (insertError) {
            console.error('Insert Buku_Tamu error:', insertError);
            throw new common_1.BadRequestException('Gagal menyimpan buku tamu');
        }
        await supabase_client_1.supabase.from('Activity_Log').insert({
            ID_User: id_pengunjung,
            Role: 'Pengunjung',
            Action: 'Isi Buku Tamu',
            Description: `Pengunjung ${namaLengkap} (${email}) mengisi buku tamu di stasiun ${idStasiun}`,
            IP_Address: ip,
            User_Agent: userAgent,
        });
        return {
            message: 'Data buku tamu berhasil disimpan',
        };
    }
};
exports.PengunjungService = PengunjungService;
exports.PengunjungService = PengunjungService = __decorate([
    (0, common_1.Injectable)()
], PengunjungService);
//# sourceMappingURL=pengunjung.service.js.map