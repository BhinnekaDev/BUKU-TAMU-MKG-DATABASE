import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
import { SearchPengunjungDto } from '@/pengunjung/dto/search-pengunjung.dto';
import axios from 'axios';

const API_BASE_URL = 'https://emsifa.github.io/api-wilayah-indonesia/api';

import { supabase } from '@/supabase/supabase.client';

import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export enum AsalPengunjung {
  BMKG = 'BMKG',
  Pemerintah_Pusat_atau_Pemerintah_Daerah = 'Pemerintah Pusat/Pemerintah Daerah',
  Umum = 'Umum',
  Universitas = 'Universitas',
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

  // async getProvinceById(id: string): Promise<{ id: string; name: string }> {
  //   const { data } = await this.wilayahApi.get(`/province/${id}.json`);
  //   return data;
  // }

  // async getRegencyById(
  //   id: string,
  // ): Promise<{ id: string; name: string; province_id: string }> {
  //   const { data } = await this.wilayahApi.get(`/regency/${id}.json`);
  //   return data;
  // }

  // async getDistrictById(
  //   id: string,
  // ): Promise<{ id: string; name: string; regency_id: string }> {
  //   const { data } = await this.wilayahApi.get(`/district/${id}.json`);
  //   return data;
  // }

  // async getVillageById(
  //   id: string,
  // ): Promise<{ id: string; name: string; district_id: string }> {
  //   const { data } = await this.wilayahApi.get(`/village/${id}.json`);
  //   return data;
  // }

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

  async getJumlahPengunjung(id_stasiun: string): Promise<{
    hariIni: number;
    mingguIni: number;
    bulanIni: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      const queries = [
        supabase
          .from('Buku_Tamu')
          .select('*', { count: 'exact', head: true })
          .gte('Tanggal_Pengisian', startOfDay.toISOString())
          .eq('ID_Stasiun', id_stasiun),

        supabase
          .from('Buku_Tamu')
          .select('*', { count: 'exact', head: true })
          .gte('Tanggal_Pengisian', startOfWeek.toISOString())
          .eq('ID_Stasiun', id_stasiun),

        supabase
          .from('Buku_Tamu')
          .select('*', { count: 'exact', head: true })
          .gte('Tanggal_Pengisian', startOfMonth.toISOString())
          .eq('ID_Stasiun', id_stasiun),
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
      Asal_Instansi,
      Alamat_Lengkap,
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
      !Asal_Pengunjung ||
      !Alamat_Lengkap
    ) {
      throw new BadRequestException('Semua data wajib diisi');
    }

    // Upload tanda-tangan
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

    // 2. Validasi ID Stasiun
    const { data: stasiunData, error: stasiunError } = await supabase
      .from('Stasiun')
      .select('ID_Stasiun, Nama_Stasiun')
      .eq('ID_Stasiun', id_stasiun)
      .single();

    type StasiunData = { ID_Stasiun: string; Nama_Stasiun: string };
    const typedStasiunData = stasiunData as StasiunData | null;

    if (stasiunError || !typedStasiunData) {
      throw new BadRequestException('ID Stasiun tidak ditemukan');
    }

    // Format waktu kunjungan
    const waktuKunjungan = waktu_kunjungan || this.formatWaktuKunjungan();

    // 4. Cek apakah pengunjung sudah ada
    const { data: existingPengunjung, error } = await supabase
      .from('Pengunjung')
      .select('ID_Pengunjung')
      .match({
        Nama_Depan_Pengunjung,
        Nama_Belakang_Pengunjung,
        Email_Pengunjung,
        No_Telepon_Pengunjung,
        Asal_Pengunjung,
        Alamat_Lengkap,
      })
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, artinya tidak ada data = bukan error
      throw new BadRequestException('Gagal mengecek data pengunjung');
    }

    // 5. Cek atau simpan data pengunjung
    let pengunjungId: string;

    try {
      const { data: pengunjungList, error } = await supabase
        .from('Pengunjung')
        .select('ID_Pengunjung')
        .eq('Email_Pengunjung', Email_Pengunjung)
        .eq('No_Telepon_Pengunjung', No_Telepon_Pengunjung);

      if (error) {
        console.error('Error saat cek pengunjung:', error);
        throw new BadRequestException('Gagal mengecek data pengunjung');
      }

      const existingPengunjung = pengunjungList?.[0];

      if (existingPengunjung?.ID_Pengunjung) {
        pengunjungId = existingPengunjung.ID_Pengunjung;
      } else {
        pengunjungId = uuidv4();

        const { error: pengunjungError } = await supabase
          .from('Pengunjung')
          .insert({
            ID_Pengunjung: pengunjungId,
            Nama_Depan_Pengunjung,
            Nama_Belakang_Pengunjung,
            Email_Pengunjung,
            No_Telepon_Pengunjung,
            Asal_Pengunjung,
            Asal_Instansi,
            Alamat_Lengkap,
          });

        if (pengunjungError) {
          console.error('Error saat insert pengunjung:', pengunjungError);
          throw new BadRequestException('Gagal menyimpan data pengunjung');
        }
      }
    } catch (err) {
      console.error('Unexpected error saat validasi pengunjung:', err);
      throw new BadRequestException('Gagal mengecek data pengunjung');
    }

    // 6. Simpan data buku tamu
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
      throw new BadRequestException('Gagal menyimpan data buku tamu');
    }

    const stasiunNama =
      typedStasiunData?.Nama_Stasiun || 'Stasiun Tidak Diketahui';
    const namaLengkap = `${Nama_Depan_Pengunjung} ${Nama_Belakang_Pengunjung}`;

    // 7. Log aktivitas
    await supabase.from('Activity_Log').insert({
      ID_User: pengunjungId,
      Role: 'Pengunjung',
      Action: 'Isi Buku Tamu',
      Description: `Pengunjung dengan ID ${pengunjungId} dan nama ${namaLengkap} mengisi buku tamu ke stasiun ${stasiunNama}.`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

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

  async searchPengunjung(dto: SearchPengunjungDto) {
    const { keyword } = dto;

    const { data: depan, error: errorDepan } = await supabase
      .from('Pengunjung')
      .select('*')
      .ilike('Nama_Depan_Pengunjung', `%${keyword}%`);

    const { data: belakang, error: errorBelakang } = await supabase
      .from('Pengunjung')
      .select('*')
      .ilike('Nama_Belakang_Pengunjung', `%${keyword}%`);

    if (errorDepan || errorBelakang) {
      console.error('Error search:', errorDepan || errorBelakang);
      throw new BadRequestException('Gagal mencari data pengunjung');
    }

    const combined = [...(depan || []), ...(belakang || [])];
    const unique = Array.from(
      new Map(combined.map((item) => [item.ID_Pengunjung, item])).values(),
    );

    return unique;
  }
}
