import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { FieldType } from '../types/TemplateField.types';

export class TemplateFieldDto {
  @IsString()
  @MinLength(1)
  label!: string;

  @IsEnum(FieldType, { message: 'type deve ser text, number, date ou boolean' })  
  type!: FieldType;
  
  @IsBoolean()
  required!: boolean;
}

export class CreateTemplateDto {
  @IsString()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateFieldDto)
  fields!: TemplateFieldDto[];
}
