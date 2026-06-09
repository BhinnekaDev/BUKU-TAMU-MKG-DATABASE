import { PengunjungController } from './pengunjung.controller';
import { PengunjungService } from './pengunjung.service';

import { SupabaseModule } from '@/supabase/supabase.module';
import { Module } from '@nestjs/common';

//*** Modul autentikasi Semua ***
@Module({
  //*** Import modul Supabase ***
  imports: [SupabaseModule],
  //*** Controller dan Service untuk modul Pengunjung ***
  controllers: [PengunjungController],
  //*** Service untuk modul Pengunjung ***
  providers: [PengunjungService],
})
export class PengunjungModule {}
