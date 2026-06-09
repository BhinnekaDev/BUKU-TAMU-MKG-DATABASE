import { AdminController } from '@/admin/admin.controller';
import { AdminService } from '@/admin/admin.service';

import { SupabaseModule } from '@/supabase/supabase.module';
import { Module } from '@nestjs/common';

//*** Modul autentikasi Semua ***
@Module({
  //*** Import modul Supabase ***
  imports: [SupabaseModule],
  //*** Controller dan Service untuk Admin ***
  controllers: [AdminController],
  //*** Provider untuk AdminService ***
  providers: [AdminService],
})
export class AdminModule {}
