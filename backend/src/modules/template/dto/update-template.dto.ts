import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { FieldType } from '../types/TemplateField.types';

export class UpdateTemplateFieldDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsString()
  @MinLength(1)
  label!: string;

  @IsEnum(FieldType, { message: 'type deve ser text, number, date ou boolean' })
  type!: FieldType;

  @IsBoolean()
  required!: boolean;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTemplateFieldDto)
  fields?: UpdateTemplateFieldDto[];
}
