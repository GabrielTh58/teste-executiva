import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantOnboardingDto } from './dto/create-tenant-onboarding.dto';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post('onboarding')
  @HttpCode(201)
  onboarding(@Body() dto: CreateTenantOnboardingDto) {
    return this.tenantService.onboard(dto);
  }
}
