import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HistoryAction } from '../../../generated/prisma/client';
import { ContractRepository } from './contract.repository';
import { TemplateService } from '../template/template.service';
import { HistoryService } from '../history/history.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractFieldsDto } from './dto/update-contract-fields.dto';
import { UpdateContractStatusDto } from './dto/update-contract-status.dto';
import { ListContractsDto } from './dto/list-contracts.dto';
import { ContractContent } from './types/contract-content.types';
import { FieldType, TemplateField, TemplateFieldsConfig,} from '../template/types/TemplateField.types';
import type { CurrentUserPayload } from '../auth/auth.service';

@Injectable()
export class ContractService {
  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly templateService: TemplateService,
    private readonly historyService: HistoryService,
  ) {}

  async create(dto: CreateContractDto, currentUser: CurrentUserPayload) {
    const template = await this.templateService.findActive(
      currentUser.tenantId,
    );
    if (!template) throw new BadRequestException('Nenhum template ativo encontrado');

    const templateSnapshot = (
      template.fieldsConfig as unknown as TemplateFieldsConfig
    ).fields;

    const content: ContractContent = {
      templateSnapshot,
      answers: dto.answers,
    };

    this.validateAnswers(templateSnapshot, content.answers);

    return this.contractRepository.create(
      dto.name,
      currentUser.tenantId,
      template.id,
      content,
      {
        action: HistoryAction.CREATE,
        changedById: currentUser.sub,
      },
    );
  }

  async findAll(filters: ListContractsDto, tenantId: string) {
    const { data, total } = await this.contractRepository.findAll(
      tenantId,
      filters,
    );
    return { data, meta: { total, skip: filters.skip, take: filters.take } };
  }

  async findById(id: string, tenantId: string) {
    const contract = await this.contractRepository.findById(id, tenantId);
    if (!contract) throw new NotFoundException('Contrato não encontrado');

    return contract;
  }

  async updateFields(
    id: string,
    dto: UpdateContractFieldsDto,
    currentUser: CurrentUserPayload,
  ) {
    const contract = await this.findById(id, currentUser.tenantId);
    const content = contract.content as unknown as ContractContent;

    const mergedAnswers = { ...content.answers, ...dto.answers };
    this.validateAnswers(content.templateSnapshot, mergedAnswers);

    const historyEntries = Object.keys(dto.answers)
      .filter((key) => content.answers[key] !== dto.answers[key])
      .map((key) => {
        const field = content.templateSnapshot.find((f) => f.key === key);
        return {
          action: HistoryAction.UPDATE_FIELD,
          changedById: currentUser.sub,
          changedField: field?.label ?? key,
          oldValue: this.stringifyValue(content.answers[key]),
          newValue: this.stringifyValue(dto.answers[key]),
        };
      });

    const newContent: ContractContent = {
      templateSnapshot: content.templateSnapshot,
      answers: mergedAnswers,
    };

    return this.contractRepository.updateFields(id, newContent, historyEntries);
  }

  async updateStatus(
    id: string,
    dto: UpdateContractStatusDto,
    currentUser: CurrentUserPayload,
  ) {
    const contract = await this.findById(id, currentUser.tenantId);

    return this.contractRepository.updateStatus(id, dto.status, {
      action: HistoryAction.STATUS_CHANGE,
      changedById: currentUser.sub,
      oldValue: contract.status,
      newValue: dto.status,
    });
  }

  async findHistory(
    contractId: string,
    tenantId: string,
    skip: number,
    take: number,
  ) {
    await this.findById(contractId, tenantId);

    const { data, total } = await this.historyService.findByContract(
      contractId,
      skip,
      take,
    );
    return { data, meta: { total, skip, take } };
  }

  private validateAnswers(
    snapshot: TemplateField[],
    answers: Record<string, string | number | boolean>,
  ) {
    for (const field of snapshot) {
      const value = answers[field.key];

      if (field.required && value === undefined) {
        throw new BadRequestException(`Campo obrigatório: ${field.label}`);
      }

      if (value === undefined) continue;

      if (!this.isValueCompatible(field.type, value)) {
        throw new BadRequestException(
          `Campo com tipo inválido: ${field.label}`,
        );
      }
    }
  }

  private isValueCompatible(
    type: FieldType,
    value: string | number | boolean,
  ): boolean {
    switch (type) {
      case FieldType.TEXT:
        return typeof value === 'string';
      case FieldType.NUMBER:
        return typeof value === 'number';
      case FieldType.BOOLEAN:
        return typeof value === 'boolean';
      case FieldType.DATE:
        return typeof value === 'string' && !Number.isNaN(Date.parse(value));
      default:
        return false;
    }
  }

  private stringifyValue(
    value: string | number | boolean | undefined,
  ): string | undefined {
    return value === undefined ? undefined : String(value);
  }
}
