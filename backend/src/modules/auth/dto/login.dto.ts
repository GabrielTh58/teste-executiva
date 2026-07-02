import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email!: string;

  @IsString({ message: 'Senha deve ter pelo menos 6 caracteres' })
  @MinLength(6)
  password!: string;
}
