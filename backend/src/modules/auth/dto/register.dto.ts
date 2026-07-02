import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../../../generated/prisma/enums';

export class RegisterDto {
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email!: string;

  @IsString({ message: 'Senha deve ter pelo menos 6 caracteres' })
  @MinLength(6)
  password!: string;

  @IsEnum(Role, { message: 'Role inválida' })
  role!: Role;
}
