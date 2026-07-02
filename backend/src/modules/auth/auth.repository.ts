import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Role } from '../../../generated/prisma/enums';

interface CreateUserData {
  email: string;
  passwordHash: string;
  role: Role;
  tenantId: string;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  createUser(data: CreateUserData) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.passwordHash,
        role: data.role,
        tenantId: data.tenantId,
      },
      omit: { password: true },
    });
  }
}
