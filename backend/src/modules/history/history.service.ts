import { Injectable } from '@nestjs/common';
import { HistoryRepository } from './history.repository';
import { CreateHistoryEntryDto } from './dto/create-history-entry.dto';

@Injectable()
export class HistoryService {
  constructor(private readonly historyRepository: HistoryRepository) {}

  createEntry(dto: CreateHistoryEntryDto) {
    return this.historyRepository.create(dto);
  }

  createEntries(dtos: CreateHistoryEntryDto[]) {
    return this.historyRepository.createMany(dtos);
  }

  findByContract(contractId: string, skip: number, take: number) {
    return this.historyRepository.findByContract(contractId, skip, take);
  }
}
