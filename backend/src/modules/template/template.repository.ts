import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TemplateFieldsConfig } from './types/TemplateField.types';

interface CreateTemplateData {
  name: string;
  fieldsConfig: TemplateFieldsConfig;
}

interface UpdateTemplateData {
  name?: string;
  fieldsConfig?: TemplateFieldsConfig;
}

@Injectable()
export class TemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, data: CreateTemplateData) {
    return this.prisma.template.create({
      data: {
        name: data.name,
        fieldsConfig: data.fieldsConfig as unknown as Prisma.InputJsonValue,
        tenantId,
      },
    });
  }

  findAllByTenant(tenantId: string) {
    return this.prisma.template.findMany({
      where: { tenantId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string, tenantId: string) {
    return this.prisma.template.findFirst({ where: { id, tenantId } });
  }

  update(id: string, data: UpdateTemplateData) {
    return this.prisma.template.update({
      where: { id },
      data: {
        name: data.name,
        fieldsConfig: data.fieldsConfig as unknown as Prisma.InputJsonValue,
      },
    });
  }

  activate(id: string, tenantId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.template.updateMany({
        where: { tenantId },
        data: { isActive: false },
      });

      return tx.template.update({
        where: { id },
        data: { isActive: true },
      });
    });
  }

  findActiveByTenant(tenantId: string) {
    return this.prisma.template.findFirst({
      where: { tenantId, isActive: true },
    });
  }
}
