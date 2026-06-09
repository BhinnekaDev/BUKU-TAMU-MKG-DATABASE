import { SupabaseService } from '@/supabase/supabase.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import dayjs from 'dayjs';
import 'dayjs/locale/id';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('id');

import { IsiBukuTamuDto } from '@/pengunjung/dto/create-buku-tamu.dto';

@Injectable()
export class PengunjungService {
  constructor(private readonly supabaseService: SupabaseService) {}

  //*** Fungsi untuk memanggil semua data dari table Stasiun ***
  async getAllStasiun() {
    //** Langkah 1: Dapatkan client Supabase***
    const supabase = this.supabaseService.getClient();

    //*** Langkah 2: Query semua data dari tabel 'Stasiun' ***
    const { data, error } = await supabase.from('Stasiun').select('*');
    if (error) {
      throw new BadRequestException(
        `Gagal ambil data stasiun: ${error.message}`,
      );
    }

    //*** Langkah 3: Kembalikan data stasiun ***
    return { message: 'Stasiun data retrieved successfully', data };
  }

  //*** Fungsi untuk menghitung jumlah pengunjung per hari, minggu, bulan ***
  async getJumlahPengunjung(id_stasiun: string) {
    //*** Langkah 1: Dapatkan client Supabase ***
    const supabase = this.supabaseService.getClient();

    //*** Langkah 2: Ambil semua data pengunjung dari tabel 'Buku_Tamu' ***
    const { data, error } = await supabase
      .from('Buku_Tamu')
      .select('Waktu_Kunjungan')
      .eq('ID_Stasiun', id_stasiun);

    if (error) {
      throw new BadRequestException(
        `Gagal ambil data pengunjung: ${error.message}`,
      );
    }

    //*** Langkah 3: Tentukan batas waktu hari, minggu, dan bulan ini ***
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    //*** Langkah 4: Hitung jumlah sesuai periode ***
    let hariIni = 0;
    let mingguIni = 0;
    let bulanIni = 0;

    for (const item of data ?? []) {
      const waktu = new Date(item.Waktu_Kunjungan);

      if (waktu.getTime() >= startOfDay.getTime()) hariIni++;
      if (waktu.getTime() >= startOfWeek.getTime()) mingguIni++;
      if (waktu.getTime() >= startOfMonth.getTime()) bulanIni++;
    }

    //*** Langkah 5: Kembalikan hasil ***
    return {
      message: 'Jumlah pengunjung berhasil dihitung',
      hariIni,
      mingguIni,
      bulanIni,
    };
  }

  //*** Fungsi untuk mengisi buku tamu ***
  async isiBukuTamu(dto: IsiBukuTamuDto, file: Express.Multer.File) {
    const supabase = this.supabaseService.getClient();

    // Validasi file tanda tangan
    if (!file) {
      throw new BadRequestException('File tanda tangan harus disertakan');
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Format tanda tangan tidak valid, hanya PNG/JPG/JPEG',
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Ukuran file maksimal 10MB');
    }

    // Upload tanda-tangan ke storage
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('tanda-tangan')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new BadRequestException(
        `Gagal upload tanda tangan: ${uploadError.message}`,
      );
    }

    // Ambil public URL (supabase client getPublicUrl tidak async)
    const {
      data: { publicUrl },
    } = supabase.storage.from('tanda-tangan').getPublicUrl(fileName);

    // format 'YYYY-MM-DD HH:mm:ss' di timezone 'Asia/Jakarta'
    const waktuKunjungan = dayjs()
      .tz('Asia/Jakarta')
      .format('YYYY-MM-DD HH:mm:ss');

    // Buat entri Pengunjung
    let idPengunjung = randomUUID();

    const pengunjungPayload = {
      ID_Pengunjung: idPengunjung,
      Nama_Depan_Pengunjung: dto.Nama_Depan_Pengunjung,
      Nama_Belakang_Pengunjung: dto.Nama_Belakang_Pengunjung || null,
      Email_Pengunjung: dto.Email_Pengunjung || null,
      No_Telepon_Pengunjung: dto.No_Telepon_Pengunjung || null,
      Asal_Pengunjung: dto.Asal_Pengunjung || null,
      Asal_Instansi: dto.Asal_Instansi || null,
      Alamat_Lengkap: dto.Alamat_Lengkap || null,
    };

    if (dto.Email_Pengunjung) {
      const { data: existing, error: checkError } = await supabase
        .from('Pengunjung')
        .select('ID_Pengunjung')
        .eq('Email_Pengunjung', dto.Email_Pengunjung)
        .maybeSingle();

      if (checkError) {
        throw new BadRequestException(
          `Gagal memeriksa data pengunjung: ${checkError.message}`,
        );
      }

      if (existing) {
        // gunakan ID lama
        idPengunjung = existing.ID_Pengunjung;
      } else {
        const { error: insertPengunjungError } = await supabase
          .from('Pengunjung')
          .insert(pengunjungPayload);

        if (insertPengunjungError) {
          await supabase.storage
            .from('tanda-tangan')
            .remove([fileName])
            .catch(() => {});

          throw new BadRequestException(
            `Gagal simpan data pengunjung: ${insertPengunjungError.message}`,
          );
        }
      }
    } else {
      const { error: insertPengunjungError } = await supabase
        .from('Pengunjung')
        .insert(pengunjungPayload);

      if (insertPengunjungError) {
        await supabase.storage
          .from('tanda-tangan')
          .remove([fileName])
          .catch(() => {});

        throw new BadRequestException(
          `Gagal simpan data pengunjung: ${insertPengunjungError.message}`,
        );
      }
    }

    // Simpan entri Buku_Tamu
    const bukuTamuPayload = {
      ID_Buku_Tamu: randomUUID(),
      ID_Pengunjung: idPengunjung,
      ID_Stasiun: dto.id_stasiun,
      Tujuan: dto.tujuan,
      Tanda_Tangan: publicUrl,
      Waktu_Kunjungan: waktuKunjungan,
    };

    const { error: insertBukuError } = await supabase
      .from('Buku_Tamu')
      .insert(bukuTamuPayload);

    if (insertBukuError) {
      // jika gagal, bersihkan pengunjung + file
      try {
        await supabase
          .from('Pengunjung')
          .delete()
          .eq('ID_Pengunjung', idPengunjung);
      } catch (error) {
        // Silently handle error
      }
      await supabase.storage
        .from('tanda-tangan')
        .remove([fileName])
        .catch(() => {});
      throw new BadRequestException(
        `Gagal simpan ke Buku_Tamu: ${insertBukuError.message}`,
      );
    }

    // Return tetap sama (format waktu untuk tampilan)
    return {
      message: 'Data buku tamu berhasil disimpan',
      data: {
        ...dto,
        waktu_kunjungan: dayjs()
          .tz('Asia/Jakarta')
          .format('dddd, D MMMM YYYY, HH.mm'),
        tanda_tangan_url: publicUrl,
      },
    };
  }
}
