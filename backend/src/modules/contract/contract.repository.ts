import { Injectable } from '@nestjs/common';
import {
  ContractStatus,
  HistoryAction,
  Prisma,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContractContent } from './types/contract-content.types';
import { ListContractsDto } from './dto/list-contracts.dto';

interface HistoryEntryData {
  action: HistoryAction;
  changedById: string;
  changedField?: string;
  oldValue?: string;
  newValue?: string;
}

@Injectable()
export class ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    name: string,
    tenantId: string,
    templateId: string,
    content: ContractContent,
    historyEntry: HistoryEntryData,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          name,
          tenantId,
          templateId,
          content: content as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.history.create({
        data: { ...historyEntry, contractId: contract.id },
      });

      return contract;
    });
  }

  async findAll(tenantId: string, filters: ListContractsDto) {
    const where: Prisma.ContractWhereInput = { tenantId };

    if (filters.status) where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
      };
    }

    if (filters.search) {
      where.content = { path: ['answers'], string_contains: filters.search };
    }

    const [data, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters.skip,
        take: filters.take,
      }),
      this.prisma.contract.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string, tenantId: string) {
    return this.prisma.contract.findFirst({ where: { id, tenantId } });
  }

  updateFields(
    id: string,
    content: ContractContent,
    historyEntries: HistoryEntryData[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.update({
        where: { id },
        data: { content: content as unknown as Prisma.InputJsonValue },
      });

      if (historyEntries.length > 0) {
        await tx.history.createMany({
          data: historyEntries.map((entry) => ({ ...entry, contractId: id })),
        });
      }

      return contract;
    });
  }

  updateStatus(
    id: string,
    status: ContractStatus,
    historyEntry: HistoryEntryData,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.update({
        where: { id },
        data: { status },
      });

      await tx.history.create({
        data: { ...historyEntry, contractId: id },
      });

      return contract;
    });
  }
}
