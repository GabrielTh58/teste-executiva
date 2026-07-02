import { ConflictException, Injectable } from '@nestjs/common';
import { TenantRepository } from './tenant.repository';
import { HashProvider } from '../../shared/hash/hash.provider';
import { CreateTenantOnboardingDto } from './dto/create-tenant-onboarding.dto';

@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly hashProvider: HashProvider,
  ) {}

  async onboard(dto: CreateTenantOnboardingDto) {
    const existingUser = await this.tenantRepository.findUserByEmail(dto.adminEmail);

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const adminPasswordHash = await this.hashProvider.hash(dto.password);

    return this.tenantRepository.createWithAdmin({
      tenantName: dto.tenantName,
      adminEmail: dto.adminEmail,
      adminPasswordHash,
    });
  }
}
