import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ContractStatus } from '../../../../generated/prisma/client';
import { PaginationDto } from './pagination.dto';

export class ListContractsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ContractStatus, {
    message: 'status deve ser DRAFT, ACTIVE ou CLOSED',
  })
  status?: ContractStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
