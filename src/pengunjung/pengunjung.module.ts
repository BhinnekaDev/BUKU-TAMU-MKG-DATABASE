import { Module } from '@nestjs/common';
import { PengunjungService } from './pengunjung.service';
import { PengunjungController } from './pengunjung.controller';

@Module({
  providers: [PengunjungService],
  controllers: [PengunjungController]
})
export class PengunjungModule {}
