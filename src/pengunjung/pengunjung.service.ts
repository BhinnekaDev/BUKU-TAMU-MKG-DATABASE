import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
import axios from 'axios';

const API_BASE_URL = 'https://emsifa.github.io/api-wilayah-indonesia/api';

import { supabase } from '@/supabase/supabase.client';

import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export enum AsalPengunjung {
  BMKG = 'BMKG',
  Dinas = 'Dinas',
  Universitas = 'Universitas',
  Media = 'Media',
  LembagaNonPemerintahan = 'Lembaga Non Pemerintahan',
  Umum = 'Umum',
}

@Injectable()
export class PengunjungService {
  private readonly wilayahApi = axios.create({
    baseURL: API_BASE_URL,
  });

  getAllAsalPengunjung(): { value: string; label: string }[] {
    return Object.entries(AsalPengunjung).map(([key, value]) => ({
      value,
      label: value,
    }));
  }

  async getProvinceById(id: string): Promise<{ id: string; name: string }> {
    const { data } = await this.wilayahApi.get(`/province/${id}.json`);
    return data;
  }

  async getRegencyById(
    id: string,
  ): Promise<{ id: string; name: string; province_id: string }> {
    const { data } = await this.wilayahApi.get(`/regency/${id}.json`);
    return data;
  }

  async getDistrictById(
    id: string,
  ): Promise<{ id: string; name: string; regency_id: string }> {
    const { data } = await this.wilayahApi.get(`/district/${id}.json`);
    return data;
  }

  async getVillageById(
    id: string,
  ): Promise<{ id: string; name: string; district_id: string }> {
    const { data } = await this.wilayahApi.get(`/village/${id}.json`);
    return data;
  }

  async getAllStasiun() {
    const { data, error } = await supabase
      .from('Stasiun')
      .select('ID_Stasiun, Nama_Stasiun')
      .order('Nama_Stasiun', { ascending: true });

    if (error) {
      console.error('Error fetching stasiun:', error);
      throw new Error('Failed to retrieve stasiun data');
    }

    return {
      message: 'Stasiun data retrieved successfully',
      data: data || [],
    };
  }

