import { Module } from '@nestjs/common';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { ContractRepository } from './contract.repository';
import { TemplateModule } from '../template/template.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [TemplateModule, HistoryModule],
  controllers: [ContractController],
  providers: [ContractService, ContractRepository],
})
export class ContractModule {}
