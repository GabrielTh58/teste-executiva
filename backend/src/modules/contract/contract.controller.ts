import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ContractService } from './contract.service';
import type { CurrentUserPayload } from '../auth/auth.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractFieldsDto } from './dto/update-contract-fields.dto';
import { UpdateContractStatusDto } from './dto/update-contract-status.dto';
import { ListContractsDto } from './dto/list-contracts.dto';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@Controller('contract')
@UseGuards(JwtAuthGuard)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post()
  @HttpCode(201)
  create(
    @Body() dto: CreateContractDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.contractService.create(dto, currentUser);
  }

  @Get()
  findAll(
    @Query() filters: ListContractsDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.contractService.findAll(filters, currentUser.tenantId);
  }

  @Get(':id')
  findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.contractService.findById(id, currentUser.tenantId);
  }

  @Patch(':id/fields')
  updateFields(
    @Param('id') id: string,
    @Body() dto: UpdateContractFieldsDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.contractService.updateFields(id, dto, currentUser);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContractStatusDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.contractService.updateStatus(id, dto, currentUser);
  }

  @Get(':id/history')
  findHistory(
    @Param('id') id: string,
    @Query() { skip, take }: PaginationDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.contractService.findHistory(
      id,
      currentUser.tenantId,
      skip,
      take,
    );
  }
}
