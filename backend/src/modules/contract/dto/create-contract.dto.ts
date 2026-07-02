import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  answers!: Record<string, string | number | boolean>;
}
