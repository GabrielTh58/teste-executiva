import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantRepository } from './tenant.repository';
import { HashProvider } from '../../shared/hash/hash.provider';

@Module({
  controllers: [TenantController],
  providers: [TenantService, TenantRepository, HashProvider],
})
export class TenantModule {}
