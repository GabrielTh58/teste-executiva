import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateTenantOnboardingDto {
  @IsString({message: 'Tenant name must be a string with more than 2 characters'})
  @MinLength(2)
  tenantName!: string;

  @IsEmail({}, {message: 'Invalid email format'})
  adminEmail!: string;

  @IsString({message: 'Password must be a string with more than 6 characters'})
  @MinLength(6)
  password!: string;
}