  async getJumlahPengunjung(): Promise<{
    hariIni: number;
    mingguIni: number;
    bulanIni: number;
  }> {
    // 1. Hitung waktu awal hari, minggu, dan bulan
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      // 2. Query untuk menghitung jumlah pengunjung
      const queries = [
        supabase
          .from('Buku_Tamu')
          .select('*', { count: 'exact', head: true })
          .gte('Tanggal_Pengisian', startOfDay.toISOString()),

        supabase
          .from('Buku_Tamu')
          .select('*', { count: 'exact', head: true })
          .gte('Tanggal_Pengisian', startOfWeek.toISOString()),

        supabase
          .from('Buku_Tamu')
          .select('*', { count: 'exact', head: true })
          .gte('Tanggal_Pengisian', startOfMonth.toISOString()),
      ];

      const [hariIni, mingguIni, bulanIni] = await Promise.all(queries);

      if (hariIni.error || mingguIni.error || bulanIni.error) {
        console.error('Error fetching statistics:', {
          hariIniError: hariIni.error,
          mingguIniError: mingguIni.error,
          bulanIniError: bulanIni.error,
        });
        throw new BadRequestException(
          'Gagal mengambil data statistik pengunjung',
        );
      }

      // 3. Return hasil
      return {
        hariIni: hariIni.count || 0,
        mingguIni: mingguIni.count || 0,
        bulanIni: bulanIni.count || 0,
      };
    } catch (error) {
      console.error('Unexpected error in getJumlahPengunjung:', error);
      throw new BadRequestException(
        'Terjadi kesalahan saat memproses permintaan',
      );
    }
  }

  async isiBukuTamu(
    dto: IsiBukuTamuDto,
    ip: string | null,
    userAgent: string | null,
    file?: Express.Multer.File,
  ): Promise<{ message: string }> {
    const {
      tujuan,
      id_stasiun,
      Nama_Depan_Pengunjung,
      Nama_Belakang_Pengunjung,
      Email_Pengunjung,
      No_Telepon_Pengunjung,
      Asal_Pengunjung,
      Keterangan_Asal_Pengunjung,
      alamat,
      waktu_kunjungan,
    } = dto;

    // 1. Validasi input
    if (
      !tujuan ||
      !id_stasiun ||
      !Nama_Depan_Pengunjung ||
      !Nama_Belakang_Pengunjung ||
      !Email_Pengunjung ||
      !No_Telepon_Pengunjung ||
      !Asal_Pengunjung
    ) {
      throw new BadRequestException('Semua data wajib diisi');
    }

    // Upload tanda tangan
    let fileUrl: string | null = null;
    if (file) {
      const path = `tanda-tangan/${uuidv4()}${extname(file.originalname)}`;
      const { error: uploadError } = await supabase.storage
        .from('tanda-tangan')
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError)
        throw new BadRequestException('Gagal mengunggah tanda tangan');

      const urlData = supabase.storage.from('tanda-tangan').getPublicUrl(path);
      fileUrl = urlData.data?.publicUrl;
      if (!fileUrl)
        throw new BadRequestException('Gagal mendapatkan URL tanda tangan');
    }

    // 2. Cek apakah ID Stasiun valid
    const { data: stasiunData, error: stasiunError } = await supabase
      .from('Stasiun')
      .select('ID_Stasiun, Nama_Stasiun')
      .eq('ID_Stasiun', id_stasiun)
      .single();
    if (stasiunError || !stasiunData) {
      throw new BadRequestException('ID Stasiun tidak ditemukan');
    }

    // Format waktu kunjungan
    const waktuKunjungan = waktu_kunjungan || this.formatWaktuKunjungan();

    // 3. Simpan alamat jika ada
    let alamatId: string | null = null;

    if (alamat) {
      let parsedAlamat: any;
      try {
        parsedAlamat = typeof alamat === 'string' ? JSON.parse(alamat) : alamat;

        // Validasi manual field wajib
        const requiredFields = [
          'province_id',
          'regency_id',
          'district_id',
          'village_id',
        ];
        for (const field of requiredFields) {
          if (!parsedAlamat[field]) {
            throw new BadRequestException(
              `Field ${field} pada alamat wajib diisi`,
            );
          }
        }
      } catch (err) {
        throw new BadRequestException(
          'Format alamat tidak valid (wajib berupa JSON string yang benar)',
        );
      }

      // Ambil nama-nama wilayah berdasarkan ID (dengan fallback)
      const [prov, kab, kec, kel] = await Promise.all([
        this.getProvinceById(parsedAlamat.province_id).catch(() => ({
          id: parsedAlamat.province_id,
          name: 'Provinsi Tidak Diketahui',
        })),
        this.getRegencyById(parsedAlamat.regency_id).catch(() => ({
          id: parsedAlamat.regency_id,
          name: 'Kabupaten Tidak Diketahui',
        })),
        this.getDistrictById(parsedAlamat.district_id).catch(() => ({
          id: parsedAlamat.district_id,
          name: 'Kecamatan Tidak Diketahui',
        })),
        this.getVillageById(parsedAlamat.village_id).catch(() => ({
          id: parsedAlamat.village_id,
          name: 'Kelurahan Tidak Diketahui',
        })),
      ]);

      const alamatData = {
        Provinsi_ID: prov.id,
        Provinsi: prov.name,
        Kabupaten_ID: kab.id,
        Kabupaten: kab.name,
        Kecamatan_ID: kec.id,
        Kecamatan: kec.name,
        Kelurahan_ID: kel.id,
        Kelurahan: kel.name,
      };

      // Cek apakah sudah ada alamat tersebut di DB
      const { data: existingAlamat, error: findError } = await supabase
        .from('Alamat')
        .select('ID_Alamat')
        .match({
          Provinsi_ID: alamatData.Provinsi_ID,
          Kabupaten_ID: alamatData.Kabupaten_ID,
          Kecamatan_ID: alamatData.Kecamatan_ID,
          Kelurahan_ID: alamatData.Kelurahan_ID,
        })
        .single();

      if (findError && findError.code !== 'PGRST116') {
        // selain error data not found
        throw new BadRequestException('Gagal mencari data alamat');
      }

      if (existingAlamat?.ID_Alamat) {
        alamatId = existingAlamat.ID_Alamat;
      } else {
        // Insert alamat baru
        const { data: insertedAlamat, error: insertError } = await supabase
          .from('Alamat')
          .insert([alamatData])
          .select('ID_Alamat')
          .single();

        if (insertError) {
          console.error('Insert alamat error:', insertError);
          throw new BadRequestException('Gagal menyimpan data alamat');
        }

        alamatId = insertedAlamat.ID_Alamat;
      }
    }

    // 4. Simpan data pengunjung
    const { data: existingPengunjung } = await supabase
      .from('Pengunjung')
      .select('ID_Pengunjung')
      .match({
        Nama_Depan_Pengunjung,
        Nama_Belakang_Pengunjung,
        Email_Pengunjung,
        No_Telepon_Pengunjung,
        Asal_Pengunjung,
      })
      .single();

    let pengunjungId: string;

    if (existingPengunjung?.ID_Pengunjung) {
      pengunjungId = existingPengunjung.ID_Pengunjung;
    } else {
      pengunjungId = uuidv4();

      const { error: pengunjungError } = await supabase
        .from('Pengunjung')
        .insert({
          ID_Pengunjung: pengunjungId,
          ID_Alamat: alamatId,
          Nama_Depan_Pengunjung,
          Nama_Belakang_Pengunjung,
          Email_Pengunjung,
          No_Telepon_Pengunjung,
          Asal_Pengunjung,
          Keterangan_Asal_Pengunjung,
        });

      if (pengunjungError) {
        console.error('Insert Pengunjung error:', pengunjungError);
        throw new BadRequestException('Gagal menyimpan data pengunjung');
      }
    }

    // 5. Simpan data buku tamu
    const { error: insertBukuTamuError } = await supabase
      .from('Buku_Tamu')
      .insert({
        ID_Pengunjung: pengunjungId,
        ID_Stasiun: id_stasiun,
        Tujuan: tujuan,
        Tanda_Tangan: fileUrl,
        Waktu_Kunjungan: waktuKunjungan,
      });

    if (insertBukuTamuError) {
      console.error('Insert Buku_Tamu error:', insertBukuTamuError);
      throw new BadRequestException('Gagal menyimpan data buku tamu');
    }

    // 6. Catat ke Activity_Log
    const stasiunNama = stasiunData?.Nama_Stasiun || 'Stasiun Tidak Diketahui';
    const namaLengkap = `${Nama_Depan_Pengunjung} ${Nama_Belakang_Pengunjung}`;

    await supabase.from('Activity_Log').insert({
      ID_User: pengunjungId,
      Role: 'Pengunjung',
      Action: 'Isi Buku Tamu',
      Description: `Pengunjung dengan ID ${pengunjungId} dan nama ${namaLengkap} mengisi buku tamu ke stasiun ${stasiunNama}.`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    // 7. Return message
    return { message: 'Data buku tamu berhasil disimpan' };
  }

  private formatWaktuKunjungan(): string {
    const now = new Date();
    const optionsDate: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    const optionsTime: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };

    const hariTanggal = now.toLocaleDateString('id-ID', optionsDate);
    const jam = now.toLocaleTimeString('id-ID', optionsTime);
    return `${hariTanggal}, ${jam}`;
  }
}
