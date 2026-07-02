import { IsEnum } from 'class-validator';
import { ContractStatus } from '../../../../generated/prisma/client';

export class UpdateContractStatusDto {
  @IsEnum(ContractStatus, {
    message: 'status deve ser DRAFT, ACTIVE ou CLOSED',
  })
  status!: ContractStatus;
}
