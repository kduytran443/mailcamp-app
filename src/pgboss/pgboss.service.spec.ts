import { Test, TestingModule } from '@nestjs/testing';
import { PgbossService } from './pgboss.service';

describe('PgbossService', () => {
  let service: PgbossService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PgbossService],
    }).compile();

    service = module.get<PgbossService>(PgbossService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
