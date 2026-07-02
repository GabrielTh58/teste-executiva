import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateHistoryEntryDto } from './dto/create-history-entry.dto';

@Injectable()
export class HistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateHistoryEntryDto) {
    return this.prisma.history.create({ data });
  }

  createMany(data: CreateHistoryEntryDto[]) {
    return this.prisma.history.createMany({ data });
  }

  async findByContract(contractId: string, skip: number, take: number) {
    const [data, total] = await Promise.all([
      this.prisma.history.findMany({
        where: { contractId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { changedBy: { select: { email: true } } },
      }),
      this.prisma.history.count({ where: { contractId } }),
    ]);

    return { data, total };
  }
}
