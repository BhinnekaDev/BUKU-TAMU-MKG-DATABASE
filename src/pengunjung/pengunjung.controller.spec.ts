import { Test, TestingModule } from '@nestjs/testing';
import { PengunjungController } from './pengunjung.controller';

describe('PengunjungController', () => {
  let controller: PengunjungController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PengunjungController],
    }).compile();

    controller = module.get<PengunjungController>(PengunjungController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
