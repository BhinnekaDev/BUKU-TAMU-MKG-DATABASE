import { Test, TestingModule } from '@nestjs/testing';
import { PengunjungService } from './pengunjung.service';

describe('PengunjungService', () => {
  let service: PengunjungService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PengunjungService],
    }).compile();

    service = module.get<PengunjungService>(PengunjungService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
