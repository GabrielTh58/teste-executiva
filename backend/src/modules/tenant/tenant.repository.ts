import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Role } from '../../../generated/prisma/enums';


interface CreateWithAdminData {
  tenantName: string;
  adminEmail: string;
  adminPasswordHash: string;
}

@Injectable()
export class TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createWithAdmin(data: CreateWithAdminData) {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: data.tenantName },
      });

      const user = await tx.user.create({
        data: {
          email: data.adminEmail,
          password: data.adminPasswordHash,
          role: Role.ADMIN,
          tenantId: tenant.id,
        },
        omit: { password: true },
      });

      return { tenant, user };
    });
  }
}
