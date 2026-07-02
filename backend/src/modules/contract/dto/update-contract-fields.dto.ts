import { IsObject } from 'class-validator';

export class UpdateContractFieldsDto {
  @IsObject()
  answers!: Record<string, string | number | boolean>;
}
