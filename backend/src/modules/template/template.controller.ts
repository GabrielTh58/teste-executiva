import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TemplateService } from './template.service';
import type { CurrentUserPayload } from '../auth/auth.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';
import { Role } from '../../../generated/prisma/enums';

@Controller('template')
@UseGuards(JwtAuthGuard)
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @HttpCode(201)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateTemplateDto, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.templateService.create(dto, currentUser.tenantId);
  }

  @Get()
  findAll(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.templateService.findAll(currentUser.tenantId);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.templateService.findById(id, currentUser.tenantId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.templateService.update(id, dto, currentUser.tenantId);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  activate(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.templateService.activate(id, currentUser.tenantId);
  }
}
