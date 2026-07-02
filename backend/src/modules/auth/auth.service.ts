import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { HashProvider } from '../../shared/hash/hash.provider';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

export interface CurrentUserPayload {
  sub: string;
  tenantId: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashProvider: HashProvider,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    
    const passwordMatches = await this.hashProvider.compare(dto.password, user.password);
    if (!passwordMatches) throw new UnauthorizedException('Credenciais inválidas');    

    return this.generateTokenPair(user);
  }

  async register(dto: RegisterDto, currentUser: CurrentUserPayload) {
    const existingUser = await this.authRepository.findUserByEmail(dto.email);
    if (existingUser) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await this.hashProvider.hash(dto.password);

    return this.authRepository.createUser({
      email: dto.email,
      passwordHash,
      role: dto.role,
      tenantId: currentUser.tenantId,
    });
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: { sub: string; type: string };

    try {
      payload = this.jwtService.verify(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }

    if (payload.type !== 'refresh') throw new UnauthorizedException('Token inválido')

    const user = await this.authRepository.findUserById(payload.sub);
    if (!user) throw new UnauthorizedException('Token inválido');

    return this.generateTokenPair(user);
  }

  private generateTokenPair(user: { id: string; tenantId: string; role: string, email: string }) {
    const accessToken = this.jwtService.sign(
      { 
        sub: user.id,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email,
        type: 'access' 
      },
      { expiresIn: '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }
}
